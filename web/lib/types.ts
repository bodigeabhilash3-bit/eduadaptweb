export type Stream = 'MPC';

export type SkillLevel = 'beginner' | 'intermediate' | 'advanced';

export interface Student {
  id: string;
  name: string;
  email: string;
  phone: string;
  stream: Stream;
  skillLevel?: SkillLevel;
  registeredAt: Date;
}

export interface Question {
  id: string;
  subject: string;
  stream: Stream;
  text: string;
  options: string[];
  correctAnswer: number;
  difficulty: SkillLevel;
}

export interface QuizResult {
  studentId: string;
  stream: Stream;
  answers: Record<string, number>;
  score: number;
  totalQuestions: number;
  skillLevel: SkillLevel;
  subjectScores: Record<string, { correct: number; total: number }>;
  completedAt: Date;
}

export interface StudyPlan {
  studentId: string;
  skillLevel: SkillLevel;
  weeklySchedule: WeeklySchedule;
  focusAreas: FocusArea[];
  estimatedDuration: string;
}

export interface WeeklySchedule {
  monday: DaySchedule;
  tuesday: DaySchedule;
  wednesday: DaySchedule;
  thursday: DaySchedule;
  friday: DaySchedule;
  saturday: DaySchedule;
  sunday: DaySchedule;
}

export interface DaySchedule {
  subjects: SubjectSlot[];
  totalHours: number;
}

export interface SubjectSlot {
  subject: string;
  topic: string;
  duration: number; // in minutes
  time: string;
}

export interface FocusArea {
  subject: string;
  topics: string[];
  priority: 'high' | 'medium' | 'low';
  currentScore: number;
  targetScore: number;
}

export interface Progress {
  studentId: string;
  overallProgress: number;
  subjectProgress: Record<string, SubjectProgress>;
  streakDays: number;
  totalStudyHours: number;
  completedTopics: number;
  totalTopics: number;
  weeklyGoalMet: boolean;
}

export interface SubjectProgress {
  subject: string;
  progress: number;
  completedTopics: number;
  totalTopics: number;
  averageScore: number;
  weakTopics: string[];
  strongTopics: string[];
}

export interface Topic {
  id: string;
  subject: string;
  stream: Stream;
  title: string;
  description: string;
  videoUrl?: string;
  duration: number; // in minutes
  difficulty: SkillLevel;
  isCompleted?: boolean;
  isWeak?: boolean;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export interface Feedback {
  studentId: string;
  rating: number;
  comment: string;
  suggestions: string[];
  submittedAt: Date;
}
