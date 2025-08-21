import { GoogleGenerativeAI } from '@google/generative-ai';
import type { Website } from '../types';

const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY || '');

export const searchWebsitesWithAI = async (query: string, websites: Website[]): Promise<Website[]> => {
  try {
    if (!import.meta.env.VITE_GEMINI_API_KEY) {
      console.warn('Gemini API key not found, falling back to text search');
      return textSearch(query, websites);
    }

    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    
    const websitesContext = websites.map(w => ({
      id: w.id,
      title: w.title,
      url: w.url,
      category: w.category,
      description: w.description || '',
    }));

    const prompt = `
Given this list of saved websites and a user search query, return the IDs of the most relevant websites in order of relevance.

User Query: "${query}"

Websites:
${JSON.stringify(websitesContext, null, 2)}

Instructions:
- Return only the IDs of relevant websites as a JSON array
- Order by relevance (most relevant first)
- Consider title, URL, category, and description
- If no websites match, return an empty array
- Return only valid IDs from the provided list

Response format: ["id1", "id2", "id3"]
`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    try {
      const ids = JSON.parse(text.trim());
      if (Array.isArray(ids)) {
        return ids.map(id => websites.find(w => w.id === id)).filter(Boolean) as Website[];
      }
    } catch (e) {
      console.warn('Failed to parse AI response, falling back to text search');
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