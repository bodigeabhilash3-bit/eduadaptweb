'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAppStore, type Mood } from '@/lib/store';
import { updateMood } from '@/lib/api';
import { getRandomVideo, type YouTubeVideo } from '@/lib/youtube-data';

const MOOD_EMOJIS: Record<Mood, string> = {
  focused: '🔥',
  okay: '😊',
  confused: '😕',
  tired: '😴',
  frustrated: '😤',
};

const MOOD_LABELS: Record<Mood, string> = {
  focused: 'Focused',
  okay: 'Doing Good',
  confused: 'Confused',
  tired: 'Tired',
  frustrated: 'Frustrated',
};

const MOOD_MESSAGES: Record<Mood, string[]> = {
  focused: [
    "You're crushing it! 🔥 Let's tackle harder problems!",
    "Amazing focus! Keep that energy going! ⚡",
    "On fire today! Ready for a challenge? 🚀",
  ],
  okay: [
    "You're doing great! Keep it up! 💪",
    "Steady progress wins the race! 🏆",
    "Nice work! Want to try something new? ✨",
  ],
  confused: [
    "That's totally okay! Let me simplify things 🌟",
    "Don't worry, we'll take it step by step 📖",
    "Let's watch a quick video to clear things up! 📺",
  ],
  tired: [
    "Let's take it easy! How about a fun video? 🎬",
    "Rest is important too! Quick break? ☕",
    "Shorter session today — quality over quantity! 🌙",
  ],
  frustrated: [
    "Hey, you've got this! Let's try easier ones first 🌈",
    "Everyone struggles sometimes. You're still learning! 💖",
    "Let's build some confidence with what you know! 🎯",
  ],
};

const PET_FACES: Record<Mood, string> = {
  focused: '🦊',
  okay: '🐱',
  confused: '🐶',
  tired: '🐨',
  frustrated: '🐼',
};

const IDLE_MESSAGES = [
  "Still there? I'm here if you need me! 👋",
  "Take your time — no rush! 🌿",
  "Need a hint? Just ask! 💡",
  "You've been quiet... want a video break? 📺",
];

