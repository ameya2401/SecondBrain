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

      const prompt = `Given this list of saved websites and a user search query, return ONLY the IDs of the most relevant websites in order of relevance as a JSON array.

User Query: "${query}"

Websites:
${JSON.stringify(websitesContext, null, 2)}

Instructions:
- Return only the IDs of relevant websites as a JSON array
- Order by relevance (most relevant first)
- Consider title, URL, category, and description
- If no websites match, return an empty array
- Return only valid IDs from the provided list

Response format: ["id1", "id2", "id3"]`;

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
  if (!query.trim()) return websites;
  
  const searchTerms = query.toLowerCase().trim().split(/\s+/);
  
  return websites.filter(website => {
    const searchableText = [
      website.title || '',
      website.url || '',
      website.category || '',
      website.description || ''
    ].join(' ').toLowerCase();
    
    // Remove spaces and special characters for flexible matching
    const normalizedSearchableText = searchableText.replace(/[\s\-_\.]/g, '');
    const normalizedQuery = query.toLowerCase().replace(/[\s\-_\.]/g, '');
    
    // Score the match quality
    let score = 0;
    
    // 1. Exact phrase match (highest score)
    if (searchableText.includes(query.toLowerCase())) {
      score += 100;
    }
    
    // 2. Normalized match (handles space differences)
    if (normalizedSearchableText.includes(normalizedQuery)) {
      score += 80;
    }
    
    // 3. All search terms present (partial match)
    const allTermsPresent = searchTerms.every(term => 
      searchableText.includes(term) || normalizedSearchableText.includes(term.replace(/[\s\-_\.]/g, ''))
    );
    if (allTermsPresent) {
      score += 60;
    }
    
    // 4. Any search term present (loose match)
    const anyTermPresent = searchTerms.some(term => 
      searchableText.includes(term) || normalizedSearchableText.includes(term.replace(/[\s\-_\.]/g, ''))
    );
    if (anyTermPresent) {
      score += 20;
    }
    
    // 5. Bonus for title matches
    const titleText = (website.title || '').toLowerCase();
    const normalizedTitle = titleText.replace(/[\s\-_\.]/g, '');
    if (titleText.includes(query.toLowerCase()) || normalizedTitle.includes(normalizedQuery)) {
      score += 30;
    }
    
    return score > 0;
  }).sort((a, b) => {
    // Calculate scores for sorting
    const getScore = (website: Website) => {
      const searchableText = [
        website.title || '',
        website.url || '',
        website.category || '',
        website.description || ''
      ].join(' ').toLowerCase();
      
      const normalizedSearchableText = searchableText.replace(/[\s\-_\.]/g, '');
      const normalizedQuery = query.toLowerCase().replace(/[\s\-_\.]/g, '');
      
      let score = 0;
      
      if (searchableText.includes(query.toLowerCase())) score += 100;
      if (normalizedSearchableText.includes(normalizedQuery)) score += 80;
      
      const allTermsPresent = searchTerms.every(term => 
        searchableText.includes(term) || normalizedSearchableText.includes(term.replace(/[\s\-_\.]/g, ''))
      );
      if (allTermsPresent) score += 60;
      
      const titleText = (website.title || '').toLowerCase();
      const normalizedTitle = titleText.replace(/[\s\-_\.]/g, '');
      if (titleText.includes(query.toLowerCase()) || normalizedTitle.includes(normalizedQuery)) {
        score += 30;
      }
      
      return score;
    };
    
    return getScore(b) - getScore(a); // Sort by score descending
  });
};