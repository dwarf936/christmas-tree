import { useState, useRef, useEffect } from 'react';
import './MusicPlayer.css';

interface MusicPlayerProps {
  audioSrc: string;
  autoPlay?: boolean;
  loop?: boolean;
}

const MusicPlayer: React.FC<MusicPlayerProps> = ({ 
  audioSrc, 
  autoPlay = true, 
  loop = true 
}) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.5);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isAudioLoaded, setIsAudioLoaded] = useState(false);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    // 设置循环播放
    audio.loop = loop;

    // 设置音量
    audio.volume = volume;

    // 加载音频
    audio.load();

    // 监听音频加载完成事件
    const handleLoadedMetadata = () => {
      setDuration(audio.duration);
      setIsAudioLoaded(true);
    };

    // 监听音频播放时间更新
    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    // 监听播放事件
    const handlePlay = () => {
      setIsPlaying(true);
      setError(null);
    };

    // 监听暂停事件
    const handlePause = () => {
      setIsPlaying(false);
    };

    // 监听播放结束事件
    const handleEnded = () => {
      setIsPlaying(false);
      audio.currentTime = 0;
    };

    // 监听错误事件
    const handleError = () => {
      setError('音频文件未找到，请将圣诞音乐文件放在 public/audio 目录下，并命名为 christmas-music.mp3');
      setIsPlaying(false);
      setIsAudioLoaded(false);
    };

    // 添加事件监听器
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError);

    // 尝试自动播放
    if (autoPlay) {
      const tryAutoPlay = async () => {
        try {
          await audio.play();
          setIsPlaying(true);
          setIsAudioLoaded(true);
        } catch (err) {
          console.log('自动播放失败，需要用户交互');
        }
      };

      setTimeout(tryAutoPlay, 1000);

      // 监听用户交互事件，以便在用户交互后尝试播放
      const handleUserInteraction = () => {
        if (!isPlaying && !error) {
          audio.play().then(() => {
            setIsPlaying(true);
            setIsAudioLoaded(true);
          }).catch(() => {
            console.log('用户交互后播放仍失败');
          });
        }
      };

      document.addEventListener('click', handleUserInteraction, { once: true });
      document.addEventListener('touchstart', handleUserInteraction, { once: true });

      // 清理函数
      return () => {
        audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
        audio.removeEventListener('timeupdate', handleTimeUpdate);
        audio.removeEventListener('play', handlePlay);
        audio.removeEventListener('pause', handlePause);
        audio.removeEventListener('ended', handleEnded);
        audio.removeEventListener('error', handleError);
        document.removeEventListener('click', handleUserInteraction, { once: true });
        document.removeEventListener('touchstart', handleUserInteraction, { once: true });
        audio.pause();
      };
    } else {
      // 清理函数
      return () => {
        audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
        audio.removeEventListener('timeupdate', handleTimeUpdate);
        audio.removeEventListener('play', handlePlay);
        audio.removeEventListener('pause', handlePause);
        audio.removeEventListener('ended', handleEnded);
        audio.removeEventListener('error', handleError);
        audio.pause();
      };
    }
  }, [loop, autoPlay, volume]);

  const togglePlayPause = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
    } else {
      audio.play()
        .catch(err => {
          console.error('播放失败:', err);
          setError('播放失败，请检查浏览器设置');
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

  const formatTime = (time: number) => {
    if (isNaN(time)) return '0:00';
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="music-player-container">
      <audio ref={audioRef} src={audioSrc} />
      
      {error && (
        <div className="music-player-error">
          {error}
        </div>
      )}

      <div className="music-player-controls">
        {/* 播放/暂停按钮 */}
        <button 
          className="play-pause-btn"
          onClick={togglePlayPause}
          title={isPlaying ? '暂停' : '播放'}
          disabled={!isAudioLoaded && !error}
        >
          {isPlaying ? (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="6" y="4" width="4" height="16" />
              <rect x="14" y="4" width="4" height="16" />
            </svg>
          ) : (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polygon points="5 3 19 12 5 21 5 3" />
            </svg>
          )}
        </button>

        {/* 进度条 */}
        <div className="progress-container">
          <span className="time-label">{formatTime(currentTime)}</span>
          <input
            type="range"
            className="progress-bar"
            min="0"
            max={duration || 0}
            step="0.1"
            value={currentTime}
            onChange={handleProgressChange}
            disabled={!isAudioLoaded}
          />
          <span className="time-label">{formatTime(duration)}</span>
        </div>

        {/* 音量控制 */}
        <div className="volume-container">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
          </svg>
          <input
            type="range"
            className="volume-slider"
            min="0"
            max="1"
            step="0.01"
            value={volume}
            onChange={handleVolumeChange}
            disabled={!isAudioLoaded}
          />
          <span className="volume-label">{Math.round(volume * 100)}%</span>
        </div>
      </div>


    </div>
  );
};

export default MusicPlayer;