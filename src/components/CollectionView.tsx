import { useEffect, useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { useStore } from '../store';
import { Book, Clock, PlayCircle, ArrowLeft, Edit2 } from 'lucide-react';
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
    loadCollections
  } = useStore();
  const [itemProgress, setItemProgress] = useState<Record<string, any>>({});
  const [showEditForm, setShowEditForm] = useState(false);
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');

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
    console.log('handlePlayItem called with item:', item);
    try {
      setCurrentLibraryItem(item);
      
      // Load saved progress from server
      let savedProgress: any = null;
      try {
        savedProgress = await invoke('get_media_progress', { libraryItemId: item.id });
        console.log('Saved progress:', savedProgress);
      } catch (error) {
        console.error('Failed to load saved progress:', error);
      }
      
      const response = await invoke('play_item', { libraryItemId: item.id, episodeId: null }) as any;
      console.log('Play response:', response);
      console.log('Response chapters:', response.chapters);
      console.log('Response audioTracks:', response.audioTracks);
      console.log('All response keys:', Object.keys(response));
      
      // Store chapters if available
      if (response.chapters && response.chapters.length > 0) {
        console.log('Chapters found:', response.chapters);
        setChapters(response.chapters);
      } else {
        console.log('No chapters found, will use audio tracks');
        setChapters([]);
      }
      
      // Handle audioTracks field
      if (response.audioTracks && response.audioTracks.length > 0) {
        const firstTrack = response.audioTracks[0];
        console.log('Content URL:', firstTrack.contentUrl);
        console.log('Server URL:', serverUrl);
        console.log('Token:', token);
        console.log('Total audio tracks:', response.audioTracks.length);
        
        // Store all audio tracks
        setAudioTracks(response.audioTracks);
        
        // Calculate total duration from all tracks
        const totalDuration = response.audioTracks.reduce((sum: number, track: any) => sum + track.duration, 0);
        console.log('Total duration:', totalDuration);
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

  if (!currentCollection) {
    return null;
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => setCurrentCollection(null)}
          className="flex items-center space-x-2 text-text-secondary hover:text-text transition mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Collections</span>
        </button>
        <div className="flex items-center space-x-3">
          <h2 className="text-3xl font-bold text-text">{currentCollection.name}</h2>
          <button
            onClick={() => setShowEditForm(true)}
            className="text-text-secondary hover:text-text transition p-1"
            title="Edit collection"
          >
            <Edit2 className="w-5 h-5" />
          </button>
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

      {/* Albums Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
        {currentCollection.books.map((item) => {
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
