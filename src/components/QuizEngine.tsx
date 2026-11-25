import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { AlertCircle, ArrowLeft, CheckCircle2, ImageOff } from 'lucide-react';
import { QuizQuestionPublic } from '../types/quiz';
import { soundFX } from '../lib/sound';

interface QuizEngineProps {
  participantName: string;
  quizTitle: string;
  currentIndex: number;
  totalQuestions: number;
  question: QuizQuestionPublic;
  submitting: boolean;
  error: string | null;
  onConfirmAnswer: (selectedOption: number) => void;
}

const OPTION_LETTERS = ['أ', 'ب', 'ج', 'د', 'هـ', 'و', 'ز', 'ح'];

export function QuizEngine({
  participantName,
  quizTitle,
  currentIndex,
  totalQuestions,
  question,
  submitting,
  error,
  onConfirmAnswer,
}: QuizEngineProps) {
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    setSelectedOption(null);
    setImgError(false);
  }, [question.id]);

  const progressPercent = Math.round(((currentIndex + 1) / totalQuestions) * 100);
  const formattedCurrent = String(currentIndex + 1).padStart(2, '0');
  const formattedTotal = String(totalQuestions).padStart(2, '0');
  const isLastQuestion = currentIndex + 1 >= totalQuestions;

  const handleSelect = (idx: number) => {
    if (submitting) return;
    setSelectedOption(idx);
    soundFX.playSelect();
  };

  const handleConfirm = () => {
    if (selectedOption === null || submitting) return;
    soundFX.playConfirm();
    onConfirmAnswer(selectedOption);
  };

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className="mx-auto flex w-full max-w-3xl flex-col"
    >
      {/* Top Progress HUD (Distraction-free, zero scores) */}
      <div className="mb-6 rounded-2xl border border-slate-300/12 bg-slate-950/65 px-5 py-4 backdrop-blur-xl">
        <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
          <div className="flex items-center gap-2 text-slate-300">
            <span className="font-semibold text-white">{quizTitle}</span>
            <span aria-hidden="true" className="text-slate-600">·</span>
            <span className="text-slate-400">{participantName}</span>
          </div>

          <div className="flex items-center gap-2 font-mono text-sm font-bold text-amber-300 tabular-nums" dir="ltr">
            <span>{formattedCurrent}</span>
            <span className="text-slate-500">/</span>
            <span className="text-slate-400">{formattedTotal}</span>
          </div>
        </div>

        {/* Animated Progress Bar */}
        <div className="mt-3.5 h-2.5 w-full overflow-hidden rounded-full bg-slate-900/90 p-0.5">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progressPercent}%` }}
            transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
            className="h-full rounded-full bg-gradient-to-l from-amber-400 via-sky-400 to-violet-500 shadow-[0_0_16px_rgba(56,189,248,0.6)]"
          />
        </div>
      </div>

      {/* Single Question Stage: Strict One Question At A Time */}
      <AnimatePresence mode="wait">
        <motion.div
          key={question.id}
          initial={{ opacity: 0, x: -36, rotateY: -4, scale: 0.97 }}
          animate={{ opacity: 1, x: 0, rotateY: 0, scale: 1 }}
          exit={{ opacity: 0, x: 36, rotateY: 4, scale: 0.96 }}
          transition={{ duration: 0.38, ease: [0.16, 1, 0.3, 1] }}
          className="rounded-3xl border border-slate-300/15 bg-slate-950/75 p-6 shadow-[0_24px_80px_rgba(2,6,23,0.85)] backdrop-blur-2xl sm:p-9"
        >
          {/* Question Header Metadata */}
          <div className="mb-4 flex flex-wrap items-center gap-2 text-xs font-semibold text-sky-300/90 sm:text-sm">
            <span className="tabular-nums">السؤال {formattedCurrent} من {formattedTotal}</span>
            <span aria-hidden="true" className="text-slate-600">·</span>
            <span
              className={
                question.difficulty === 'easy'
                  ? 'text-emerald-300'
                  : question.difficulty === 'hard'
                    ? 'text-rose-300'
                    : 'text-amber-300'
              }
            >
              المستوى:{' '}
              {question.difficulty === 'easy'
                ? 'سهل'
                : question.difficulty === 'hard'
                  ? 'صعب'
                  : 'متوسط'}
            </span>
            <span aria-hidden="true" className="text-slate-600">·</span>
            <span className="text-slate-400">اختر إجابة واحدة</span>
          </div>

          {/* Question Text */}
          <h2 className="text-balance text-xl font-bold leading-relaxed text-white sm:text-2xl">
            {question.question}
          </h2>

          {/* Optional Question Image with Zero-Broken-Image Policy */}
          {question.imageUrl && (
            <div className="mt-5 overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/80">
              {!imgError ? (
                <img
                  src={question.imageUrl}
                  alt={question.question}
                  referrerPolicy="no-referrer"
                  onError={() => setImgError(true)}
                  className="max-h-64 w-full object-contain"
                />
              ) : (
                <div className="flex h-32 items-center justify-center gap-2 text-sm text-slate-400">
                  <ImageOff className="h-4 w-4" />
                  <span>تعذر تحميل صورة السؤال</span>
                </div>
              )}
            </div>
          )}

          {/* Options List */}
          <div className="mt-7 grid grid-cols-1 gap-3.5">
            {question.options.map((option, idx) => {
              const isSelected = selectedOption === idx;
              const letter = OPTION_LETTERS[idx] ?? String(idx + 1);
              return (
                <motion.button
                  key={`${question.id}-opt-${idx}`}
                  type="button"
                  disabled={submitting}
                  onClick={() => handleSelect(idx)}
                  whileHover={!submitting ? { scale: 1.01, x: -3 } : undefined}
                  whileTap={!submitting ? { scale: 0.99 } : undefined}
                  transition={{ duration: 0.16 }}
                  className={`group flex min-h-[56px] w-full items-center justify-between gap-4 rounded-2xl border px-5 py-3.5 text-right transition-all duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-400 ${
                    isSelected
                      ? 'border-sky-400 bg-gradient-to-l from-sky-500/20 via-indigo-500/15 to-violet-500/20 text-white shadow-[0_0_28px_rgba(56,189,248,0.28)]'
                      : 'border-slate-700/70 bg-slate-900/55 text-slate-200 hover:border-violet-400/50 hover:bg-slate-900/85 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-3.5">
                    <span
                      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border text-sm font-bold transition-colors ${
                        isSelected
                          ? 'border-amber-300/70 bg-amber-400/20 text-amber-200'
                          : 'border-slate-700 bg-slate-800/80 text-slate-400 group-hover:border-violet-400/50 group-hover:text-violet-200'
                      }`}
                    >
                      {letter}
                    </span>
                    <span className="text-base font-medium leading-snug sm:text-lg">
                      {option}
                    </span>
                  </div>

                  {isSelected && (
                    <CheckCircle2 className="h-5 w-5 shrink-0 text-sky-300" />
                  )}
                </motion.button>
              );
            })}
          </div>

          {error && (
            <div className="mt-5 flex items-center gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-2.5 text-sm text-rose-200">
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          {/* Confirm & Advance Button */}
          <div className="mt-8 flex items-center justify-end">
            <motion.button
              type="button"
              disabled={selectedOption === null || submitting}
              onClick={handleConfirm}
              whileHover={selectedOption !== null && !submitting ? { scale: 1.02 } : undefined}
              whileTap={selectedOption !== null && !submitting ? { scale: 0.98 } : undefined}
              transition={{ duration: 0.16 }}
              className="flex min-h-[48px] w-full items-center justify-center gap-2.5 rounded-2xl bg-gradient-to-l from-amber-400 via-amber-500 to-orange-500 px-7 py-3.5 text-base font-bold text-slate-950 shadow-[0_10px_32px_rgba(245,158,11,0.28)] transition-all duration-200 hover:shadow-[0_14px_40px_rgba(251,191,36,0.42)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-300 disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none sm:w-auto"
            >
              <span className="whitespace-nowrap">
                {submitting
                  ? 'جارٍ الحفظ...'
                  : isLastQuestion
                    ? 'إنهاء التحدي وإظهار النتيجة'
                    : 'تأكيد والانتقال للسؤال التالي'}
              </span>
              <ArrowLeft className="h-5 w-5" />
            </motion.button>
          </div>
        </motion.div>
      </AnimatePresence>
    </motion.section>
  );
}
