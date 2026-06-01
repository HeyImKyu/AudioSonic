import { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { Plus, X, Book, ArrowRight } from 'lucide-react';
import { useStore } from '../store';

export default function Collections() {
  console.log('Collections component rendering');
  
  const { 
    collections, 
    collectionsLoading,
    currentLibrary,
    currentLibraryItems,
    loadCollections,
    setCurrentCollection,
    serverUrl
  } = useStore();

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newCollectionName, setNewCollectionName] = useState('');
  const [newCollectionDescription, setNewCollectionDescription] = useState('');
  const [selectedBookIds, setSelectedBookIds] = useState<string[]>([]);
  const [bookSearchQuery, setBookSearchQuery] = useState('');

  useEffect(() => {
    console.log('Collections useEffect - currentLibrary:', currentLibrary);
    if (currentLibrary) {
      console.log('Loading collections for library:', currentLibrary.id);
      loadCollections(currentLibrary.id);
    } else {
      console.log('No currentLibrary, not loading collections');
    }
  }, [currentLibrary, loadCollections]);

  const handleCreateCollection = async () => {
    if (!newCollectionName.trim() || !currentLibrary || selectedBookIds.length === 0) {
      alert('Please enter a name and select at least one book');
      return;
    }

    try {
      console.log('Creating collection...', { name: newCollectionName.trim(), description: newCollectionDescription.trim(), bookIds: selectedBookIds });
      await invoke('create_collection', { 
        libraryId: currentLibrary.id,
        name: newCollectionName.trim(),
        description: newCollectionDescription.trim() || null,
        bookIds: selectedBookIds
      });
      console.log('Collection created successfully');
      
      // Refresh collections from server
      await loadCollections(currentLibrary.id);
      
      setNewCollectionName('');
      setNewCollectionDescription('');
      setSelectedBookIds([]);
      setBookSearchQuery('');
      setShowCreateForm(false);
    } catch (error) {
      console.error('Failed to create collection:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      alert('Failed to create collection: ' + errorMessage);
    }
  };

  const toggleBookSelection = (bookId: string) => {
    setSelectedBookIds(prev => 
      prev.includes(bookId) 
        ? prev.filter(id => id !== bookId)
        : [...prev, bookId]
    );
  };

  const handleRemoveCollection = async (id: string) => {
    if (confirm('Are you sure you want to delete this collection?')) {
      try {
        console.log('Deleting collection...', id);
        await invoke('delete_collection', { collectionId: id });
        console.log('Collection deleted:', id);
        
        // Refresh collections from server
        if (currentLibrary) {
          await loadCollections(currentLibrary.id);
        }
      } catch (error) {
        console.error('Failed to delete collection:', error);
        alert('Failed to delete collection: ' + (error as Error).message);
      }
    }
  };

  const getCoverUrl = (item: any) => {
    if (item.media?.coverPath && serverUrl) {
      return `${serverUrl}/api/items/${item.id}/cover`;
    }
    return null;
  };

  const handleCollectionClick = (collection: any) => {
    setCurrentCollection(collection);
  };

  console.log('Collections render state:', { 
    collections, 
    collectionsLoading, 
    currentLibrary, 
    collectionsLength: collections?.length 
  });

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-text">Collections</h2>
        <button
          onClick={() => setShowCreateForm(true)}
          className="flex items-center space-x-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-hover transition"
        >
          <Plus className="w-4 h-4" />
          <span>New Collection</span>
        </button>
      </div>

      {/* Create Collection Form */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-surface border border-border rounded-lg p-6 w-96 max-w-full mx-4">
            <h3 className="text-lg font-semibold text-text mb-4">Create New Collection</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-text mb-1">Name</label>
                <input
                  type="text"
                  value={newCollectionName}
                  onChange={(e) => setNewCollectionName(e.target.value)}
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-text focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Collection name"
                  autoFocus
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-text mb-1">Description</label>
                <textarea
                  value={newCollectionDescription}
                  onChange={(e) => setNewCollectionDescription(e.target.value)}
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-text focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                  placeholder="Collection description (optional)"
                  rows={3}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-text mb-1">Select Books (required)</label>
                <input
                  type="text"
                  value={bookSearchQuery}
                  onChange={(e) => setBookSearchQuery(e.target.value)}
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-text focus:outline-none focus:ring-2 focus:ring-primary mb-2"
                  placeholder="Search books..."
                />
                <div className="max-h-48 overflow-y-auto border border-border rounded-lg bg-background">
                  {currentLibraryItems.length === 0 ? (
                    <p className="p-4 text-text-secondary text-sm">No books available in library</p>
                  ) : (
                    currentLibraryItems
                      .filter(item => 
                        item.media.metadata.title.toLowerCase().includes(bookSearchQuery.toLowerCase()) ||
                        item.media.metadata.authorName?.toLowerCase().includes(bookSearchQuery.toLowerCase())
                      )
                      .map((item) => (
                        <label
                          key={item.id}
                          className="flex items-center p-3 hover:bg-surface-hover cursor-pointer border-b border-border last:border-b-0"
                        >
                          <input
                            type="checkbox"
                            checked={selectedBookIds.includes(item.id)}
                            onChange={() => toggleBookSelection(item.id)}
                            className="mr-3 w-4 h-4 accent-primary"
                          />
                          <span className="text-sm text-text truncate">{item.media.metadata.title}</span>
                        </label>
                      ))
                  )}
                </div>
                <p className="text-xs text-text-secondary mt-1">
                  {selectedBookIds.length} book{selectedBookIds.length !== 1 ? 's' : ''} selected
                </p>
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowCreateForm(false)}
                className="px-4 py-2 text-text-secondary hover:text-text transition"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateCollection}
                disabled={!newCollectionName.trim() || selectedBookIds.length === 0}
                className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-hover disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Collections Grid */}
      {collectionsLoading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-text-secondary">Loading collections...</p>
        </div>
      ) : !currentLibrary ? (
        <div className="text-center py-12">
          <Book className="w-16 h-16 text-text-muted mx-auto mb-4" />
          <h3 className="text-lg font-medium text-text mb-2">No library selected</h3>
          <p className="text-text-secondary">Select a library to view collections</p>
        </div>
      ) : collections.length === 0 ? (
        <div className="text-center py-12">
          <Book className="w-16 h-16 text-text-muted mx-auto mb-4" />
          <h3 className="text-lg font-medium text-text mb-2">No collections yet</h3>
          <p className="text-text-secondary">Create your first collection to organize your audiobooks</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {collections.map((collection) => (
            <div 
              key={collection.id} 
              className="bg-surface border border-border rounded-lg overflow-hidden hover:border-primary transition cursor-pointer group"
              onClick={() => handleCollectionClick(collection)}
            >
              {/* Cover Gallery */}
              <div className="relative h-40 bg-background">
                {collection.books.length > 0 ? (
                  <div className="grid grid-cols-3 h-full">
                    {collection.books.slice(0, 6).map((book: any) => {
                      const coverUrl = getCoverUrl(book);
                      return (
                        <div key={book.id} className="relative overflow-hidden">
                          {coverUrl ? (
                            <img
                              src={coverUrl}
                              alt={book.media?.metadata?.title}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none';
                              }}
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-accent/20">
                              <Book className="w-6 h-6 text-primary/50" />
                            </div>
                          )}
                        </div>
                      );
                    })}
                    {collection.books.length > 6 && (
                      <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                        +{collection.books.length - 6}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/10 to-accent/10">
                    <Book className="w-12 h-12 text-text-muted" />
                  </div>
                )}
                
                {/* Hover overlay */}
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                  <div className="flex items-center space-x-2 text-white">
                    <span>View Collection</span>
                    <ArrowRight className="w-4 h-4" />
                  </div>
                </div>
              </div>

              {/* Collection Info */}
              <div className="p-4">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex-1">
                    <h3 className="font-semibold text-text group-hover:text-primary transition-colors">{collection.name}</h3>
                    {collection.description && (
                      <p className="text-sm text-text-secondary mt-1 line-clamp-2">{collection.description}</p>
                    )}
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemoveCollection(collection.id);
                    }}
                    className="text-text-secondary hover:text-red-400 transition p-1"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex items-center text-sm text-text-secondary">
                  <Book className="w-4 h-4 mr-1" />
                  <span>{collection.books.length} book{collection.books.length !== 1 ? 's' : ''}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
