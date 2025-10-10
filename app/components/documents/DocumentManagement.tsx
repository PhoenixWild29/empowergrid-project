/**
 * Document Management Component
 * 
 * WO-106: Document Management with Integrated Viewing
 * 
 * Features:
 * - Document categorization and navigation
 * - Integrated PDF/image viewing
 * - Search functionality
 * - Annotation capabilities
 * - Version control display
 * - Access permission controls
 * - Metadata display
 */

'use client';

import React, { useState } from 'react';

interface Document {
  id: string;
  name: string;
  category: string;
  type: string;
  size: number;
  uploadDate: string;
  uploadedBy: string;
  version: number;
  tags: string[];
  accessLevel: string;
}

interface DocumentManagementProps {
  projectId: string;
}

export default function DocumentManagement({ projectId }: DocumentManagementProps) {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDoc, setSelectedDoc] = useState<Document | null>(null);

  // Mock documents for demonstration
  const documents: Document[] = [
    {
      id: '1',
      name: 'Technical Specification v2.pdf',
      category: 'technical',
      type: 'PDF',
      size: 2400000,
      uploadDate: '2025-09-15',
      uploadedBy: 'Project Creator',
      version: 2,
      tags: ['specification', 'equipment'],
      accessLevel: 'public',
    },
    {
      id: '2',
      name: 'Environmental Permit.pdf',
      category: 'permits',
      type: 'PDF',
      size: 1800000,
      uploadDate: '2025-09-10',
      uploadedBy: 'Legal Team',
      version: 1,
      tags: ['permit', 'regulatory'],
      accessLevel: 'public',
    },
    {
      id: '3',
      name: 'Financial Model v3.xlsx',
      category: 'financial',
      type: 'Excel',
      size: 450000,
      uploadDate: '2025-10-01',
      uploadedBy: 'Financial Analyst',
      version: 3,
      tags: ['financial', 'projections'],
      accessLevel: 'restricted',
    },
    {
      id: '4',
      name: 'Progress Report Q3.pdf',
      category: 'reports',
      type: 'PDF',
      size: 1200000,
      uploadDate: '2025-09-30',
      uploadedBy: 'Project Manager',
      version: 1,
      tags: ['progress', 'quarterly'],
      accessLevel: 'public',
    },
  ];

  const categories = [
    { key: 'all', label: 'All Documents', icon: '📁', count: documents.length },
    { key: 'technical', label: 'Technical Specs', icon: '⚙️', count: documents.filter(d => d.category === 'technical').length },
    { key: 'permits', label: 'Permits', icon: '📋', count: documents.filter(d => d.category === 'permits').length },
    { key: 'financial', label: 'Financial', icon: '💰', count: documents.filter(d => d.category === 'financial').length },
    { key: 'reports', label: 'Progress Reports', icon: '📊', count: documents.filter(d => d.category === 'reports').length },
  ];

  const filteredDocuments = documents.filter(doc =>
    (selectedCategory === 'all' || doc.category === selectedCategory) &&
    (searchTerm === '' || doc.name.toLowerCase().includes(searchTerm.toLowerCase()) || doc.tags.some(tag => tag.includes(searchTerm.toLowerCase())))
  );

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-6 border-b border-gray-200">
        <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
          <span>📚</span> Document Library
        </h2>

        {/* Search Bar */}
        <div className="relative">
          <input
            type="text"
            placeholder="Search documents, tags, or content..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
          />
          <svg
            className="w-5 h-5 text-gray-400 absolute left-3 top-2.5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      </div>

      <div className="flex">
        {/* Category Navigation */}
        <div className="w-64 border-r border-gray-200 p-4">
          <div className="space-y-1">
            {categories.map((cat) => (
              <button
                key={cat.key}
                onClick={() => setSelectedCategory(cat.key)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg transition-colors ${
                  selectedCategory === cat.key
                    ? 'bg-green-50 text-green-700 font-medium'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span>{cat.icon}</span>
                  <span className="text-sm">{cat.label}</span>
                </div>
                <span className="text-xs bg-gray-200 px-2 py-0.5 rounded-full">{cat.count}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Document List */}
        <div className="flex-1 p-6">
          {filteredDocuments.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <div className="text-6xl mb-4">📄</div>
              <p>No documents found</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredDocuments.map((doc) => (
                <div
                  key={doc.id}
                  onClick={() => setSelectedDoc(doc)}
                  className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow cursor-pointer"
                >
                  <div className="flex items-center gap-3 flex-1">
                    <div className="w-10 h-10 bg-blue-100 rounded flex items-center justify-center flex-shrink-0">
                      <span className="text-xs font-bold text-blue-600">{doc.type}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-gray-900 truncate">{doc.name}</div>
                      <div className="flex items-center gap-3 text-xs text-gray-500 mt-1">
                        <span>{formatFileSize(doc.size)}</span>
                        <span>•</span>
                        <span>{new Date(doc.uploadDate).toLocaleDateString()}</span>
                        <span>•</span>
                        <span>v{doc.version}</span>
                        {doc.accessLevel === 'restricted' && (
                          <>
                            <span>•</span>
                            <span className="text-orange-600 font-medium">🔒 Restricted</span>
                          </>
                        )}
                      </div>
                      <div className="flex gap-1 mt-2">
                        {doc.tags.map((tag) => (
                          <span key={tag} className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                  <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                    View →
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Document Viewer Modal */}
      {selectedDoc && (
        <DocumentViewerModal
          document={selectedDoc}
          onClose={() => setSelectedDoc(null)}
        />
      )}
    </div>
  );
}

/** Document Viewer Modal */
function DocumentViewerModal({ document, onClose }: any) {
  const [annotations, setAnnotations] = useState<any[]>([]);
  const [showVersions, setShowVersions] = useState(false);

  const versions = [
    { version: document.version, date: document.uploadDate, changes: 'Current version' },
    { version: document.version - 1, date: '2025-09-01', changes: 'Updated financial projections' },
    { version: 1, date: '2025-08-15', changes: 'Initial upload' },
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold text-gray-900">{document.name}</h3>
            <div className="text-sm text-gray-600 mt-1">
              {document.type} • {formatFileSize(document.size)} • v{document.version}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowVersions(!showVersions)}
              className="px-3 py-1 text-sm text-blue-600 hover:bg-blue-50 rounded"
            >
              Versions
            </button>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex h-[600px]">
          {/* Document Viewer */}
          <div className="flex-1 p-6 bg-gray-50 overflow-auto">
            {document.type === 'PDF' ? (
              <div className="bg-white rounded shadow-lg p-8 min-h-full">
                <div className="text-center text-gray-500">
                  <div className="text-6xl mb-4">📄</div>
                  <p className="font-medium">PDF Viewer</p>
                  <p className="text-sm mt-2">Production: Integrate react-pdf or pdf.js</p>
                  <p className="text-xs mt-4 text-gray-400">{document.name}</p>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded p-4">
                <p className="text-gray-600">Document preview for {document.type} files</p>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="w-80 border-l border-gray-200 overflow-y-auto">
            {showVersions ? (
              /* Version History */
              <div className="p-4">
                <h4 className="font-semibold text-gray-900 mb-4">Version History</h4>
                <div className="space-y-3">
                  {versions.map((v) => (
                    <div key={v.version} className={`p-3 rounded-lg ${
                      v.version === document.version ? 'bg-green-50 border border-green-200' : 'bg-gray-50'
                    }`}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium text-sm">Version {v.version}</span>
                        {v.version === document.version && (
                          <span className="text-xs text-green-600 font-medium">Current</span>
                        )}
                      </div>
                      <div className="text-xs text-gray-600 mb-1">{new Date(v.date).toLocaleDateString()}</div>
                      <div className="text-xs text-gray-700">{v.changes}</div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              /* Annotations */
              <div className="p-4">
                <h4 className="font-semibold text-gray-900 mb-4">Annotations</h4>
                <div className="mb-4">
                  <textarea
                    placeholder="Add a note or comment..."
                    className="w-full p-2 text-sm border border-gray-300 rounded resize-none focus:outline-none focus:ring-2 focus:ring-green-500"
                    rows={3}
                  />
                  <button className="mt-2 w-full bg-green-600 text-white py-1 text-sm rounded hover:bg-green-700">
                    Add Annotation
                  </button>
                </div>

                {annotations.length === 0 ? (
                  <p className="text-sm text-gray-500 text-center py-4">No annotations yet</p>
                ) : (
                  <div className="space-y-3">
                    {annotations.map((ann, index) => (
                      <div key={index} className="p-3 bg-gray-50 rounded">
                        <div className="text-xs text-gray-600 mb-1">{ann.user} • {ann.date}</div>
                        <p className="text-sm text-gray-700">{ann.text}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Document Metadata */}
            <div className="p-4 border-t border-gray-200">
              <h4 className="font-semibold text-gray-900 mb-3">Metadata</h4>
              <div className="space-y-2 text-sm">
                <MetaItem label="Uploaded" value={new Date(document.uploadDate).toLocaleDateString()} />
                <MetaItem label="Uploaded By" value={document.uploadedBy} />
                <MetaItem label="File Size" value={formatFileSize(document.size)} />
                <MetaItem label="Type" value={document.type} />
                <MetaItem label="Access" value={document.accessLevel} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function MetaItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-gray-600">{label}:</span>
      <span className="font-medium text-gray-900">{value}</span>
    </div>
  );
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

