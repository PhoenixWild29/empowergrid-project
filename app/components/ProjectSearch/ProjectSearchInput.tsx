/**
 * Project Search Input Component
 * 
 * Real-time autocomplete with suggestions:
 * - Recent searches
 * - Popular searches
 * - Related terms
 * - Project name matches
 */

import React, { useState, useEffect, useRef } from 'react';

export interface SearchSuggestion {
  type: 'recent' | 'popular' | 'project' | 'term';
  text: string;
  projectId?: string;
}

export interface ProjectSearchInputProps {
  value: string;
  onChange: (value: string) => void;
  onSearch: (query: string) => void;
  placeholder?: string;
}

export default function ProjectSearchInput({
  value,
  onChange,
  onSearch,
  placeholder = 'Search projects by name, location, or keywords...',
}: ProjectSearchInputProps) {
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loading, setLoading] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Fetch suggestions
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (value.length >= 2) {
        setLoading(true);
        
        try {
          const response = await fetch(`/api/projects/search/suggestions?q=${encodeURIComponent(value)}`);
          
          if (response.ok) {
            const data = await response.json();
            setSuggestions(data.suggestions || []);
            setShowSuggestions(true);
          }
        } catch (error) {
          console.error('Failed to fetch suggestions:', error);
        } finally {
          setLoading(false);
        }
      } else {
        setSuggestions([]);
        setShowSuggestions(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [value]);

  // Close suggestions when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle input change
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
  };

  // Handle search submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (value.trim()) {
      onSearch(value);
      setShowSuggestions(false);
      
      // Save to recent searches
      const recent = JSON.parse(localStorage.getItem('recent_searches') || '[]');
      const updated = [value, ...recent.filter((s: string) => s !== value)].slice(0, 10);
      localStorage.setItem('recent_searches', JSON.stringify(updated));
    }
  };

  // Handle suggestion click
  const handleSuggestionClick = (suggestion: SearchSuggestion) => {
    onChange(suggestion.text);
    onSearch(suggestion.text);
    setShowSuggestions(false);
  };

  // Get icon for suggestion type
  const getSuggestionIcon = (type: string) => {
    switch (type) {
      case 'recent':
        return '🕒';
      case 'popular':
        return '🔥';
      case 'project':
        return '📋';
      case 'term':
        return '🔍';
      default:
        return '💡';
    }
  };

  return (
    <div ref={wrapperRef} className="relative">
      <form onSubmit={handleSubmit}>
        <div className="relative">
          <input
            type="text"
            value={value}
            onChange={handleChange}
            placeholder={placeholder}
            className="w-full px-4 py-3 pl-12 pr-12 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
          />
          
          {/* Search Icon */}
          <svg
            className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>

          {/* Loading Spinner */}
          {loading && (
            <svg
              className="absolute right-12 top-1/2 -translate-y-1/2 w-5 h-5 text-blue-600 animate-spin"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
          )}

          {/* Clear Button */}
          {value && (
            <button
              type="button"
              onClick={() => {
                onChange('');
                setShowSuggestions(false);
              }}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          )}
        </div>
      </form>

      {/* Autocomplete Suggestions */}
      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute z-10 w-full mt-2 bg-white border border-gray-300 rounded-lg shadow-lg max-h-96 overflow-y-auto">
          {suggestions.map((suggestion, index) => (
            <button
              key={index}
              type="button"
              onClick={() => handleSuggestionClick(suggestion)}
              className="w-full px-4 py-3 text-left hover:bg-blue-50 transition-colors border-b border-gray-100 last:border-b-0 flex items-center gap-3"
            >
              <span className="text-lg">{getSuggestionIcon(suggestion.type)}</span>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">
                  {suggestion.text}
                </p>
                <p className="text-xs text-gray-500 capitalize">
                  {suggestion.type} {suggestion.type === 'recent' ? 'search' : ''}
                </p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}




