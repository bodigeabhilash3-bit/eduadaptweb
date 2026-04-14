'use client';

import { Navigation } from '@/components/navigation';
import { Landing } from '@/components/landing';
import { RegistrationForm } from '@/components/registration-form';
import { QuizSection } from '@/components/quiz-section';
import { ProgressDashboard } from '@/components/progress-dashboard';
import { TopicsSection } from '@/components/topics-section';
import { AIChatbot } from '@/components/ai-chatbot';
import { AIPet } from '@/components/ai-pet';
import { useAppStore } from '@/lib/store';

export default function Home() {
  const { currentView } = useAppStore();

  const renderView = () => {
    switch (currentView) {
      case 'home':
        return <Landing />;
      case 'register':
        return <RegistrationForm />;
      case 'quiz':
        return <QuizSection />;
      case 'progress':
        return <ProgressDashboard />;
      case 'topics':
        return <TopicsSection />;
      case 'chat':
        return <AIChatbot />;
      default:
        return <Landing />;
    }
  };

  return (
    <main className="min-h-screen bg-background animated-bg">
      <Navigation />
      {renderView()}
      <AIPet />
    </main>
  );
}
