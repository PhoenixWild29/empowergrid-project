/**
 * Saved Searches Component
 * 
 * Manages user's saved search queries
 */

import React, { useState, useEffect } from 'react';

export interface SavedSearch {
  id: string;
  name: string;
  query: string;
  filters?: Record<string, any>;
  createdAt: string;
}

export interface SavedSearchesProps {
  onApplySearch: (query: string, filters?: Record<string, any>) => void;
}

export default function SavedSearches({ onApplySearch }: SavedSearchesProps) {
  const [savedSearches, setSavedSearches] = useState<SavedSearch[]>([]);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [newSearchName, setNewSearchName] = useState('');

  // Load saved searches from localStorage
  useEffect(() => {
    const stored = localStorage.getItem('saved_searches');
    if (stored) {
      try {
        setSavedSearches(JSON.parse(stored));
      } catch (error) {
        console.error('Failed to load saved searches:', error);
      }
    }
  }, []);

  // Save search
  const saveCurrentSearch = (query: string, filters?: Record<string, any>) => {
    if (!newSearchName.trim()) return;

    const newSearch: SavedSearch = {
      id: `search_${Date.now()}`,
      name: newSearchName,
      query,
      filters,
      createdAt: new Date().toISOString(),
    };

    const updated = [...savedSearches, newSearch];
    setSavedSearches(updated);
    localStorage.setItem('saved_searches', JSON.stringify(updated));
    
    setNewSearchName('');
    setShowSaveDialog(false);
  };

  // Delete saved search
  const deleteSearch = (id: string) => {
    const updated = savedSearches.filter((s) => s.id !== id);
    setSavedSearches(updated);
    localStorage.setItem('saved_searches', JSON.stringify(updated));
  };

  // Apply saved search
  const applySearch = (search: SavedSearch) => {
    onApplySearch(search.query, search.filters);
  };

  if (savedSearches.length === 0) {
    return (
      <div className="bg-gray-50 rounded-lg border-2 border-dashed border-gray-300 p-6 text-center">
        <svg
          className="w-12 h-12 text-gray-400 mx-auto mb-3"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
          />
        </svg>
        <p className="text-sm text-gray-600">No saved searches yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-gray-900">Saved Searches</h3>
      
      <div className="space-y-2">
        {savedSearches.map((search) => (
          <div
            key={search.id}
            className="bg-white border border-gray-200 rounded-lg p-3 hover:border-blue-500 transition-colors"
          >
            <div className="flex items-start justify-between gap-3">
              <button
                onClick={() => applySearch(search)}
                className="flex-1 text-left"
              >
                <p className="text-sm font-medium text-gray-900 mb-1">
                  {search.name}
                </p>
                <p className="text-xs text-gray-600">
                  {search.query}
                </p>
              </button>
              
              <button
                onClick={() => deleteSearch(search.id)}
                className="text-red-600 hover:bg-red-50 p-1 rounded transition-colors"
                title="Delete saved search"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}






