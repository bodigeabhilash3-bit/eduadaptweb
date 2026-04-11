'use client';

import { useState, useRef, useEffect } from 'react';
import {
  Send,
  Bot,
  User,
  Sparkles,
  BookOpen,
  Calculator,
  Beaker,
  Lightbulb,
  RefreshCcw,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Card,
  CardContent,
} from '@/components/ui/card';
import { useAppStore, type ChatMessage, type Mood } from '@/lib/store';
import { cn } from '@/lib/utils';
import { getRandomVideo } from '@/lib/youtube-data';

const MOOD_EMOJIS: Record<Mood, string> = {
  focused: '🔥',
  okay: '😊',
  confused: '😕',
  tired: '😴',
  frustrated: '😤',
};

// Dynamic suggestions based on mood and weak topics
function getSuggestions(weakTopics: string[], mood: Mood) {
  const base = [
    { icon: Calculator, text: 'Explain integration by parts' },
    { icon: Beaker, text: "What is Le Chatelier's principle?" },
    { icon: Lightbulb, text: 'How does electromagnetic induction work?' },
    { icon: BookOpen, text: 'Tips for solving differential equations' },
  ];

  // Mood-based suggestion
  if (mood === 'confused' || mood === 'frustrated') {
    base.unshift({
      icon: Sparkles,
      text: 'I need simpler explanations for my topics',
    });
    base.pop();
  }

  if (mood === 'tired') {
    base.unshift({
      icon: Sparkles,
      text: 'Give me a quick video recommendation',
    });
    base.pop();
  }

  // Prepend weak-topic suggestion if available
  if (weakTopics.length > 0) {
    base.unshift({
      icon: Sparkles,
      text: `Help me improve in ${weakTopics.slice(0, 2).join(' and ')}`,
    });
    if (base.length > 4) base.pop();
  }

  return base;
}

