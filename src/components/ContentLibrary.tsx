'use client';

import React, { useState, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import {
  PhotoIcon,
  VideoCameraIcon,
  DocumentIcon,
  MagnifyingGlassIcon,
  PlusIcon,
  TrashIcon,
  PencilIcon,
  CloudArrowUpIcon,
  FolderIcon,
  TagIcon,
  CalendarIcon,
  EyeIcon,
} from '@heroicons/react/24/outline';

interface ContentItem {
  id: string;
  name: string;
  type: 'IMAGE' | 'VIDEO' | 'TEMPLATE' | 'AUDIO';
  url: string;
  description?: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  size?: number;
  duration?: number;
}

interface ContentLibraryProps {
  onSelectContent?: (content: ContentItem) => void;
  selectionMode?: boolean;
}

const ContentLibrary: React.FC<ContentLibraryProps> = ({
  onSelectContent,
  selectionMode = false
}) => {
  const { data: session } = useSession();
  const [contentItems, setContentItems] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Filter content based on search and filters
  const filteredContent = contentItems.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         item.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = selectedType === 'all' || item.type === selectedType.toUpperCase();
    const matchesTags = selectedTags.length === 0 || 
                       selectedTags.some(tag => item.tags.includes(tag));
    
    return matchesSearch && matchesType && matchesTags;
  });

  // Get unique tags from all content
  const allTags = Array.from(new Set(contentItems.flatMap(item => item.tags)));

  const handleFileUpload = useCallback(async (files: FileList) => {
    setLoading(true);
    try {
      for (const file of Array.from(files)) {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('name', file.name);
        formData.append('type', getContentType(file.type));

        const response = await fetch('/api/content/upload', {
          method: 'POST',
          body: formData,
        });

        if (response.ok) {
          const newItem = await response.json();
          setContentItems(prev => [newItem, ...prev]);
        }
      }
    } catch (error) {
      console.error('Upload failed:', error);
    }
    setLoading(false);
    setIsUploadModalOpen(false);
  }, []);

  const getContentType = (mimeType: string): ContentItem['type'] => {
    if (mimeType.startsWith('image/')) return 'IMAGE';
    if (mimeType.startsWith('video/')) return 'VIDEO';
    if (mimeType.startsWith('audio/')) return 'AUDIO';
    return 'TEMPLATE';
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileUpload(files);
    }
  }, [handleFileUpload]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  }, []);

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getTypeIcon = (type: ContentItem['type']) => {
    switch (type) {
      case 'IMAGE':
        return <PhotoIcon className="h-6 w-6" />;
      case 'VIDEO':
        return <VideoCameraIcon className="h-6 w-6" />;
      case 'AUDIO':
        return <DocumentIcon className="h-6 w-6" />;
      case 'TEMPLATE':
        return <DocumentIcon className="h-6 w-6" />;
      default:
        return <DocumentIcon className="h-6 w-6" />;
    }
  };

  const toggleItemSelection = (itemId: string) => {
    const newSelection = new Set(selectedItems);
    if (newSelection.has(itemId)) {
      newSelection.delete(itemId);
    } else {
      newSelection.add(itemId);
    }
    setSelectedItems(newSelection);
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Content Library</h1>
            <p className="text-sm text-gray-600 mt-1">
              Manage your media assets, templates, and content
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
              className="px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              {viewMode === 'grid' ? 'List View' : 'Grid View'}
            </button>
            <button
              onClick={() => setIsUploadModalOpen(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2"
            >
              <PlusIcon className="h-4 w-4" />
              <span>Upload Content</span>
            </button>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="mt-4 flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search content..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Types</option>
            <option value="image">Images</option>
            <option value="video">Videos</option>
            <option value="audio">Audio</option>
            <option value="template">Templates</option>
          </select>

          {allTags.length > 0 && (
            <select
              onChange={(e) => {
                const tag = e.target.value;
                if (tag && !selectedTags.includes(tag)) {
                  setSelectedTags([...selectedTags, tag]);
                }
              }}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Filter by tag</option>
              {allTags.map(tag => (
                <option key={tag} value={tag}>{tag}</option>
              ))}
            </select>
          )}
        </div>

        {/* Selected Tags */}
        {selectedTags.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-2">
            {selectedTags.map(tag => (
              <span
                key={tag}
                className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
              >
                {tag}
                <button
                  onClick={() => setSelectedTags(selectedTags.filter(t => t !== tag))}
                  className="ml-1 h-4 w-4 text-blue-600 hover:text-blue-800"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Content Area */}
      <div
        className="flex-1 p-6 overflow-auto"
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        {dragOver && (
          <div className="absolute inset-0 bg-blue-50 bg-opacity-75 flex items-center justify-center z-10">
            <div className="text-center">
              <CloudArrowUpIcon className="mx-auto h-12 w-12 text-blue-500" />
              <p className="mt-2 text-lg font-medium text-blue-900">
                Drop files here to upload
              </p>
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : filteredContent.length === 0 ? (
          <div className="text-center py-12">
            <FolderIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No content found</h3>
            <p className="mt-1 text-sm text-gray-500">
              Upload your first media file or template to get started.
            </p>
            <button
              onClick={() => setIsUploadModalOpen(true)}
              className="mt-6 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
            >
              Upload Content
            </button>
          </div>
        ) : (
          <div className={viewMode === 'grid' 
            ? "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4"
            : "space-y-2"
          }>
            {filteredContent.map((item) => (
              <ContentItem
                key={item.id}
                item={item}
                viewMode={viewMode}
                isSelected={selectedItems.has(item.id)}
                onSelect={() => {
                  if (selectionMode && onSelectContent) {
                    onSelectContent(item);
                  } else {
                    toggleItemSelection(item.id);
                  }
                }}
                onEdit={(id) => {
                  // Handle edit
                  console.log('Edit item:', id);
                }}
                onDelete={(id) => {
                  // Handle delete
                  setContentItems(prev => prev.filter(item => item.id !== id));
                }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Upload Modal */}
      {isUploadModalOpen && (
        <UploadModal
          onClose={() => setIsUploadModalOpen(false)}
          onUpload={handleFileUpload}
        />
      )}
    </div>
  );
};

// Content Item Component
interface ContentItemProps {
  item: ContentItem;
  viewMode: 'grid' | 'list';
  isSelected: boolean;
  onSelect: () => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

const ContentItem: React.FC<ContentItemProps> = ({
  item,
  viewMode,
  isSelected,
  onSelect,
  onEdit,
  onDelete
}) => {
  const getTypeIcon = (type: ContentItem['type']) => {
    switch (type) {
      case 'IMAGE':
        return <PhotoIcon className="h-6 w-6" />;
      case 'VIDEO':
        return <VideoCameraIcon className="h-6 w-6" />;
      case 'AUDIO':
        return <DocumentIcon className="h-6 w-6" />;
      case 'TEMPLATE':
        return <DocumentIcon className="h-6 w-6" />;
      default:
        return <DocumentIcon className="h-6 w-6" />;
    }
  };

  if (viewMode === 'list') {
    return (
      <div className={`flex items-center p-3 border rounded-lg hover:bg-gray-50 cursor-pointer ${isSelected ? 'ring-2 ring-blue-500 bg-blue-50' : 'border-gray-200'}`}>
        <input
          type="checkbox"
          checked={isSelected}
          onChange={onSelect}
          className="mr-3"
        />
        <div className="flex-shrink-0 mr-3">
          {item.type === 'IMAGE' ? (
            <img
              src={item.url}
              alt={item.name}
              className="h-10 w-10 rounded object-cover"
            />
          ) : (
            <div className="h-10 w-10 bg-gray-200 rounded flex items-center justify-center">
              {getTypeIcon(item.type)}
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900 truncate">{item.name}</p>
          <p className="text-sm text-gray-500 truncate">{item.description}</p>
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-xs text-gray-500">{item.type}</span>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEdit(item.id);
            }}
            className="p-1 text-gray-400 hover:text-gray-600"
          >
            <PencilIcon className="h-4 w-4" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(item.id);
            }}
            className="p-1 text-gray-400 hover:text-red-600"
          >
            <TrashIcon className="h-4 w-4" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div 
      className={`relative group border rounded-lg overflow-hidden hover:shadow-md transition-shadow cursor-pointer ${isSelected ? 'ring-2 ring-blue-500' : 'border-gray-200'}`}
      onClick={onSelect}
    >
      <div className="aspect-square bg-gray-100 flex items-center justify-center">
        {item.type === 'IMAGE' ? (
          <img
            src={item.url}
            alt={item.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="text-gray-400">
            {getTypeIcon(item.type)}
          </div>
        )}
      </div>
      
      <div className="p-3">
        <h3 className="text-sm font-medium text-gray-900 truncate">{item.name}</h3>
        <p className="text-xs text-gray-500 mt-1">{item.type}</p>
        {item.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {item.tags.slice(0, 2).map(tag => (
              <span
                key={tag}
                className="inline-block px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded"
              >
                {tag}
              </span>
            ))}
            {item.tags.length > 2 && (
              <span className="text-xs text-gray-400">+{item.tags.length - 2}</span>
            )}
          </div>
        )}
      </div>

      {/* Overlay with actions */}
      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-opacity flex items-center justify-center opacity-0 group-hover:opacity-100">
        <div className="flex space-x-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              // Preview action
            }}
            className="p-2 bg-white bg-opacity-90 rounded-full hover:bg-opacity-100"
          >
            <EyeIcon className="h-4 w-4 text-gray-700" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEdit(item.id);
            }}
            className="p-2 bg-white bg-opacity-90 rounded-full hover:bg-opacity-100"
          >
            <PencilIcon className="h-4 w-4 text-gray-700" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(item.id);
            }}
            className="p-2 bg-white bg-opacity-90 rounded-full hover:bg-opacity-100"
          >
            <TrashIcon className="h-4 w-4 text-red-600" />
          </button>
        </div>
      </div>

      {isSelected && (
        <div className="absolute top-2 right-2">
          <div className="h-5 w-5 bg-blue-600 rounded-full flex items-center justify-center">
            <svg className="h-3 w-3 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          </div>
        </div>
      )}
    </div>
  );
};

// Upload Modal Component
interface UploadModalProps {
  onClose: () => void;
  onUpload: (files: FileList) => void;
}

const UploadModal: React.FC<UploadModalProps> = ({ onClose, onUpload }) => {
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      onUpload(files);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      onUpload(files);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h2 className="text-lg font-semibold mb-4">Upload Content</h2>
        
        <div
          className={`border-2 border-dashed rounded-lg p-8 text-center ${dragOver ? 'border-blue-500 bg-blue-50' : 'border-gray-300'}`}
          onDrop={handleDrop}
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={(e) => {
            e.preventDefault();
            setDragOver(false);
          }}
        >
          <CloudArrowUpIcon className="mx-auto h-12 w-12 text-gray-400" />
          <p className="mt-2 text-sm text-gray-600">
            Drag and drop files here, or{' '}
            <button
              onClick={() => fileInputRef.current?.click()}
              className="text-blue-600 hover:text-blue-500"
            >
              browse
            </button>
          </p>
          <p className="text-xs text-gray-500 mt-1">
            Supports images, videos, audio files, and templates
          </p>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*,video/*,audio/*,.pdf,.doc,.docx"
          onChange={handleFileSelect}
          className="hidden"
        />

        <div className="flex justify-end space-x-3 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default ContentLibrary;
