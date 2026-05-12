import { useEffect, useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { useStore } from '../store';
import { Book, Clock, PlayCircle, ImageOff } from 'lucide-react';
import { LibraryItem } from '../types';

export default function Library() {
  console.log('Library component rendering');
  const { currentLibrary, currentLibraryItems, setCurrentLibraryItems, setCurrentLibraryItem, setPlaying, serverUrl, setAudioUrl, setDuration, token, libraries, setLibraries, setCurrentLibrary, setAudioTracks, setCurrentTrackIndex, setCurrentTime } = useStore();
  const [itemProgress, setItemProgress] = useState<Record<string, any>>({});

  useEffect(() => {
    console.log('Library useEffect triggered, currentLibrary:', currentLibrary);
    if (currentLibrary) {
      loadLibraryItems();
    }
  }, [currentLibrary]);

  useEffect(() => {
    console.log('Library component mounted, loading libraries');
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
        console.log('Configuring Rust client with persisted credentials');
        await invoke('set_config', { serverUrl, token });
      }
      
      console.log('Attempting to load libraries...');
      const libs = await invoke('get_libraries');
      console.log('Libraries response:', libs);
      
      if (libs && Array.isArray(libs)) {
        setLibraries(libs);
        console.log('Libraries set in store:', libs);
        
        // Set the first library as current if none is set
        if (!currentLibrary && libs.length > 0) {
          setCurrentLibrary(libs[0]);
          console.log('Set current library to:', libs[0]);
        }
      } else {
        console.error('Invalid libraries response:', libs);
      }
    } catch (error) {
      console.error('Failed to load libraries:', error);
      console.error('Error details:', JSON.stringify(error));
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
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-white mb-2">{currentLibrary?.name || 'Library'}</h2>
        <p className="text-gray-400">{currentLibraryItems.length} items</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {currentLibraryItems.map((item) => {
          const coverUrl = getCoverUrl(item);
          console.log('Rendering item:', item.id, item.media.metadata.title, 'coverUrl:', coverUrl);
          return (
            <div
              key={item.id}
              className="bg-glass-200 backdrop-blur-sm rounded-lg p-4 hover:bg-glass-300 transition cursor-pointer group"
              onClick={() => {
                console.log('Item clicked:', item.id);
                handlePlayItem(item);
              }}
            >
              <div className="aspect-square bg-gradient-to-br from-accent-primary/20 to-accent-secondary/20 rounded-lg mb-3 flex items-center justify-center relative overflow-hidden">
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
                <div className={`absolute inset-0 flex items-center justify-center ${coverUrl ? 'hidden' : ''}`}>
                  <Book className="w-16 h-16 text-accent-primary/50" />
                </div>
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                  <PlayCircle className="w-12 h-12 text-white" />
                </div>
                {/* Progress bar */}
                {itemProgress[item.id] && (
                  <div className="absolute bottom-0 left-0 right-0 h-1">
                    <div
                      className="h-full"
                      style={{
                        width: `${itemProgress[item.id].progress * 100}%`,
                        backgroundColor: itemProgress[item.id].isFinished ? '#22c55e' : '#eab308',
                      }}
                    />
                  </div>
                )}
              </div>
              <h3 className="text-white font-semibold truncate mb-1">{item.media.metadata.title}</h3>
              <p className="text-gray-400 text-sm truncate mb-2">{item.media.metadata.authorName}</p>
              <div className="flex items-center text-gray-500 text-xs">
                <Clock className="w-3 h-3 mr-1" />
                {formatDuration(item.media.duration)}
              </div>
            </div>
          );
        })}
      </div>

      {currentLibraryItems.length === 0 && (
        <div className="text-center py-12">
          <Book className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <p className="text-gray-400">No items in this library</p>
        </div>
      )}
    </div>
  );
}
