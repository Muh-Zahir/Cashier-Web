const { handler: netlifyHandler } = require('../netlify/functions/api.cjs');

module.exports = async function (req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  let body = '';
  if (req.body) {
    body = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
  } else if (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH') {
    try {
      const chunks = [];
      for await (const chunk of req) chunks.push(chunk);
      body = Buffer.concat(chunks).toString();
    } catch (_) {
      body = '';
    }
  }

  const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const subpath = parsedUrl.searchParams.get('subpath');
  const forwardedUri = req.headers['x-forwarded-uri'] || req.headers['x-matched-path'] || '';
  
  let rawPath = '';
  if (subpath) {
    rawPath = subpath.startsWith('/') ? subpath : '/' + subpath;
  } else if (forwardedUri && forwardedUri.startsWith('/api')) {
    rawPath = forwardedUri.replace(/^\/api/, '');
  } else {
    rawPath = parsedUrl.pathname.replace(/^\/api/, '');
  }
  const path = rawPath.replace(/^\/index\.js/, '') || '/';

  const queryParams = {};
  parsedUrl.searchParams.forEach((v, k) => {
    if (k !== 'subpath') queryParams[k] = v;
  });

  const event = {
    httpMethod: req.method,
    path: path,
    queryStringParameters: queryParams,
    headers: req.headers || {},
    body: body
  };

  try {
    const result = await netlifyHandler(event, {});
    if (result.headers) {
      Object.entries(result.headers).forEach(([k, v]) => {
        res.setHeader(k, v);
      });
    }
    return res.status(result.statusCode || 200).send(result.body);
  } catch (err) {
    console.error('Vercel API Error:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
};
