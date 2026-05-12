import { useStore } from '../store';
import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, MoreHorizontal } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';

export default function Player() {
  const { isPlaying, currentTime, duration, volume, audioUrl, playbackSpeed, audioTracks, currentTrackIndex, currentLibraryItem, setCurrentTrackIndex, setPlaying, setCurrentTime, setDuration, setVolume } = useStore();
  const [isMuted, setIsMuted] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

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

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    if (hours > 0) {
      return `${hours}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

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

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
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
      setDuration(audioRef.current.duration);
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

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-glass-dark backdrop-blur-xl border-t border-glass-200 p-4">
      <audio
        ref={audioRef}
        src={audioUrl || undefined}
        preload="none"
        onProgress={handleProgress}
        onCanPlay={handleCanPlay}
        onTimeUpdate={handleTimeUpdate}
        onEnded={handleNextTrack}
      />
      <div className="max-w-7xl mx-auto">
        {/* Progress Bar with Chapters */}
        <div className="mb-4">
          <input
            type="range"
            min="0"
            max={duration || 100}
            value={currentTime}
            onChange={handleSeek}
            className="w-full h-2 bg-purple-900 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:bg-purple-500 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-runnable-track]:bg-purple-900 [&::-webkit-slider-runnable-track]:rounded-lg"
          />
          {/* Chapter markers */}
          <div className="relative h-4 -mt-2">
            {audioTracks.map((track, index) => {
              const trackStartTime = calculateTrackStartTime(index);
              const position = (trackStartTime / duration) * 100;
              return (
                <div
                  key={index}
                  onClick={() => handleChapterClick(index)}
                  className="absolute top-0 w-1 h-3 bg-purple-500 cursor-pointer hover:bg-purple-400 transition-colors z-10"
                  style={{ left: `calc(${position}% * (100% - 16px) / 100% + 6px)` }}
                  title={`Track ${index + 1}: ${track.metadata?.filename || 'Unknown'}`}
                />
              );
            })}
          </div>
          <div className="flex justify-between text-xs text-white mt-1">
            <span>{formatTimeHHMMSS(currentTime)}</span>
            <span>{formatTimeHHMMSS(duration)}</span>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-between">
          {/* Track Info */}
          <div className="flex items-center space-x-4 flex-1">
            <div className="w-12 h-12 bg-gradient-to-br from-accent-primary to-accent-secondary rounded-lg flex items-center justify-center">
              <span className="text-white font-bold">🎧</span>
            </div>
            <div className="overflow-hidden">
              <h3 className="text-white font-semibold truncate">
                {currentLibraryItem?.media.metadata.title || 'No track selected'}
              </h3>
              <p className="text-gray-400 text-sm truncate">
                {currentLibraryItem?.media.metadata.authorName || 'Unknown author'}
              </p>
            </div>
          </div>

          {/* Playback Controls */}
          <div className="flex items-center space-x-4">
            <button onClick={handleSkipBack} className="text-gray-400 hover:text-white transition" title="-10s">
              <SkipBack className="w-5 h-5" />
            </button>
            <button onClick={handlePreviousTrack} className="text-gray-400 hover:text-white transition" title="Previous track">
              <SkipBack className="w-5 h-5" />
            </button>
            <button
              onClick={handlePlayPause}
              className="w-12 h-12 bg-gradient-to-r from-accent-primary to-accent-secondary rounded-full flex items-center justify-center text-white hover:scale-110 transition-transform"
            >
              {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6 ml-1" />}
            </button>
            <button onClick={handleNextTrack} className="text-gray-400 hover:text-white transition" title="Next track">
              <SkipForward className="w-5 h-5" />
            </button>
            <button onClick={handleSkipForward} className="text-gray-400 hover:text-white transition" title="+10s">
              <SkipForward className="w-5 h-5" />
            </button>
          </div>

          {/* Volume & Extra Controls */}
          <div className="flex items-center space-x-4 flex-1 justify-end">
            <div className="flex items-center space-x-2">
              <button onClick={toggleMute} className="text-gray-400 hover:text-white transition">
                {isMuted || volume === 0 ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
              </button>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={volume}
                onChange={handleVolumeChange}
                className="w-24 h-2 bg-glass-200 rounded-lg appearance-none cursor-pointer accent-accent-primary"
              />
            </div>
            <div className="relative">
              <button 
                onClick={() => setShowMenu(!showMenu)}
                className="text-gray-400 hover:text-white transition"
              >
                <MoreHorizontal className="w-5 h-5" />
              </button>
              {showMenu && (
                <div className="absolute bottom-full right-0 mb-2 bg-glass-dark backdrop-blur-xl border border-glass-200 rounded-lg p-2 w-48">
                  <button className="w-full text-left px-3 py-2 text-white hover:bg-glass-200 rounded transition text-sm">
                    Playback Speed
                  </button>
                  <button className="w-full text-left px-3 py-2 text-white hover:bg-glass-200 rounded transition text-sm">
                    Skip Silence
                  </button>
                  <button className="w-full text-left px-3 py-2 text-white hover:bg-glass-200 rounded transition text-sm">
                    Show Queue
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
