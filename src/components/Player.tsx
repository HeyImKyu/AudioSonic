import { useStore } from '../store';
import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, MoreHorizontal, RotateCcw, RotateCw } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';

export default function Player() {
  const { isPlaying, currentTime, duration, volume, audioUrl, playbackSpeed, audioTracks, currentTrackIndex, currentLibraryItem, setCurrentTrackIndex, setPlaying, setCurrentTime, setDuration, setVolume, serverUrl } = useStore();
  const [isMuted, setIsMuted] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  const positionRestoredRef = useRef(false);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);


  useEffect(() => {
    if (audioRef.current) {
      if (isPlaying) {
        console.log('Attempting to play audio');
        audioRef.current.play().catch(e => console.error('Play error:', e));
      } else {
        console.log('Pausing audio');
        audioRef.current.pause();
      }
    }
  }, [isPlaying]);

  // Restore audio element currentTime when audioUrl changes (for saved progress)
  useEffect(() => {
    if (audioUrl) {
      positionRestoredRef.current = false;
    }
  }, [audioUrl]);

  useEffect(() => {
    if (audioRef.current && audioUrl && currentTime > 0 && audioTracks.length > 0 && !positionRestoredRef.current) {
      const trackStartTime = calculateTrackStartTime(currentTrackIndex);
      const timeInTrack = currentTime - trackStartTime;
      console.log('Restoring audio position:', { currentTime, trackStartTime, timeInTrack, currentTrackIndex });
      const restorePosition = () => {
        if (audioRef.current && timeInTrack >= 0) {
          audioRef.current.currentTime = timeInTrack;
          positionRestoredRef.current = true;
          console.log('Audio position restored to:', timeInTrack);
        }
      };
      
      if (audioRef.current.readyState >= 2) {
        restorePosition();
      } else {
        audioRef.current.addEventListener('loadedmetadata', restorePosition, { once: true });
      }
      
      return () => {
        audioRef.current?.removeEventListener('loadedmetadata', restorePosition);
      };
    }
  }, [audioUrl, currentTime, currentTrackIndex, audioTracks]);

  // Sync progress with server periodically during playback
  useEffect(() => {
    if (!currentLibraryItem || !duration) return;

    const syncProgress = async () => {
      try {
        const progress = currentTime / duration;
        const isFinished = currentTime >= duration - 1; // Consider finished if within 1 second of end
        await invoke('update_progress', {
          libraryItemId: currentLibraryItem.id,
          episodeId: null,
          currentTime,
          duration,
          progress,
          isFinished,
        });
      } catch (error) {
        console.error('Failed to sync progress:', error);
      }
    };

    // Sync every 10 seconds during playback
    let interval: number | null = null;
    if (isPlaying) {
      interval = setInterval(syncProgress, 10000) as unknown as number;
    }

    // Sync when pausing
    if (!isPlaying && currentTime > 0) {
      syncProgress();
    }

    // Also sync when page is about to unload
    const handleBeforeUnload = () => {
      syncProgress();
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      if (interval) clearInterval(interval);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [isPlaying, currentTime, duration, currentLibraryItem]);

  const formatTimeHHMMSS = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleChapterClick = (trackIndex: number) => {
    setCurrentTrackIndex(trackIndex);
    const track = audioTracks[trackIndex];
    if (track && audioRef.current) {
      const trackStartTime = calculateTrackStartTime(trackIndex);
      const fullUrl = track.contentUrl.startsWith('http') 
        ? track.contentUrl 
        : `${useStore.getState().serverUrl}${track.contentUrl}`;
      const token = useStore.getState().token;
      if (token && !fullUrl.includes('token=')) {
        const separator = fullUrl.includes('?') ? '&' : '?';
        const urlWithToken = `${fullUrl}${separator}token=${token}`;
        audioRef.current.src = urlWithToken;
      } else {
        audioRef.current.src = fullUrl;
      }
      audioRef.current.load();
      // Set store currentTime to cumulative time, but audio element to 0
      setCurrentTime(trackStartTime);
      audioRef.current.currentTime = 0;
      setPlaying(true);
      audioRef.current.play().catch(console.error);
    }
  };

  const calculateTrackStartTime = (trackIndex: number) => {
    return audioTracks.slice(0, trackIndex).reduce((sum, track) => sum + track.duration, 0);
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newCumulativeTime = parseFloat(e.target.value);
    setCurrentTime(newCumulativeTime);
    // Find which track this time falls into
    let trackIndex = 0;
    let accumulatedTime = 0;
    for (let i = 0; i < audioTracks.length; i++) {
      if (accumulatedTime + audioTracks[i].duration > newCumulativeTime) {
        trackIndex = i;
        break;
      }
      accumulatedTime += audioTracks[i].duration;
    }
    // If we need to switch tracks
    if (trackIndex !== currentTrackIndex) {
      handleChapterClick(trackIndex);
    }
    // Set audio element currentTime to position within the track
    if (audioRef.current) {
      audioRef.current.currentTime = newCumulativeTime - accumulatedTime;
    }
  };

  const toggleMute = () => {
    if (isMuted) {
      setVolume(1);
      setIsMuted(false);
    } else {
      setVolume(0);
      setIsMuted(true);
    }
  };

  const handlePlayPause = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setPlaying(!isPlaying);
    }
  };

  const handleSkipBack = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = Math.max(0, audioRef.current.currentTime - 10);
    }
  };

  const handleSkipForward = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = Math.min(duration, audioRef.current.currentTime + 10);
    }
  };

  const handlePreviousTrack = () => {
    if (currentTrackIndex > 0) {
      handleChapterClick(currentTrackIndex - 1);
    }
  };

  const handleNextTrack = () => {
    if (currentTrackIndex < audioTracks.length - 1) {
      handleChapterClick(currentTrackIndex + 1);
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    setIsMuted(newVolume === 0);
    if (audioRef.current) {
      audioRef.current.volume = newVolume;
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      const trackStartTime = calculateTrackStartTime(currentTrackIndex);
      const cumulativeTime = trackStartTime + audioRef.current.currentTime;
      setCurrentTime(cumulativeTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      console.log('Audio metadata loaded:', {
        duration: audioRef.current.duration,
        readyState: audioRef.current.readyState,
        networkState: audioRef.current.networkState
      });
      setCurrentTime(audioRef.current.currentTime);
      // Calculate total duration of all tracks
      const totalDuration = audioTracks.reduce((sum, track) => sum + (track.duration || 0), 0);
      setDuration(totalDuration);
    }
  };

  const handleProgress = () => {
    if (audioRef.current) {
      console.log('Audio loading progress:', {
        buffered: audioRef.current.buffered.length,
        networkState: audioRef.current.networkState,
        readyState: audioRef.current.readyState
      });
    }
  };

  const handleCanPlay = () => {
    console.log('Audio can play');
  };

  const handleError = (e: React.SyntheticEvent<HTMLAudioElement>) => {
    const audio = e.currentTarget;
    console.error('Audio error:', {
      error: audio.error,
      networkState: audio.networkState,
      readyState: audio.readyState,
      src: audio.src
    });
    setPlaying(false);
  };

  const [showMenu, setShowMenu] = useState(false);

  const getCoverUrl = () => {
    if (currentLibraryItem?.media.coverPath && serverUrl) {
      return `${serverUrl}/api/items/${currentLibraryItem.id}/cover`;
    }
    return null;
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-surface/95 backdrop-blur-xl border-t border-border">
      <audio
        ref={audioRef}
        src={audioUrl || undefined}
        preload="none"
        onProgress={handleProgress}
        onCanPlay={handleCanPlay}
        onTimeUpdate={handleTimeUpdate}
        onEnded={handleNextTrack}
        onError={handleError}
        onLoadedMetadata={handleLoadedMetadata}
      />
      <div className="max-w-7xl mx-auto px-6 py-4">
        {/* Progress Bar with Chapters */}
        <div className="mb-3">
          <div className="relative">
            <input
              type="range"
              min="0"
              max={duration || 100}
              value={currentTime}
              onChange={handleSeek}
              // className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
              // style={{
              //   background: `linear-gradient(to right, var(--color-primary) 0%, var(--color-primary) ${(currentTime / duration) * 100}%, var(--color-surface-hover) ${(currentTime / duration) * 100}%, var(--color-surface-hover) 100%)`
              // }}
              className="w-full h-2 rounded-lg appearance-none cursor-pointer"
              style={{
                background: `linear-gradient(to right, var(--color-primary) 0%, var(--color-primary) ${currentTime / duration * 100}%, var(--color-surface) ${currentTime / duration * 100}%, var(--color-surface) 100%)`
              }}
            />
            {/* Chapter markers underneath */}
            <div className="relative h-2 mt-1">
              {audioTracks.map((_, index) => {
                const trackStartTime = calculateTrackStartTime(index);
                const position = (trackStartTime / duration) * 100;
                // Skip markers that would be too close to each other (less than 2% apart)
                if (index > 0) {
                  const prevTrackStartTime = calculateTrackStartTime(index - 1);
                  const prevPosition = (prevTrackStartTime / duration) * 100;
                  if (position - prevPosition < 2) return null;
                }
                return (
                  <div
                    key={index}
                    onClick={() => handleChapterClick(index)}
                    className="absolute top-0 w-0.5 h-2 bg-text-secondary cursor-pointer hover:bg-text transition-colors z-10"
                    style={{ left: `calc(${position}% * (100% - 16px) / 100% + 6px)` }}
                    title={`Chapter ${index + 1}`}
                  />
                );
              })}
            </div>
          </div>
          <div className="flex justify-between text-xs text-text-secondary mt-1">
            <span>{formatTimeHHMMSS(currentTime)}</span>
            <span>{formatTimeHHMMSS(duration)}</span>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-between">
          {/* Track Info */}
          <div className="flex items-center space-x-4 flex-1 min-w-0">
            <div className="w-14 h-14 bg-surface rounded-lg flex items-center justify-center relative overflow-hidden shadow-glass">
              {getCoverUrl() ? (
                <img
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                  src={getCoverUrl() || undefined}
                  alt={currentLibraryItem?.media.metadata.title || 'Cover'}
                />
              ) : (
                <span className="text-2xl">🎧</span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-text font-semibold truncate">
                {currentLibraryItem?.media.metadata.title || 'No track selected'}
              </h3>
              <p className="text-text-secondary text-sm truncate">
                {currentLibraryItem?.media.metadata.authorName || 'Unknown author'}
              </p>
              {audioTracks.length > 1 && (
                <p className="text-text-muted text-xs">
                  Track {currentTrackIndex + 1} of {audioTracks.length}
                </p>
              )}
            </div>
          </div>

          {/* Playback Controls */}
          <div className="flex items-center space-x-2 px-8">
            <button 
              onClick={handlePreviousTrack} 
              className="text-text-secondary hover:text-text transition-colors p-2 hover:bg-surface-hover rounded-lg" 
              title="Previous track"
              disabled={currentTrackIndex === 0}
            >
              <SkipBack className="w-5 h-5" />
            </button>
            <button 
              onClick={handleSkipBack} 
              className="text-text-secondary hover:text-text transition-colors p-2 hover:bg-surface-hover rounded-lg" 
              title="-10s"
            >
              <RotateCcw className="w-5 h-5" />
            </button>
            <button
              onClick={handlePlayPause}
              className="w-12 h-12 bg-primary hover:bg-primary-hover text-white rounded-full flex items-center justify-center transition-all duration-200 hover:scale-105 shadow-lg"
            >
              {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6 ml-0.5" />}
            </button>
            <button 
              onClick={handleSkipForward} 
              className="text-text-secondary hover:text-text transition-colors p-2 hover:bg-surface-hover rounded-lg" 
              title="+10s"
            >
              <RotateCw className="w-5 h-5" />
            </button>
            <button 
              onClick={handleNextTrack} 
              className="text-text-secondary hover:text-text transition-colors p-2 hover:bg-surface-hover rounded-lg" 
              title="Next track"
              disabled={currentTrackIndex === audioTracks.length - 1}
            >
              <SkipForward className="w-5 h-5" />
            </button>
          </div>

          {/* Volume & Extra Controls */}
          <div className="flex items-center space-x-4 flex-1 justify-end">
            <div className="flex items-center space-x-2">
              <button 
                onClick={toggleMute} 
                className="text-text-secondary hover:text-text transition-colors p-2 hover:bg-surface-hover rounded-lg"
              >
                {isMuted || volume === 0 ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
              </button>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={volume}
                onChange={handleVolumeChange}
                className="w-24 h-1.5 rounded-lg appearance-none cursor-pointer"
                style={{
                  background: `linear-gradient(to right, var(--color-primary) 0%, var(--color-primary) ${volume * 100}%, var(--color-surface) ${volume * 100}%, var(--color-surface) 100%)`
                }}
              />
            </div>
            <div className="relative">
              <button 
                onClick={() => setShowMenu(!showMenu)}
                className="text-text-secondary hover:text-text transition-colors p-2 hover:bg-surface-hover rounded-lg"
              >
                <MoreHorizontal className="w-5 h-5" />
              </button>
              {showMenu && (
                <>
                  <div 
                    className="fixed inset-0 z-10" 
                    onClick={() => setShowMenu(false)}
                  />
                  <div className="absolute bottom-full right-0 mb-2 bg-surface border border-border rounded-lg shadow-glass p-2 w-48 z-20">
                    <button className="w-full text-left px-3 py-2 text-text hover:bg-surface-hover rounded transition text-sm">
                      Playback Speed: {playbackSpeed}x
                    </button>
                    <button className="w-full text-left px-3 py-2 text-text hover:bg-surface-hover rounded transition text-sm">
                      Skip Silence
                    </button>
                    <button className="w-full text-left px-3 py-2 text-text hover:bg-surface-hover rounded transition text-sm">
                      Audio Settings
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
      
      <style>{`
        .slider::-webkit-slider-thumb {
          appearance: none;
          width: 16px;
          height: 16px;
          background: var(--color-primary, #ff6b35);
          border-radius: 50%;
          cursor: pointer;
          box-shadow: 0 0 10px var(--color-primary), 0 2px 6px rgba(0,0,0,0.3);
          border: 2px solid rgba(255,255,255,0.9);
          transition: all 0.2s ease;
        }
        .slider::-webkit-slider-thumb:hover {
          transform: scale(1.1);
          box-shadow: 0 0 15px var(--color-primary), 0 2px 8px rgba(0,0,0,0.4);
        }
        .slider::-moz-range-thumb {
          width: 16px;
          height: 16px;
          background: var(--color-primary, #ff6b35);
          border-radius: 50%;
          cursor: pointer;
          border: 2px solid rgba(255,255,255,0.9);
          box-shadow: 0 0 10px var(--color-primary), 0 2px 6px rgba(0,0,0,0.3);
          transition: all 0.2s ease;
        }
        .slider::-moz-range-thumb:hover {
          transform: scale(1.1);
          box-shadow: 0 0 15px var(--color-primary), 0 2px 8px rgba(0,0,0,0.4);
        }
        
        /* Volume Slider */
        input[type="range"]::-webkit-slider-thumb {
          appearance: none;
          width: 12px;
          height: 12px;
          background: var(--color-primary, #ff6b35);
          border-radius: 50%;
          cursor: pointer;
          box-shadow: 0 0 6px var(--color-primary), 0 1px 3px rgba(0,0,0,0.2);
          border: 1px solid rgba(255,255,255,0.8);
          transition: all 0.2s ease;
        }
        input[type="range"]::-webkit-slider-thumb:hover {
          transform: scale(1.15);
          box-shadow: 0 0 10px var(--color-primary), 0 1px 4px rgba(0,0,0,0.3);
        }
        input[type="range"]::-moz-range-thumb {
          width: 12px;
          height: 12px;
          background: var(--color-primary, #ff6b35);
          border-radius: 50%;
          cursor: pointer;
          border: 1px solid rgba(255,255,255,0.8);
          box-shadow: 0 0 6px var(--color-primary), 0 1px 3px rgba(0,0,0,0.2);
          transition: all 0.2s ease;
        }
        input[type="range"]::-moz-range-thumb:hover {
          transform: scale(1.15);
          box-shadow: 0 0 10px var(--color-primary), 0 1px 4px rgba(0,0,0,0.3);
        }
      `}</style>
    </div>
  );
}