export function AIPet() {
  const { student, mood, setMood, wrongStreak, resetWrongStreak, setLastMoodCheck } = useAppStore();
  const [isOpen, setIsOpen] = useState(false);
  const [showMoodPicker, setShowMoodPicker] = useState(false);
  const [message, setMessage] = useState('');
  const [isMinimized, setIsMinimized] = useState(false);
  const [showVideo, setShowVideo] = useState(false);
  const [videoSuggestion, setVideoSuggestion] = useState<YouTubeVideo | null>(null);
  const [idleTime, setIdleTime] = useState(0);
  const [showIdleMessage, setShowIdleMessage] = useState(false);
  const [animClass, setAnimClass] = useState('pet-bounce');

  // Get a random mood message
  const getMoodMessage = useCallback((m: Mood) => {
    const messages = MOOD_MESSAGES[m];
    return messages[Math.floor(Math.random() * messages.length)];
  }, []);

  // Show initial greeting
  useEffect(() => {
    if (student) {
      const timer = setTimeout(() => {
        setMessage(`Hi ${student.name}! 👋 I'm your study buddy! How are you feeling today?`);
        setIsOpen(true);
        setTimeout(() => setShowMoodPicker(true), 1000);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [student]);

  // Idle detection
  useEffect(() => {
    if (!student || isMinimized) return;

    const interval = setInterval(() => {
      setIdleTime(prev => prev + 1);
    }, 60000); // every minute

    const resetIdle = () => setIdleTime(0);
    window.addEventListener('mousemove', resetIdle);
    window.addEventListener('keydown', resetIdle);
    window.addEventListener('click', resetIdle);

    return () => {
      clearInterval(interval);
      window.removeEventListener('mousemove', resetIdle);
      window.removeEventListener('keydown', resetIdle);
      window.removeEventListener('click', resetIdle);
    };
  }, [student, isMinimized]);

  // Show idle message after 2 minutes
  useEffect(() => {
    if (idleTime >= 2 && !showIdleMessage) {
      const msg = IDLE_MESSAGES[Math.floor(Math.random() * IDLE_MESSAGES.length)];
      setMessage(msg);
      setShowIdleMessage(true);
      setIsOpen(true);
      setAnimClass('pet-wave');
      setTimeout(() => setAnimClass('pet-bounce'), 2000);
    }
    if (idleTime < 2) {
      setShowIdleMessage(false);
    }
  }, [idleTime, showIdleMessage]);

  // Struggle detection — 3 wrong answers in a row
  useEffect(() => {
    if (wrongStreak >= 3) {
      const video = getRandomVideo();
      setVideoSuggestion(video);
      setMessage("Hey, let's take a breather! 🌈 How about watching a quick video to refresh?");
      setShowVideo(true);
      setIsOpen(true);
      setAnimClass('pet-pulse');
      resetWrongStreak();
    }
  }, [wrongStreak, resetWrongStreak]);

  const handleMoodSelect = async (selectedMood: Mood) => {
    setMood(selectedMood);
    setLastMoodCheck(Date.now());
    setShowMoodPicker(false);
    setAnimClass('pet-wave');
    setTimeout(() => setAnimClass('pet-bounce'), 1500);

    const msg = getMoodMessage(selectedMood);
    setMessage(msg);

    // Persist to backend
    if (student) {
      try {
        await updateMood(student.id, selectedMood, 'pet');
      } catch {
        // Silently fail — mood is still stored locally
      }
    }

    // If confused/tired, suggest a video
    if (selectedMood === 'confused' || selectedMood === 'tired') {
      setTimeout(() => {
        const video = getRandomVideo();
        setVideoSuggestion(video);
        setShowVideo(true);
      }, 2000);
    }
  };

  if (!student || isMinimized) {
    return (
      <button
        onClick={() => setIsMinimized(false)}
        className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full 
                   bg-gradient-to-br from-teal-500 to-purple-600 text-2xl shadow-lg 
                   hover:scale-110 transition-transform pet-glow"
        title="Open Study Buddy"
      >
        {PET_FACES[mood]}
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
      {/* Chat Bubble */}
      {isOpen && (
        <div className="glass-strong rounded-2xl p-4 max-w-xs animate-in fade-in slide-in-from-bottom-4 duration-300 shadow-2xl">
          <p className="text-sm text-foreground leading-relaxed">{message}</p>

          {/* Mood Picker */}
          {showMoodPicker && (
            <div className="mt-3 space-y-2">
              <p className="text-xs text-muted-foreground font-medium">How are you feeling?</p>
              <div className="flex gap-2">
                {(Object.keys(MOOD_EMOJIS) as Mood[]).map((m) => (
                  <button
                    key={m}
                    onClick={() => handleMoodSelect(m)}
                    className={`flex flex-col items-center gap-1 rounded-xl px-2 py-2 transition-all
                      hover:bg-white/10 hover:scale-110 ${mood === m ? 'bg-white/10 ring-1 ring-primary' : ''}`}
                    title={MOOD_LABELS[m]}
                  >
                    <span className="text-xl">{MOOD_EMOJIS[m]}</span>
                    <span className="text-[10px] text-muted-foreground">{MOOD_LABELS[m]}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Video Suggestion */}
          {showVideo && videoSuggestion && (
            <div className="mt-3 space-y-2">
              <p className="text-xs text-muted-foreground font-medium">📺 Recommended Video</p>
              <a
                href={`https://youtube.com/watch?v=${videoSuggestion.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="block rounded-lg bg-white/5 p-3 hover:bg-white/10 transition-colors"
              >
                <p className="text-sm font-medium text-foreground">{videoSuggestion.title}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {videoSuggestion.channel} • {videoSuggestion.duration}
                </p>
              </a>
              <button
                onClick={() => setShowVideo(false)}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                Dismiss
              </button>
            </div>
          )}

          {/* Quick Actions */}
          {!showMoodPicker && !showVideo && (
            <div className="mt-3 flex gap-2">
              <button
                onClick={() => setShowMoodPicker(true)}
                className="text-xs bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded-lg transition-colors"
              >
                Update Mood
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                Close
              </button>
            </div>
          )}
        </div>
      )}

      {/* Pet Avatar */}
      <button
        onClick={() => {
          setIsOpen(!isOpen);
          if (!isOpen) {
            setShowMoodPicker(false);
            setShowVideo(false);
            setMessage(getMoodMessage(mood));
          }
        }}
        className={`relative flex h-16 w-16 items-center justify-center rounded-full
                   bg-gradient-to-br from-teal-500/20 to-purple-600/20
                   border border-white/10 shadow-2xl
                   hover:scale-110 transition-all cursor-pointer pet-glow ${animClass}`}
        title="Study Buddy"
      >
        <span className="text-3xl">{PET_FACES[mood]}</span>

        {/* Mood indicator dot */}
        <span className={`absolute -top-1 -right-1 flex h-6 w-6 items-center justify-center
                         rounded-full text-sm bg-gradient-to-br from-teal-500 to-purple-600 shadow-lg`}>
          {MOOD_EMOJIS[mood]}
        </span>

        {/* Minimize button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            setIsMinimized(true);
          }}
          className="absolute -top-2 -left-2 flex h-5 w-5 items-center justify-center 
                     rounded-full bg-white/10 text-xs text-muted-foreground hover:bg-white/20 transition-colors"
          title="Minimize"
        >
          −
        </button>
      </button>
    </div>
  );
}
