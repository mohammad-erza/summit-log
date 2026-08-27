// Vercel Serverless Function to upload an image file to the GitHub repo
// Accepts: { password, filename, base64 }
// Falls back to local disk write in dev mode (no GITHUB_TOKEN)
const fs = require('fs');
const path = require('path');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') { res.status(200).end(); return; }
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { password, filename, base64 } = req.body;

  const adminPassword = process.env.ADMIN_PASSWORD;
  if (!adminPassword || password !== adminPassword) {
    return res.status(401).json({ error: 'Unauthorized: Invalid password' });
  }

  if (!filename || !base64) {
    return res.status(400).json({ error: 'Missing filename or base64 image data' });
  }

  // Sanitise filename — allow only alphanumerics, dashes, underscores, dots
  const safe = filename.replace(/[^a-zA-Z0-9._-]/g, '_');
  const githubToken = process.env.GITHUB_TOKEN;

  // ── Local dev fallback ────────────────────────────────────────────────────
  if (!githubToken) {
    try {
      const localPath = path.join(process.cwd(), 'images', safe);
      fs.writeFileSync(localPath, Buffer.from(base64, 'base64'));
      return res.status(200).json({ success: true, file: `images/${safe}`, message: 'Saved locally (dev mode)' });
    } catch (err) {
      return res.status(500).json({ error: `Local write failed: ${err.message}` });
    }
  }

  // ── GitHub API commit ─────────────────────────────────────────────────────
  const githubRepo   = process.env.GITHUB_REPO;
  const githubBranch = process.env.GITHUB_BRANCH || 'main';
  const filePath     = `images/${safe}`;

  if (!githubRepo) return res.status(500).json({ error: 'GITHUB_REPO env var is missing' });

  try {
    // Check if file already exists (to get SHA for update)
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
          message: `chore: upload image ${safe} via admin dashboard`,
          content: base64,
          branch: githubBranch,
          ...(sha && { sha }),
        }),
      }
    );

    if (!putRes.ok) return res.status(putRes.status).json({ error: `GitHub upload failed: ${await putRes.text()}` });
    return res.status(200).json({ success: true, file: filePath, message: `${safe} uploaded to GitHub` });
  } catch (err) {
    return res.status(500).json({ error: `Server error: ${err.message}` });
  }
};
