// Vercel Serverless Function - CORS Bypass Proxy
// Securely forwards authorization headers and bypasses browser CORS locks for Vercel deployments.

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization');

  // Handle preflight options request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const targetUrl = req.query.url;
  if (!targetUrl) {
    return res.status(400).json({ error: "Missing target 'url' query parameter" });
  }

  try {
    // Clone headers from client request
    const headers = {};
    
    // Copy allowed headers
    const allowedHeaders = ['authorization', 'content-type', 'accept', 'x-api-key'];
    for (const key of Object.keys(req.headers)) {
      if (allowedHeaders.includes(key.toLowerCase())) {
        headers[key] = req.headers[key];
      }
    }

    // Determine target URL request configurations
    const fetchOptions = {
      method: req.method,
      headers: headers
    };

    if (req.method !== 'GET' && req.method !== 'HEAD' && req.body) {
      fetchOptions.body = typeof req.body === 'object' ? JSON.stringify(req.body) : req.body;
    }

    const response = await fetch(targetUrl, fetchOptions);
    const contentType = response.headers.get('content-type');
    
    // Set response status
    res.status(response.status);

    if (contentType && contentType.includes('application/json')) {
      const responseData = await response.json();
      return res.json(responseData);
    } else {
      const responseText = await response.text();
      return res.send(responseText);
    }
  } catch (error) {
    return res.status(500).json({ error: "Proxy connection error: " + error.message });
  }
}
