import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { searchWebsitesWithAI } from '../lib/gemini';
import { useAuth } from '../contexts/AuthContext';
import type { Website, Category } from '../types';
import WebsiteCard from './WebsiteCard';
import SearchBar from './SearchBar';
import CategorySidebar from './CategorySidebar';
import AddWebsiteModal from './AddWebsiteModal';
import WebsiteDetailsModal from './WebsiteDetailsModal';
import { LogOut, Plus, Grid, List } from 'lucide-react';
import { signOut } from '../lib/supabase';
import toast from 'react-hot-toast';

const Dashboard: React.FC = () => {
  const { user } = useAuth();
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

  useEffect(() => {
    if (user) {
      fetchWebsites();
    }
  }, [user]);

  useEffect(() => {
    if (!user) return;
    const channel = (supabase as any).channel('websites-realtime')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'websites',
        filter: `user_id=eq.${user.id}`,
      }, () => {
        fetchWebsites();
      })
      .subscribe();

    return () => {
      try { (supabase as any).removeChannel(channel); } catch {}
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
      
      // Update categories
      const categoryMap = new Map<string, number>();
      data?.forEach(website => {
        const count = categoryMap.get(website.category) || 0;
        categoryMap.set(website.category, count + 1);
      });
      
      const categoriesArray: Category[] = Array.from(categoryMap.entries()).map(([name, count]) => ({
        id: name,
        name,
        count,
      }));
      
      setCategories(categoriesArray);
    } catch (error: any) {
      toast.error('Failed to fetch websites');
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterWebsites = async () => {
    let filtered = websites;

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(website => website.category === selectedCategory);
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
          // Fallback to text search
          const searchTerm = searchQuery.toLowerCase();
          filtered = filtered.filter(website => 
            website.title.toLowerCase().includes(searchTerm) ||
            website.url.toLowerCase().includes(searchTerm) ||
            website.category.toLowerCase().includes(searchTerm) ||
            (website.description && website.description.toLowerCase().includes(searchTerm))
          );
        } finally {
          setIsSearchingAI(false);
        }
      } else {
        // Regular text search
        const searchTerm = searchQuery.toLowerCase();
        filtered = filtered.filter(website => 
          website.title.toLowerCase().includes(searchTerm) ||
          website.url.toLowerCase().includes(searchTerm) ||
          website.category.toLowerCase().includes(searchTerm) ||
          (website.description && website.description.toLowerCase().includes(searchTerm))
        );
      }
    }

    setFilteredWebsites(filtered);
  };

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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <div className="bg-blue-600 w-8 h-8 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">SB</span>
              </div>
              <h1 className="text-xl font-bold text-gray-900">SecondBrain</h1>
            </div>
            
            <div className="flex items-center gap-3">
              <span className="text-gray-600 text-sm hidden sm:block">
                Welcome, {user?.email}
              </span>
              <button
                onClick={handleSignOut}
                className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:block">Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar */}
          <div className="w-full lg:w-64 flex-shrink-0">
            <CategorySidebar
              categories={categories}
              selectedCategory={selectedCategory}
              onCategorySelect={setSelectedCategory}
              totalWebsites={websites.length}
            />
            
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="w-full mt-6 bg-blue-600 text-white px-4 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
            >
              <Plus className="h-5 w-5" />
              Add Website
            </button>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            {/* Search and Controls */}
            <div className="mb-6 space-y-4">
              <SearchBar
                value={searchQuery}
                onChange={setSearchQuery}
                isSearchingAI={isSearchingAI}
                placeholder="Search websites... (prefix with 'ai:' for AI search)"
              />
              
              <div className="flex justify-between items-center">
                <p className="text-gray-600">
                  {filteredWebsites.length} website{filteredWebsites.length !== 1 ? 's' : ''} found
                </p>
                
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-2 rounded-lg transition-colors ${
                      viewMode === 'grid' 
                        ? 'bg-blue-100 text-blue-600' 
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    <Grid className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`p-2 rounded-lg transition-colors ${
                      viewMode === 'list' 
                        ? 'bg-blue-100 text-blue-600' 
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    <List className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Websites Grid/List */}
            {filteredWebsites.length === 0 ? (
              <div className="text-center py-12">
                <div className="bg-gray-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Grid className="h-8 w-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No websites found</h3>
                <p className="text-gray-600 mb-4">
                  {searchQuery ? 'Try adjusting your search terms' : 'Start saving your first website!'}
                </p>
                {!searchQuery && (
                  <button
                    onClick={() => setIsAddModalOpen(true)}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Add Your First Website
                  </button>
                )}
              </div>
            ) : (
              <div className={
                viewMode === 'grid' 
                  ? 'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6'
                  : 'space-y-4'
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
      <footer className="border-t border-gray-200 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 text-center text-sm text-gray-600">
          made with ❤ by Ameya Bhagat
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