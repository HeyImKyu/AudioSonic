import { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { Plus, X, Book, Heart } from 'lucide-react';
import { useStore } from '../store';

export default function Collections() {
  console.log('Collections component rendering');
  
  const { 
    collections, 
    collectionsLoading,
    currentLibrary,
    currentLibraryItems,
    loadCollections
  } = useStore();

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newCollectionName, setNewCollectionName] = useState('');
  const [newCollectionDescription, setNewCollectionDescription] = useState('');

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
    if (!newCollectionName.trim() || !currentLibrary) return;

    try {
      console.log('Creating collection...', { name: newCollectionName.trim(), description: newCollectionDescription.trim() });
      await invoke('create_collection', { 
        libraryId: currentLibrary.id,
        name: newCollectionName.trim(),
        description: newCollectionDescription.trim() || null
      });
      console.log('Collection created successfully');
      
      // Refresh collections from server
      await loadCollections(currentLibrary.id);
      
      setNewCollectionName('');
      setNewCollectionDescription('');
      setShowCreateForm(false);
    } catch (error) {
      console.error('Failed to create collection:', error);
      alert('Failed to create collection: ' + (error as Error).message);
    }
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

  const handleAddToCollection = async (collectionId: string, item: any) => {
    try {
      console.log('Adding item to collection...', { collectionId, itemId: item.id });
      await invoke('add_to_collection', { collectionId, libraryItemId: item.id });
      console.log('Item added to collection');
      
      // Refresh collections from server
      if (currentLibrary) {
        await loadCollections(currentLibrary.id);
      }
    } catch (error) {
      console.error('Failed to add item to collection:', error);
      alert('Failed to add item to collection: ' + (error as Error).message);
    }
  };

  const handleRemoveFromCollection = async (collectionId: string, itemId: string) => {
    try {
      console.log('Removing item from collection...', { collectionId, itemId });
      await invoke('remove_from_collection', { collectionId, libraryItemId: itemId });
      console.log('Item removed from collection');
      
      // Refresh collections from server
      if (currentLibrary) {
        await loadCollections(currentLibrary.id);
      }
    } catch (error) {
      console.error('Failed to remove item from collection:', error);
      alert('Failed to remove item from collection: ' + (error as Error).message);
    }
  };

  const isItemInCollection = (collection: any, itemId: string) => {
    return collection.books.some((book: any) => book.id === itemId);
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
                disabled={!newCollectionName.trim()}
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {collections.map((collection) => (
            <div key={collection.id} className="bg-surface border border-border rounded-lg p-4 hover:border-primary transition">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="font-semibold text-text">{collection.name}</h3>
                  {collection.description && (
                    <p className="text-sm text-text-secondary mt-1">{collection.description}</p>
                  )}
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleRemoveCollection(collection.id)}
                    className="text-text-secondary hover:text-red-400 transition"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="flex items-center text-sm text-text-secondary mb-3">
                <Book className="w-4 h-4 mr-1" />
                <span>{collection.books.length} books</span>
              </div>

              {/* Books in Collection */}
              {collection.books.length > 0 && (
                <div className="space-y-2">
                  {collection.books.slice(0, 3).map((book: any) => (
                    <div key={book.id} className="flex items-center justify-between p-2 bg-background rounded">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-text truncate">{book.media?.metadata?.title}</p>
                        <p className="text-xs text-text-secondary truncate">{book.media?.metadata?.authorName}</p>
                      </div>
                      <button
                        onClick={() => handleRemoveFromCollection(collection.id, book.id)}
                        className="text-text-secondary hover:text-red-400 ml-2"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                  {collection.books.length > 3 && (
                    <p className="text-xs text-text-secondary text-center">
                      +{collection.books.length - 3} more books
                    </p>
                  )}
                </div>
              )}

              {/* Add Books from Library */}
              <div className="mt-4 pt-4 border-t border-border">
                <p className="text-sm text-text-secondary mb-2">Add books from library:</p>
                <div className="grid grid-cols-1 gap-2 max-h-32 overflow-y-auto">
                  {currentLibraryItems.slice(0, 5).map((item) => (
                    <button
                      key={item.id}
                      onClick={() => handleAddToCollection(collection.id, item)}
                      disabled={isItemInCollection(collection, item.id)}
                      className={`flex items-center space-x-2 p-2 rounded text-sm transition ${
                        isItemInCollection(collection, item.id)
                          ? 'bg-surface-hover text-text-muted cursor-not-allowed'
                          : 'bg-background hover:bg-surface-hover text-text'
                      }`}
                    >
                      {isItemInCollection(collection, item.id) ? (
                        <>
                          <Heart className="w-3 h-3 fill-current" />
                          <span className="truncate">{item.media?.metadata?.title}</span>
                        </>
                      ) : (
                        <>
                          <Plus className="w-3 h-3" />
                          <span className="truncate">{item.media?.metadata?.title}</span>
                        </>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
