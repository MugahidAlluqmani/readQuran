"use client";
import React, { useState, useRef } from 'react';
import '../../public/styles/AudioPlayer.css';

const AudioPlayer = ({ ayahNumber, speed }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef(null);

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  return (
    <div className="audio-player">
      <audio
        ref={audioRef}
        src={`https://cdn.islamic.network/quran/audio/128/ar.alafasy/${ayahNumber}.mp3`}
        onEnded={() => setIsPlaying(false)}
        playbackrate={speed}
      />
      <button 
        className={`play-btn ${isPlaying ? 'playing' : ''}`}
        onClick={togglePlay}
      >
        {isPlaying ? '⏸️ إيقاف' : '▶️ تشغيل'}
      </button>
    </div>
  );
};

export default AudioPlayer;