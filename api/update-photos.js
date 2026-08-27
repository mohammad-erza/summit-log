// Vercel Serverless Function to update images/photos.json via GitHub API
// Falls back to local disk write in dev mode (no GITHUB_TOKEN)
const fs = require('fs');
const path = require('path');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') { res.status(200).end(); return; }
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { password, data } = req.body;

  const adminPassword = process.env.ADMIN_PASSWORD;
  if (!adminPassword || password !== adminPassword) {
    return res.status(401).json({ error: 'Unauthorized: Invalid password' });
  }

  if (!Array.isArray(data)) {
    return res.status(400).json({ error: 'Invalid data format: expected an array' });
  }

  const githubToken = process.env.GITHUB_TOKEN;

  // ── Local dev fallback ────────────────────────────────────────────────────
  if (!githubToken) {
    try {
      const localPath = path.join(process.cwd(), 'images', 'photos.json');
      fs.writeFileSync(localPath, JSON.stringify(data, null, 2), 'utf8');
      return res.status(200).json({ success: true, message: 'photos.json saved locally (dev mode)' });
    } catch (err) {
      return res.status(500).json({ error: `Local write failed: ${err.message}` });
    }
  }

  // ── GitHub API commit ─────────────────────────────────────────────────────
  const githubRepo   = process.env.GITHUB_REPO;
  const githubBranch = process.env.GITHUB_BRANCH || 'main';
  const filePath     = 'images/photos.json';

  if (!githubRepo) return res.status(500).json({ error: 'GITHUB_REPO env var is missing' });

  try {
    const getRes = await fetch(
      `https://api.github.com/repos/${githubRepo}/contents/${filePath}?ref=${githubBranch}`,
      { headers: { Authorization: `token ${githubToken}`, Accept: 'application/vnd.github.v3+json', 'User-Agent': 'summit-log-admin' } }
    );
    let sha = null;
    if (getRes.status === 200) sha = (await getRes.json()).sha;

    const putRes = await fetch(
      `https://api.github.com/repos/${githubRepo}/contents/${filePath}`,
      {
        method: 'PUT',
        headers: {
          Authorization: `token ${githubToken}`,
          Accept: 'application/vnd.github.v3+json',
          'Content-Type': 'application/json',
          'User-Agent': 'summit-log-admin',
        },
        body: JSON.stringify({
          message: 'chore: update photos.json via admin dashboard',
          content: Buffer.from(JSON.stringify(data, null, 2)).toString('base64'),
          branch: githubBranch,
          ...(sha && { sha }),
        }),
      }
    );

    if (!putRes.ok) return res.status(putRes.status).json({ error: `GitHub commit failed: ${await putRes.text()}` });
    return res.status(200).json({ success: true, message: 'photos.json committed to GitHub' });
  } catch (err) {
    return res.status(500).json({ error: `Server error: ${err.message}` });
  }
};
