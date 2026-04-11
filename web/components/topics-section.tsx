'use client';

import { useState, useEffect } from 'react';
import {
  BookOpen,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Calendar,
  ChevronRight,
  ChevronDown,
  Target,
  Zap,
  Loader2,
  AlertCircle,
  FileText,
  HelpCircle,
  Lightbulb,
  Play,
  ExternalLink,
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
  generateStudyPlan,
  type StudyPlanResponse,
  type StudyPlanDay,
  type PracticeTask,
} from '@/lib/api';
import { cn } from '@/lib/utils';
import { YOUTUBE_VIDEOS, type YouTubeVideo } from '@/lib/youtube-data';

const dayLabels: Record<number, string> = {
  1: 'Monday',
  2: 'Tuesday',
  3: 'Wednesday',
  4: 'Thursday',
  5: 'Friday',
  6: 'Saturday',
  7: 'Sunday',
};

const phaseLabels: Record<number, { label: string; gradient: string }> = {
  1: { label: 'Intensive Focus', gradient: 'from-red-500/20 to-red-500/5' },
  2: { label: 'Intensive Focus', gradient: 'from-red-500/20 to-red-500/5' },
  3: { label: 'Intensive Focus', gradient: 'from-red-500/20 to-red-500/5' },
  4: { label: 'Mixed Review', gradient: 'from-amber-500/20 to-amber-500/5' },
  5: { label: 'Mixed Review', gradient: 'from-amber-500/20 to-amber-500/5' },
  6: { label: 'Full Revision', gradient: 'from-teal-500/20 to-teal-500/5' },
  7: { label: 'Simulated Test', gradient: 'from-purple-500/20 to-purple-500/5' },
};

const resourceTypeIcons: Record<string, typeof FileText> = {
  notes: FileText,
  formula: Zap,
  tip: Lightbulb,
  concept: BookOpen,
};

