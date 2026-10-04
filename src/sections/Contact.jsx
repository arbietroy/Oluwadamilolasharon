import { useState } from 'react';
import { useContent } from '../lib/ContentContext';
import SplitHeading from '../components/SplitHeading';

export default function ContactForm({ data }) {
  const { content } = useContent();
  const { site } = content;
  const [status, setStatus] = useState('idle'); // idle | sending | sent | error
  const [error, setError] = useState('');

  async function onSubmit(e) {
    e.preventDefault();
    const form = Object.fromEntries(new FormData(e.currentTarget));
    if (!data.formEndpoint) {
      // No endpoint yet: open the visitor's email app with the message filled in
      const body = `Name: ${form.name}\nCompany: ${form.company}\nBudget: ${form.budget}\n\n${form.message}`;
      window.location.href = `mailto:${site.email}?subject=${encodeURIComponent('Automation enquiry from ' + form.name)}&body=${encodeURIComponent(body)}`;
      return;
    }
    setStatus('sending');
    // FormSubmit reads these extra fields to set the email subject and layout
    const extras = data.formEndpoint.includes('formsubmit.co')
      ? { _subject: `Automation enquiry from ${form.name}`, _template: 'table' }
      : {};
    try {
      const res = await fetch(data.formEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ ...form, ...extras, sentAt: new Date().toISOString(), source: 'website' }),
      });
      if (!res.ok) throw new Error(`The form service replied with status ${res.status}.`);
      // some services answer 200 but report failure in the body (e.g. FormSubmit before activation)
      const reply = await res.json().catch(() => ({}));
      if (reply.success === false || reply.success === 'false') throw new Error(reply.message || 'The form service did not accept the message.');
      setStatus('sent');
    } catch (err) {
      setError(`${err.message || 'The message could not be sent.'} Email ${site.email} instead.`);
      setStatus('error');
    }
  }

  const channels = [
    site.email && { label: 'Email', value: site.email, href: `mailto:${site.email}` },
    site.whatsapp && { label: 'WhatsApp', value: site.whatsapp, href: `https://wa.me/${site.whatsapp.replace(/\D/g, '')}` },
    site.bookingUrl && { label: 'Book a call', value: 'Pick a time', href: site.bookingUrl },
    ...site.socials.filter((s) => s.url).map((s) => ({ label: s.label, value: s.url.replace(/^https?:\/\/(www\.)?/, ''), href: s.url })),
  ].filter(Boolean);

  return (
    <section className="contact">
      <div className="contact-copy">
        <SplitHeading as="h1" text={data.heading} className="page-title" />
        <p className="lede" data-fx="rise">{data.body}</p>
        <ul className="channels" data-fx="stagger">
          {channels.map((c) => (
            <li key={c.label}><span>{c.label}</span><a href={c.href} target={c.href.startsWith('http') ? '_blank' : undefined} rel="noreferrer">{c.value}</a></li>
          ))}
        </ul>
      </div>

      {status === 'sent' ? (
        <div className="sent" role="status">
          <div className="sent-flow" aria-hidden="true">
            <span>Form</span><i /><span>Workflow</span><i /><span>Inbox</span>
            <b className="sent-pulse" />
          </div>
          <p>{data.successMessage}</p>
        </div>
      ) : (
        <form className="form" data-fx="scale" onSubmit={onSubmit}>
          <label>Your name<input name="name" required autoComplete="name" /></label>
          <label>Email<input name="email" type="email" required autoComplete="email" /></label>
          <label>Company or brand<input name="company" autoComplete="organization" /></label>
          <label>What do you want to automate?<textarea name="message" rows="5" required placeholder="The task, the tools you use, and how often it happens." /></label>
          <label>Budget
            <select name="budget" defaultValue={data.budgetOptions?.[0]}>
              {(data.budgetOptions || []).map((b) => <option key={b}>{b}</option>)}
            </select>
          </label>
          {status === 'error' && <p className="form-error" role="alert">{error}</p>}
          <button className="btn btn-solid" type="submit" disabled={status === 'sending'}>
            <span>{status === 'sending' ? 'Sending…' : 'Send message'}</span>
          </button>
        </form>
      )}
    </section>
  );
}
