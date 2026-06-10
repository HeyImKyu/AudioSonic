import { useEffect, useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { useStore } from '../store';
import { Book, Clock, PlayCircle, Plus, Minus } from 'lucide-react';
import { LibraryItem } from '../types';

export default function Library() {
  const { currentLibrary, currentLibraryItems, setCurrentLibraryItems, setCurrentLibraryItem, setPlaying, serverUrl, setAudioUrl, setDuration, token, setLibraries, setCurrentLibrary, setAudioTracks, setCurrentTrackIndex, setCurrentTime, setChapters, viewMode, setViewMode, zoomLevel, setZoomLevel, cycleZoomLevel } = useStore();
  const [itemProgress, setItemProgress] = useState<Record<string, any>>({});

  useEffect(() => {
    if (currentLibrary) {
      loadLibraryItems();
    }
  }, [currentLibrary]);

  useEffect(() => {
    loadLibraries();
  }, []);

  // Load progress for all library items
  useEffect(() => {
    if (currentLibraryItems.length > 0) {
      loadProgressForItems();
    }
  }, [currentLibraryItems]);

  const loadProgressForItems = async () => {
    const progressMap: Record<string, any> = {};
    for (const item of currentLibraryItems) {
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

  const loadLibraries = async () => {
    try {
      // Configure the Rust client with persisted credentials
      if (serverUrl && token) {
        await invoke('set_config', { serverUrl, token });
      }
      
      const libs = await invoke('get_libraries');
      
      if (libs && Array.isArray(libs)) {
        setLibraries(libs);
        
        // Set the first library as current if none is set
        if (!currentLibrary && libs.length > 0) {
          setCurrentLibrary(libs[0]);
        }
      } else {
        console.error('Invalid libraries response:', libs);
      }
    } catch (error) {
      console.error('Failed to load libraries:', error);
    }
  };

  const loadLibraryItems = async () => {
    try {
      const items = await invoke('get_library_items', { libraryId: currentLibrary?.id });
      setCurrentLibraryItems(items as LibraryItem[]);
    } catch (error) {
      console.error('Failed to load library items:', error);
    }
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

  return (
    <div>
      {/* Filter Bar */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <button className="px-4 py-2 bg-primary/20 text-primary rounded-lg border border-primary/30 hover:bg-primary/30 transition">
            A-Z
          </button>
          <button className="px-4 py-2 text-text-secondary hover:text-text hover:bg-surface-hover rounded-lg transition">
            Year
          </button>
          <button className="px-4 py-2 text-text-secondary hover:text-text hover:bg-surface-hover rounded-lg transition">
            Genre
          </button>
          <button className="px-4 py-2 text-text-secondary hover:text-text hover:bg-surface-hover rounded-lg transition">
            Recent
          </button>
        </div>
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

      {/* Albums Grid */}
      {viewMode === 'grid' ? (
        <div className="grid gap-6" style={{ gridTemplateColumns: `repeat(${zoomLevel}, minmax(0, 1fr))` }}>
        {currentLibraryItems.map((item) => {
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
      ) : (
        /* List View */
        <div className="space-y-3">
          {currentLibraryItems.map((item) => {
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
              </div>
            );
          })}
        </div>
      )}

      {/* Empty State */}
      {currentLibraryItems.length === 0 && (
        <div className="text-center py-16">
          <div className="w-24 h-24 bg-surface rounded-full flex items-center justify-center mx-auto mb-6 shadow-glass">
            <Book className="w-12 h-12 text-text-muted" />
          </div>
          <h3 className="text-xl font-semibold text-text mb-2">No items found</h3>
          <p className="text-text-secondary">This library doesn't contain any audiobooks yet.</p>
        </div>
      )}
    </div>
  );
}
