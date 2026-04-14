'use client';

import { useState } from 'react';
import { ArrowRight, Sparkles, ShieldCheck, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { useAppStore } from '@/lib/store';
import { cn } from '@/lib/utils';

export function Landing() {
  const { setCurrentView } = useAppStore();
  const [starting, setStarting] = useState(false);

  const onStart = async () => {
    if (starting) return;
    setStarting(true);
    // Small delay so the user sees a smooth transition.
    await new Promise((r) => setTimeout(r, 450));
    setCurrentView('register');
    setStarting(false);
  };

  return (
    <section className="relative">
      <div className="container mx-auto px-4">
        <div className="relative overflow-hidden rounded-3xl glass-card gradient-border mt-6 md:mt-10">
          <div className="absolute inset-0 pointer-events-none">
            <div className="particle h-24 w-24 bg-teal-400/10 left-6 top-8" />
            <div className="particle h-16 w-16 bg-purple-400/10 right-10 top-16" style={{ animationDelay: '1.2s' }} />
            <div className="particle h-20 w-20 bg-pink-400/10 right-24 bottom-8" style={{ animationDelay: '2.1s' }} />
          </div>

          <div className="relative p-6 sm:p-10 md:p-14">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span className="inline-flex items-center gap-2 rounded-full px-3 py-1 glass">
                <Sparkles className="h-4 w-4 text-teal-300" />
                AI-powered study buddy
              </span>
              <span className="hidden sm:inline">•</span>
              <span className="hidden sm:inline">Mood-adaptive learning</span>
            </div>

            <h1 className="mt-6 text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight">
              <span className="gradient-text">EduAdapt</span>
              <span className="text-foreground"> makes exam prep feel easier.</span>
            </h1>

            <p className="mt-4 max-w-2xl text-base sm:text-lg text-muted-foreground leading-relaxed">
              Take a quick assessment, get a personalized 7‑day study plan, and let the AI pet adjust difficulty based on how you feel—so you stay consistent and improve faster.
            </p>

            <div className="mt-8 flex flex-col sm:flex-row gap-3 sm:items-center">
              <Button
                onClick={onStart}
                size="lg"
                className={cn(
                  'h-12 px-6 text-base font-semibold shadow-lg glow-primary transition-smooth',
                  'bg-gradient-to-r from-teal-500 to-purple-600 text-white hover:opacity-95'
                )}
              >
                {starting ? (
                  <>
                    <Spinner className="mr-2 size-5" />
                    Loading…
                  </>
                ) : (
                  <>
                    Try now
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </>
                )}
              </Button>

              <div className="text-sm text-muted-foreground">
                Free to use • Works great on mobile
              </div>
            </div>

            <div className="mt-10 grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="rounded-2xl glass p-4 card-hover">
                <div className="flex items-center gap-2 font-semibold">
                  <Zap className="h-4 w-4 text-teal-300" />
                  Adaptive quizzes
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                  Difficulty shifts based on mood and performance.
                </p>
              </div>
              <div className="rounded-2xl glass p-4 card-hover">
                <div className="flex items-center gap-2 font-semibold">
                  <ShieldCheck className="h-4 w-4 text-purple-300" />
                  Clean progress
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                  See strengths, weak topics, and accuracy trends.
                </p>
              </div>
              <div className="rounded-2xl glass p-4 card-hover">
                <div className="flex items-center gap-2 font-semibold">
                  <Sparkles className="h-4 w-4 text-pink-300" />
                  7‑day plan
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                  Daily tasks + curated videos to stay consistent.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

