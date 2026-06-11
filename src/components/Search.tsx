import { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { useStore } from '../store';
import { Book, Clock, PlayCircle, Search as SearchIcon, X } from 'lucide-react';
import { LibraryItem, SearchResponse } from '../types';

export default function Search() {
  const { serverUrl, setCurrentLibraryItem, setPlaying, setAudioUrl, setDuration, token, setAudioTracks, setCurrentTrackIndex, setCurrentTime, setChapters, currentLibrary } = useStore();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [itemProgress, setItemProgress] = useState<Record<string, any>>({});

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (query.trim()) {
        performSearch(query);
      } else {
        setResults(null);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [query]);

  const performSearch = async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults(null);
      return;
    }

    setLoading(true);
    try {
      const response = await invoke<any>('search', { 
        query: searchQuery,
        libraryId: currentLibrary?.id 
      });
      setResults(response);
      
      // Load progress for book results
      if (response.book) {
        const progressMap: Record<string, any> = {};
        for (const searchItem of response.book) {
          const item = searchItem.libraryItem as any;
          try {
            const progress = await invoke('get_media_progress', { libraryItemId: item.id });
            if (progress) {
              progressMap[item.id] = progress;
            }
          } catch (error) {
            // Ignore progress errors
          }
        }
        setItemProgress(progressMap);
      }
    } catch (error: any) {
      console.error('Search failed:', error);
      setResults({ error: error.toString() } as any);
    } finally {
      setLoading(false);
    }
  };

  const handlePlayItem = async (item: LibraryItem) => {
    try {
      setCurrentLibraryItem(item);
      
      let savedProgress: any = null;
      try {
        savedProgress = await invoke('get_media_progress', { libraryItemId: item.id });
      } catch (error) {
        console.error('Failed to load saved progress:', error);
      }
      
      const response = await invoke('play_item', { libraryItemId: item.id, episodeId: null }) as any;
      
      if (response.chapters && response.chapters.length > 0) {
        setChapters(response.chapters);
      } else {
        setChapters([]);
      }
      
      if (response.audioTracks && response.audioTracks.length > 0) {
        const firstTrack = response.audioTracks[0];
        
        setAudioTracks(response.audioTracks);
        
        const totalDuration = response.audioTracks.reduce((sum: number, track: any) => sum + track.duration, 0);
        setDuration(totalDuration);
        
        if (savedProgress && savedProgress.currentTime) {
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
      {/* Search Input */}
      <div className="mb-6">
        <div className="relative">
          <SearchIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 text-text-muted w-5 h-5" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search audiobooks, authors, series..."
            className="w-full pl-12 pr-12 py-3 bg-surface border border-border rounded-lg text-text placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-primary"
            autoFocus
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="absolute right-4 top-1/2 transform -translate-y-1/2 text-text-muted hover:text-text transition"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="text-center py-8">
          <div className="text-text-muted">Searching...</div>
        </div>
      )}

      {/* No Results */}
      {!loading && results && !results.book?.length && !results.authors?.length && !results.series?.length && (
        <div className="text-center py-16">
          <div className="w-24 h-24 bg-surface rounded-full flex items-center justify-center mx-auto mb-6 shadow-glass">
            <SearchIcon className="w-12 h-12 text-text-muted" />
          </div>
          <h3 className="text-xl font-semibold text-text mb-2">No results found</h3>
          <p className="text-text-secondary">Try a different search term</p>
          {(results as any).error && (
            <div className="mt-4 p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
              Error: {(results as any).error}
            </div>
          )}
          <div className="mt-4 text-xs text-text-muted">
            Response: {JSON.stringify(results)}
          </div>
        </div>
      )}

      {/* Search Results */}
      {!loading && results && (
        <div className="space-y-8">
          {/* Books */}
          {results.book && results.book.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-text mb-4">Books ({results.book.length})</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                {results.book.map((searchItem) => {
                  const item = searchItem.libraryItem as any;
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
                        
                        <div className={`absolute inset-0 flex items-center justify-center bg-gradient-to-br from-primary/20 to-accent/20 ${coverUrl ? 'hidden' : ''}`}>
                          <Book className="w-20 h-20 text-primary/50" />
                        </div>
                        
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                          <div className="w-16 h-16 bg-primary/90 rounded-full flex items-center justify-center transform scale-90 group-hover:scale-100 transition-transform duration-300">
                            <PlayCircle className="w-8 h-8 text-white" />
                          </div>
                        </div>
                        
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
            </div>
          )}

          {/* Authors */}
          {results.authors && results.authors.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-text mb-4">Authors ({results.authors.length})</h3>
              <div className="flex flex-wrap gap-3">
                {results.authors.map((author) => (
                  <button
                    key={author.id}
                    onClick={() => setQuery(author.name)}
                    className="px-4 py-2 bg-surface border border-border rounded-lg text-text hover:bg-surface-hover hover:border-primary/50 transition"
                  >
                    {author.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Series */}
          {results.series && results.series.filter(s => s.name && s.name.trim()).length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-text mb-4">Series ({results.series.filter(s => s.name && s.name.trim()).length})</h3>
              <div className="flex flex-wrap gap-3">
                {results.series.filter(s => s.name && s.name.trim()).map((series) => (
                  <button
                    key={series.id}
                    onClick={() => setQuery(series.name)}
                    className="px-4 py-2 bg-surface border border-border rounded-lg text-text hover:bg-surface-hover hover:border-primary/50 transition"
                  >
                    {series.name}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Empty State (no search yet) */}
      {!loading && !results && !query && (
        <div className="text-center py-16">
          <div className="w-24 h-24 bg-surface rounded-full flex items-center justify-center mx-auto mb-6 shadow-glass">
            <SearchIcon className="w-12 h-12 text-text-muted" />
          </div>
          <h3 className="text-xl font-semibold text-text mb-2">Search your library</h3>
          <p className="text-text-secondary">Enter a search term to find audiobooks, authors, or series</p>
          {!currentLibrary && (
            <p className="text-text-muted text-sm mt-2">Note: Please select a library first to search</p>
          )}
        </div>
      )}
    </div>
  );
}
