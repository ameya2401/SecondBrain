import type { Website } from '../types';

export const searchWebsitesWithAI = async (query: string, websites: Website[]): Promise<Website[]> => {
  try {
    const websitesContext = websites.map(w => ({
      id: w.id,
      title: w.title,
      url: w.url,
      category: w.category,
      description: w.description || '',
    }));

    // Prefer secure serverless endpoint first
    const res = await fetch('/api/ai-search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, websites: websitesContext }),
    });

    if (res.ok) {
      const data: { ids?: string[] } = await res.json();
      if (Array.isArray(data.ids)) {
        const ordered = data.ids
          .map(id => websites.find(w => w.id === id))
          .filter(Boolean) as Website[];
        return ordered.length ? ordered : textSearch(query, websites);
      }
    }

    // If API route fails, try client-side key if present, else fallback to text search
    if (import.meta.env.VITE_GEMINI_API_KEY) {
      const { GoogleGenerativeAI } = await import('@google/generative-ai');
      const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY || '');
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

      const prompt = `Given this list of saved websites and a user search query, return ONLY the IDs of the most relevant websites in order of relevance as a JSON array.\n\nUser Query: "${query}"\n\nWebsites:\n${JSON.stringify(websitesContext, null, 2)}\n\nInstructions:\n- Return only the IDs of relevant websites as a JSON array\n- Order by relevance (most relevant first)\n- Consider title, URL, category, and description\n- If no websites match, return an empty array\n- Return only valid IDs from the provided list\n\nResponse format: ["id1", "id2", "id3"]`;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      try {
        const ids = JSON.parse(text.trim());
        if (Array.isArray(ids)) {
          const ordered = ids
            .map(id => websites.find(w => w.id === id))
            .filter(Boolean) as Website[];
          if (ordered.length) return ordered;
        }
      } catch {
        // ignore and fallback
      }
    }

    return textSearch(query, websites);
  } catch (error) {
    console.error('AI search failed:', error);
    return textSearch(query, websites);
  }
};

const textSearch = (query: string, websites: Website[]): Website[] => {
  const searchTerm = query.toLowerCase();
  return websites.filter(website => 
    website.title.toLowerCase().includes(searchTerm) ||
    website.url.toLowerCase().includes(searchTerm) ||
    website.category.toLowerCase().includes(searchTerm) ||
    (website.description && website.description.toLowerCase().includes(searchTerm))
  );
};