// AI response generator — mood-aware + uses real student data
function getAIResponse(
  question: string,
  weakTopics: string[],
  overallAccuracy: number | null,
  mood: Mood
): string {
  const q = question.toLowerCase();

  // Mood-adaptive response prefix
  const moodPrefix: Record<Mood, string> = {
    focused: '',
    okay: '',
    confused: "Let me explain this simply! 🌟\n\n",
    tired: "I'll keep this brief and clear! 💤\n\n",
    frustrated: "No worries, let's take it step by step! 🌈\n\n",
  };

  const prefix = moodPrefix[mood];

  // Video recommendation
  if (q.includes('video') || q.includes('watch') || q.includes('recommend')) {
    const topics = weakTopics.length > 0 ? weakTopics[0] : undefined;
    const video = getRandomVideo(topics);
    return `${prefix}📺 Here's a great video for you:\n\n**${video.title}**\nChannel: ${video.channel} | Duration: ${video.duration}\n\n🔗 [Watch on YouTube](https://youtube.com/watch?v=${video.id})\n\nYou can also find curated videos for each topic in your **Study Plan** tab!`;
  }

  // If asking about their performance / weak areas
  if (
    q.includes('weak') ||
    q.includes('improve') ||
    q.includes('focus') ||
    q.includes('struggle') ||
    q.includes('performance')
  ) {
    if (weakTopics.length > 0) {
      const accuracyStr =
        overallAccuracy !== null
          ? `Your overall accuracy is ${Math.round(overallAccuracy * 100)}%. `
          : '';

      if (mood === 'confused' || mood === 'tired') {
        return `${prefix}${accuracyStr}Your focus areas are: **${weakTopics.join(', ')}**.\n\nLet's start simple:\n1. Watch the videos in your Study Plan\n2. Try Easy-level practice questions\n3. Take it one topic at a time\n\nYou've got this! 💪`;
      }

      return `${prefix}${accuracyStr}Based on your test results, your weak areas are: **${weakTopics.join(
        ', '
      )}**.\n\n**Recommended approach:**\n\n1. Start by reviewing the fundamental concepts in ${weakTopics[0]}\n2. Practice Easy-difficulty problems first, then move to Medium\n3. Focus on understanding *why* answers are correct, not just memorizing\n4. Take the daily adaptive test — it will automatically prioritize your weak topics\n5. Check your Study Plan for a structured 7-day improvement schedule\n\nWould you like me to explain a specific concept from ${weakTopics[0]}?`;
    }
    return `${prefix}You haven't taken any tests yet, so I don't have performance data. Take an assessment first and I'll be able to give you personalized guidance!`;
  }

  if (q.includes('study plan') || q.includes('schedule')) {
    return `${prefix}Your personalized study plan is available in the **Study Plan** tab. It's structured as a 7-day plan:\n\n📅 **Days 1-3:** Intensive focus on your weakest topics${
      weakTopics.length > 0 ? ` (${weakTopics.slice(0, 2).join(', ')})` : ''
    }\n📅 **Days 4-5:** Mixed review and practice\n📅 **Day 6:** Full revision across all topics\n📅 **Day 7:** Simulated practice test\n\nEach day includes study resources, **YouTube videos**, practice tasks with real questions, and test recommendations. Go check it out!`;
  }

  if (q.includes('mood') || q.includes('feeling')) {
    return `${prefix}Your current mood is set to **${mood}** ${MOOD_EMOJIS[mood]}.\n\nThis affects your learning experience:\n- Quiz difficulty is adjusted based on your mood\n- I adapt my explanations accordingly\n- Your AI buddy suggests activities that match how you feel\n\nYou can change your mood anytime using the floating pet companion! 🐱`;
  }

  if (q.includes('integration') || q.includes('integral')) {
    return `${prefix}**Integration by Parts** is a powerful technique for integrating products of functions.\n\n**Formula:** ∫u dv = uv - ∫v du\n\n**Steps:**\n1. Choose u and dv from the integrand\n2. Find du by differentiating u\n3. Find v by integrating dv\n4. Apply the formula\n\n**Tip:** Use LIATE rule to choose u:\n- **L**ogarithmic\n- **I**nverse trig\n- **A**lgebraic\n- **T**rig\n- **E**xponential\n\nWant me to solve a specific integration problem?`;
  }

  if (q.includes('chatelier') || q.includes('equilibrium')) {
    return `${prefix}**Le Chatelier's Principle** states that if a system at equilibrium is disturbed, it will shift to counteract the change.\n\n**Key Factors:**\n\n1. **Concentration:** Adding reactant → shifts right; Adding product → shifts left\n\n2. **Pressure:** Increasing pressure → shifts toward fewer moles of gas\n\n3. **Temperature:**\n   - Exothermic: Increasing T shifts left\n   - Endothermic: Increasing T shifts right\n\n**Example:** For N₂ + 3H₂ ⇌ 2NH₃\n- Adding N₂ → More NH₃ produced\n- Removing NH₃ → Reaction shifts right\n\nWould you like me to explain a specific application?`;
  }

  if (q.includes('electromagnetic') || q.includes('induction')) {
    return `${prefix}**Electromagnetic Induction** is the production of EMF when magnetic flux through a conductor changes.\n\n**Faraday's Law:**\nEMF = -dΦ/dt\n\n**Key Concepts:**\n\n1. **Magnetic Flux (Φ):** Φ = B·A·cosθ\n   - B = Magnetic field\n   - A = Area of loop\n   - θ = Angle between B and normal\n\n2. **Lenz's Law:** The induced current opposes the change that produces it\n\n3. **Applications:**\n   - Electric generators\n   - Transformers\n   - Induction cooktops\n\nWant me to solve a practice problem?`;
  }

  if (q.includes('differential equation')) {
    return `${prefix}**Tips for Solving Differential Equations:**\n\n**1. Identify the Type:**\n- First order linear: dy/dx + P(x)y = Q(x)\n- Separable: dy/dx = f(x)g(y)\n- Homogeneous: dy/dx = f(y/x)\n\n**2. Common Methods:**\n\n📌 **Separation of Variables:**\n- Rearrange to get all y terms on one side, x terms on the other\n- Integrate both sides\n\n📌 **Integrating Factor (for linear):**\n- IF = e^∫P(x)dx\n- Multiply equation by IF\n- Integrate\n\n**Pro Tips:**\n- Always check your solution by substituting back\n- Don't forget the constant of integration!\n- Practice recognizing patterns`;
  }

  if (q.includes('simple') || q.includes('easier') || q.includes('basic')) {
    return `${prefix}No problem! Let me break things down:\n\n📐 **Math Basics:** Start with formulas and practice step-by-step\n⚡ **Physics Basics:** Focus on understanding concepts before calculations\n🧪 **Chemistry Basics:** Begin with periodic table trends and simple reactions\n\n**My tips:**\n1. Watch the tutorial videos in your Study Plan 📺\n2. Practice with Easy-level questions first\n3. Ask me to explain any concept in simpler terms!\n\nWhat topic would you like me to simplify?`;
  }

  if (q.includes('buffer')) {
    return `${prefix}**Buffer Solutions** resist pH changes when small amounts of acid or base are added.\n\n**Types:**\n\n1. **Acidic Buffer:** Weak acid + its conjugate base\n   - Example: CH₃COOH + CH₃COONa\n   - pH < 7\n\n2. **Basic Buffer:** Weak base + its conjugate acid\n   - Example: NH₃ + NH₄Cl\n   - pH > 7\n\n**Henderson-Hasselbalch Equation:**\npH = pKa + log([A⁻]/[HA])\n\n**Biological Importance:**\n- Blood: pH 7.35-7.45 (carbonic acid/bicarbonate buffer)`;
  }

  if (q.includes('tip') || q.includes('memoriz') || q.includes('study')) {
    return `${prefix}**Study Tips for MPC Students:**\n\n**1. Active Recall:**\n- Test yourself regularly with the adaptive quiz\n- Explain concepts aloud\n\n**2. Spaced Repetition:**\n- Day 1 → Day 3 → Day 7 → Day 14\n\n**3. Visual Learning:**\n- Watch the curated YouTube videos in each study day 📺\n- Create mind maps and diagrams\n\n**4. Practice Problems:**\n- Start with Easy, build to Hard\n- Use the embedded practice questions in your Study Plan\n\n**Daily Routine:**\n- 45-minute study blocks\n- 10-minute breaks\n- Take the daily adaptive test`;
  }

  // Default response
  const weakInfo =
    weakTopics.length > 0
      ? `\n\n📊 Based on your tests, you should focus on: **${weakTopics.join(', ')}**`
      : '';

  return `${prefix}Great question! As your AI tutor, I'm here to help.${weakInfo}\n\n**I can assist you with:**\n\n📐 **Mathematics:** Calculus, Algebra, Coordinate Geometry\n⚡ **Physics:** Mechanics, Electromagnetism, Modern Physics\n🧪 **Chemistry:** Organic, Inorganic, Physical Chemistry\n\n**Try asking:**\n- Explain a specific concept\n- How can I improve my weak areas?\n- Recommend a video for my weak topics\n- How is my mood affecting my learning?`;
}

