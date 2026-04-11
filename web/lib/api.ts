/**
 * API Client — centralized backend communication layer.
 *
 * All calls to the FastAPI backend go through this module.
 * Base URL is configurable via NEXT_PUBLIC_API_URL env var.
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

// ─── Helper ────────────────────────────────────────────────────────────────

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const url = `${API_BASE}${path}`;
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json', ...options?.headers },
    ...options,
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`API ${res.status}: ${body}`);
  }
  return res.json() as Promise<T>;
}

// ─── Types matching backend schemas ────────────────────────────────────────

export interface BackendStudent {
  id: number;
  name: string;
  email: string | null;
  phone: string | null;
  stream: string | null;
  created_at: string;
}

export interface BackendQuestion {
  id: number;
  question_text: string;
  options: string[];
  topic: string;
  difficulty: string;
}

export interface BackendQuestionWithAnswer extends BackendQuestion {
  answer: string;
}

export interface DailyTestResponse {
  test_id: number;
  student_id: number;
  total_questions: number;
  questions: BackendQuestion[];
}

export interface QuestionResult {
  question_id: number;
  topic: string;
  difficulty: string;
  is_correct: boolean;
  student_answer: string;
  correct_answer: string;
  explanation: string | null;
}

export interface SubmitTestResponse {
  test_id: number;
  student_id: number;
  score: number;
  total_questions: number;
  correct_count: number;
  results: QuestionResult[];
  updated_weak_topics: string[];
  coaching_feedback: string;
}

export interface SubmitTestRequest {
  student_id: number;
  test_id: number;
  answers: Record<string, string>;
  time_per_question?: Record<string, number>;
}

export interface TopicInsight {
  topic: string;
  accuracy: number;
  avg_time: number;
  total_questions: number;
  correct: number;
  incorrect: number;
}

export interface DifficultyInsight {
  difficulty: string;
  accuracy: number;
  total_questions: number;
  correct: number;
}

export interface AnalysisResponse {
  student_id: number;
  overall_accuracy: number;
  total_questions: number;
  topic_insights: TopicInsight[];
  difficulty_insights: DifficultyInsight[];
  weak_topics: string[];
  weak_areas: { topic: string; difficulty: string | null; accuracy: number }[];
  coaching_feedback: string;
}

export interface StudyResource {
  topic: string;
  title: string;
  content: string;
  resource_type: string;
}

export interface PracticeTask {
  task: string;
  topic: string;
  question_count: number | null;
  difficulty_focus: string | null;
  content_questions: BackendQuestionWithAnswer[];
}

export interface StudyPlanDay {
  day: number;
  focus_topics: string[];
  practice_tasks: PracticeTask[];
  test_recommendation: string;
  study_resources: StudyResource[];
}

export interface StudyPlanResponse {
  student_id: number;
  plan: StudyPlanDay[];
  weak_topics_addressed: string[];
  message: string;
}

export interface PerformanceSnapshot {
  student_id: number;
  weak_topics: string[];
  overall_accuracy: number;
  total_questions_attempted: number;
  topic_accuracies: Record<string, number>;
  difficulty_accuracies: Record<string, number>;
  last_updated: string | null;
}

// ─── Student APIs ──────────────────────────────────────────────────────────

export async function createStudent(data: {
  name: string;
  email?: string;
  phone?: string;
  stream?: string;
}): Promise<BackendStudent> {
  return apiFetch<BackendStudent>('/students', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function getStudents(): Promise<BackendStudent[]> {
  return apiFetch<BackendStudent[]>('/students');
}

export async function getStudentPerformance(
  studentId: number
): Promise<PerformanceSnapshot> {
  return apiFetch<PerformanceSnapshot>(
    `/students/${studentId}/performance`
  );
}

// ─── Test APIs ─────────────────────────────────────────────────────────────

export async function getDailyTest(
  studentId: number,
  numQuestions: number = 12,
  mood: string = 'okay'
): Promise<DailyTestResponse> {
  return apiFetch<DailyTestResponse>(
    `/daily-test?student_id=${studentId}&num_questions=${numQuestions}&mood=${mood}`
  );
}

export async function submitTest(
  request: SubmitTestRequest
): Promise<SubmitTestResponse> {
  return apiFetch<SubmitTestResponse>('/submit-test', {
    method: 'POST',
    body: JSON.stringify(request),
  });
}

// ─── Analysis API ──────────────────────────────────────────────────────────

export async function analyzePerformance(data: {
  student_id: number;
  test_data: {
    question_id: number;
    topic: string;
    difficulty: string;
    is_correct: boolean;
    time_taken: number;
  }[];
}): Promise<AnalysisResponse> {
  return apiFetch<AnalysisResponse>('/analyze', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

// ─── Study Plan API ────────────────────────────────────────────────────────

export async function generateStudyPlan(
  studentId: number
): Promise<StudyPlanResponse> {
  return apiFetch<StudyPlanResponse>('/generate-plan', {
    method: 'POST',
    body: JSON.stringify({ student_id: studentId }),
  });
}

// ─── Question Bank API ─────────────────────────────────────────────────────

export async function getQuestions(params?: {
  topic?: string;
  difficulty?: string;
  limit?: number;
}): Promise<BackendQuestionWithAnswer[]> {
  const search = new URLSearchParams();
  if (params?.topic) search.set('topic', params.topic);
  if (params?.difficulty) search.set('difficulty', params.difficulty);
  if (params?.limit) search.set('limit', String(params.limit));
  const qs = search.toString();
  return apiFetch<BackendQuestionWithAnswer[]>(
    `/questions${qs ? '?' + qs : ''}`
  );
}

export async function getQuestionCount(): Promise<{ total_questions: number }> {
  return apiFetch<{ total_questions: number }>('/questions/count');
}

// ─── Mood APIs ─────────────────────────────────────────────────────────────

export interface MoodResponse {
  student_id: number;
  mood: string;
  message: string;
}

export async function updateMood(
  studentId: number,
  mood: string,
  context?: string
): Promise<MoodResponse> {
  return apiFetch<MoodResponse>('/mood', {
    method: 'POST',
    body: JSON.stringify({ student_id: studentId, mood, context }),
  });
}

export async function getMood(studentId: number): Promise<MoodResponse> {
  return apiFetch<MoodResponse>(`/mood/${studentId}`);
}

