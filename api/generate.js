export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'API key not configured on server.' });

  try {
    const { prompt, pdfDataList } = req.body;
    if (!prompt) return res.status(400).json({ error: 'No prompt provided.' });

    // Build Gemini parts — text + inline PDF data
    const parts = [];

    if (pdfDataList && pdfDataList.length > 0) {
      pdfDataList.forEach(pdf => {
        parts.push({
          inline_data: {
            mime_type: 'application/pdf',
            data: pdf.base64,
          }
        });
      });
    }

    parts.push({ text: prompt });

    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 8192,
          },
        }),
      }
    );

    if (!geminiRes.ok) {
      const errData = await geminiRes.json();
      return res.status(geminiRes.status).json({ error: errData.error?.message || 'Gemini API error' });
    }

    const data = await geminiRes.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    return res.status(200).json({ text });

  } catch (err) {
    console.error('API handler error:', err);
    return res.status(500).json({ error: err.message });
  }
}
