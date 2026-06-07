// Vercel Serverless Function - Reviews DB Handler
// Securely retrieves and inserts public user reviews using Supabase REST API.

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  // Fallback to empty reviews list if database is not configured yet
  if (!supabaseUrl || !supabaseKey) {
    if (req.method === 'GET') {
      return res.status(200).json([]);
    }
    return res.status(500).json({ error: "Supabase environment variables (SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY) are not configured." });
  }

  const reviewsEndpoint = `${supabaseUrl}/rest/v1/reviews`;

  try {
    if (req.method === 'GET') {
      const response = await fetch(`${reviewsEndpoint}?select=*&order=created_at.asc`, {
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`
        }
      });
      
      if (!response.ok) {
        throw new Error(await response.text());
      }
      
      const data = await response.json();
      return res.status(200).json(data);
    } else if (req.method === 'POST') {
      const { rating, author, title, comment, date } = req.body;
      
      if (!comment) {
        return res.status(400).json({ error: "Missing required 'comment' field" });
      }

      const response = await fetch(reviewsEndpoint, {
        method: 'POST',
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation'
        },
        body: JSON.stringify({ rating, author, title, comment, date })
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }

      const data = await response.json();
      return res.status(201).json(data[0] || data);
    }
  } catch (error) {
    return res.status(500).json({ error: "Database error: " + error.message });
  }
}