export function AIChatbot() {
  const {
    student,
    chatMessages,
    addChatMessage,
    clearChat,
    setCurrentView,
    performance,
    mood,
    setMood,
  } = useAppStore();
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatMessages]);

  if (!student) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="glass-card rounded-xl max-w-md p-6 text-center">
          <p className="text-muted-foreground mb-4">
            Please register first to use AI Tutor
          </p>
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

  const weakTopics = performance?.weak_topics || [];
  const overallAccuracy = performance?.overall_accuracy ?? null;
  const suggestions = getSuggestions(weakTopics, mood);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: input,
      timestamp: new Date().toISOString(),
    };

    addChatMessage(userMessage);
    setInput('');
    setIsLoading(true);

    // Simulate AI thinking
    await new Promise((resolve) =>
      setTimeout(resolve, 800 + Math.random() * 800)
    );

    const aiResponse: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'assistant',
      content: getAIResponse(input, weakTopics, overallAccuracy, mood),
      timestamp: new Date().toISOString(),
    };

    addChatMessage(aiResponse);
    setIsLoading(false);
  };

  const handleSuggestionClick = (text: string) => {
    setInput(text);
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <div className="glass-strong">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-teal-500 to-purple-600 flex items-center justify-center shadow-lg glow-primary">
                <Bot className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold flex items-center gap-2 font-[family-name:var(--font-heading)]">
                  <span className="gradient-text">AI Tutor</span>
                  <Sparkles className="h-4 w-4 text-teal-400" />
                </h1>
                <p className="text-sm text-muted-foreground">
                  Your 24/7 study companion · Mood: {MOOD_EMOJIS[mood]}
                  {weakTopics.length > 0 && (
                    <span className="ml-1">
                      · Focus: {weakTopics.slice(0, 2).join(', ')}
                    </span>
                  )}
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={clearChat}
              className="gap-2 glass border-white/10 hover:bg-white/5"
            >
              <RefreshCcw className="h-4 w-4" />
              New Chat
            </Button>
          </div>
        </div>
      </div>

      {/* Chat Container */}
      <div className="flex-1 container mx-auto px-4 max-w-4xl overflow-y-auto py-6">
        {chatMessages.length === 0 ? (
          // Empty State
          <div className="h-full flex flex-col items-center justify-center text-center py-12">
            <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-teal-500/20 to-purple-600/20 flex items-center justify-center mb-6 glow-primary">
              <Bot className="h-10 w-10 text-teal-400" />
            </div>
            <h2 className="text-2xl font-bold mb-2 font-[family-name:var(--font-heading)]">
              Hi {student.name}! I&apos;m your <span className="gradient-text">AI Tutor</span>
            </h2>
            <p className="text-muted-foreground max-w-md mb-8">
              Ask me anything about Mathematics, Physics, or Chemistry.
              I adapt my responses based on your mood {MOOD_EMOJIS[mood]}
            </p>

            <div className="grid sm:grid-cols-2 gap-3 w-full max-w-lg">
              {suggestions.map((suggestion, index) => {
                const Icon = suggestion.icon;
                return (
                  <button
                    key={index}
                    onClick={() => handleSuggestionClick(suggestion.text)}
                    className="flex items-center gap-3 rounded-xl glass p-4 text-left transition-all duration-300 hover:bg-white/5 card-hover"
                  >
                    <div className="h-10 w-10 rounded-lg bg-teal-500/10 flex items-center justify-center shrink-0">
                      <Icon className="h-5 w-5 text-teal-400" />
                    </div>
                    <span className="text-sm font-medium">
                      {suggestion.text}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          // Messages
          <div className="space-y-6">
            {chatMessages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  'flex gap-4',
                  message.role === 'user' ? 'justify-end' : 'justify-start'
                )}
              >
                {message.role === 'assistant' && (
                  <div className="h-10 w-10 shrink-0 rounded-xl bg-gradient-to-br from-teal-500 to-purple-600 flex items-center justify-center shadow-lg">
                    <Bot className="h-5 w-5 text-white" />
                  </div>
                )}

                <div
                  className={cn(
                    'max-w-[80%] rounded-2xl px-5 py-4',
                    message.role === 'user'
                      ? 'bg-gradient-to-r from-teal-500 to-purple-600 text-white'
                      : 'glass'
                  )}
                >
                  <div
                    className={cn(
                      'prose prose-sm max-w-none',
                      message.role === 'user' && 'prose-invert'
                    )}
                  >
                    {message.content.split('\n').map((line, i) => (
                      <p key={i} className="mb-2 last:mb-0">
                        {line.startsWith('**') && line.endsWith('**') ? (
                          <strong>{line.slice(2, -2)}</strong>
                        ) : line.startsWith('- ') ? (
                          <span className="block ml-4">{line}</span>
                        ) : (
                          line
                        )}
                      </p>
                    ))}
                  </div>
                </div>

                {message.role === 'user' && (
                  <div className="h-10 w-10 shrink-0 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg">
                    <User className="h-5 w-5 text-white" />
                  </div>
                )}
              </div>
            ))}

            {isLoading && (
              <div className="flex gap-4">
                <div className="h-10 w-10 shrink-0 rounded-xl bg-gradient-to-br from-teal-500 to-purple-600 flex items-center justify-center shadow-lg">
                  <Bot className="h-5 w-5 text-white" />
                </div>
                <div className="glass rounded-2xl px-5 py-4">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin text-teal-400" />
                    <span className="text-sm">Thinking...</span>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="glass-strong">
        <div className="container mx-auto px-4 py-4 max-w-4xl">
          <div className="flex gap-3">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask me anything about your subjects..."
              className="flex-1 h-12 bg-white/5 border-white/10 focus:border-teal-500/50 focus:ring-teal-500/20"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              disabled={isLoading}
            />
            <Button
              onClick={handleSend}
              size="lg"
              className="h-12 px-6 gap-2 bg-gradient-to-r from-teal-500 to-purple-600 text-white border-0 shadow-lg hover:shadow-[0_0_30px_rgba(45,212,191,0.3)]"
              disabled={!input.trim() || isLoading}
            >
              <Send className="h-5 w-5" />
              Send
            </Button>
          </div>
          <p className="text-xs text-muted-foreground text-center mt-3">
            AI Tutor adapts to your mood {MOOD_EMOJIS[mood]} · Ask for video recommendations or concept explanations
          </p>
        </div>
      </div>
    </div>
  );
}
