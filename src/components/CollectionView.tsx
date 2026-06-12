import { useEffect, useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { useStore } from '../store';
import { Book, Clock, PlayCircle, ArrowLeft, Edit2, X, Plus, Minus } from 'lucide-react';
import { LibraryItem, Collection } from '../types';

export default function CollectionView() {
  const { 
    currentCollection, 
    setCurrentCollection,
    setCurrentLibraryItem, 
    setPlaying, 
    serverUrl, 
    setAudioUrl, 
    setDuration, 
    token, 
    setAudioTracks, 
    setCurrentTrackIndex, 
    setCurrentTime, 
    setChapters,
    currentLibrary,
    loadCollections,
    currentLibraryItems,
    viewMode,
    setViewMode,
    zoomLevel,
    setZoomLevel,
    sortBy,
    sortOrder,
    setSortBy,
    setSortOrder
  } = useStore();
  const [itemProgress, setItemProgress] = useState<Record<string, any>>({});
  const [showEditForm, setShowEditForm] = useState(false);
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [showAddBooksForm, setShowAddBooksForm] = useState(false);
  const [selectedBookIdsToAdd, setSelectedBookIdsToAdd] = useState<string[]>([]);
  const [bookSearchQuery, setBookSearchQuery] = useState('');

  useEffect(() => {
    if (currentCollection?.books) {
      loadProgressForItems();
    }
  }, [currentCollection]);

  useEffect(() => {
    if (currentCollection) {
      setEditName(currentCollection.name);
      setEditDescription(currentCollection.description || '');
    }
  }, [currentCollection]);

  const handleUpdateCollection = async () => {
    if (!currentCollection || !editName.trim()) return;

    try {
      const updated = await invoke<Collection>('update_collection', {
        collectionId: currentCollection.id,
        name: editName.trim(),
        description: editDescription.trim() || null
      });
      setCurrentCollection(updated);
      setShowEditForm(false);
      
      // Refresh collections list
      if (currentLibrary) {
        await loadCollections(currentLibrary.id);
      }
    } catch (error) {
      console.error('Failed to update collection:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      alert('Failed to update collection: ' + errorMessage);
    }
  };

  const handleRemoveBook = async (bookId: string) => {
    if (!currentCollection) return;

    try {
      await invoke('remove_from_collection', {
        collectionId: currentCollection.id,
        libraryItemId: bookId
      });
      
      // Update local collection state
      setCurrentCollection({
        ...currentCollection,
        books: currentCollection.books.filter(b => b.id !== bookId)
      });
      
      // Refresh collections list
      if (currentLibrary) {
        await loadCollections(currentLibrary.id);
      }
    } catch (error) {
      console.error('Failed to remove book from collection:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      alert('Failed to remove book from collection: ' + errorMessage);
    }
  };

  const handleAddBooks = async () => {
    if (!currentCollection || selectedBookIdsToAdd.length === 0) return;

    try {
      const updated = await invoke<Collection>('add_books_to_collection', {
        collectionId: currentCollection.id,
        bookIds: selectedBookIdsToAdd
      });
      setCurrentCollection(updated);
      setShowAddBooksForm(false);
      setSelectedBookIdsToAdd([]);
      setBookSearchQuery('');
      
      // Refresh collections list
      if (currentLibrary) {
        await loadCollections(currentLibrary.id);
      }
    } catch (error) {
      console.error('Failed to add books to collection:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      alert('Failed to add books to collection: ' + errorMessage);
    }
  };

  const toggleBookToAdd = (bookId: string) => {
    setSelectedBookIdsToAdd(prev => 
      prev.includes(bookId) 
        ? prev.filter(id => id !== bookId)
        : [...prev, bookId]
    );
  };

  const loadProgressForItems = async () => {
    if (!currentCollection?.books) return;
    
    const progressMap: Record<string, any> = {};
    for (const item of currentCollection.books) {
      try {
        const progress = await invoke('get_media_progress', { libraryItemId: item.id });
        if (progress) {
          progressMap[item.id] = progress;
        }
      } catch (error) {
        console.error(`Failed to load progress for item ${item.id}:`, error);
      }
    }
    setItemProgress(progressMap);
  };

  const handlePlayItem = async (item: LibraryItem) => {
    try {
      setCurrentLibraryItem(item);

      // Load saved progress from server
      let savedProgress: any = null;
      try {
        savedProgress = await invoke('get_media_progress', { libraryItemId: item.id });
      } catch (error) {
        console.error('Failed to load saved progress:', error);
      }

      const response = await invoke('play_item', { libraryItemId: item.id, episodeId: null }) as any;

      // Store chapters if available
      if (response.chapters && response.chapters.length > 0) {
        setChapters(response.chapters);
      } else {
        setChapters([]);
      }

      // Handle audioTracks field
      if (response.audioTracks && response.audioTracks.length > 0) {
        const firstTrack = response.audioTracks[0];

        // Store all audio tracks
        setAudioTracks(response.audioTracks);

        // Calculate total duration from all tracks
        const totalDuration = response.audioTracks.reduce((sum: number, track: any) => sum + track.duration, 0);
        setDuration(totalDuration);
        
        // Set currentTime to saved progress if available
        if (savedProgress && savedProgress.currentTime) {
          // Find which track the saved time falls into
          let trackIndex = 0;
          let accumulatedTime = 0;
          for (let i = 0; i < response.audioTracks.length; i++) {
            if (accumulatedTime + response.audioTracks[i].duration > savedProgress.currentTime) {
              trackIndex = i;
              break;
            }
            accumulatedTime += response.audioTracks[i].duration;
          }
          setCurrentTrackIndex(trackIndex);
          setCurrentTime(savedProgress.currentTime);
          
          // Load the correct track
          const track = response.audioTracks[trackIndex];
          if (track.contentUrl) {
            let fullUrl = track.contentUrl.startsWith('http') 
              ? track.contentUrl 
              : `${serverUrl}${track.contentUrl}`;
            
            if (token && !fullUrl.includes('token=')) {
              const separator = fullUrl.includes('?') ? '&' : '?';
              fullUrl = `${fullUrl}${separator}token=${token}`;
            }
            
            setAudioUrl(fullUrl);
          }
        } else {
          setCurrentTrackIndex(0);
          setCurrentTime(0);
          
          if (firstTrack.contentUrl) {
            let fullUrl = firstTrack.contentUrl.startsWith('http') 
              ? firstTrack.contentUrl 
              : `${serverUrl}${firstTrack.contentUrl}`;
            
            if (token && !fullUrl.includes('token=')) {
              const separator = fullUrl.includes('?') ? '&' : '?';
              fullUrl = `${fullUrl}${separator}token=${token}`;
            }
            
            setAudioUrl(fullUrl);
          }
        }
        
        setPlaying(true);
      } else {
        console.error('No audioTracks in play response');
      }
    } catch (error) {
      console.error('Failed to play item:', error);
    }
  };

  const formatDuration = (seconds?: number) => {
    if (!seconds) return '--:--';
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  const getCoverUrl = (item: LibraryItem) => {
    if (item.media.coverPath && serverUrl) {
      return `${serverUrl}/api/items/${item.id}/cover`;
    }
    return null;
  };

  const sortItems = (items: LibraryItem[]) => {
    const sorted = [...items];
    sorted.sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'title':
          comparison = a.media.metadata.title.localeCompare(b.media.metadata.title);
          break;
        case 'year':
          const yearA = a.media.metadata.publishedYear || '0';
          const yearB = b.media.metadata.publishedYear || '0';
          comparison = yearA.localeCompare(yearB);
          break;
        case 'genre':
          const genreA = (a.media.metadata.genres || [])[0] || '';
          const genreB = (b.media.metadata.genres || [])[0] || '';
          comparison = genreA.localeCompare(genreB);
          break;
        case 'recent':
          const progressA = itemProgress[a.id];
          const progressB = itemProgress[b.id];
          const dateA = progressA?.lastUpdate || a.updatedAt || 0;
          const dateB = progressB?.lastUpdate || b.updatedAt || 0;
          comparison = dateA - dateB;
          break;
      }
      
      return sortOrder === 'asc' ? comparison : -comparison;
    });
    
    return sorted;
  };

  const sortedBooks = sortItems(currentCollection?.books || []);

  if (!currentCollection) {
    return null;
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => setCurrentCollection(null)}
            className="flex items-center space-x-2 text-text-secondary hover:text-text transition"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Collections</span>
          </button>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-lg transition ${viewMode === 'list' ? 'text-primary bg-primary/20' : 'text-text-secondary hover:text-text hover:bg-surface-hover'}`}
              title="List view"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-lg transition ${viewMode === 'grid' ? 'text-primary bg-primary/20' : 'text-text-secondary hover:text-text hover:bg-surface-hover'}`}
              title="Grid view"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
            </button>
            {viewMode === 'grid' && (
              <>
                <div className="w-px h-6 bg-border mx-1" />
                <button
                  onClick={() => setZoomLevel(zoomLevel - 1)}
                  disabled={zoomLevel <= 2}
                  className="p-2 text-text-secondary hover:text-text hover:bg-surface-hover rounded-lg transition disabled:opacity-30 disabled:cursor-not-allowed"
                  title="Zoom out"
                >
                  <Minus className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setZoomLevel(zoomLevel + 1)}
                  disabled={zoomLevel >= 6}
                  className="p-2 text-text-secondary hover:text-text hover:bg-surface-hover rounded-lg transition disabled:opacity-30 disabled:cursor-not-allowed"
                  title="Zoom in"
                >
                  <Plus className="w-5 h-5" />
                </button>
              </>
            )}
          </div>
        </div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <h2 className="text-3xl font-bold text-text">{currentCollection.name}</h2>
            <button
              onClick={() => setShowEditForm(true)}
              className="text-text-secondary hover:text-text transition p-1"
              title="Edit collection"
            >
              <Edit2 className="w-5 h-5" />
            </button>
            <button
              onClick={() => setShowAddBooksForm(true)}
              className="text-text-secondary hover:text-text transition p-1"
              title="Add books to collection"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => {
                if (sortBy === 'title') {
                  setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                } else {
                  setSortBy('title');
                  setSortOrder('asc');
                }
              }}
              className={`px-3 py-1.5 text-sm rounded-lg border transition ${
                sortBy === 'title'
                  ? 'bg-primary/20 text-primary border-primary/30'
                  : 'text-text-secondary border-transparent hover:text-text hover:bg-surface-hover'
              }`}
            >
              A-Z {sortBy === 'title' && (sortOrder === 'asc' ? '↑' : '↓')}
            </button>
            <button
              onClick={() => {
                if (sortBy === 'year') {
                  setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                } else {
                  setSortBy('year');
                  setSortOrder('asc');
                }
              }}
              className={`px-3 py-1.5 text-sm rounded-lg border transition ${
                sortBy === 'year'
                  ? 'bg-primary/20 text-primary border-primary/30'
                  : 'text-text-secondary border-transparent hover:text-text hover:bg-surface-hover'
              }`}
            >
              Year {sortBy === 'year' && (sortOrder === 'asc' ? '↑' : '↓')}
            </button>
            <button
              onClick={() => {
                if (sortBy === 'genre') {
                  setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                } else {
                  setSortBy('genre');
                  setSortOrder('asc');
                }
              }}
              className={`px-3 py-1.5 text-sm rounded-lg border transition ${
                sortBy === 'genre'
                  ? 'bg-primary/20 text-primary border-primary/30'
                  : 'text-text-secondary border-transparent hover:text-text hover:bg-surface-hover'
              }`}
            >
              Genre {sortBy === 'genre' && (sortOrder === 'asc' ? '↑' : '↓')}
            </button>
            <button
              onClick={() => {
                if (sortBy === 'recent') {
                  setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                } else {
                  setSortBy('recent');
                  setSortOrder('desc');
                }
              }}
              className={`px-3 py-1.5 text-sm rounded-lg border transition ${
                sortBy === 'recent'
                  ? 'bg-primary/20 text-primary border-primary/30'
                  : 'text-text-secondary border-transparent hover:text-text hover:bg-surface-hover'
              }`}
            >
              Recent {sortBy === 'recent' && (sortOrder === 'asc' ? '↑' : '↓')}
            </button>
          </div>
        </div>
        {currentCollection.description && (
          <p className="text-text-secondary mt-2">{currentCollection.description}</p>
        )}
        <p className="text-text-muted text-sm mt-1">
          {currentCollection.books.length} book{currentCollection.books.length !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Edit Collection Form */}
      {showEditForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-surface border border-border rounded-lg p-6 w-96 max-w-full mx-4">
            <h3 className="text-lg font-semibold text-text mb-4">Edit Collection</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-text mb-1">Name</label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-text focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Collection name"
                  autoFocus
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-text mb-1">Description</label>
                <textarea
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-text focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                  placeholder="Collection description (optional)"
                  rows={3}
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowEditForm(false)}
                className="px-4 py-2 text-text-secondary hover:text-text transition"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateCollection}
                disabled={!editName.trim()}
                className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-hover disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Books Form */}
      {showAddBooksForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-surface border border-border rounded-lg p-6 w-96 max-w-full mx-4 max-h-[80vh] flex flex-col">
            <h3 className="text-lg font-semibold text-text mb-4">Add Books to Collection</h3>
            
            <div className="space-y-4 flex-1 overflow-hidden flex flex-col">
              <div>
                <input
                  type="text"
                  value={bookSearchQuery}
                  onChange={(e) => setBookSearchQuery(e.target.value)}
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-text focus:outline-none focus:ring-2 focus:ring-primary mb-2"
                  placeholder="Search books..."
                />
              </div>
              
              <div className="flex-1 overflow-y-auto border border-border rounded-lg bg-background">
                {currentLibraryItems.length === 0 ? (
                  <p className="p-4 text-text-secondary text-sm">No books available in library</p>
                ) : (
                  currentLibraryItems
                    .filter(item => 
                      !currentCollection?.books.some(b => b.id === item.id) &&
                      (item.media.metadata.title.toLowerCase().includes(bookSearchQuery.toLowerCase()) ||
                       item.media.metadata.authorName?.toLowerCase().includes(bookSearchQuery.toLowerCase()))
                    )
                    .map((item) => (
                      <label
                        key={item.id}
                        className="flex items-center p-3 hover:bg-surface-hover cursor-pointer border-b border-border last:border-b-0"
                      >
                        <input
                          type="checkbox"
                          checked={selectedBookIdsToAdd.includes(item.id)}
                          onChange={() => toggleBookToAdd(item.id)}
                          className="mr-3 w-4 h-4 accent-primary"
                        />
                        <span className="text-sm text-text truncate">{item.media.metadata.title}</span>
                      </label>
                    ))
                )}
              </div>
              <p className="text-xs text-text-secondary mt-1">
                {selectedBookIdsToAdd.length} book{selectedBookIdsToAdd.length !== 1 ? 's' : ''} selected
              </p>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowAddBooksForm(false);
                  setSelectedBookIdsToAdd([]);
                  setBookSearchQuery('');
                }}
                className="px-4 py-2 text-text-secondary hover:text-text transition"
              >
                Cancel
              </button>
              <button
                onClick={handleAddBooks}
                disabled={selectedBookIdsToAdd.length === 0}
                className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-hover disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                Add
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Albums Grid */}
      {viewMode === 'grid' ? (
        <div className="grid gap-6" style={{ gridTemplateColumns: `repeat(${zoomLevel}, minmax(0, 1fr))` }}>
        {sortedBooks.map((item) => {
          const coverUrl = getCoverUrl(item);
          return (
            <div
              key={item.id}
              className="group cursor-pointer"
              onClick={() => handlePlayItem(item)}
            >
              <div className="relative aspect-square mb-3 rounded-lg overflow-hidden bg-surface shadow-glass group-hover:shadow-glass-hover transition-all duration-300">
                {coverUrl ? (
                  <img
                    src={coverUrl}
                    alt={item.media.metadata.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                      e.currentTarget.nextElementSibling?.classList.remove('hidden');
                    }}
                  />
                ) : null}
                
                {/* Fallback for missing cover */}
                <div className={`absolute inset-0 flex items-center justify-center bg-gradient-to-br from-primary/20 to-accent/20 ${coverUrl ? 'hidden' : ''}`}>
                  <Book className="w-20 h-20 text-primary/50" />
                </div>
                
                {/* Hover overlay with play button */}
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                  <div className="w-16 h-16 bg-primary/90 rounded-full flex items-center justify-center transform scale-90 group-hover:scale-100 transition-transform duration-300">
                    <PlayCircle className="w-8 h-8 text-white" />
                  </div>
                </div>

                {/* Remove button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemoveBook(item.id);
                  }}
                  className="absolute top-2 right-2 w-8 h-8 bg-red-500/90 hover:bg-red-600 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                  title="Remove from collection"
                >
                  <X className="w-4 h-4 text-white" />
                </button>
                
                {/* Progress bar */}
                {itemProgress[item.id] && (
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/50">
                    <div
                      className="h-full transition-all duration-300"
                      style={{
                        width: `${itemProgress[item.id].progress * 100}%`,
                        backgroundColor: itemProgress[item.id].isFinished ? '#22c55e' : '#eab308',
                      }}
                    />
                  </div>
                )}
              </div>
              
              <div className="space-y-1">
                <h3 className="text-text font-semibold truncate group-hover:text-primary transition-colors">
                  {item.media.metadata.title}
                </h3>
                <p className="text-text-secondary text-sm truncate">
                  {item.media.metadata.authorName}
                </p>
                <div className="flex items-center text-text-muted text-xs">
                  <Clock className="w-3 h-3 mr-1" />
                  {formatDuration(item.media.duration)}
                </div>
              </div>
            </div>
          );
        })}
        </div>
      ) : (
        /* List View */
        <div className="space-y-3">
          {sortedBooks.map((item) => {
            const coverUrl = getCoverUrl(item);
            return (
              <div
                key={item.id}
                className="group cursor-pointer flex items-center p-3 rounded-lg hover:bg-surface-hover transition"
                onClick={() => handlePlayItem(item)}
              >
                <div className="relative w-16 h-16 flex-shrink-0 rounded overflow-hidden bg-surface shadow-glass">
                  {coverUrl ? (
                    <img
                      src={coverUrl}
                      alt={item.media.metadata.title}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                        e.currentTarget.nextElementSibling?.classList.remove('hidden');
                      }}
                    />
                  ) : null}
                  
                  {/* Fallback for missing cover */}
                  <div className={`absolute inset-0 flex items-center justify-center bg-gradient-to-br from-primary/20 to-accent/20 ${coverUrl ? 'hidden' : ''}`}>
                    <Book className="w-8 h-8 text-primary/50" />
                  </div>
                  
                  {/* Progress bar */}
                  {itemProgress[item.id] && (
                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/50">
                      <div
                        className="h-full transition-all duration-300"
                        style={{
                          width: `${itemProgress[item.id].progress * 100}%`,
                          backgroundColor: itemProgress[item.id].isFinished ? '#22c55e' : '#eab308',
                        }}
                      />
                    </div>
                  )}
                </div>
                
                <div className="ml-4 flex-1 min-w-0">
                  <h3 className="text-text font-semibold truncate group-hover:text-primary transition-colors">
                    {item.media.metadata.title}
                  </h3>
                  <p className="text-text-secondary text-sm truncate">
                    {item.media.metadata.authorName}
                  </p>
                  <div className="flex items-center text-text-muted text-xs mt-1">
                    <Clock className="w-3 h-3 mr-1" />
                    {formatDuration(item.media.duration)}
                  </div>
                </div>
                
                {/* Play button on hover */}
                <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <div className="w-10 h-10 bg-primary/90 rounded-full flex items-center justify-center">
                    <PlayCircle className="w-6 h-6 text-white" />
                  </div>
                </div>
                
                {/* Remove button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemoveBook(item.id);
                  }}
                  className="ml-2 w-8 h-8 bg-red-500/90 hover:bg-red-600 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                  title="Remove from collection"
                >
                  <X className="w-4 h-4 text-white" />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Empty State */}
      {currentCollection.books.length === 0 && (
        <div className="text-center py-16">
          <div className="w-24 h-24 bg-surface rounded-full flex items-center justify-center mx-auto mb-6 shadow-glass">
            <Book className="w-12 h-12 text-text-muted" />
          </div>
          <h3 className="text-xl font-semibold text-text mb-2">No books in this collection</h3>
          <p className="text-text-secondary">This collection doesn't contain any audiobooks yet.</p>
        </div>
      )}
    </div>
  );
}
