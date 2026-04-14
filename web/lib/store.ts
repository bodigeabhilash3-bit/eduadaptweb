import { create } from 'zustand';
import type {
  DailyTestResponse,
  SubmitTestResponse,
  StudyPlanResponse,
  PerformanceSnapshot,
} from './api';

// ─── Types ─────────────────────────────────────────────────────────────────

export type Stream = 'MPC';

export type Mood = 'focused' | 'okay' | 'confused' | 'tired' | 'frustrated';

export interface AppStudent {
  /** Backend database ID */
  id: number;
  name: string;
  email: string;
  phone: string;
  stream: Stream;
  created_at: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

// ─── Store ─────────────────────────────────────────────────────────────────

interface AppState {
  // Current view
  currentView: 'home' | 'register' | 'quiz' | 'progress' | 'topics' | 'chat';
  setCurrentView: (view: AppState['currentView']) => void;

  // Student (from backend)
  student: AppStudent | null;
  setStudent: (student: AppStudent) => void;

  // Mood system
  mood: Mood;
  setMood: (mood: Mood) => void;
  lastMoodCheck: number; // timestamp of last mood check
  setLastMoodCheck: (t: number) => void;

  // Wrong-answer streak (for struggle detection)
  wrongStreak: number;
  incrementWrongStreak: () => void;
  resetWrongStreak: () => void;

  // Daily test from backend
  dailyTest: DailyTestResponse | null;
  setDailyTest: (test: DailyTestResponse | null) => void;

  // Test results from backend evaluation
  testResults: SubmitTestResponse | null;
  setTestResults: (results: SubmitTestResponse | null) => void;

  // Performance snapshot from backend
  performance: PerformanceSnapshot | null;
  setPerformance: (p: PerformanceSnapshot | null) => void;

  // 7-day study plan from backend
  studyPlan: StudyPlanResponse | null;
  setStudyPlan: (plan: StudyPlanResponse | null) => void;

  // Chat
  chatMessages: ChatMessage[];
  addChatMessage: (message: ChatMessage) => void;
  clearChat: () => void;

  // Reset
  reset: () => void;
}

const initialState = {
  currentView: 'home' as const,
  student: null,
  mood: 'okay' as Mood,
  lastMoodCheck: 0,
  wrongStreak: 0,
  dailyTest: null,
  testResults: null,
  performance: null,
  studyPlan: null,
  chatMessages: [] as ChatMessage[],
};

// Clear any stale localStorage from previous sessions
if (typeof window !== 'undefined') {
  localStorage.removeItem('eduadapt-storage');
}

export const useAppStore = create<AppState>()(
  (set) => ({
    ...initialState,

    setCurrentView: (view) => set({ currentView: view }),
    setStudent: (student) => set({ student }),
    setMood: (mood) => set({ mood }),
    setLastMoodCheck: (t) => set({ lastMoodCheck: t }),
    incrementWrongStreak: () =>
      set((state) => ({ wrongStreak: state.wrongStreak + 1 })),
    resetWrongStreak: () => set({ wrongStreak: 0 }),
    setDailyTest: (test) => set({ dailyTest: test }),
    setTestResults: (results) => set({ testResults: results }),
    setPerformance: (p) => set({ performance: p }),
    setStudyPlan: (plan) => set({ studyPlan: plan }),

    addChatMessage: (message) =>
      set((state) => ({
        chatMessages: [...state.chatMessages, message],
      })),

    clearChat: () => set({ chatMessages: [] }),

    reset: () => set(initialState),
  })
);
