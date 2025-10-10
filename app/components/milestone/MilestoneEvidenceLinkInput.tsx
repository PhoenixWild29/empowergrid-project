/**
 * Milestone Evidence Link Input
 * 
 * WO-113: External link submission for verification evidence
 */

import React, { useState } from 'react';

interface MilestoneEvidenceLinkInputProps {
  onLinksAdded: (links: string[]) => void;
}

export default function MilestoneEvidenceLinkInput({ onLinksAdded }: MilestoneEvidenceLinkInputProps) {
  const [links, setLinks] = useState<string[]>([]);
  const [currentLink, setCurrentLink] = useState('');
  const [linkError, setLinkError] = useState('');

  const validateUrl = (url: string): boolean => {
    try {
      new URL(url);
      return url.startsWith('http://') || url.startsWith('https://');
    } catch {
      return false;
    }
  };

  const handleAddLink = () => {
    setLinkError('');

    if (!currentLink) {
      setLinkError('Please enter a URL');
      return;
    }

    if (!validateUrl(currentLink)) {
      setLinkError('Please enter a valid URL (must start with http:// or https://)');
      return;
    }

    if (links.includes(currentLink)) {
      setLinkError('This link has already been added');
      return;
    }

    const newLinks = [...links, currentLink];
    setLinks(newLinks);
    onLinksAdded(newLinks);
    setCurrentLink('');
  };

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        External Evidence Links
      </label>

      <div className="flex space-x-2">
        <input
          type="url"
          value={currentLink}
          onChange={(e) => {
            setCurrentLink(e.target.value);
            setLinkError('');
          }}
          onKeyPress={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              handleAddLink();
            }
          }}
          className={'flex-1 px-4 py-2 border rounded focus:ring-2 focus:ring-blue-500 ' + (
            linkError ? 'border-red-300' : 'border-gray-300'
          )}
          placeholder="https://example.com/evidence"
        />
        <button
          onClick={handleAddLink}
          className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Add Link
        </button>
      </div>

      {linkError && (
        <div className="mt-1 text-xs text-red-600">{linkError}</div>
      )}

      {links.length > 0 && (
        <div className="mt-4 space-y-2">
          {links.map((link, idx) => (
            <div key={idx} className="flex items-center justify-between p-2 bg-blue-50 border border-blue-200 rounded">
              <a
                href={link}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-blue-600 hover:underline truncate flex-1"
              >
                {link}
              </a>
              <button
                onClick={() => {
                  const newLinks = links.filter((_, i) => i !== idx);
                  setLinks(newLinks);
                  onLinksAdded(newLinks);
                }}
                className="ml-2 text-red-600 hover:text-red-800 text-sm"
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="mt-2 text-xs text-gray-500">
        Add links to external evidence (e.g., energy dashboards, reports, documentation)
      </div>
    </div>
  );
}



