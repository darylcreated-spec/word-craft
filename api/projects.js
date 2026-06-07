// Vercel Serverless Function - Projects DB Handler
// Securely retrieves, saves, and deletes user-specific project drafts via Supabase REST API.

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST,DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  // Fallback to empty projects list if database is not configured yet
  if (!supabaseUrl || !supabaseKey) {
    if (req.method === 'GET') {
      return res.status(200).json([]);
    }
    return res.status(500).json({ error: "Supabase environment variables (SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY) are not configured." });
  }

  const projectsEndpoint = `${supabaseUrl}/rest/v1/projects`;

  try {
    if (req.method === 'GET') {
      const { user_uuid } = req.query;
      if (!user_uuid) {
        return res.status(400).json({ error: "Missing required 'user_uuid' parameter" });
      }

      const response = await fetch(`${projectsEndpoint}?user_uuid=eq.${user_uuid}&select=*`, {
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
      const { id, user_uuid, title, input_content, output_content, active_option_id, options_json } = req.body;
      
      if (!id || !user_uuid || !title) {
        return res.status(400).json({ error: "Missing required fields (id, user_uuid, title)" });
      }

      // Upsert: resolution=merge-duplicates to update existing keys
      const response = await fetch(projectsEndpoint, {
        method: 'POST',
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json',
          'Prefer': 'resolution=merge-duplicates,return=representation'
        },
        body: JSON.stringify({ id, user_uuid, title, input_content, output_content, active_option_id, options_json })
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }

      const data = await response.json();
      return res.status(200).json(data[0] || data);
    } else if (req.method === 'DELETE') {
      const { id, user_uuid } = req.query;
      
      if (!id || !user_uuid) {
        return res.status(400).json({ error: "Missing required parameters (id, user_uuid)" });
      }

      const response = await fetch(`${projectsEndpoint}?id=eq.${id}&user_uuid=eq.${user_uuid}`, {
        method: 'DELETE',
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`
        }
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }

      return res.status(200).json({ success: true });
    }
  } catch (error) {
    return res.status(500).json({ error: "Database error: " + error.message });
  }
}
