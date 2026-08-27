// Vercel Serverless Function to update mountains.json via GitHub API
module.exports = async (req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { password, data } = req.body;

  // Simple password protection
  const adminPassword = process.env.ADMIN_PASSWORD;
  if (!adminPassword || password !== adminPassword) {
    return res.status(401).json({ error: 'Unauthorized: Invalid password' });
  }

  if (!Array.isArray(data)) {
    return res.status(400).json({ error: 'Invalid data format: Expected an array of mountains' });
  }

  const githubToken = process.env.GITHUB_TOKEN;
  const githubRepo = process.env.GITHUB_REPO; // e.g. "mohammad-erza/summit-log"
  const githubBranch = process.env.GITHUB_BRANCH || 'main';
  const path = 'mountains.json';

  if (!githubToken || !githubRepo) {
    return res.status(500).json({ error: 'Server configuration error: GITHUB_TOKEN or GITHUB_REPO is missing' });
  }

  try {
    // 1. Get current SHA of mountains.json
    const getUrl = `https://api.github.com/repos/${githubRepo}/contents/${path}?ref=${githubBranch}`;
    const getRes = await fetch(getUrl, {
      headers: {
        'Authorization': `token ${githubToken}`,
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'Vercel-Serverless-Function'
      }
    });

    let sha = null;
    if (getRes.status === 200) {
      const fileData = await getRes.json();
      sha = fileData.sha;
    } else if (getRes.status !== 404) {
      const errText = await getRes.text();
      return res.status(getRes.status).json({ error: `Failed to fetch file SHA from GitHub: ${errText}` });
    }

    // 2. Commit updated file content
    const putUrl = `https://api.github.com/repos/${githubRepo}/contents/${path}`;
    const fileContent = JSON.stringify(data, null, 2);
    const base64Content = Buffer.from(fileContent).toString('base64');

    const body = {
      message: 'Update mountains.json via admin CRUD dashboard',
      content: base64Content,
      branch: githubBranch
    };
    if (sha) {
      body.sha = sha;
    }

    const putRes = await fetch(putUrl, {
      method: 'PUT',
      headers: {
        'Authorization': `token ${githubToken}`,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
        'User-Agent': 'Vercel-Serverless-Function'
      },
      body: JSON.stringify(body)
    });

    if (!putRes.ok) {
      const errText = await putRes.text();
      return res.status(putRes.status).json({ error: `GitHub API error: ${errText}` });
    }

    return res.status(200).json({ success: true, message: 'mountains.json updated successfully' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: `Server error: ${err.message}` });
  }
};
