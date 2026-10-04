// Vercel serverless function: saves edited content back to GitHub.
// Vercel sees the new commit and redeploys the site automatically.
//
// Environment variables (Vercel → Project → Settings → Environment Variables):
//   ADMIN_PASSWORD  the password you type into /admin
//   GITHUB_TOKEN    fine-grained token with "Contents: read and write" on this repo
//   GITHUB_REPO     e.g. yourname/sharon-site
//   GITHUB_BRANCH   optional, defaults to main

const FILE = 'src/content/site.json';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Use POST.' });

  const { ADMIN_PASSWORD, GITHUB_TOKEN, GITHUB_REPO, GITHUB_BRANCH = 'main' } = process.env;
  if (!ADMIN_PASSWORD || !GITHUB_TOKEN || !GITHUB_REPO) {
    return res.status(500).json({ error: 'The server is missing ADMIN_PASSWORD, GITHUB_TOKEN or GITHUB_REPO. Add them in Vercel settings.' });
  }

  const { password, content } = req.body || {};
  if (password !== ADMIN_PASSWORD) return res.status(401).json({ error: 'Wrong password. Log out of the editor and try again.' });
  if (!content || !content.pages || !content.theme) return res.status(400).json({ error: 'The content looks incomplete, so nothing was saved.' });

  const api = `https://api.github.com/repos/${GITHUB_REPO}/contents/${FILE}`;
  const headers = { Authorization: `Bearer ${GITHUB_TOKEN}`, Accept: 'application/vnd.github+json', 'User-Agent': 'sharon-site-admin' };

  try {
    const current = await fetch(`${api}?ref=${GITHUB_BRANCH}`, { headers });
    if (!current.ok) throw new Error(`GitHub couldn't find ${FILE} (status ${current.status}). Check GITHUB_REPO and the token.`);
    const { sha } = await current.json();

    const put = await fetch(api, {
      method: 'PUT',
      headers,
      body: JSON.stringify({
        message: 'Update site content from editor',
        content: Buffer.from(JSON.stringify(content, null, 2) + '\n').toString('base64'),
        sha,
        branch: GITHUB_BRANCH,
      }),
    });
    if (!put.ok) throw new Error(`GitHub refused the save (status ${put.status}). Check the token has write access.`);
    return res.status(200).json({ ok: true });
  } catch (e) {
    return res.status(502).json({ error: e.message });
  }
}
