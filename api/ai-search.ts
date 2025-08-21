import { GoogleGenerativeAI } from '@google/generative-ai';

interface WebsiteInput {
  id: string;
  title: string;
  url: string;
  category: string;
  description?: string | null;
}

export default async function handler(req: any, res: any) {
  try {
    if (req.method !== 'POST') {
      res.status(405).json({ error: 'Method Not Allowed' });
      return;
    }

    const apiKey = process.env.GEMINI_API_KEY || '';
    if (!apiKey) {
      res.status(500).json({ error: 'GEMINI_API_KEY not configured on server' });
      return;
    }

    const { query, websites } = req.body || {} as { query?: string; websites?: WebsiteInput[] };

    if (!query || !Array.isArray(websites)) {
      res.status(400).json({ error: 'Invalid payload. Expected { query: string, websites: Website[] }' });
      return;
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    // Minimize prompt size by only sending necessary fields
    const websitesContext = websites.map(w => ({
      id: w.id,
      title: w.title,
      url: w.url,
      category: w.category,
      description: w.description || ''
    }));

    const prompt = `Given this list of saved websites and a user search query, return ONLY the IDs of the most relevant websites in order of relevance as a JSON array.\n\nUser Query: "${query}"\n\nWebsites:\n${JSON.stringify(websitesContext, null, 2)}\n\nInstructions:\n- Return only the IDs of relevant websites as a JSON array\n- Order by relevance (most relevant first)\n- Consider title, URL, category, and description\n- If no websites match, return an empty array\n- Return only valid IDs from the provided list\n\nResponse format: ["id1", "id2", "id3"]`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    let ids: string[] = [];
    try {
      const parsed = JSON.parse(text.trim());
      if (Array.isArray(parsed)) {
        ids = parsed.filter((v) => typeof v === 'string');
      }
    } catch {
      // If parsing fails, return empty to signal fallback on client
      ids = [];
    }

    res.status(200).json({ ids });
  } catch (error: any) {
    console.error('AI search handler error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}


