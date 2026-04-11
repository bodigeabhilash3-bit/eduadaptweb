'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  GraduationCap,
  BookOpen,
  Calculator,
  Sparkles,
  ArrowRight,
  Trophy,
  Clock,
  Loader2,
  Zap,
  Brain,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useAppStore, type Stream } from '@/lib/store';
import { createStudent } from '@/lib/api';
import { cn } from '@/lib/utils';

const registrationSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email'),
  phone: z.string().min(10, 'Please enter a valid phone number'),
});

type RegistrationData = z.infer<typeof registrationSchema>;

const features = [
  {
    icon: Brain,
    title: 'AI-Powered Assessment',
    description: 'Smart quiz adapts to your mood and skill level',
    gradient: 'from-teal-500/20 to-teal-500/5',
  },
  {
    icon: Trophy,
    title: 'Personalized Plans',
    description: '7-day study plans with YouTube videos',
    gradient: 'from-purple-500/20 to-purple-500/5',
  },
  {
    icon: Zap,
    title: 'Mood-Driven Learning',
    description: 'AI adjusts difficulty based on how you feel',
    gradient: 'from-pink-500/20 to-pink-500/5',
  },
  {
    icon: Sparkles,
    title: 'AI Study Buddy',
    description: 'Your personal pet companion guides you',
    gradient: 'from-amber-500/20 to-amber-500/5',
  },
];

const stats = [
  { value: '10K+', label: 'Students', color: 'text-teal-400' },
  { value: '95%', label: 'Success Rate', color: 'text-purple-400' },
  { value: '500+', label: 'Topics', color: 'text-pink-400' },
  { value: '24/7', label: 'AI Support', color: 'text-amber-400' },
];

function AnimatedCounter({ target, label, color }: { target: string; label: string; color: string }) {
  const [count, setCount] = useState(0);
  const numericValue = parseInt(target.replace(/\D/g, ''));
  const suffix = target.replace(/[\d]/g, '');

  useEffect(() => {
    if (isNaN(numericValue)) return;
    const duration = 2000;
    const steps = 60;
    const stepDuration = duration / steps;
    let current = 0;

    const timer = setInterval(() => {
      current += 1;
      const progress = current / steps;
      const eased = 1 - Math.pow(1 - progress, 3); // cubic ease-out
      setCount(Math.round(numericValue * eased));
      
      if (current >= steps) {
        clearInterval(timer);
        setCount(numericValue);
      }
    }, stepDuration);

    return () => clearInterval(timer);
  }, [numericValue]);

  return (
    <div className="text-center">
      <p className={cn('text-2xl lg:text-4xl font-bold', color)}>
        {isNaN(numericValue) ? target : `${count}${suffix}`}
      </p>
      <p className="text-xs text-muted-foreground mt-1">{label}</p>
    </div>
  );
}

