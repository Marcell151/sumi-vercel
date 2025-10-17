const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const REPO = process.env.GITHUB_REPO;
const FILE_PATH = process.env.GITHUB_FILE_PATH || 'response.json';
const BRANCH = process.env.GITHUB_BRANCH || 'main';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ message: 'Method not allowed' });
    return;
  }
  try {
    const newEntry = req.body;
    const getUrl = `https://api.github.com/repos/${REPO}/contents/${FILE_PATH}?ref=${BRANCH}`;
    let existing = [];
    let sha = null;
    const getResp = await fetch(getUrl, {
      headers: {
        'Authorization': `token ${GITHUB_TOKEN}`,
        'Accept': 'application/vnd.github.v3+json'
      }
    });
    if (getResp.status === 200) {
      const j = await getResp.json();
      sha = j.sha;
      const content = Buffer.from(j.content, 'base64').toString('utf8');
      existing = JSON.parse(content || '[]');
    } else if (getResp.status === 404) {
      existing = [];
    } else {
      return res.status(500).json({ message: 'Error accessing GitHub' });
    }
    existing.push(newEntry);
    const newContent = JSON.stringify(existing, null, 2);
    const blob = Buffer.from(newContent).toString('base64');
    const putUrl = `https://api.github.com/repos/${REPO}/contents/${FILE_PATH}`;
    const body = { message: `Add response ${newEntry.id}`, content: blob, branch: BRANCH };
    if (sha) body.sha = sha;
    const putResp = await fetch(putUrl, {
      method: 'PUT',
      headers: {
        'Authorization': `token ${GITHUB_TOKEN}`,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });
    if (putResp.ok) {
      res.status(200).json({ message: 'Saved' });
    } else {
      res.status(500).json({ message: 'Failed to save to GitHub' });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
}