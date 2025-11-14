import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { searchWebsitesWithAI } from '../lib/gemini';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { useReminders } from '../hooks/useReminders';
import type { Website, Category } from '../types';
import WebsiteCard from './WebsiteCard';
import SearchBar from './SearchBar';
import CategorySidebar from './CategorySidebar';
import AddWebsiteModal from './AddWebsiteModal';
import WebsiteDetailsModal from './WebsiteDetailsModal';
import ReminderModal from './ReminderModal';
import RemindersPanel from './RemindersPanel';
import ThemeToggle from './ThemeToggle';
import { LogOut, Plus, Grid, List } from 'lucide-react';
import { signOut } from '../lib/supabase';
import toast from 'react-hot-toast';

// Enhanced search function that handles flexible text matching
const enhancedTextSearch = (query: string, websites: Website[]): Website[] => {
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

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const { isDarkMode } = useTheme();
  const [websites, setWebsites] = useState<Website[]>([]);
  const [filteredWebsites, setFilteredWebsites] = useState<Website[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchingAI, setIsSearchingAI] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedWebsite, setSelectedWebsite] = useState<Website | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Callback to trigger data refresh
  const triggerRefresh = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  // Callback specifically for category changes
  const handleCategoryChange = () => {
    fetchCategories();
    fetchWebsites(); // Also refresh websites to update counts
  };

  // Initialize reminder system
  const {
    reminderWebsite,
    showReminder,
    handleOpenWebsite,
    handleCheckLater,
    handleDismissReminder,
    getPendingReminders,
    pendingRemindersCount
  } = useReminders(websites, user?.id, triggerRefresh);

  useEffect(() => {
    if (user) {
      fetchWebsites();
    }
  }, [user, refreshTrigger]);

  useEffect(() => {
    if (!user) return;
    
    // Subscribe to both websites and categories changes
    const websitesChannel = (supabase as any).channel('websites-realtime')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'websites',
        filter: `user_id=eq.${user.id}`,
      }, () => {
        fetchWebsites();
      })
      .subscribe();

    const categoriesChannel = (supabase as any).channel('categories-realtime')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'categories',
        filter: `user_id=eq.${user.id}`,
      }, () => {
        fetchCategories();
      })
      .subscribe();

    return () => {
      try { 
        (supabase as any).removeChannel(websitesChannel); 
        (supabase as any).removeChannel(categoriesChannel);
      } catch {}
    };
  }, [user]);

  useEffect(() => {
    filterWebsites();
  }, [websites, selectedCategory, searchQuery]);

  const fetchWebsites = async () => {
    try {
      const { data, error } = await supabase
        .from('websites')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setWebsites(data || []);
      
      // Fetch categories from dedicated categories table
      await fetchCategories();
    } catch (error: any) {
      toast.error('Failed to fetch websites');
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    if (!user) return;
    
    try {
      const response = await fetch(`/api/categories?userId=${user.id}`);
      if (response.ok) {
        const result = await response.json();
        setCategories(result.categories || []);
      } else {
        console.error('Failed to fetch categories');
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const filterWebsites = async () => {
    let filtered = websites;

    // Filter by category
    if (selectedCategory !== 'all') {
      if (selectedCategory === 'Reminders') {
        // Show pending reminders
        filtered = getPendingReminders();
      } else {
        filtered = filtered.filter(website => website.category === selectedCategory);
      }
    }

    // Filter by search
    if (searchQuery.trim()) {
      if (searchQuery.startsWith('ai:')) {
        // AI-powered search
        setIsSearchingAI(true);
        try {
          const aiQuery = searchQuery.slice(3).trim();
          filtered = await searchWebsitesWithAI(aiQuery, filtered);
        } catch (error) {
          console.error('AI search failed:', error);
          // Fallback to enhanced text search
          filtered = enhancedTextSearch(searchQuery, filtered);
        } finally {
          setIsSearchingAI(false);
        }
      } else {
        // Enhanced text search
        filtered = enhancedTextSearch(searchQuery, filtered);
      }
    }

    setFilteredWebsites(filtered);
  };

  // Calculate 'Recently Added' count
  const recentlyAddedCount = websites.filter(website => website.category === 'Recently Added').length;

  const handleDeleteWebsite = async (id: string) => {
    try {
      const { error } = await supabase
        .from('websites')
        .delete()
        .eq('id', id)
        .eq('user_id', user?.id);

      if (error) throw error;

      toast.success('Website deleted successfully');
      fetchWebsites();
      handleCategoryChange(); // Update category counts
    } catch (error: any) {
      toast.error('Failed to delete website');
      console.error('Error:', error);
    }
  };

  const handleViewWebsite = (website: Website) => {
    setSelectedWebsite(website);
  };

  const handleCloseDetailsModal = () => {
    setSelectedWebsite(null);
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      toast.success('Successfully signed out');
    } catch (error: any) {
      toast.error('Failed to sign out');
    }
  };

  // Reminder action helpers for individual websites
  const handleReminderOpenWebsite = async (website: Website) => {
    try {
      // Open website in new tab
      window.open(website.url, '_blank');
      
      // Update reminder timestamp
      const { error } = await supabase
        .from('websites')
        .update({ 
          last_reminded_at: new Date().toISOString()
        })
        .eq('id', website.id)
        .eq('user_id', user?.id);
        
      if (error) throw error;
      
      // Refresh data
      triggerRefresh();
    } catch (error: any) {
      console.error('Error handling reminder open:', error);
      toast.error('Failed to update reminder');
    }
  };

  const handleReminderCheckLater = async (website: Website) => {
    try {
      // Update reminder timestamp so it won't show again for a while
      const { error } = await supabase
        .from('websites')
        .update({ 
          last_reminded_at: new Date().toISOString()
        })
        .eq('id', website.id)
        .eq('user_id', user?.id);
        
      if (error) throw error;
      
      // Refresh data
      triggerRefresh();
      toast.success('Reminder postponed');
    } catch (error: any) {
      console.error('Error handling check later:', error);
      toast.error('Failed to update reminder');
    }
  };

  const handleReminderDismiss = async (website: Website) => {
    try {
      // Permanently dismiss reminders for this website
      const { error } = await supabase
        .from('websites')
        .update({ 
          reminder_dismissed: true,
          last_reminded_at: new Date().toISOString()
        })
        .eq('id', website.id)
        .eq('user_id', user?.id);
        
      if (error) throw error;
      
      // Refresh data
      triggerRefresh();
      toast.success('Reminder dismissed permanently');
    } catch (error: any) {
      console.error('Error handling dismiss reminder:', error);
      toast.error('Failed to dismiss reminder');
    }
  };

  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center transition-colors duration-300 ${
        isDarkMode ? 'bg-black' : 'bg-white'
      }`} style={{ fontFamily: "'Google Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>
        <div className={`animate-spin rounded-full h-8 w-8 border-b ${
          isDarkMode ? 'border-[#e9e9e9]' : 'border-[#37352f]'
        }`}></div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen transition-all duration-300 ${
      isDarkMode ? 'bg-black' : 'bg-white'
    }`} style={{ fontFamily: "'Google Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>
      {/* Header */}
      <header className={`border-b transition-all duration-300 ${
        isDarkMode 
          ? 'bg-black border-[#2e2e2e]' 
          : 'bg-white border-[#e9e9e9]'
      }`}>
        <div className="max-w-[120rem] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-4">
              <div className="w-8 h-8 flex items-center justify-center overflow-hidden rounded">
                <img 
                  src="/logo.png" 
                  alt="Memorai Logo" 
                  className="w-full h-full object-contain"
                  onError={(e) => {
                    // Fallback to text if image fails to load
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    const parent = target.parentElement;
                    if (parent && !parent.querySelector('.fallback-text')) {
                      const fallback = document.createElement('span');
                      fallback.className = `font-light text-sm fallback-text ${
                        isDarkMode ? 'text-white' : 'text-black'
                      }`;
                      fallback.textContent = 'AB';
                      parent.appendChild(fallback);
                    }
                  }}
                />
              </div>
              <div>
                <h1 className={`text-xl font-normal transition-colors duration-300 ${
                  isDarkMode ? 'text-[#e9e9e9]' : 'text-[#37352f]'
                }`}>Memorai</h1>
                <p className={`text-xs font-normal transition-colors duration-300 ${
                  isDarkMode ? 'text-[#787774]' : 'text-[#787774]'
                }`}>A personal archive for curated web content</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className={`px-3 py-1.5 border rounded transition-colors duration-300 ${
                isDarkMode ? 'border-[#2e2e2e] bg-[#191919]' : 'border-[#e9e9e9] bg-white'
              }`}>
                <span className={`text-sm font-normal transition-colors duration-300 ${
                  isDarkMode ? 'text-[#787774]' : 'text-[#787774]'
                }`}>
                  Welcome, <span className={`font-medium ${
                    isDarkMode ? 'text-[#e9e9e9]' : 'text-[#37352f]'
                  }`}>{user?.email?.split('@')[0]}</span>
                </span>
              </div>
              
              {/* Theme Toggle */}
              <ThemeToggle />
              
              <button
                onClick={handleSignOut}
                className={`flex items-center gap-2 px-2 py-1.5 border rounded transition-all duration-150 text-sm font-normal ${
                  isDarkMode 
                    ? 'text-[#787774] hover:text-[#e9e9e9] border-[#2e2e2e] hover:bg-[#2e2e2e]' 
                    : 'text-[#787774] hover:text-[#37352f] border-[#e9e9e9] hover:bg-[#f1f1ef]'
                }`}
                title="Sign out"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span className="hidden sm:block">Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-[120rem] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar */}
          <div className="w-full lg:w-64 flex-shrink-0">
            <CategorySidebar
              categories={categories}
              selectedCategory={selectedCategory}
              onCategorySelect={setSelectedCategory}
              totalWebsites={websites.length}
              onCategoryChange={handleCategoryChange}
              recentlyAddedCount={recentlyAddedCount}
              pendingRemindersCount={pendingRemindersCount}
            />
            
            <button
              onClick={() => setIsAddModalOpen(true)}
              className={`w-full mt-6 border rounded-lg px-2 py-1.5 text-sm font-normal transition-all duration-150 flex items-center justify-center gap-2 ${
                isDarkMode 
                  ? 'bg-[#2e2e2e] text-[#e9e9e9] border-[#2e2e2e] hover:bg-[#3e3e3e]' 
                  : 'bg-[#f1f1ef] text-[#37352f] border-[#e9e9e9] hover:bg-[#e9e9e9]'
              }`}
            >
              <Plus className="h-3.5 w-3.5" />
              Add Website
            </button>
          </div>

          {/* Main Content */}
          <div className="flex-1 min-w-0">
            {/* Search and Controls */}
            <div className="mb-6 space-y-4">
              <SearchBar
                value={searchQuery}
                onChange={setSearchQuery}
                isSearchingAI={isSearchingAI}
                placeholder="Search websites... (prefix with 'ai:' for AI search)"
              />
              
              <div className="flex justify-between items-center">
                <div className={`px-2 py-1.5 border rounded transition-colors duration-300 ${
                  isDarkMode ? 'border-[#2e2e2e] bg-[#191919] text-[#787774]' : 'border-[#e9e9e9] bg-white text-[#787774]'
                }`}>
                  <p className="text-sm font-normal">
                    <span className="font-medium">{filteredWebsites.length}</span> website{filteredWebsites.length !== 1 ? 's' : ''} found
                  </p>
                </div>
                
                <div className={`flex items-center gap-0.5 p-1 border rounded transition-colors duration-300 ${
                  isDarkMode ? 'border-[#2e2e2e] bg-[#191919]' : 'border-[#e9e9e9] bg-white'
                }`}>
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-2 rounded transition-all duration-150 ${
                      viewMode === 'grid' 
                        ? isDarkMode
                          ? 'bg-[#2e2e2e] text-[#e9e9e9]'
                          : 'bg-[#f1f1ef] text-[#37352f]'
                        : isDarkMode
                          ? 'text-[#787774] hover:text-[#e9e9e9] hover:bg-[#2e2e2e]'
                          : 'text-[#787774] hover:text-[#37352f] hover:bg-[#f1f1ef]'
                    }`}
                    title="Grid view"
                  >
                    <Grid className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`p-2 rounded transition-all duration-150 ${
                      viewMode === 'list' 
                        ? isDarkMode
                          ? 'bg-[#2e2e2e] text-[#e9e9e9]'
                          : 'bg-[#f1f1ef] text-[#37352f]'
                        : isDarkMode
                          ? 'text-[#787774] hover:text-[#e9e9e9] hover:bg-[#2e2e2e]'
                          : 'text-[#787774] hover:text-[#37352f] hover:bg-[#f1f1ef]'
                    }`}
                    title="List view"
                  >
                    <List className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Websites Grid/List or Reminders Panel */}
            {selectedCategory === 'Reminders' ? (
              <RemindersPanel
                websites={filteredWebsites}
                onOpenWebsite={handleReminderOpenWebsite}
                onCheckLater={handleReminderCheckLater}
                onDismissReminder={handleReminderDismiss}
                onViewDetails={handleViewWebsite}
              />
            ) : filteredWebsites.length === 0 ? (
              <div className="text-center py-16">
                <Grid className={`h-12 w-12 mx-auto mb-6 transition-colors duration-300 ${
                  isDarkMode ? 'text-[#787774]' : 'text-[#9b9a97]'
                }`} />
                <h3 className={`text-2xl font-medium mb-3 transition-colors duration-300 ${
                  isDarkMode ? 'text-[#e9e9e9]' : 'text-[#37352f]'
                }`}>No websites found</h3>
                <p className={`text-sm mb-8 font-normal transition-colors duration-300 ${
                  isDarkMode ? 'text-[#787774]' : 'text-[#787774]'
                }`}>
                  {searchQuery ? 'Try adjusting your search terms' : 'Start building your personal archive!'}
                </p>
                {!searchQuery && (
                  <button
                    onClick={() => setIsAddModalOpen(true)}
                    className={`border rounded-lg px-2 py-1.5 text-sm font-normal transition-all duration-150 ${
                      isDarkMode 
                        ? 'bg-[#2e2e2e] text-[#e9e9e9] border-[#2e2e2e] hover:bg-[#3e3e3e]' 
                        : 'bg-[#f1f1ef] text-[#37352f] border-[#e9e9e9] hover:bg-[#e9e9e9]'
                    }`}
                  >
                    Add Your First Website
                  </button>
                )}
              </div>
            ) : (
              <div className={
                viewMode === 'grid' 
                  ? 'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6'
                  : 'space-y-4 overflow-hidden'
              }>
                {filteredWebsites.map((website) => (
                  <WebsiteCard
                    key={website.id}
                    website={website}
                    viewMode={viewMode}
                    onDelete={handleDeleteWebsite}
                    onView={handleViewWebsite}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className={`border-t transition-all duration-300 ${
        isDarkMode 
          ? 'border-[#2e2e2e] bg-black' 
          : 'border-[#e9e9e9] bg-white'
      }`}>
        <div className={`max-w-[120rem] mx-auto px-4 sm:px-6 lg:px-8 py-8 text-center transition-colors duration-300`}>
          <div className={`inline-flex items-center gap-2 px-2 py-1.5 border rounded transition-colors duration-300 ${
            isDarkMode ? 'border-[#2e2e2e] bg-[#191919] text-[#787774]' : 'border-[#e9e9e9] bg-white text-[#787774]'
          }`}>
            <span className="text-sm font-normal">Made with</span>
            <span className="text-red-500 text-lg animate-pulse">❤</span>
            <span className="text-sm font-normal">by</span>
            <span className="text-sm font-medium">Ameya Bhagat</span>
          </div>
        </div>
      </footer>

      {/* Add Website Modal */}
      <AddWebsiteModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={fetchWebsites}
        categories={categories.map(c => c.name)}
      />

      {/* Website Details Modal */}
      {selectedWebsite && (
        <WebsiteDetailsModal
          website={selectedWebsite}
          isOpen={!!selectedWebsite}
          onClose={handleCloseDetailsModal}
          onUpdate={fetchWebsites}
          categories={categories.map(c => c.name)}
        />
      )}
    </div>
  );
};

export default Dashboard;