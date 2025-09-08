import React, { useState } from 'react';
import { Plus, Trash2, X, AlertTriangle } from 'lucide-react';
import type { Category } from '../types';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

interface CategoryManagementProps {
  categories: Category[];
  onCategoryChange: () => void;
}

interface DeleteConfirmationProps {
  category: Category;
  onConfirm: () => void;
  onCancel: () => void;
  isDeleting: boolean;
}

const DeleteConfirmation: React.FC<DeleteConfirmationProps> = ({
  category,
  onConfirm,
  onCancel,
  isDeleting
}) => (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
      <div className="flex items-center gap-3 mb-4">
        <div className="bg-red-100 p-2 rounded-full">
          <AlertTriangle className="h-5 w-5 text-red-600" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900">Delete Category</h3>
      </div>
      
      <p className="text-gray-600 mb-6">
        Are you sure you want to delete the category "{category.name}"?
        {category.count > 0 && (
          <span className="block mt-2 text-red-600 font-medium">
            Warning: This category is used by {category.count} website{category.count !== 1 ? 's' : ''}. 
            You cannot delete a category that is in use.
          </span>
        )}
      </p>
      
      <div className="flex justify-end gap-3">
        <button
          onClick={onCancel}
          disabled={isDeleting}
          className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          onClick={onConfirm}
          disabled={isDeleting || category.count > 0}
          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isDeleting ? 'Deleting...' : 'Delete'}
        </button>
      </div>
    </div>
  </div>
);

const CategoryManagement: React.FC<CategoryManagementProps> = ({
  categories,
  onCategoryChange
}) => {
  const { user } = useAuth();
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleCreateCategory = async () => {
    if (!newCategoryName.trim() || !user) return;

    setIsCreating(true);
    try {
      const response = await fetch(`/api/categories?userId=${user.id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: newCategoryName.trim()
        })
      });

      const result = await response.json();

      if (!response.ok) {
        if (response.status === 409) {
          toast.error('Category already exists');
        } else {
          toast.error(result.error || 'Failed to create category');
        }
        return;
      }

      toast.success('Category created successfully');
      setNewCategoryName('');
      setIsAddingCategory(false);
      onCategoryChange();
    } catch (error) {
      console.error('Failed to create category:', error);
      toast.error('Failed to create category');
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteCategory = async (category: Category) => {
    if (!user) return;

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/categories?userId=${user.id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: category.id,
          name: category.name
        })
      });

      const result = await response.json();

      if (!response.ok) {
        if (response.status === 409 && result.inUse) {
          toast.error(`Cannot delete "${category.name}" - it is being used by websites`);
        } else {
          toast.error(result.error || 'Failed to delete category');
        }
        return;
      }

      toast.success('Category deleted successfully');
      setCategoryToDelete(null);
      onCategoryChange();
    } catch (error) {
      console.error('Failed to delete category:', error);
      toast.error('Failed to delete category');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleCreateCategory();
    } else if (e.key === 'Escape') {
      setIsAddingCategory(false);
      setNewCategoryName('');
    }
  };

  return (
    <>
      <div className="space-y-3">
        {/* Add Category Section */}
        {isAddingCategory ? (
          <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
            <input
              type="text"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="Enter category name..."
              className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              autoFocus
              disabled={isCreating}
            />
            <button
              onClick={handleCreateCategory}
              disabled={!newCategoryName.trim() || isCreating}
              className="px-3 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isCreating ? '...' : 'Add'}
            </button>
            <button
              onClick={() => {
                setIsAddingCategory(false);
                setNewCategoryName('');
              }}
              disabled={isCreating}
              className="p-2 text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <button
            onClick={() => setIsAddingCategory(true)}
            className="w-full flex items-center justify-center gap-2 p-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-blue-400 hover:text-blue-600 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Add Category
          </button>
        )}

        {/* Categories List */}
        {categories.length > 0 && (
          <div className="space-y-1">
            {categories.map((category) => (
              <div
                key={category.id}
                className="flex items-center justify-between p-2 rounded hover:bg-gray-50 group"
              >
                <div className="flex items-center gap-2 flex-1">
                  <span className="text-sm text-gray-700 capitalize">{category.name}</span>
                  <span className="text-xs bg-gray-200 text-gray-600 px-2 py-1 rounded-full">
                    {category.count}
                  </span>
                </div>
                <button
                  onClick={() => setCategoryToDelete(category)}
                  className="p-1 text-gray-400 hover:text-red-600 transition-colors opacity-0 group-hover:opacity-100"
                  title={category.count > 0 ? 'Cannot delete category in use' : 'Delete category'}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}

        {categories.length === 0 && !isAddingCategory && (
          <p className="text-gray-500 text-sm italic text-center py-4">
            No custom categories yet
          </p>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {categoryToDelete && (
        <DeleteConfirmation
          category={categoryToDelete}
          onConfirm={() => handleDeleteCategory(categoryToDelete)}
          onCancel={() => setCategoryToDelete(null)}
          isDeleting={isDeleting}
        />
      )}
    </>
  );
};

export default CategoryManagement;