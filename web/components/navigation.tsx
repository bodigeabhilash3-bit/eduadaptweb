'use client';

import { GraduationCap, BookOpen, BarChart3, Calendar, MessageCircle, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAppStore } from '@/lib/store';
import { cn } from '@/lib/utils';

const MOOD_EMOJIS: Record<string, string> = {
  focused: '🔥',
  okay: '😊',
  confused: '😕',
  tired: '😴',
  frustrated: '😤',
};

const navItems = [
  { id: 'register', label: 'Home', icon: Home },
  { id: 'quiz', label: 'Assessment', icon: BookOpen },
  { id: 'progress', label: 'Progress', icon: BarChart3 },
  { id: 'topics', label: 'Study Plan', icon: Calendar },
  { id: 'chat', label: 'AI Tutor', icon: MessageCircle },
] as const;

export function Navigation() {
  const { currentView, setCurrentView, student, mood } = useAppStore();

  return (
    <header className="sticky top-0 z-50 w-full glass-strong">
      {/* Top gradient line */}
      <div className="h-[2px] w-full bg-gradient-to-r from-teal-500 via-purple-500 to-pink-500" />

      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-teal-500 to-purple-600 shadow-lg glow-primary">
            <GraduationCap className="h-6 w-6 text-white" />
          </div>
          <span className="text-xl font-bold tracking-tight">
            <span className="gradient-text">Edu</span>
            <span className="text-foreground">Adapt</span>
          </span>
        </div>

        <nav className="hidden md:flex items-center gap-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;
            const isDisabled = !student && item.id !== 'register';

            return (
              <Button
                key={item.id}
                variant={isActive ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setCurrentView(item.id as any)}
                disabled={isDisabled}
                className={cn(
                  'gap-2 transition-all duration-300',
                  isActive && 'bg-gradient-to-r from-teal-500 to-purple-600 text-white shadow-lg glow-primary',
                  !isActive && !isDisabled && 'hover:bg-white/5',
                  isDisabled && 'opacity-30 cursor-not-allowed'
                )}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Button>
            );
          })}
        </nav>

        {student && (
          <div className="flex items-center gap-3">
            {/* Mood badge */}
            <span className="text-lg" title={`Mood: ${mood}`}>
              {MOOD_EMOJIS[mood] || '😊'}
            </span>
            <div className="hidden sm:block text-right">
              <p className="text-sm font-medium text-foreground">{student.name}</p>
              <p className="text-xs text-muted-foreground">{student.stream} Stream</p>
            </div>
            <div className="h-9 w-9 rounded-full bg-gradient-to-br from-teal-500 to-purple-600 flex items-center justify-center shadow-lg">
              <span className="text-sm font-semibold text-white">
                {student.name.charAt(0).toUpperCase()}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Mobile Navigation */}
      <nav className="md:hidden flex items-center justify-around glass py-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.id;
          const isDisabled = !student && item.id !== 'register';

          return (
            <button
              key={item.id}
              onClick={() => setCurrentView(item.id as any)}
              disabled={isDisabled}
              className={cn(
                'flex flex-col items-center gap-1 px-3 py-1 rounded-lg transition-all duration-300',
                isActive ? 'text-teal-400' : 'text-muted-foreground',
                isDisabled && 'opacity-30 cursor-not-allowed'
              )}
            >
              <Icon className={cn('h-5 w-5', isActive && 'drop-shadow-[0_0_8px_rgba(45,212,191,0.5)]')} />
              <span className="text-xs">{item.label}</span>
            </button>
          );
        })}
      </nav>
    </header>
  );
}
