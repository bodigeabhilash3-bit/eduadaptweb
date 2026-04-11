'use client';

import { useState, useEffect, useRef } from 'react';
import {
  CheckCircle2,
  XCircle,
  Clock,
  ChevronRight,
  AlertCircle,
  Sparkles,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useAppStore } from '@/lib/store';
import {
  getDailyTest,
  submitTest,
  type BackendQuestion,
  type SubmitTestResponse,
} from '@/lib/api';
import { cn } from '@/lib/utils';

export function QuizSection() {
  const {
    student,
    setCurrentView,
    setTestResults,
    setDailyTest,
    dailyTest,
    testResults,
    mood,
    incrementWrongStreak,
    resetWrongStreak,
  } = useAppStore();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [questions, setQuestions] = useState<BackendQuestion[]>([]);
  const [testId, setTestId] = useState<number | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [timePerQuestion, setTimePerQuestion] = useState<Record<string, number>>({});
  const [showResult, setShowResult] = useState(false);
  const [timeLeft, setTimeLeft] = useState(900);
  const [answerAnimation, setAnswerAnimation] = useState<string | null>(null);
  const questionStartTime = useRef<number>(Date.now());

  // Load test from backend — now includes mood parameter
  useEffect(() => {
    if (!student) return;

    if (testResults) {
      setShowResult(true);
      setLoading(false);
      return;
    }

    setShowResult(false);
    setError(null);
    setCurrentQuestionIndex(0);
    setSelectedAnswer(null);
    setAnswers({});
    setTimePerQuestion({});
    setTimeLeft(900);
    questionStartTime.current = Date.now();

    const loadTest = async () => {
      try {
        setLoading(true);
        const test = await getDailyTest(student.id, 12, mood);
        setQuestions(test.questions);
        setTestId(test.test_id);
        setDailyTest(test);
        questionStartTime.current = Date.now();
      } catch (err: any) {
        setError(err.message || 'Failed to load test. Is the backend running?');
      } finally {
        setLoading(false);
      }
    };

    loadTest();
  }, [student, testResults, setDailyTest, mood]);

  // Timer
  useEffect(() => {
    if (showResult || loading || timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          handleSubmitQuiz();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [showResult, loading, timeLeft]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs
      .toString()
      .padStart(2, '0')}`;
  };

  const currentQuestion = questions[currentQuestionIndex];
  const progressPercentage =
    questions.length > 0
      ? ((currentQuestionIndex + 1) / questions.length) * 100
      : 0;

  const handleSelectAnswer = (optionText: string) => {
    setSelectedAnswer(optionText);
    setAnswerAnimation(optionText);
    setTimeout(() => setAnswerAnimation(null), 300);
  };

  const recordTime = () => {
    if (currentQuestion) {
      const elapsed = (Date.now() - questionStartTime.current) / 1000;
      setTimePerQuestion((prev) => ({
        ...prev,
        [String(currentQuestion.id)]: elapsed,
      }));
    }
  };

  const handleNextQuestion = () => {
    if (selectedAnswer === null || !currentQuestion) return;

    recordTime();

    const newAnswers = {
      ...answers,
      [String(currentQuestion.id)]: selectedAnswer,
    };
    setAnswers(newAnswers);
    setSelectedAnswer(null);
    questionStartTime.current = Date.now();

    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
    } else {
      doSubmit(newAnswers);
    }
  };

  const handleSubmitQuiz = () => {
    recordTime();
    const finalAnswers =
      selectedAnswer !== null && currentQuestion
        ? { ...answers, [String(currentQuestion.id)]: selectedAnswer }
        : answers;
    doSubmit(finalAnswers);
  };

  const doSubmit = async (finalAnswers: Record<string, string>) => {
    if (!student || testId === null) return;

    setSubmitting(true);
    try {
      const result = await submitTest({
        student_id: student.id,
        test_id: testId,
        answers: finalAnswers,
        time_per_question: timePerQuestion,
      });

      // Streak detection for AI Pet
      let streak = 0;
      for (const r of result.results) {
        if (!r.is_correct) {
          streak++;
          if (streak >= 3) incrementWrongStreak();
        } else {
          streak = 0;
          resetWrongStreak();
        }
      }

      setTestResults(result);
      setShowResult(true);
    } catch (err: any) {
      setError(err.message || 'Failed to submit test');
    } finally {
      setSubmitting(false);
    }
  };

  if (!student) return null;

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md glass-card border-0">
          <CardContent className="pt-8 pb-8 text-center space-y-4">
            <div className="relative mx-auto w-16 h-16">
              <Loader2 className="h-16 w-16 animate-spin text-teal-400" />
              <div className="absolute inset-0 h-16 w-16 rounded-full bg-teal-400/10 animate-ping" />
            </div>
            <p className="text-lg font-medium">Preparing your adaptive test...</p>
            <p className="text-sm text-muted-foreground">
              Generating questions tailored to your {mood} mood
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Error state
  if (error && !showResult) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md glass-card border-0">
          <CardContent className="pt-6 text-center space-y-4">
            <AlertCircle className="h-12 w-12 text-red-400 mx-auto" />
            <p className="text-red-400 font-medium">Error loading test</p>
            <p className="text-sm text-muted-foreground">{error}</p>
            <Button
              onClick={() => window.location.reload()}
              className="bg-gradient-to-r from-teal-500 to-purple-600 text-white border-0"
            >
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Submitting state
  if (submitting) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md glass-card border-0">
          <CardContent className="pt-8 pb-8 text-center space-y-4">
            <div className="relative mx-auto w-16 h-16">
              <Loader2 className="h-16 w-16 animate-spin text-purple-400" />
            </div>
            <p className="text-lg font-medium">Evaluating your answers...</p>
            <p className="text-sm text-muted-foreground">
              Analyzing performance and updating your study plan
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Results view
  if (showResult && testResults) {
    const scorePercent = Math.round(testResults.score * 100);

    // Group results by topic
    const topicScores: Record<string, { correct: number; total: number }> = {};
    for (const r of testResults.results) {
      if (!topicScores[r.topic]) topicScores[r.topic] = { correct: 0, total: 0 };
      topicScores[r.topic].total += 1;
      if (r.is_correct) topicScores[r.topic].correct += 1;
    }

    const skillLabel =
      scorePercent >= 80
        ? 'Subject Master'
        : scorePercent >= 50
        ? 'Knowledge Explorer'
        : 'Foundation Builder';

    const skillGradient =
      scorePercent >= 80
        ? 'from-teal-500 to-emerald-500'
        : scorePercent >= 50
        ? 'from-purple-500 to-blue-500'
        : 'from-amber-500 to-orange-500';

    return (
      <div className="min-h-screen py-8">
        <div className="container mx-auto px-4 max-w-4xl">
          <Card className="glass-card border-0 overflow-hidden">
            {/* Header gradient */}
            <div className={cn('p-8 text-center bg-gradient-to-br', skillGradient, 'bg-opacity-10')}>
              <div className="absolute inset-0 bg-gradient-to-br from-black/40 to-black/60" />
              <div className="relative">
                <div className={cn(
                  'mx-auto mb-4 inline-flex items-center gap-2 rounded-full px-6 py-2 text-lg font-medium glass'
                )}>
                  <Sparkles className="h-5 w-5 text-teal-400" />
                  <span className="gradient-text">{skillLabel}</span>
                </div>

                <h2 className="text-3xl font-bold mb-2 font-[family-name:var(--font-heading)]">
                  Assessment Complete!
                </h2>
                <p className="text-muted-foreground">
                  You scored {testResults.correct_count} out of{' '}
                  {testResults.total_questions} questions
                </p>

                <div className="mt-6 flex justify-center items-center gap-8">
                  <div className="text-center">
                    <p className="text-5xl font-bold gradient-text">
                      {scorePercent}%
                    </p>
                    <p className="text-sm text-muted-foreground">Overall Score</p>
                  </div>
                </div>
              </div>
            </div>

            <CardContent className="p-8">
              {/* Topic-wise Performance */}
              <div className="mb-8">
                <h3 className="text-lg font-semibold mb-4 font-[family-name:var(--font-heading)]">
                  Topic-wise Performance
                </h3>
                <div className="grid gap-4">
                  {Object.entries(topicScores).map(([topic, scores]) => {
                    const percentage = Math.round(
                      (scores.correct / scores.total) * 100
                    );
                    return (
                      <div key={topic} className="glass rounded-xl p-4 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-medium">{topic}</span>
                          <span className="text-sm text-muted-foreground">
                            {scores.correct}/{scores.total} correct (
                            {percentage}%)
                          </span>
                        </div>
                        <div className="h-2 rounded-full bg-white/5 overflow-hidden">
                          <div
                            className={cn(
                              'h-full rounded-full transition-all duration-1000',
                              percentage >= 70
                                ? 'bg-gradient-to-r from-teal-500 to-emerald-500'
                                : percentage >= 40
                                ? 'bg-gradient-to-r from-purple-500 to-blue-500'
                                : 'bg-gradient-to-r from-red-500 to-orange-500'
                            )}
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Coaching Feedback */}
              {testResults.coaching_feedback && (
                <div className="glass rounded-xl p-6 mb-8 glow-primary">
                  <div className="flex items-center gap-3 mb-2">
                    <Sparkles className="h-5 w-5 text-teal-400" />
                    <h3 className="font-semibold">Coaching Feedback</h3>
                  </div>
                  <p className="text-muted-foreground text-sm">
                    {testResults.coaching_feedback}
                  </p>
                </div>
              )}

              {/* Weak Topics */}
              {testResults.updated_weak_topics.length > 0 && (
                <div className="mb-8">
                  <h3 className="text-lg font-semibold mb-4 font-[family-name:var(--font-heading)]">
                    Focus Areas Identified
                  </h3>
                  <div className="grid sm:grid-cols-3 gap-4">
                    {testResults.updated_weak_topics.map((topic) => (
                      <div key={topic} className="glass rounded-xl p-4 card-hover">
                        <h4 className="font-semibold mb-1">{topic}</h4>
                        <p className="text-sm font-medium text-red-400">
                          Needs Improvement
                        </p>
                        <p className="text-xs text-muted-foreground mt-2">
                          Prioritized in your study plan
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Question Review */}
              <div className="mb-8">
                <h3 className="text-lg font-semibold mb-4 font-[family-name:var(--font-heading)]">
                  Question Review
                </h3>
                <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                  {testResults.results.map((r, i) => (
                    <div
                      key={r.question_id}
                      className={cn(
                        'rounded-xl p-4 transition-all',
                        r.is_correct
                          ? 'glass border-teal-500/20'
                          : 'glass border-red-500/20'
                      )}
                    >
                      <div className="flex items-start gap-3">
                        {r.is_correct ? (
                          <CheckCircle2 className="h-5 w-5 text-teal-400 shrink-0 mt-0.5" />
                        ) : (
                          <XCircle className="h-5 w-5 text-red-400 shrink-0 mt-0.5" />
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs bg-white/5 px-2 py-0.5 rounded-full">
                              {r.topic}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {r.difficulty}
                            </span>
                          </div>
                          {!r.is_correct && (
                            <div className="mt-2 text-sm space-y-1">
                              <p>
                                <span className="text-muted-foreground">
                                  Your answer:{' '}
                                </span>
                                <span className="text-red-400">
                                  {r.student_answer || '(not answered)'}
                                </span>
                              </p>
                              <p>
                                <span className="text-muted-foreground">
                                  Correct:{' '}
                                </span>
                                <span className="text-teal-400 font-medium">
                                  {r.correct_answer}
                                </span>
                              </p>
                              {r.explanation && (
                                <p className="text-muted-foreground text-xs mt-1 italic">
                                  {r.explanation}
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <Button
                  size="lg"
                  className="flex-1 gap-2 bg-gradient-to-r from-teal-500 to-purple-600 text-white border-0 shadow-lg"
                  onClick={() => setCurrentView('progress')}
                >
                  View Progress Dashboard
                  <ChevronRight className="h-5 w-5" />
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="flex-1 gap-2 glass border-white/10"
                  onClick={() => setCurrentView('topics')}
                >
                  View Study Plan
                  <ChevronRight className="h-5 w-5" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Quiz in-progress view
  const questionNumber = currentQuestionIndex + 1;
  const topicSet = new Set(questions.map((q) => q.topic));
  const topics = Array.from(topicSet);

  return (
    <div className="min-h-screen py-8">
      <div className="container mx-auto px-4 max-w-3xl">
        {/* Quiz Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold font-[family-name:var(--font-heading)]">
                <span className="gradient-text">Skill Assessment</span>
              </h1>
              <p className="text-muted-foreground">
                {student.stream} Stream — {currentQuestion?.topic}
              </p>
            </div>
            <div
              className={cn(
                'flex items-center gap-2 rounded-full px-4 py-2 font-mono text-lg glass',
                timeLeft < 300
                  ? 'text-red-400 border-red-500/20'
                  : 'text-teal-400 border-teal-500/20'
              )}
            >
              <Clock className="h-5 w-5" />
              {formatTime(timeLeft)}
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>
                Question {questionNumber} of {questions.length}
              </span>
              <span>{Math.round(progressPercentage)}% Complete</span>
            </div>
            <div className="h-2 rounded-full bg-white/5 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-teal-500 to-purple-600 transition-all duration-500"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
          </div>
        </div>

        {/* Question Card */}
        {currentQuestion && (
          <Card className="glass-card border-0 overflow-hidden">
            <div className="h-1 bg-gradient-to-r from-teal-500 via-purple-500 to-pink-500" />
            <CardHeader>
              <div className="flex items-center gap-2 mb-2">
                <span className="inline-flex items-center rounded-full bg-teal-500/10 px-3 py-1 text-xs font-medium text-teal-400">
                  {currentQuestion.topic}
                </span>
                <span className="inline-flex items-center rounded-full bg-white/5 px-3 py-1 text-xs font-medium text-muted-foreground">
                  {currentQuestion.difficulty}
                </span>
              </div>
              <CardTitle className="text-xl leading-relaxed">
                {currentQuestion.question_text}
              </CardTitle>
            </CardHeader>

            <CardContent className="space-y-3">
              {currentQuestion.options.map((option, index) => (
                <button
                  key={index}
                  onClick={() => handleSelectAnswer(option)}
                  className={cn(
                    'w-full flex items-center gap-4 rounded-xl border p-4 text-left transition-all duration-300',
                    selectedAnswer === option
                      ? 'border-teal-500/50 bg-teal-500/10 shadow-[0_0_20px_rgba(45,212,191,0.1)]'
                      : 'border-white/5 bg-white/[0.02] hover:border-white/10 hover:bg-white/[0.04]',
                    answerAnimation === option && 'scale-[1.02]'
                  )}
                >
                  <span
                    className={cn(
                      'flex h-10 w-10 shrink-0 items-center justify-center rounded-full font-semibold transition-all',
                      selectedAnswer === option
                        ? 'bg-gradient-to-br from-teal-500 to-purple-600 text-white'
                        : 'bg-white/5 text-muted-foreground'
                    )}
                  >
                    {String.fromCharCode(65 + index)}
                  </span>
                  <span className="font-medium">{option}</span>
                </button>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Navigation */}
        <div className="mt-6 flex justify-between">
          <Button
            variant="outline"
            onClick={handleSubmitQuiz}
            disabled={
              Object.keys(answers).length === 0 && selectedAnswer === null
            }
            className="glass border-white/10"
          >
            Submit Quiz
          </Button>

          <Button
            onClick={handleNextQuestion}
            disabled={selectedAnswer === null}
            className="gap-2 bg-gradient-to-r from-teal-500 to-purple-600 text-white border-0 shadow-lg"
          >
            {currentQuestionIndex < questions.length - 1
              ? 'Next Question'
              : 'Finish Quiz'}
            <ChevronRight className="h-5 w-5" />
          </Button>
        </div>

        {/* Topic Progress */}
        <div className="mt-8 grid grid-cols-3 gap-4">
          {topics.map((topic) => {
            const topicQuestions = questions.filter((q) => q.topic === topic);
            const answeredCount = topicQuestions.filter(
              (q) => answers[String(q.id)] !== undefined
            ).length;
            const isCurrent = topic === currentQuestion?.topic;

            return (
              <div
                key={topic}
                className={cn(
                  'glass rounded-xl p-4 transition-all duration-300',
                  isCurrent && 'ring-1 ring-teal-500/50 glow-primary'
                )}
              >
                <p className="font-medium text-sm">{topic}</p>
                <p className="text-xs text-muted-foreground">
                  {answeredCount}/{topicQuestions.length} answered
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
