import Hero from './Hero';
import Marquee from './Marquee';
import Hats from './Hats';
import { ServicesSnapshot, ServiceList } from './Services';
import { FeaturedProjects, ProjectGrid } from './Projects';
import { Process, Timeline } from './Steps';
import { CTA, TextBlock, PageHeader, AboutIntro, Skills, FAQ } from './Blocks';
import ContactForm from './Contact';

// Every section type the admin can add. `defaults` is what a new section starts with.
export const SECTIONS = {
  hero: { label: 'Hero (animated workflow)', component: Hero, defaults: {
    messyHeadline: 'Your business runs on tasks nobody should be doing by hand.',
    flowHeadline: 'I turn them into systems that run themselves.',
    name: 'Sharon', intro: 'Short introduction.',
    primaryCta: { label: 'See my work', path: '/projects' }, secondaryCta: { label: "Let's talk", path: '/contact' },
    tasks: [{ messy: 'Messy task', node: 'Automation step' }, { messy: 'Messy task', node: 'Automation step' }, { messy: 'Messy task', node: 'Automation step' }],
  } },
  pageHeader: { label: 'Page title', component: PageHeader, defaults: { heading: 'Page title', body: 'A short line under the title.' } },
  text: { label: 'Text (reads as you scroll)', component: TextBlock, defaults: { heading: 'New heading', body: 'Write your paragraph here.' } },
  marquee: { label: 'Tools list (lights up on scroll)', component: Marquee, defaults: { label: 'Tools I build with', items: ['Tool one', 'Tool two', 'Tool three'] } },
  hats: { label: 'Sideways story cards', component: Hats, defaults: { heading: 'New heading', body: '', items: [{ title: 'Card title', text: 'Card text' }] } },
  servicesSnapshot: { label: 'Services preview', component: ServicesSnapshot, defaults: { heading: 'What I can take off your plate', linkLabel: 'All services', limit: 4 } },
  serviceList: { label: 'Full services list', component: ServiceList, defaults: {} },
  featuredProjects: { label: 'Featured projects (stacking cards)', component: FeaturedProjects, defaults: { heading: 'Recent builds', body: '', slugs: [] } },
  projectGrid: { label: 'All projects grid', component: ProjectGrid, defaults: {} },
  process: { label: 'Process steps', component: Process, defaults: { heading: 'How it works', steps: [{ title: 'Step', text: 'What happens here.' }] } },
  timeline: { label: 'Timeline', component: Timeline, defaults: { heading: 'Timeline', items: [{ title: 'Milestone', text: 'What happened.' }] } },
  aboutIntro: { label: 'About intro with photo', component: AboutIntro, defaults: { heading: "Hi, I'm Sharon.", body: 'Bio.', photoUrl: '', photoAlt: '' } },
  skills: { label: 'Skills groups', component: Skills, defaults: { heading: 'Skills', groups: [{ title: 'Group', items: ['Skill'] }] } },
  faq: { label: 'FAQ', component: FAQ, defaults: { heading: 'Questions', items: [{ q: 'Question?', a: 'Answer.' }] } },
  cta: { label: 'Call to action', component: CTA, defaults: { heading: "Let's work together.", body: '', button: { label: 'Get in touch', path: '/contact' } } },
  contactForm: { label: 'Contact form', component: ContactForm, defaults: { heading: 'Get in touch', body: '', formEndpoint: '', successMessage: 'Message sent.', budgetOptions: ['Not sure yet'] } },
};
