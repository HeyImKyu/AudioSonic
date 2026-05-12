import { useStore } from '../store';
import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, MoreHorizontal } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';

export default function Player() {
  const { isPlaying, currentTime, duration, volume, currentLibraryItem, audioUrl, setPlaying, setCurrentTime, setDuration, setVolume } = useStore();
  const [isMuted, setIsMuted] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  useEffect(() => {
    if (audioUrl && audioRef.current) {
      console.log('Audio URL changed:', audioUrl);
      // Pause and clear previous audio to prevent background loading
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current.src = audioUrl;
      audioRef.current.load();
      if (isPlaying) {
        audioRef.current.play().catch(console.error);
      }
    }
  }, [audioUrl, isPlaying]);

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

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = parseFloat(e.target.value);
    setCurrentTime(newTime);
    if (audioRef.current) {
      audioRef.current.currentTime = newTime;
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
      setCurrentTime(audioRef.current.currentTime);
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
      />
      <div className="max-w-7xl mx-auto">
        {/* Progress Bar */}
        <div className="mb-4">
          <input
            type="range"
            min="0"
            max={duration || 100}
            value={currentTime}
            onChange={handleSeek}
            className="w-full h-2 bg-glass-200 rounded-lg appearance-none cursor-pointer accent-accent-primary"
            style={{ background: `linear-gradient(to right, #6366f1 ${(currentTime / (duration || 1)) * 100}%, rgba(255,255,255,0.2) ${(currentTime / (duration || 1)) * 100}%)` }}
          />
          <div className="flex justify-between text-xs text-gray-400 mt-1">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
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
            <button className="text-gray-400 hover:text-white transition">
              <SkipBack className="w-5 h-5" />
            </button>
            <button
              onClick={handlePlayPause}
              className="w-12 h-12 bg-gradient-to-r from-accent-primary to-accent-secondary rounded-full flex items-center justify-center text-white hover:scale-110 transition-transform"
            >
              {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6 ml-1" />}
            </button>
            <button className="text-gray-400 hover:text-white transition">
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
