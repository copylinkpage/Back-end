export default async function handler(req, res) {
  // Handle CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { text, from, to } = req.body;

    if (!text || !from || !to) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }

    // Azure Translator API
    const response = await fetch(
      `https://api.cognitive.microsofttranslator.com/translate?api-version=3.0&from=${from}&to=${to}`,
      {
        method: 'POST',
        headers: {
          'Ocp-Apim-Subscription-Key': process.env.AZURE_API_KEY,
          'Ocp-Apim-Subscription-Region': process.env.AZURE_REGION,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify([{ text }])
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(`Azure API Error: ${response.status}`);
    }

    if (data[0] && data[0].translations && data[0].translations[0]) {
      return res.status(200).json({
        success: true,
        translatedText: data[0].translations[0].text,
        originalText: text,
        from,
        to
      });
    } else {
      throw new Error('Invalid response from Azure API');
    }

  } catch (error) {
    console.error('Translation error:', error);
    return res.status(500).json({
      success: false,
      error: 'Translation failed',
      details: error.message
    });
  }
}