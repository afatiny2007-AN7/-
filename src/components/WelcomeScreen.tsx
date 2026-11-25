import { FormEvent, useEffect, useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { AlertCircle, ArrowLeft, Folder, Sparkles } from 'lucide-react';
import {
  PublicQuizCatalog,
  PublicQuizSummary,
  QuizDifficultyFilter,
} from '../types/quiz';
import { soundFX } from '../lib/sound';

interface WelcomeScreenProps {
  catalog: PublicQuizCatalog | null;
  loadingCatalog: boolean;
  starting: boolean;
  error: string | null;
  onStartQuiz: (
    name: string,
    quizId: number,
    difficulty: QuizDifficultyFilter
  ) => void;
}

const DIFFICULTY_OPTIONS: Array<{
  value: QuizDifficultyFilter;
  label: string;
}> = [
  { value: 'all', label: 'الكل' },
  { value: 'easy', label: 'سهل' },
  { value: 'medium', label: 'متوسط' },
  { value: 'hard', label: 'صعب' },
];

export function WelcomeScreen({
  catalog,
  loadingCatalog,
  starting,
  error,
  onStartQuiz,
}: WelcomeScreenProps) {
  const [name, setName] = useState('');
  const [selectedFolderId, setSelectedFolderId] = useState<number | 'all'>('all');
  const [selectedQuizId, setSelectedQuizId] = useState<number | null>(null);
  const [difficulty, setDifficulty] = useState<QuizDifficultyFilter>('all');
  const [localError, setLocalError] = useState<string | null>(null);

  const visibleQuizzes = useMemo<PublicQuizSummary[]>(() => {
    if (!catalog) return [];
    if (selectedFolderId === 'all') return catalog.allQuizzes;
    const found = catalog.folders.find((f) => f.id === selectedFolderId);
    return found ? found.quizzes : [];
  }, [catalog, selectedFolderId]);

  useEffect(() => {
    if (!catalog) return;
    if (
      selectedQuizId &&
      visibleQuizzes.some((q) => q.id === selectedQuizId)
    ) {
      return;
    }
    const firstAvailable =
      visibleQuizzes.find((q) => q.isActive && q.totalQuestions > 0) ??
      visibleQuizzes[0] ??
      null;
    setSelectedQuizId(firstAvailable ? firstAvailable.id : null);
  }, [catalog, visibleQuizzes, selectedQuizId]);

  const selectedQuiz = useMemo(
    () => visibleQuizzes.find((q) => q.id === selectedQuizId) ?? null,
    [visibleQuizzes, selectedQuizId]
  );

  useEffect(() => {
    if (!selectedQuiz) return;
    if (
      difficulty !== 'all' &&
      selectedQuiz.countsByDifficulty[difficulty] === 0
    ) {
      setDifficulty('all');
    }
  }, [selectedQuiz, difficulty]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (trimmed.length < 2) {
      setLocalError('يرجى كتابة اسمك أولاً (حرفين على الأقل) لبدء التحدي.');
      return;
    }
    if (!selectedQuiz) {
      setLocalError('يرجى اختيار اختبار متاح للبدء.');
      return;
    }
    setLocalError(null);
    onStartQuiz(trimmed, selectedQuiz.id, difficulty);
  };

  const globalPaused = catalog ? !catalog.globalActive : false;
  const quizPaused = selectedQuiz ? !selectedQuiz.isActive : false;
  const selectedCount = selectedQuiz
    ? selectedQuiz.countsByDifficulty[difficulty]
    : 0;
  const noQuestions = !selectedQuiz || selectedCount === 0;
  const disabled =
    loadingCatalog || starting || globalPaused || quizPaused || noQuestions;

  const showFolderSelector =
    Boolean(catalog) &&
    ((catalog?.folders.length ?? 0) > 1 ||
      ((catalog?.folders.length ?? 0) === 1 &&
        (catalog?.uncategorizedQuizzes.length ?? 0) > 0));

  const showQuizSelector = (catalog?.allQuizzes.length ?? 0) > 1;

  return (
    <motion.section
      initial={{ opacity: 0, y: 24, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 1.06, filter: 'blur(8px)' }}
      transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
      className="mx-auto flex w-full max-w-2xl flex-col items-center text-center"
    >
      {/* Geometric Celestial Emblem */}
      <motion.div
        initial={{ opacity: 0, scale: 0.85, rotate: -10 }}
        animate={{ opacity: 1, scale: 1, rotate: 0 }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        className="mb-6 flex flex-col items-center"
      >
        <div className="relative flex h-20 w-20 items-center justify-center rounded-2xl border border-sky-400/25 bg-slate-900/70 shadow-[0_0_45px_rgba(56,189,248,0.22)] backdrop-blur-xl">
          <svg
            viewBox="0 0 64 64"
            className="h-12 w-12 text-sky-300"
            fill="none"
            aria-hidden="true"
          >
            <circle
              cx="32"
              cy="32"
              r="24"
              stroke="url(#qvGold)"
              strokeWidth="1.75"
              strokeDasharray="6 4"
            />
            <polygon
              points="32,8 40,24 56,32 40,40 32,56 24,40 8,32 24,24"
              stroke="url(#qvNeon)"
              strokeWidth="2"
              fill="rgba(56,189,248,0.12)"
            />
            <circle cx="32" cy="32" r="5.5" fill="#FBBF24" />
            <defs>
              <linearGradient id="qvGold" x1="8" y1="8" x2="56" y2="56">
                <stop offset="0%" stopColor="#FBBF24" />
                <stop offset="100%" stopColor="#F59E0B" />
              </linearGradient>
              <linearGradient id="qvNeon" x1="8" y1="8" x2="56" y2="56">
                <stop offset="0%" stopColor="#38BDF8" />
                <stop offset="100%" stopColor="#A855F7" />
              </linearGradient>
            </defs>
          </svg>
        </div>

        <span
          className="mt-4 font-display text-sm font-bold tracking-[0.28em] text-amber-300/90"
          dir="ltr"
        >
          QUIZVERSE
        </span>
      </motion.div>

      {/* Main Card */}
      <div className="w-full rounded-3xl border border-slate-300/15 bg-slate-950/65 p-6 shadow-[0_24px_80px_rgba(2,6,23,0.8)] backdrop-blur-2xl sm:p-10">
        <h1 className="text-balance text-3xl font-extrabold leading-tight text-white sm:text-5xl">
          هل أنت مستعد للتحدي؟
        </h1>

        <p className="mx-auto mt-4 max-w-lg text-base leading-relaxed text-slate-300 sm:text-lg">
          اختبر معلوماتك، تحدَّ نفسك، واكتشف قدراتك!
        </p>

        {/* Clean Unboxed Metadata Line */}
        {selectedQuiz && (
          <div className="mt-5 flex flex-wrap items-center justify-center gap-2 text-xs text-slate-400 sm:text-sm">
            {selectedQuiz.folderName && (
              <>
                <span className="text-amber-300/90">{selectedQuiz.folderName}</span>
                <span aria-hidden="true">·</span>
              </>
            )}
            <span className="font-medium text-sky-300">{selectedQuiz.title}</span>
            <span aria-hidden="true">·</span>
            <span className="tabular-nums">{selectedCount} سؤال</span>
            <span aria-hidden="true">·</span>
            <span>سؤال واحد في كل مرة</span>
          </div>
        )}

        {(globalPaused || quizPaused) && (
          <div className="mt-6 flex items-center justify-center gap-2 rounded-2xl border border-amber-400/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
            <AlertCircle className="h-4 w-4 shrink-0 text-amber-300" />
            <span>الاختبار متوقف مؤقتاً من قِبل الإدارة. يرجى المحاولة لاحقاً.</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-8 space-y-5 text-right">
          {/* Folder / Section Selector */}
          {showFolderSelector && catalog && (
            <div>
              <span className="mb-2 block text-sm font-semibold text-slate-200">
                اختر القسم (المجلد)
              </span>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedFolderId('all');
                    soundFX.playSelect();
                  }}
                  className={`flex min-h-[40px] items-center gap-1.5 rounded-xl border px-3.5 py-2 text-xs font-bold transition ${
                    selectedFolderId === 'all'
                      ? 'border-sky-400/60 bg-sky-500/20 text-white'
                      : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:text-white'
                  }`}
                >
                  <span>كل الأقسام</span>
                  <span className="font-mono text-[11px] tabular-nums">
                    ({catalog.allQuizzes.length})
                  </span>
                </button>
                {catalog.folders.map((folder) => {
                  const isActive = selectedFolderId === folder.id;
                  return (
                    <button
                      key={folder.id}
                      type="button"
                      onClick={() => {
                        setSelectedFolderId(folder.id);
                        soundFX.playSelect();
                      }}
                      className={`flex min-h-[40px] items-center gap-1.5 rounded-xl border px-3.5 py-2 text-xs font-bold transition ${
                        isActive
                          ? 'border-amber-400/60 bg-amber-500/20 text-amber-100'
                          : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:text-white'
                      }`}
                    >
                      <Folder className="h-3.5 w-3.5 text-amber-300" />
                      <span>{folder.name}</span>
                      <span className="font-mono text-[11px] tabular-nums">
                        ({folder.quizzes.length})
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Quiz Selector when multiple quizzes exist */}
          {showQuizSelector && visibleQuizzes.length > 0 && (
            <div>
              <span className="mb-2 block text-sm font-semibold text-slate-200">
                اختر الاختبار
              </span>
              <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                {visibleQuizzes.map((quiz) => {
                  const isSelected = selectedQuizId === quiz.id;
                  return (
                    <button
                      key={quiz.id}
                      type="button"
                      onClick={() => {
                        setSelectedQuizId(quiz.id);
                        soundFX.playSelect();
                      }}
                      className={`flex flex-col items-start rounded-2xl border p-3.5 text-right transition-all ${
                        isSelected
                          ? 'border-sky-400 bg-gradient-to-l from-sky-500/20 to-violet-500/20 text-white shadow-[0_0_24px_rgba(56,189,248,0.2)]'
                          : 'border-slate-800 bg-slate-900/60 text-slate-300 hover:border-slate-600'
                      }`}
                    >
                      <span className="text-sm font-bold leading-snug">
                        {quiz.title}
                      </span>
                      <span className="mt-1 text-xs text-slate-400 tabular-nums">
                        {quiz.folderName ? `${quiz.folderName} · ` : ''}
                        {quiz.totalQuestions} سؤال
                        {!quiz.isActive ? ' · متوقف' : ''}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Difficulty Segmented Selector */}
          {selectedQuiz && selectedQuiz.totalQuestions > 0 && (
            <div>
              <span className="mb-2 block text-sm font-semibold text-slate-200">
                اختر مستوى الصعوبة
              </span>
              <div className="grid grid-cols-4 gap-1.5 rounded-2xl border border-slate-800 bg-slate-900/75 p-1.5">
                {DIFFICULTY_OPTIONS.map((opt) => {
                  const count = selectedQuiz.countsByDifficulty[opt.value];
                  const isActive = difficulty === opt.value;
                  const optDisabled = count === 0;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      disabled={optDisabled}
                      onClick={() => {
                        setDifficulty(opt.value);
                        soundFX.playSelect();
                      }}
                      className={`flex min-h-[42px] items-center justify-center gap-1.5 rounded-xl px-2 py-2 text-xs font-bold transition-all sm:text-sm ${
                        isActive
                          ? 'border border-sky-400/50 bg-gradient-to-l from-sky-500/30 to-violet-500/30 text-white shadow-[0_0_20px_rgba(56,189,248,0.2)]'
                          : 'border border-transparent text-slate-400 hover:text-slate-100'
                      } disabled:cursor-not-allowed disabled:opacity-35`}
                    >
                      <span className="whitespace-nowrap">{opt.label}</span>
                      <span className="font-mono text-[11px] text-slate-400 tabular-nums">
                        ({count})
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div>
            <label
              htmlFor="challenger-name"
              className="mb-2 block text-sm font-semibold text-slate-200"
            >
              أدخل اسمك للمشاركة
            </label>
            <input
              id="challenger-name"
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (localError) setLocalError(null);
              }}
              placeholder="مثال: أحمد، سارة، أو لقبك المفضل..."
              maxLength={60}
              disabled={globalPaused || quizPaused || starting}
              autoComplete="name"
              className="w-full rounded-2xl border border-slate-700/80 bg-slate-900/75 px-5 py-4 text-base text-white placeholder-slate-500 outline-none transition-all duration-200 focus:border-sky-400 focus:bg-slate-900 focus:shadow-[0_0_25px_rgba(56,189,248,0.2)] disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>

          {(localError || error) && (
            <div className="flex items-center gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-2.5 text-sm text-rose-200">
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
              <span>{localError || error}</span>
            </div>
          )}

          <motion.button
            type="submit"
            disabled={disabled || name.trim().length < 2}
            whileHover={
              !disabled && name.trim().length >= 2
                ? { scale: 1.02, y: -2 }
                : undefined
            }
            whileTap={
              !disabled && name.trim().length >= 2 ? { scale: 0.98 } : undefined
            }
            transition={{ duration: 0.18 }}
            className="group relative flex w-full items-center justify-center gap-3 overflow-hidden rounded-2xl bg-gradient-to-l from-sky-500 via-indigo-600 to-violet-600 px-8 py-4 text-lg font-bold text-white shadow-[0_12px_40px_rgba(56,189,248,0.32)] transition-all duration-200 hover:shadow-[0_16px_50px_rgba(139,92,246,0.48)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-400 disabled:cursor-not-allowed disabled:opacity-45 disabled:shadow-none"
          >
            <span className="relative z-10 flex items-center gap-2.5 whitespace-nowrap">
              {starting ? (
                <>
                  <Sparkles className="h-5 w-5 animate-spin" />
                  <span>جارٍ فتح بوابة التحدي...</span>
                </>
              ) : (
                <>
                  <span>ابدأ التحدي 🚀</span>
                  <ArrowLeft className="h-5 w-5 transition-transform duration-200 group-hover:-translate-x-1" />
                </>
              )}
            </span>
          </motion.button>
        </form>
      </div>
    </motion.section>
  );
}
