import { useCallback, useEffect, useState } from 'react';
import { AnimatePresence } from 'motion/react';
import { Shield, Volume2, VolumeX } from 'lucide-react';
import { CosmicBackdrop } from './components/CosmicBackdrop';
import { WelcomeScreen } from './components/WelcomeScreen';
import { QuizEngine } from './components/QuizEngine';
import { FinaleSurprise } from './components/FinaleSurprise';
import { AdminPortal } from './components/AdminPortal';
import { soundFX } from './lib/sound';
import {
  PublicQuizCatalog,
  QuizAnswerResponse,
  QuizDifficultyFilter,
  QuizQuestionPublic,
  QuizSessionStartResponse,
} from './types/quiz';

type AppView = 'welcome' | 'quiz' | 'finale' | 'admin';

interface ActiveQuizState {
  sessionToken: string;
  participantName: string;
  quizTitle: string;
  currentIndex: number;
  totalQuestions: number;
  question: QuizQuestionPublic;
}

export default function App() {
  const [view, setView] = useState<AppView>('welcome');
  const [soundEnabled, setSoundEnabled] = useState(true);

  const [catalog, setCatalog] = useState<PublicQuizCatalog | null>(null);
  const [loadingCatalog, setLoadingCatalog] = useState(true);

  const [startingQuiz, setStartingQuiz] = useState(false);
  const [startError, setStartError] = useState<string | null>(null);

  const [activeQuiz, setActiveQuiz] = useState<ActiveQuizState | null>(null);
  const [submittingAnswer, setSubmittingAnswer] = useState(false);
  const [answerError, setAnswerError] = useState<string | null>(null);

  const [finishedParticipantName, setFinishedParticipantName] = useState('');

  const fetchQuizCatalog = useCallback(async () => {
    setLoadingCatalog(true);
    try {
      const res = await fetch('/api/quiz/status');
      if (res.ok) {
        const data: PublicQuizCatalog = await res.json();
        setCatalog(data);
      }
    } catch {
      // Keep UI graceful on transient fetch error
    } finally {
      setLoadingCatalog(false);
    }
  }, []);

  useEffect(() => {
    fetchQuizCatalog();
  }, [fetchQuizCatalog]);

  const toggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    soundFX.setEnabled(next);
  };

  const handleStartQuiz = async (
    name: string,
    quizId: number,
    difficulty: QuizDifficultyFilter
  ) => {
    setStartingQuiz(true);
    setStartError(null);
    soundFX.playPortalStart();

    try {
      const res = await fetch('/api/quiz/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, quizId, difficulty }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'تعذر بدء الاختبار.');
      }
      const session = data as QuizSessionStartResponse;
      setActiveQuiz({
        sessionToken: session.sessionToken,
        participantName: session.name,
        quizTitle: session.quizTitle,
        currentIndex: session.currentIndex,
        totalQuestions: session.totalQuestions,
        question: session.question,
      });
      setAnswerError(null);
      setView('quiz');
    } catch (err: any) {
      setStartError(err?.message || 'حدث خطأ أثناء بدء الاختبار.');
    } finally {
      setStartingQuiz(false);
    }
  };

  const handleConfirmAnswer = async (selectedOption: number) => {
    if (!activeQuiz) return;
    setSubmittingAnswer(true);
    setAnswerError(null);

    try {
      const res = await fetch('/api/quiz/answer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionToken: activeQuiz.sessionToken,
          questionId: activeQuiz.question.id,
          selectedOption,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'تعذر حفظ الإجابة.');
      }

      const result = data as QuizAnswerResponse;
      if (result.completed) {
        setFinishedParticipantName(result.participantName);
        setActiveQuiz(null);
        setView('finale');
      } else {
        setActiveQuiz({
          ...activeQuiz,
          currentIndex: result.currentIndex,
          totalQuestions: result.totalQuestions,
          question: result.question,
        });
      }
    } catch (err: any) {
      setAnswerError(err?.message || 'تعذر الاتصال بالخادم.');
    } finally {
      setSubmittingAnswer(false);
    }
  };

  const handleBackHome = () => {
    setActiveQuiz(null);
    setStartError(null);
    setAnswerError(null);
    fetchQuizCatalog();
    setView('welcome');
  };

  return (
    <div className="relative flex min-h-screen flex-col text-slate-100">
      <CosmicBackdrop dimmed={view === 'finale'} />

      {/* Minimal Top Utility Bar */}
      <header className="relative z-20 mx-auto flex w-full max-w-6xl items-center justify-between gap-8 px-5 py-4 sm:px-8">
        <button
          type="button"
          onClick={view === 'quiz' ? undefined : handleBackHome}
          className="font-display text-lg font-extrabold tracking-wider text-white whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-sky-400"
          dir="ltr"
        >
          QUIZVERSE
        </button>

        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={toggleSound}
            className="flex min-h-[40px] items-center gap-2 rounded-xl border border-slate-700/70 bg-slate-900/60 px-3.5 py-2 text-xs font-semibold text-slate-200 backdrop-blur-md transition hover:border-sky-400/60"
            aria-label={soundEnabled ? 'كتم المؤثرات الصوتية' : 'تشغيل المؤثرات الصوتية'}
          >
            {soundEnabled ? (
              <Volume2 className="h-4 w-4 text-sky-300" />
            ) : (
              <VolumeX className="h-4 w-4 text-slate-500" />
            )}
            <span className="hidden whitespace-nowrap sm:inline">
              {soundEnabled ? 'الصوت مفعّل' : 'الصوت مكتوم'}
            </span>
          </button>
        </div>
      </header>

      {/* Main Viewport */}
      <main className="relative z-10 flex flex-1 items-center justify-center px-4 py-6 sm:px-6 sm:py-10">
        <AnimatePresence mode="wait">
          {view === 'welcome' && (
            <WelcomeScreen
              key="view-welcome"
              catalog={catalog}
              loadingCatalog={loadingCatalog}
              starting={startingQuiz}
              error={startError}
              onStartQuiz={handleStartQuiz}
            />
          )}

          {view === 'quiz' && activeQuiz && (
            <QuizEngine
              key="view-quiz"
              participantName={activeQuiz.participantName}
              quizTitle={activeQuiz.quizTitle}
              currentIndex={activeQuiz.currentIndex}
              totalQuestions={activeQuiz.totalQuestions}
              question={activeQuiz.question}
              submitting={submittingAnswer}
              error={answerError}
              onConfirmAnswer={handleConfirmAnswer}
            />
          )}

          {view === 'finale' && (
            <FinaleSurprise
              key="view-finale"
              participantName={finishedParticipantName}
              onBackHome={handleBackHome}
            />
          )}

          {view === 'admin' && (
            <AdminPortal
              key="view-admin"
              onClose={handleBackHome}
              onQuizChanged={fetchQuizCatalog}
            />
          )}
        </AnimatePresence>
      </main>

      {/* Quiet Footer with Secret Admin Portal Entry (Hidden during active quiz) */}
      {view === 'welcome' && (
        <footer className="relative z-10 mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-5 text-xs text-slate-500">
          <span>QUIZVERSE · تجربة تحديات تفاعلية</span>
          <button
            type="button"
            onClick={() => setView('admin')}
            className="flex items-center gap-1.5 text-slate-500 transition-colors hover:text-slate-300"
          >
            <Shield className="h-3.5 w-3.5" />
            <span>بوابة الإدارة</span>
          </button>
        </footer>
      )}
    </div>
  );
}
