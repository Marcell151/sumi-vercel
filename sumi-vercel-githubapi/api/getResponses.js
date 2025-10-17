const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const REPO = process.env.GITHUB_REPO;
const FILE_PATH = process.env.GITHUB_FILE_PATH || 'response.json';
const BRANCH = process.env.GITHUB_BRANCH || 'main';

export default async function handler(req, res) {
  try {
    const url = `https://api.github.com/repos/${REPO}/contents/${FILE_PATH}?ref=${BRANCH}`;
    const resp = await fetch(url, {
      headers: {
        'Authorization': `token ${GITHUB_TOKEN}`,
        'Accept': 'application/vnd.github.v3+json'
      }
    });
    if (resp.status === 200) {
      const j = await resp.json();
      const content = Buffer.from(j.content, 'base64').toString('utf8');
      const data = JSON.parse(content || '[]');
      res.status(200).json(data);
    } else if (resp.status === 404) {
      res.status(200).json([]);
    } else {
      res.status(500).json({ message: 'Error reading GitHub file' });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
}