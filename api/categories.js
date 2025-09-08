import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  // CORS
  const origin = req.headers?.origin || '*';
  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Vary', 'Origin');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }

  if (!['GET', 'POST', 'DELETE'].includes(req.method)) {
    res.status(405).json({ error: 'Method Not Allowed' });
    return;
  }

  try {
    const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
    if (!supabaseUrl || !serviceKey) {
      res.status(500).json({ error: 'Supabase server credentials not configured' });
      return;
    }

    const supabase = createClient(supabaseUrl, serviceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // Resolve userId from email if provided using RPC function
    let userId = req.query.userId;
    const email = req.query.email;
    if (!userId && email) {
      try {
        // Use RPC function to get user ID by email
        const { data, error } = await supabase
          .rpc('get_user_id_by_email', { user_email: String(email) });
          
        if (error) {
          res.status(500).json({ error: `User lookup failed: ${error.message}` });
          return;
        }
        
        userId = data;
      } catch (e) {
        res.status(500).json({ error: `User lookup exception: ${e?.message || e}` });
        return;
      }
    }

    if (!userId) {
      res.status(400).json({ error: 'Missing userId or email' });
      return;
    }

    if (req.method === 'GET') {
      await handleGetCategories(supabase, userId, res);
    } else if (req.method === 'POST') {
      await handleCreateCategory(supabase, userId, req.body, res);
    } else if (req.method === 'DELETE') {
      await handleDeleteCategory(supabase, userId, req.body, res);
    }
  } catch (err) {
    console.error('categories error:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}

// Handle GET request - fetch categories from dedicated categories table
async function handleGetCategories(supabase, userId, res) {
  try {
    // Get categories from the dedicated categories table
    const { data: categoriesData, error: categoriesError } = await supabase
      .from('categories')
      .select('id, name, created_at')
      .eq('user_id', userId)
      .order('name');

    if (categoriesError) {
      res.status(500).json({ error: categoriesError.message });
      return;
    }

    // Get category usage counts from websites table
    const { data: websitesData, error: websitesError } = await supabase
      .from('websites')
      .select('category')
      .eq('user_id', userId);

    if (websitesError) {
      res.status(500).json({ error: websitesError.message });
      return;
    }

    // Count usage for each category
    const categoryUsage = new Map();
    websitesData?.forEach(website => {
      const count = categoryUsage.get(website.category) || 0;
      categoryUsage.set(website.category, count + 1);
    });

    // Create category list with counts
    const categories = (categoriesData || []).map(cat => ({
      id: cat.id,
      name: cat.name,
      count: categoryUsage.get(cat.name) || 0
    }));

    // Also include categories that exist in websites but not in categories table
    // (for backward compatibility during transition)
    const existingCategoryNames = new Set(categories.map(c => c.name));
    const websiteCategories = Array.from(new Set(websitesData?.map(w => w.category) || []))
      .filter(cat => cat && cat !== 'Uncategorized' && !existingCategoryNames.has(cat));
    
    websiteCategories.forEach(categoryName => {
      categories.push({
        id: categoryName, // Use name as temporary ID for backward compatibility
        name: categoryName,
        count: categoryUsage.get(categoryName) || 0
      });
    });

    // Sort categories alphabetically
    categories.sort((a, b) => a.name.localeCompare(b.name));

    res.status(200).json({ categories });
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
}

// Handle POST request - create new category
async function handleCreateCategory(supabase, userId, body, res) {
  try {
    const { name } = body;
    
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      res.status(400).json({ error: 'Category name is required' });
      return;
    }

    const trimmedName = name.trim();
    
    if (trimmedName.toLowerCase() === 'uncategorized') {
      res.status(400).json({ error: 'Cannot create category named "Uncategorized"' });
      return;
    }

    // Check if category already exists
    const { data: existingCategory } = await supabase
      .from('categories')
      .select('id')
      .eq('user_id', userId)
      .eq('name', trimmedName)
      .single();

    if (existingCategory) {
      res.status(409).json({ error: 'Category already exists' });
      return;
    }

    // Create new category
    const { data, error } = await supabase
      .from('categories')
      .insert({
        name: trimmedName,
        user_id: userId
      })
      .select('id, name, created_at')
      .single();

    if (error) {
      res.status(500).json({ error: error.message });
      return;
    }

    res.status(201).json({ 
      category: {
        id: data.id,
        name: data.name,
        count: 0
      }
    });
  } catch (error) {
    console.error('Create category error:', error);
    res.status(500).json({ error: 'Failed to create category' });
  }
}

// Handle DELETE request - delete category
async function handleDeleteCategory(supabase, userId, body, res) {
  try {
    const { id, name } = body;
    
    if (!id && !name) {
      res.status(400).json({ error: 'Category ID or name is required' });
      return;
    }

    // Check if category exists and belongs to user
    let categoryQuery = supabase
      .from('categories')
      .select('id, name')
      .eq('user_id', userId);
    
    if (id) {
      categoryQuery = categoryQuery.eq('id', id);
    } else {
      categoryQuery = categoryQuery.eq('name', name);
    }

    const { data: category, error: fetchError } = await categoryQuery.single();

    if (fetchError || !category) {
      res.status(404).json({ error: 'Category not found' });
      return;
    }

    // Check if category is in use by any websites
    const { data: websitesUsingCategory, error: usageError } = await supabase
      .from('websites')
      .select('id')
      .eq('user_id', userId)
      .eq('category', category.name)
      .limit(1);

    if (usageError) {
      res.status(500).json({ error: usageError.message });
      return;
    }

    if (websitesUsingCategory && websitesUsingCategory.length > 0) {
      res.status(409).json({ 
        error: 'Cannot delete category that is in use',
        inUse: true,
        categoryName: category.name
      });
      return;
    }

    // Delete the category
    const { error: deleteError } = await supabase
      .from('categories')
      .delete()
      .eq('id', category.id)
      .eq('user_id', userId);

    if (deleteError) {
      res.status(500).json({ error: deleteError.message });
      return;
    }

    res.status(200).json({ 
      success: true,
      deletedCategory: {
        id: category.id,
        name: category.name
      }
    });
  } catch (error) {
    console.error('Delete category error:', error);
    res.status(500).json({ error: 'Failed to delete category' });
  }
}


