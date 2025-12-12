import React, { useState, useRef, useEffect } from 'react';

interface MusicPlayerProps {
  audioSrc: string;
  autoPlay?: boolean;
  loop?: boolean;
}

const MusicPlayer: React.FC<MusicPlayerProps> = ({ audioSrc, autoPlay = false, loop = false }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.7);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleLoadedMetadata = () => {
      setDuration(audio.duration);
    };

    const handleError = (e: Event) => {
      const error = e.target as HTMLAudioElement;
      if (error.error) {
        switch (error.error.code) {
          case MediaError.MEDIA_ERR_ABORTED:
            setError('音频加载被中断');
            break;
          case MediaError.MEDIA_ERR_NETWORK:
            setError('网络错误，无法加载音频');
            break;
          case MediaError.MEDIA_ERR_DECODE:
            setError('音频文件损坏，无法解码');
            break;
          case MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED:
            setError('浏览器不支持该音频格式');
            break;
          default:
            setError('音频加载失败，请检查文件路径');
        }
      } else {
        setError('音频加载失败，请检查文件路径');
      }
    };

    const handlePlay = () => {
      setIsPlaying(true);
      setError(null); // 清除错误信息
    };

    const handlePause = () => {
      setIsPlaying(false);
    };

    const handleEnded = () => {
      setIsPlaying(false);
      if (loop && audio) {
        audio.currentTime = 0;
        audio.play().catch((e) => {
          setError('自动播放失败，请手动点击播放按钮');
        });
      }
    };

    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('error', handleError);
    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('ended', handleEnded);

    audio.volume = volume;

    // 尝试自动播放
    if (autoPlay) {
      audio.play().catch((e) => {
        setError('自动播放失败，请手动点击播放按钮');
      });
    }

    return () => {
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('error', handleError);
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('ended', handleEnded);
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    };
  }, [autoPlay, loop, volume]);

  useEffect(() => {
    if (isPlaying && audioRef.current) {
      progressIntervalRef.current = setInterval(() => {
        setCurrentTime(audioRef.current?.currentTime || 0);
      }, 1000);
    } else if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }

    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    };
  }, [isPlaying]);

  const togglePlayPause = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
    } else {
      audio.play().catch((e) => {
        setError('播放失败，请检查音频文件');
      });
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    if (audioRef.current) {
      audioRef.current.volume = newVolume;
    }
  };

  const handleProgressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = parseFloat(e.target.value);
    setCurrentTime(newTime);
    if (audioRef.current) {
      audioRef.current.currentTime = newTime;
    }
  };

  const formatTime = (time: number): string => {
    if (isNaN(time)) return '00:00';
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div style={{ position: 'absolute', bottom: '20px', left: '50%', transform: 'translateX(-50%)', zIndex: 2000, width: '90%', maxWidth: '600px' }}>
      <audio ref={audioRef} src={audioSrc} loop={loop} />
      
      {error && (
        <div style={{ color: '#ff0000', fontSize: '12px', marginBottom: '10px', textAlign: 'center' }}>
          {error}
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'center', gap: '15px', backgroundColor: 'rgba(0, 0, 0, 0.7)', padding: '12px 20px', borderRadius: '30px', backdropFilter: 'blur(10px)', flexWrap: 'wrap', justifyContent: 'center' }}>
        {/* 播放/暂停按钮 */}
        <button 
          onClick={togglePlayPause} 
          style={{ 
            width: '40px', 
            height: '40px', 
            borderRadius: '50%', 
            backgroundColor: '#FFD700', 
            border: 'none', 
            cursor: 'pointer', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            fontSize: '18px',
            transition: 'transform 0.2s'
          }}
          onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
          onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
        >
          {isPlaying ? '⏸' : '▶'}
        </button>

        {/* 进度条 */}
        <div style={{ flex: 1, minWidth: '200px', display: 'flex', flexDirection: 'column', gap: '5px', margin: '0 10px' }}>
          <input 
            type="range" 
            min="0" 
            max={duration || 100} 
            value={currentTime} 
            onChange={handleProgressChange} 
            style={{ width: '100%', height: '4px', borderRadius: '2px', backgroundColor: 'rgba(255, 255, 255, 0.3)', outline: 'none' }}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#fff', fontSize: '10px' }}>
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        {/* 音量控制 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: '100px' }}>
          <span style={{ color: '#fff', fontSize: '16px' }}>🔊</span>
          <input 
            type="range" 
            min="0" 
            max="1" 
            step="0.01" 
            value={volume} 
            onChange={handleVolumeChange} 
            style={{ width: '80px', height: '4px', borderRadius: '2px', backgroundColor: 'rgba(255, 255, 255, 0.3)', outline: 'none' }}
          />
        </div>
      </div>
    </div>
  );
};

export default MusicPlayer;