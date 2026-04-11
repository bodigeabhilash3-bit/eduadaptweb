'use client';

import { useState, useEffect } from 'react';
import {
  TrendingUp,
  BookOpen,
  Clock,
  Flame,
  Target,
  ChevronRight,
  Star,
  Send,
  CheckCircle2,
  Loader2,
  AlertCircle,
  Zap,
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
import { Textarea } from '@/components/ui/textarea';
import { useAppStore } from '@/lib/store';
import { getStudentPerformance, type PerformanceSnapshot } from '@/lib/api';
import { cn } from '@/lib/utils';

export function ProgressDashboard() {
  const { student, performance, setPerformance, setCurrentView, testResults } =
    useAppStore();
  const [feedback, setFeedback] = useState('');
  const [rating, setRating] = useState(0);
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load performance from backend
  useEffect(() => {
    if (!student) return;

    const load = async () => {
      try {
        setLoading(true);
        const perf = await getStudentPerformance(student.id);
        setPerformance(perf);
      } catch (err: any) {
        setError(err.message || 'Failed to load performance data');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [student, testResults, setPerformance]);

  if (!student) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md glass-card border-0">
          <CardContent className="pt-6 text-center">
            <p className="text-muted-foreground mb-4">
              Please complete the assessment first
            </p>
            <Button
              onClick={() => setCurrentView('quiz')}
              className="bg-gradient-to-r from-teal-500 to-purple-600 text-white border-0"
            >
              Take Assessment
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md glass-card border-0">
          <CardContent className="pt-8 pb-8 text-center space-y-4">
            <Loader2 className="h-12 w-12 animate-spin text-teal-400 mx-auto" />
            <p className="text-lg font-medium">Loading your progress...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md glass-card border-0">
          <CardContent className="pt-6 text-center space-y-4">
            <AlertCircle className="h-12 w-12 text-red-400 mx-auto" />
            <p className="text-red-400">{error}</p>
            <Button
              onClick={() => setCurrentView('quiz')}
              className="bg-gradient-to-r from-teal-500 to-purple-600 text-white border-0"
            >
              Take Assessment
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const perf = performance;
  const overallPct = perf ? Math.round(perf.overall_accuracy * 100) : 0;
  const totalAttempted = perf?.total_questions_attempted || 0;
  const topicAccuracies = perf?.topic_accuracies || {};
  const difficultyAccuracies = perf?.difficulty_accuracies || {};
  const weakTopics = perf?.weak_topics || [];
  const topics = Object.keys(topicAccuracies);

  const handleSubmitFeedback = () => {
    setFeedbackSubmitted(true);
    setTimeout(() => {
      setFeedback('');
      setRating(0);
    }, 3000);
  };

  const statCards = [
    {
      label: 'Overall Accuracy',
      value: `${overallPct}%`,
      icon: TrendingUp,
      gradient: 'from-teal-500/20 to-teal-500/5',
      glow: 'glow-primary',
      color: 'text-teal-400',
      hasProgress: true,
      progressValue: overallPct,
    },
    {
      label: 'Questions Attempted',
      value: totalAttempted,
      icon: BookOpen,
      gradient: 'from-purple-500/20 to-purple-500/5',
      glow: 'glow-secondary',
      color: 'text-purple-400',
      subtitle: 'Across all tests',
    },
    {
      label: 'Topics Covered',
      value: topics.length,
      icon: Zap,
      gradient: 'from-amber-500/20 to-amber-500/5',
      glow: 'glow-accent',
      color: 'text-amber-400',
      subtitle: 'Unique topics',
    },
    {
      label: 'Weak Areas',
      value: weakTopics.length,
      icon: Flame,
      gradient: weakTopics.length === 0 ? 'from-teal-500/20 to-teal-500/5' : 'from-red-500/20 to-red-500/5',
      glow: '',
      color: weakTopics.length === 0 ? 'text-teal-400' : 'text-red-400',
      subtitle: weakTopics.length === 0 ? 'Great work!' : 'Focus needed',
    },
  ];

  return (
    <div className="min-h-screen py-8">
      <div className="container mx-auto px-4 max-w-6xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2 font-[family-name:var(--font-heading)]">
            <span className="gradient-text">Progress Dashboard</span>
          </h1>
          <p className="text-muted-foreground">
            Track your learning journey and achievements
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {statCards.map((stat) => {
            const Icon = stat.icon;
            return (
              <div
                key={stat.label}
                className={cn(
                  'glass rounded-xl p-6 card-hover',
                  stat.glow
                )}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">
                      {stat.label}
                    </p>
                    <p className={cn('text-3xl font-bold', stat.color)}>
                      {stat.value}
                    </p>
                  </div>
                  <div className={cn(
                    'h-12 w-12 rounded-xl flex items-center justify-center',
                    `bg-gradient-to-br ${stat.gradient}`
                  )}>
                    <Icon className={cn('h-6 w-6', stat.color)} />
                  </div>
                </div>
                {stat.hasProgress && (
                  <div className="mt-4 h-2 rounded-full bg-white/5 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-teal-500 to-emerald-500 transition-all duration-1000"
                      style={{ width: `${stat.progressValue}%` }}
                    />
                  </div>
                )}
                {stat.subtitle && (
                  <p className="text-xs text-muted-foreground mt-4">
                    {stat.subtitle}
                  </p>
                )}
              </div>
            );
          })}
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Subject Progress */}
          <div className="lg:col-span-2 space-y-6">
            <div className="glass rounded-xl p-6">
              <div className="flex items-center gap-2 mb-6">
                <Target className="h-5 w-5 text-teal-400" />
                <h2 className="text-lg font-semibold font-[family-name:var(--font-heading)]">
                  Topic-wise Accuracy
                </h2>
              </div>

              <div className="space-y-6">
                {topics.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">
                    Take a test to see your topic performance
                  </p>
                ) : (
                  topics.map((topic) => {
                    const accuracy = topicAccuracies[topic] || 0;
                    const percentage = Math.round(accuracy * 100);
                    const isWeak = weakTopics.includes(topic);

                    return (
                      <div key={topic} className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div
                              className={cn(
                                'h-10 w-10 rounded-lg flex items-center justify-center',
                                percentage >= 70
                                  ? 'bg-teal-500/10'
                                  : percentage >= 40
                                  ? 'bg-purple-500/10'
                                  : 'bg-red-500/10'
                              )}
                            >
                              <BookOpen
                                className={cn(
                                  'h-5 w-5',
                                  percentage >= 70
                                    ? 'text-teal-400'
                                    : percentage >= 40
                                    ? 'text-purple-400'
                                    : 'text-red-400'
                                )}
                              />
                            </div>
                            <div>
                              <p className="font-semibold">{topic}</p>
                              {isWeak && (
                                <p className="text-xs text-red-400">
                                  Focus Area
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="text-right">
                            <p
                              className={cn(
                                'text-2xl font-bold',
                                percentage >= 70
                                  ? 'text-teal-400'
                                  : percentage >= 40
                                  ? 'text-purple-400'
                                  : 'text-red-400'
                              )}
                            >
                              {percentage}%
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {percentage >= 70
                                ? 'Excellent'
                                : percentage >= 40
                                ? 'Good'
                                : 'Needs Work'}
                            </p>
                          </div>
                        </div>
                        <div className="h-3 rounded-full bg-white/5 overflow-hidden">
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
                  })
                )}
              </div>
            </div>

            {/* Difficulty Breakdown */}
            {Object.keys(difficultyAccuracies).length > 0 && (
              <div className="glass rounded-xl p-6">
                <div className="flex items-center gap-2 mb-6">
                  <Target className="h-5 w-5 text-purple-400" />
                  <h2 className="text-lg font-semibold font-[family-name:var(--font-heading)]">
                    Difficulty Breakdown
                  </h2>
                </div>
                <div className="space-y-4">
                  {['Easy', 'Medium', 'Hard'].map((diff) => {
                    const accuracy = difficultyAccuracies[diff];
                    if (accuracy === undefined) return null;
                    const pct = Math.round(accuracy * 100);
                    const colors: Record<string, string> = {
                      Easy: 'from-teal-500 to-emerald-500',
                      Medium: 'from-purple-500 to-blue-500',
                      Hard: 'from-red-500 to-orange-500',
                    };
                    return (
                      <div key={diff} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-medium">{diff}</span>
                          <span className="text-sm text-muted-foreground">
                            {pct}%
                          </span>
                        </div>
                        <div className="h-2 rounded-full bg-white/5 overflow-hidden">
                          <div
                            className={cn(
                              'h-full rounded-full transition-all duration-1000',
                              `bg-gradient-to-r ${colors[diff]}`
                            )}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Coaching Feedback from last test */}
            {testResults?.coaching_feedback && (
              <div className="glass rounded-xl p-6 glow-primary">
                <div className="flex items-center gap-4">
                  <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-teal-500/20 to-purple-500/20 flex items-center justify-center">
                    <Target className="h-7 w-7 text-teal-400" />
                  </div>
                  <div>
                    <p className="font-semibold text-lg">Coach Says</p>
                    <p className="text-sm text-muted-foreground">
                      {testResults.coaching_feedback}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Feedback */}
            <div className="glass rounded-xl p-6">
              <h3 className="font-semibold mb-1">Share Your Feedback</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Help us improve your experience
              </p>

              {feedbackSubmitted ? (
                <div className="text-center py-8">
                  <div className="h-16 w-16 rounded-full bg-teal-500/10 mx-auto mb-4 flex items-center justify-center">
                    <CheckCircle2 className="h-8 w-8 text-teal-400" />
                  </div>
                  <p className="font-semibold mb-2">Thank you!</p>
                  <p className="text-sm text-muted-foreground">
                    Your feedback helps us improve
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">
                      Rate your experience
                    </label>
                    <div className="flex gap-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          onClick={() => setRating(star)}
                          className={cn(
                            'h-10 w-10 rounded-lg flex items-center justify-center transition-all',
                            rating >= star
                              ? 'bg-amber-500/20 text-amber-400'
                              : 'bg-white/5 text-muted-foreground hover:bg-white/10'
                          )}
                        >
                          <Star
                            className={cn(
                              'h-5 w-5',
                              rating >= star && 'fill-current'
                            )}
                          />
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-2 block">
                      Your suggestions
                    </label>
                    <Textarea
                      value={feedback}
                      onChange={(e) => setFeedback(e.target.value)}
                      placeholder="Share what you like or what could be improved..."
                      rows={4}
                      className="bg-white/5 border-white/10 focus:border-teal-500/50"
                    />
                  </div>

                  <Button
                    className="w-full gap-2 bg-gradient-to-r from-teal-500 to-purple-600 text-white border-0"
                    onClick={handleSubmitFeedback}
                    disabled={rating === 0}
                  >
                    <Send className="h-4 w-4" />
                    Submit Feedback
                  </Button>
                </div>
              )}
            </div>

            {/* Quick Actions */}
            <div className="glass rounded-xl p-6">
              <h3 className="font-semibold mb-4">Quick Actions</h3>
              <div className="space-y-2">
                <Button
                  variant="outline"
                  className="w-full justify-start gap-3 glass border-white/10 hover:bg-white/5"
                  onClick={() => setCurrentView('topics')}
                >
                  <BookOpen className="h-4 w-4 text-teal-400" />
                  View Study Plan
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start gap-3 glass border-white/10 hover:bg-white/5"
                  onClick={() => setCurrentView('chat')}
                >
                  <Star className="h-4 w-4 text-purple-400" />
                  Ask AI Tutor
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
