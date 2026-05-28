import { useStore } from '../store';
import { X, Play, Pause, List } from 'lucide-react';
import { useState } from 'react';

export default function QueuePanel() {
  const { 
    audioTracks, 
    currentTrackIndex, 
    isPlaying, 
    setPlaying, 
    setCurrentTrackIndex, 
    setAudioUrl,
    serverUrl,
    token,
    currentLibraryItem,
    chapters,
    currentTime,
    setCurrentTime
  } = useStore();
  
  const [showChapters, setShowChapters] = useState(true);

  const handleTrackSelect = (index: number) => {
    setCurrentTrackIndex(index);
    if (audioTracks[index]) {
      const track = audioTracks[index];
      if (!track.contentUrl) return;
      let fullUrl = track.contentUrl.startsWith('http')
        ? track.contentUrl
        : `${serverUrl}${track.contentUrl}`;

      if (token && !fullUrl.includes('token=')) {
        const separator = fullUrl.includes('?') ? '&' : '?';
        fullUrl = `${fullUrl}${separator}token=${token}`;
      }

      setAudioUrl(fullUrl);
      setPlaying(true);
    }
  };

  const handleChapterSelect = (startTime: number) => {
    // Find which track this time falls into
    let trackIndex = 0;
    let accumulatedTime = 0;
    for (let i = 0; i < audioTracks.length; i++) {
      if (accumulatedTime + audioTracks[i].duration > startTime) {
        trackIndex = i;
        break;
      }
      accumulatedTime += audioTracks[i].duration;
    }

    setCurrentTrackIndex(trackIndex);
    setCurrentTime(startTime);

    if (audioTracks[trackIndex]) {
      const track = audioTracks[trackIndex];
      if (!track.contentUrl) return;
      let fullUrl = track.contentUrl.startsWith('http')
        ? track.contentUrl
        : `${serverUrl}${track.contentUrl}`;

      if (token && !fullUrl.includes('token=')) {
        const separator = fullUrl.includes('?') ? '&' : '?';
        fullUrl = `${fullUrl}${separator}token=${token}`;
      }

      setAudioUrl(fullUrl);
      setPlaying(true);
    }
  };

  const handleRemoveFromQueue = (index: number) => {
    // This would need to be implemented in the store
    console.log('Remove track from queue:', index);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatTimeHHMMSS = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    if (hours > 0) {
      return `${hours}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="w-80 bg-surface border-l border-border flex flex-col h-full pb-24">
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-text">Queue</h2>
          <div className="flex items-center space-x-2">
            {chapters.length > 0 && (
              <button
                onClick={() => setShowChapters(!showChapters)}
                className={`p-2 rounded-lg transition ${
                  showChapters ? 'bg-primary/20 text-primary' : 'text-text-secondary hover:text-text hover:bg-surface-hover'
                }`}
                title="Toggle chapters view"
              >
                <List className="w-5 h-5" />
              </button>
            )}
            <button className="text-text-secondary hover:text-text transition">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto">
        {audioTracks.length === 0 ? (
          <div className="p-8 text-center">
            <div className="w-16 h-16 bg-surface rounded-full flex items-center justify-center mx-auto mb-4">
              <Play className="w-8 h-8 text-text-muted" />
            </div>
            <p className="text-text-muted">No tracks in queue</p>
            <p className="text-text-secondary text-sm mt-2">Add tracks to build your queue</p>
          </div>
        ) : showChapters && chapters.length > 0 ? (
          <div className="p-2">
            {/* Chapter list */}
            {chapters.map((chapter, index) => {
              const isActive = currentTime >= chapter.start && currentTime < chapter.end;
              return (
                <div
                  key={index}
                  className={`p-3 rounded-lg cursor-pointer transition group ${
                    isActive 
                      ? 'bg-primary/20 border border-primary/30' 
                      : 'hover:bg-surface-hover'
                  }`}
                  onClick={() => handleChapterSelect(chapter.start)}
                >
                  <div className="flex items-center space-x-3">
                    <div className="flex-shrink-0">
                      {isActive && isPlaying ? (
                        <Pause className="w-4 h-4 text-primary" />
                      ) : (
                        <Play className="w-4 h-4 text-text-muted group-hover:text-text" />
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium truncate ${
                        isActive ? 'text-primary' : 'text-text'
                      }`}>
                        {chapter.title}
                      </p>
                      <p className="text-xs text-text-secondary">
                        {formatTimeHHMMSS(chapter.start)} - {formatTimeHHMMSS(chapter.end)}
                      </p>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <span className="text-xs text-text-muted">
                        {formatTime(chapter.end - chapter.start)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-2">
            {audioTracks.map((track, index) => (
              <div
                key={index}
                className={`p-3 rounded-lg cursor-pointer transition group ${
                  index === currentTrackIndex 
                    ? 'bg-primary/20 border border-primary/30' 
                    : 'hover:bg-surface-hover'
                }`}
                onClick={() => handleTrackSelect(index)}
              >
                <div className="flex items-center space-x-3">
                  <div className="flex-shrink-0">
                    {index === currentTrackIndex && isPlaying ? (
                      <Pause className="w-5 h-5 text-primary" />
                    ) : (
                      <Play className="w-5 h-5 text-text-muted group-hover:text-text" />
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium truncate ${
                      index === currentTrackIndex ? 'text-primary' : 'text-text'
                    }`}>
                      {track.metadata?.filename || `Track ${index + 1}`}
                    </p>
                    <p className="text-xs text-text-secondary truncate">
                      {currentLibraryItem?.media?.metadata?.title || 'Unknown Album'}
                    </p>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <span className="text-xs text-text-muted">
                      {formatTime(track.duration || 0)}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveFromQueue(index);
                      }}
                      className="opacity-0 group-hover:opacity-100 transition text-text-muted hover:text-text"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      {audioTracks.length > 0 && (
        <div className="p-4 border-t border-border">
          <div className="flex items-center justify-between text-sm text-text-secondary">
            <span>{showChapters && chapters.length > 0 ? `${chapters.length} chapters` : `${audioTracks.length} tracks`}</span>
            <span>
              {formatTime(audioTracks.reduce((total, track) => total + (track.duration || 0), 0))}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