export function RegistrationForm() {
  const [selectedStream] = useState<Stream>('MPC');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { setStudent, setCurrentView } = useAppStore();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegistrationData>({
    resolver: zodResolver(registrationSchema),
  });

  const onSubmit = async (data: RegistrationData) => {
    setIsLoading(true);
    setError(null);

    try {
      const backendStudent = await createStudent({
        name: data.name,
        email: data.email,
        phone: data.phone,
        stream: selectedStream,
      });

      setStudent({
        id: backendStudent.id,
        name: backendStudent.name,
        email: data.email,
        phone: data.phone,
        stream: selectedStream,
        created_at: backendStudent.created_at,
      });

      setCurrentView('quiz');
    } catch (err: any) {
      setError(err.message || 'Failed to register. Is the backend running?');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden py-12 lg:py-20">
        {/* Gradient orbs */}
        <div className="absolute top-20 left-10 w-72 h-72 bg-teal-500/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-10 right-10 w-96 h-96 bg-purple-500/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute top-40 right-1/4 w-64 h-64 bg-pink-500/8 rounded-full blur-[100px] pointer-events-none" />

        {/* Floating particles */}
        <div className="particle w-2 h-2 bg-teal-400/30 top-[20%] left-[15%]" style={{ animationDelay: '0s' }} />
        <div className="particle w-3 h-3 bg-purple-400/20 top-[60%] left-[80%]" style={{ animationDelay: '2s' }} />
        <div className="particle w-1.5 h-1.5 bg-pink-400/25 top-[40%] left-[50%]" style={{ animationDelay: '4s' }} />
        <div className="particle w-2.5 h-2.5 bg-teal-400/20 top-[80%] left-[30%]" style={{ animationDelay: '6s' }} />

        <div className="container relative mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Content */}
            <div className="space-y-8">
              <div className="inline-flex items-center gap-2 rounded-full glass px-4 py-2 text-sm text-teal-400">
                <Sparkles className="h-4 w-4" />
                <span>AI-Powered Adaptive Learning</span>
              </div>

              <h1 className="text-4xl lg:text-6xl font-bold tracking-tight text-balance font-[family-name:var(--font-heading)]">
                Master Your
                <span className="gradient-text"> Entrance Exam</span>
                <br />
                with{' '}
                <span className="relative">
                  <span className="gradient-text-subtle">Smart Learning</span>
                </span>
              </h1>

              <p className="text-lg text-muted-foreground max-w-xl text-pretty">
                EduAdapt detects your mood, adapts difficulty in real-time, and creates 
                a personalized 7-day study plan with curated video resources — all 
                powered by AI.
              </p>

              {/* Animated Stats */}
              <div className="grid grid-cols-4 gap-4 glass rounded-2xl p-6">
                {stats.map((stat) => (
                  <AnimatedCounter
                    key={stat.label}
                    target={stat.value}
                    label={stat.label}
                    color={stat.color}
                  />
                ))}
              </div>
            </div>

            {/* Registration Card */}
            <Card className="glass-card border-0 shadow-2xl overflow-hidden">
              {/* Top gradient accent */}
              <div className="h-1 w-full bg-gradient-to-r from-teal-500 via-purple-500 to-pink-500" />
              
              <CardHeader className="text-center pb-4">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-teal-500 to-purple-600 shadow-lg glow-primary">
                  <GraduationCap className="h-9 w-9 text-white" />
                </div>
                <CardTitle className="text-2xl gradient-text font-[family-name:var(--font-heading)]">
                  Start Your Journey
                </CardTitle>
                <CardDescription>
                  Quick assessment to personalize your learning
                </CardDescription>
              </CardHeader>

              <CardContent>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                  {/* Error Message */}
                  {error && (
                    <div className="rounded-xl bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-400">
                      {error}
                    </div>
                  )}

                  {/* Form Fields */}
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground">
                        Full Name
                      </label>
                      <Input
                        {...register('name')}
                        placeholder="Enter your full name"
                        className="h-12 bg-white/5 border-white/10 focus:border-teal-500/50 focus:ring-teal-500/20 transition-all"
                      />
                      {errors.name && (
                        <p className="text-xs text-red-400">
                          {errors.name.message}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground">
                        Email Address
                      </label>
                      <Input
                        {...register('email')}
                        type="email"
                        placeholder="you@example.com"
                        className="h-12 bg-white/5 border-white/10 focus:border-teal-500/50 focus:ring-teal-500/20 transition-all"
                      />
                      {errors.email && (
                        <p className="text-xs text-red-400">
                          {errors.email.message}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground">
                        Phone Number
                      </label>
                      <Input
                        {...register('phone')}
                        type="tel"
                        placeholder="Enter your phone number"
                        className="h-12 bg-white/5 border-white/10 focus:border-teal-500/50 focus:ring-teal-500/20 transition-all"
                      />
                      {errors.phone && (
                        <p className="text-xs text-red-400">
                          {errors.phone.message}
                        </p>
                      )}
                    </div>
                  </div>

                  <Button
                    type="submit"
                    size="lg"
                    className="w-full h-12 text-base gap-2 bg-gradient-to-r from-teal-500 to-purple-600 
                             hover:from-teal-400 hover:to-purple-500 text-white border-0 shadow-lg
                             hover:shadow-[0_0_30px_rgba(45,212,191,0.3)] transition-all duration-300"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="h-5 w-5 animate-spin" />
                        Registering...
                      </>
                    ) : (
                      <>
                        Start Assessment
                        <ArrowRight className="h-5 w-5" />
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4 font-[family-name:var(--font-heading)]">
              How <span className="gradient-text">EduAdapt</span> Works
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Our AI-powered platform reads your mood and adapts in real-time
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <Card
                  key={feature.title}
                  className="glass-card border-0 card-hover overflow-hidden group"
                >
                  <CardContent className="pt-6 pb-6">
                    <div className="flex flex-col items-center text-center gap-4">
                      <div className="relative">
                        <div className="absolute -top-1 -left-1 text-4xl font-bold text-white/5 font-[family-name:var(--font-heading)]">
                          {index + 1}
                        </div>
                        <div className={cn(
                          'flex h-14 w-14 items-center justify-center rounded-xl',
                          `bg-gradient-to-br ${feature.gradient}`,
                          'group-hover:scale-110 transition-transform duration-300'
                        )}>
                          <Icon className="h-7 w-7 text-foreground" />
                        </div>
                      </div>
                      <div>
                        <h3 className="font-semibold mb-2">{feature.title}</h3>
                        <p className="text-sm text-muted-foreground">
                          {feature.description}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}