function YouTubeEmbed({ video }: { video: YouTubeVideo }) {
  const [loaded, setLoaded] = useState(false);

  return (
    <div className="glass rounded-xl overflow-hidden card-hover">
      {!loaded ? (
        <button
          onClick={() => setLoaded(true)}
          className="relative w-full aspect-video bg-gradient-to-br from-red-500/10 to-red-500/5 flex items-center justify-center group"
        >
          <img
            src={`https://img.youtube.com/vi/${video.id}/mqdefault.jpg`}
            alt={video.title}
            className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:opacity-80 transition-opacity"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
          <div className="relative z-10 flex items-center justify-center h-14 w-14 rounded-full bg-red-500/90 group-hover:bg-red-500 group-hover:scale-110 transition-all shadow-xl">
            <Play className="h-7 w-7 text-white ml-1" fill="white" />
          </div>
          <div className="absolute bottom-3 left-3 right-3 z-10">
            <p className="text-sm font-medium text-white truncate">{video.title}</p>
            <p className="text-xs text-white/70">{video.channel} • {video.duration}</p>
          </div>
        </button>
      ) : (
        <div className="youtube-container">
          <iframe
            src={`https://www.youtube.com/embed/${video.id}?autoplay=1&rel=0`}
            title={video.title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      )}
    </div>
  );
}

function VideoCarousel({ topics }: { topics: string[] }) {
  const videos = topics.flatMap(t => YOUTUBE_VIDEOS[t] || []).slice(0, 4);

  if (videos.length === 0) return null;

  return (
    <div className="space-y-3">
      <h4 className="text-sm font-semibold text-teal-400 flex items-center gap-2">
        <Play className="h-4 w-4" />
        📺 Watch & Learn
      </h4>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {videos.map((video) => (
          <YouTubeEmbed key={video.id} video={video} />
        ))}
      </div>
    </div>
  );
}

export function TopicsSection() {
  const { student, studyPlan, setStudyPlan, setCurrentView } = useAppStore();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedDay, setExpandedDay] = useState<number | null>(1);
  const [completedTasks, setCompletedTasks] = useState<Set<string>>(new Set());
  const [showQuestions, setShowQuestions] = useState<string | null>(null);

  // Load study plan from backend
  useEffect(() => {
    if (!student) return;

    // If we already have a plan, use it
    if (studyPlan) {
      setLoading(false);
      return;
    }

    const load = async () => {
      try {
        setLoading(true);
        const plan = await generateStudyPlan(student.id);
        setStudyPlan(plan);
      } catch (err: any) {
        setError(err.message || 'Failed to generate study plan');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [student]);

  const handleRegenerate = async () => {
    if (!student) return;
    try {
      setLoading(true);
      setError(null);
      const plan = await generateStudyPlan(student.id);
      setStudyPlan(plan);
    } catch (err: any) {
      setError(err.message || 'Failed to regenerate plan');
    } finally {
      setLoading(false);
    }
  };

  if (!student) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="glass-card rounded-xl max-w-md p-6 text-center">
          <p className="text-muted-foreground mb-4">Please register first</p>
          <Button
            onClick={() => setCurrentView('register')}
            className="bg-gradient-to-r from-teal-500 to-purple-600 text-white border-0"
          >
            Register Now
          </Button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="glass-card rounded-xl max-w-md p-8 text-center space-y-4">
          <div className="relative mx-auto w-16 h-16">
            <Loader2 className="h-16 w-16 animate-spin text-teal-400" />
          </div>
          <p className="text-lg font-medium">
            Generating your personalized study plan...
          </p>
          <p className="text-sm text-muted-foreground">
            Analyzing your weak areas and building a 7-day schedule
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="glass-card rounded-xl max-w-md p-6 text-center space-y-4">
          <AlertCircle className="h-12 w-12 text-red-400 mx-auto" />
          <p className="text-red-400">{error}</p>
          <Button
            onClick={() => setCurrentView('quiz')}
            className="bg-gradient-to-r from-teal-500 to-purple-600 text-white border-0"
          >
            Take an Assessment First
          </Button>
        </div>
      </div>
    );
  }

  if (!studyPlan) return null;

  const totalTasks = studyPlan.plan.reduce(
    (sum, day) => sum + day.practice_tasks.length,
    0
  );
  const completedCount = completedTasks.size;
  const progressPercentage =
    totalTasks > 0 ? (completedCount / totalTasks) * 100 : 0;

  const handleToggleTask = (taskId: string) => {
    setCompletedTasks((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(taskId)) {
        newSet.delete(taskId);
      } else {
        newSet.add(taskId);
      }
      return newSet;
    });
  };

  return (
    <div className="min-h-screen py-8">
      <div className="container mx-auto px-4 max-w-6xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2 font-[family-name:var(--font-heading)]">
            <span className="gradient-text">Your 7-Day Study Plan</span>
          </h1>
          <p className="text-muted-foreground">{studyPlan.message}</p>
        </div>

        {/* Progress Overview */}
        <div className="glass rounded-xl p-6 mb-8 glow-primary">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-teal-500/20 to-purple-500/20 flex items-center justify-center">
                <Target className="h-8 w-8 text-teal-400" />
              </div>
              <div>
                <p className="text-2xl font-bold gradient-text">
                  {completedCount}/{totalTasks} Tasks
                </p>
                <p className="text-muted-foreground">Completed</p>
              </div>
            </div>
            <div className="w-full sm:w-64">
              <div className="h-3 rounded-full bg-white/5 overflow-hidden mb-2">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-teal-500 to-purple-600 transition-all duration-500"
                  style={{ width: `${progressPercentage}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground text-right">
                {Math.round(progressPercentage)}% Complete
              </p>
            </div>
          </div>

          {/* Weak Topics Addressed */}
          {studyPlan.weak_topics_addressed.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              <span className="text-xs text-muted-foreground">
                Targeting:
              </span>
              {studyPlan.weak_topics_addressed.map((topic) => (
                <span
                  key={topic}
                  className="text-xs bg-red-500/10 text-red-400 px-2 py-1 rounded-full"
                >
                  {topic}
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main: Day-by-day Plan */}
          <div className="lg:col-span-2 space-y-4">
            {studyPlan.plan.map((day) => {
              const isExpanded = expandedDay === day.day;
              const phase = phaseLabels[day.day] || phaseLabels[7];
              const dayTaskIds = day.practice_tasks.map(
                (_, i) => `day${day.day}-task${i}`
              );
              const dayCompleted = dayTaskIds.filter((id) =>
                completedTasks.has(id)
              ).length;

              return (
                <div
                  key={day.day}
                  className={cn(
                    'glass rounded-xl overflow-hidden transition-all duration-300',
                    isExpanded && 'ring-1 ring-teal-500/30 glow-primary'
                  )}
                >
                  {/* Day Header (clickable) */}
                  <button
                    className="w-full text-left p-5"
                    onClick={() =>
                      setExpandedDay(isExpanded ? null : day.day)
                    }
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div
                          className={cn(
                            'h-12 w-12 rounded-xl flex items-center justify-center text-lg font-bold transition-all',
                            dayCompleted === dayTaskIds.length &&
                              dayTaskIds.length > 0
                              ? 'bg-gradient-to-br from-teal-500 to-purple-600 text-white'
                              : 'bg-white/5 text-muted-foreground'
                          )}
                        >
                          {dayCompleted === dayTaskIds.length &&
                          dayTaskIds.length > 0 ? (
                            <CheckCircle2 className="h-6 w-6" />
                          ) : (
                            day.day
                          )}
                        </div>
                        <div>
                          <div className="text-lg font-semibold flex items-center gap-2">
                            Day {day.day} — {dayLabels[day.day] || `Day ${day.day}`}
                            <span
                              className={cn(
                                'text-xs px-2 py-0.5 rounded-full',
                                `bg-gradient-to-r ${phase.gradient}`,
                                'text-foreground'
                              )}
                            >
                              {phase.label}
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground flex items-center gap-2 mt-1">
                            <span>
                              Focus: {day.focus_topics.join(', ')}
                            </span>
                            <span>
                              · {dayCompleted}/{dayTaskIds.length} done
                            </span>
                          </p>
                        </div>
                      </div>
                      <ChevronDown
                        className={cn(
                          'h-5 w-5 text-muted-foreground transition-transform duration-300',
                          isExpanded && 'rotate-180'
                        )}
                      />
                    </div>
                  </button>

                  {/* Expanded Content */}
                  {isExpanded && (
                    <div className="px-5 pb-5 space-y-5">
                      {/* YouTube Videos */}
                      <VideoCarousel topics={day.focus_topics} />

                      {/* Study Resources */}
                      {day.study_resources && day.study_resources.length > 0 && (
                        <div className="space-y-3">
                          <h4 className="text-sm font-semibold text-purple-400 flex items-center gap-2">
                            <BookOpen className="h-4 w-4" />
                            Study Material
                          </h4>
                          {day.study_resources.map((resource, ri) => {
                            const Icon =
                              resourceTypeIcons[resource.resource_type] ||
                              FileText;
                            return (
                              <div
                                key={ri}
                                className="glass rounded-xl p-4"
                              >
                                <div className="flex items-start gap-3">
                                  <div className="h-8 w-8 rounded-lg bg-purple-500/10 flex items-center justify-center shrink-0 mt-0.5">
                                    <Icon className="h-4 w-4 text-purple-400" />
                                  </div>
                                  <div>
                                    <div className="flex items-center gap-2">
                                      <p className="font-medium text-sm">
                                        {resource.title}
                                      </p>
                                      <span className="text-xs bg-white/5 px-2 py-0.5 rounded-full capitalize">
                                        {resource.resource_type}
                                      </span>
                                      <span className="text-xs text-muted-foreground">
                                        {resource.topic}
                                      </span>
                                    </div>
                                    <p className="text-sm text-muted-foreground mt-1 whitespace-pre-line">
                                      {resource.content}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {/* Practice Tasks */}
                      <div className="space-y-3">
                        <h4 className="text-sm font-semibold text-amber-400 flex items-center gap-2">
                          <Zap className="h-4 w-4" />
                          Practice Tasks
                        </h4>
                        {day.practice_tasks.map((task, ti) => {
                          const taskId = `day${day.day}-task${ti}`;
                          const isDone = completedTasks.has(taskId);
                          const hasQuestions =
                            task.content_questions &&
                            task.content_questions.length > 0;
                          const isQuestionsShown =
                            showQuestions === taskId;

                          return (
                            <div
                              key={ti}
                              className={cn(
                                'glass rounded-xl p-4 transition-all duration-300',
                                isDone && 'opacity-60'
                              )}
                            >
                              <div className="flex items-start gap-3">
                                <button
                                  onClick={() => handleToggleTask(taskId)}
                                  className={cn(
                                    'h-7 w-7 shrink-0 rounded-md flex items-center justify-center transition-all mt-0.5',
                                    isDone
                                      ? 'bg-gradient-to-br from-teal-500 to-purple-600 text-white'
                                      : 'bg-white/5 hover:bg-white/10'
                                  )}
                                >
                                  {isDone && (
                                    <CheckCircle2 className="h-4 w-4" />
                                  )}
                                </button>
                                <div className="flex-1 min-w-0">
                                  <p
                                    className={cn(
                                      'font-medium text-sm',
                                      isDone && 'line-through'
                                    )}
                                  >
                                    {task.task}
                                  </p>
                                  <div className="flex items-center gap-3 mt-2 flex-wrap">
                                    <span className="text-xs bg-white/5 px-2 py-0.5 rounded-full">
                                      {task.topic}
                                    </span>
                                    {task.question_count && (
                                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                                        <HelpCircle className="h-3 w-3" />
                                        {task.question_count} questions
                                      </span>
                                    )}
                                    {task.difficulty_focus && (
                                      <span className="text-xs text-muted-foreground">
                                        {task.difficulty_focus} difficulty
                                      </span>
                                    )}
                                  </div>

                                  {/* Embedded Questions */}
                                  {hasQuestions && (
                                    <div className="mt-3">
                                      <button
                                        onClick={() =>
                                          setShowQuestions(
                                            isQuestionsShown
                                              ? null
                                              : taskId
                                          )
                                        }
                                        className="text-xs text-teal-400 font-medium hover:text-teal-300 flex items-center gap-1 transition-colors"
                                      >
                                        <ChevronRight
                                          className={cn(
                                            'h-3 w-3 transition-transform',
                                            isQuestionsShown &&
                                              'rotate-90'
                                          )}
                                        />
                                        {isQuestionsShown
                                          ? 'Hide'
                                          : 'Show'}{' '}
                                        {task.content_questions.length}{' '}
                                        practice questions
                                      </button>
                                      {isQuestionsShown && (
                                        <div className="mt-2 space-y-2">
                                          {task.content_questions.map(
                                            (q, qi) => (
                                              <div
                                                key={qi}
                                                className="glass rounded-lg p-3 text-sm"
                                              >
                                                <p className="font-medium mb-2">
                                                  {qi + 1}.{' '}
                                                  {q.question_text}
                                                </p>
                                                <div className="grid grid-cols-2 gap-1">
                                                  {q.options.map(
                                                    (opt, oi) => (
                                                      <p
                                                        key={oi}
                                                        className={cn(
                                                          'text-xs px-2 py-1 rounded',
                                                          opt ===
                                                            q.answer
                                                            ? 'bg-teal-500/10 text-teal-400 font-medium'
                                                            : 'text-muted-foreground'
                                                        )}
                                                      >
                                                        {String.fromCharCode(
                                                          65 + oi
                                                        )}
                                                        . {opt}
                                                      </p>
                                                    )
                                                  )}
                                                </div>
                                              </div>
                                            )
                                          )}
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Test Recommendation */}
                      <div className="glass rounded-xl p-4 border-purple-500/20">
                        <p className="text-sm font-medium flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-purple-400" />
                          Today&apos;s Test Recommendation
                        </p>
                        <p className="text-sm text-muted-foreground mt-1">
                          {day.test_recommendation}
                        </p>
                        <Button
                          size="sm"
                          className="mt-3 gap-2 bg-gradient-to-r from-teal-500 to-purple-600 text-white border-0"
                          onClick={() => {
                            // Clear old test results so a new test loads
                            useAppStore.getState().setTestResults(null);
                            useAppStore.getState().setDailyTest(null);
                            setCurrentView('quiz');
                          }}
                        >
                          Take Test Now
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Plan Overview */}
            <div className="glass rounded-xl p-6 glow-secondary">
              <div className="flex items-center gap-2 mb-4">
                <Calendar className="h-5 w-5 text-purple-400" />
                <h3 className="font-semibold">Plan Overview</h3>
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                7-day personalized schedule
              </p>
              <div className="space-y-2">
                {studyPlan.plan.map((day) => {
                  const dayTaskIds = day.practice_tasks.map(
                    (_, i) => `day${day.day}-task${i}`
                  );
                  const dayDone = dayTaskIds.filter((id) =>
                    completedTasks.has(id)
                  ).length;
                  const allDone =
                    dayDone === dayTaskIds.length && dayTaskIds.length > 0;

                  return (
                    <button
                      key={day.day}
                      onClick={() => setExpandedDay(day.day)}
                      className={cn(
                        'w-full flex items-center justify-between py-2 px-3 rounded-lg transition-all text-left',
                        expandedDay === day.day
                          ? 'bg-teal-500/10 border border-teal-500/20'
                          : 'hover:bg-white/5 border border-transparent'
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={cn(
                            'h-8 w-8 rounded-lg flex items-center justify-center text-sm font-bold',
                            allDone
                              ? 'bg-gradient-to-br from-teal-500 to-purple-600 text-white'
                              : 'bg-white/5 text-muted-foreground'
                          )}
                        >
                          {allDone ? (
                            <CheckCircle2 className="h-4 w-4" />
                          ) : (
                            day.day
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-sm">
                            Day {day.day}
                          </p>
                          <p className="text-xs text-muted-foreground truncate max-w-32">
                            {day.focus_topics.join(', ')}
                          </p>
                        </div>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {dayDone}/{dayTaskIds.length}
                      </span>
                    </button>
                  );
                })}

                <Button
                  variant="outline"
                  className="w-full mt-2 glass border-white/10 hover:bg-white/5"
                  onClick={handleRegenerate}
                  disabled={loading}
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : null}
                  Regenerate Plan
                </Button>
              </div>
            </div>

            {/* Weak Areas */}
            {studyPlan.weak_topics_addressed.length > 0 && (
              <div className="glass rounded-xl p-6">
                <div className="flex items-center gap-2 mb-4">
                  <AlertTriangle className="h-5 w-5 text-red-400" />
                  <h3 className="font-semibold">Weak Areas Targeted</h3>
                </div>
                <div className="space-y-2">
                  {studyPlan.weak_topics_addressed.map((topic) => (
                    <div
                      key={topic}
                      className="flex items-center gap-2 text-sm"
                    >
                      <div className="h-2 w-2 rounded-full bg-red-400" />
                      {topic}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Quick Video Access */}
            <div className="glass rounded-xl p-6">
              <div className="flex items-center gap-2 mb-4">
                <Play className="h-5 w-5 text-teal-400" />
                <h3 className="font-semibold">Quick Videos</h3>
              </div>
              <div className="space-y-2">
                {['Mathematics', 'Physics', 'Chemistry'].map((subject) => {
                  const count = YOUTUBE_VIDEOS[subject]?.length || 0;
                  return (
                    <div key={subject} className="flex items-center justify-between text-sm">
                      <span>{subject}</span>
                      <span className="text-xs text-muted-foreground">{count} videos</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
