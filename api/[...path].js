const { handler } = require('../netlify/functions/api.cjs');

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
  const queryParams = {};
  parsedUrl.searchParams.forEach((v, k) => { queryParams[k] = v; });

  const event = {
    httpMethod: req.method,
    path: parsedUrl.pathname,
    queryStringParameters: queryParams,
    headers: req.headers || {},
    body: body
  };

  try {
    const result = await handler(event, {});
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
