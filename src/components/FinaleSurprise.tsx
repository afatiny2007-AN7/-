import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import confetti from 'canvas-confetti';
import { RotateCcw } from 'lucide-react';
import { soundFX } from '../lib/sound';

interface FinaleSurpriseProps {
  participantName: string;
  onBackHome: () => void;
}

type FinalePhase = 'typing' | 'burst' | 'pause' | 'reveal';

const TYPEWRITER_TEXT = 'لقد........';

export function FinaleSurprise({
  participantName,
  onBackHome,
}: FinaleSurpriseProps) {
  const [phase, setPhase] = useState<FinalePhase>('typing');
  const [typedChars, setTypedChars] = useState(0);

  useEffect(() => {
    soundFX.playSuspenseRiser();

    // Typewriter progression for "لقد........"
    const typeInterval = window.setInterval(() => {
      setTypedChars((prev) => {
        if (prev >= TYPEWRITER_TEXT.length) {
          window.clearInterval(typeInterval);
          return prev;
        }
        return prev + 1;
      });
    }, 145);

    const burstTimer = window.setTimeout(() => {
      setPhase('burst');
      soundFX.playExplosionBurst();
      confetti({
        particleCount: 110,
        spread: 85,
        origin: { y: 0.55 },
        colors: ['#38BDF8', '#A855F7', '#FBBF24', '#F8FAFC'],
      });
    }, 2000);

    const pauseTimer = window.setTimeout(() => {
      setPhase('pause');
    }, 3900);

    const revealTimer = window.setTimeout(() => {
      setPhase('reveal');
      soundFX.playPrankReveal();
      confetti({
        particleCount: 90,
        angle: 60,
        spread: 70,
        origin: { x: 0.15, y: 0.65 },
        colors: ['#FBBF24', '#38BDF8', '#EC4899'],
      });
      confetti({
        particleCount: 90,
        angle: 120,
        spread: 70,
        origin: { x: 0.85, y: 0.65 },
        colors: ['#FBBF24', '#A855F7', '#34D399'],
      });
    }, 5100);

    return () => {
      window.clearInterval(typeInterval);
      window.clearTimeout(burstTimer);
      window.clearTimeout(pauseTimer);
      window.clearTimeout(revealTimer);
    };
  }, []);

  return (
    <section className="relative mx-auto flex min-h-[65vh] w-full max-w-3xl flex-col items-center justify-center px-4 text-center">
      {/* Light Burst Aura on Explosion & Reveal */}
      <AnimatePresence>
        {(phase === 'burst' || phase === 'reveal') && (
          <motion.div
            key={`aura-${phase}`}
            initial={{ opacity: 0, scale: 0.4 }}
            animate={{ opacity: [0.85, 0.25], scale: [0.6, 1.5] }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.1, ease: 'easeOut' }}
            className="pointer-events-none absolute inset-0 mx-auto my-auto h-80 w-80 rounded-full bg-gradient-to-tr from-amber-400/35 via-sky-500/25 to-violet-500/25 blur-3xl"
            aria-hidden="true"
          />
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        {phase === 'typing' && (
          <motion.div
            key="phase-typing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 1.15 }}
            transition={{ duration: 0.35 }}
            className="flex flex-col items-center"
          >
            <p className="text-4xl font-extrabold tracking-wide text-sky-200 sm:text-6xl">
              {TYPEWRITER_TEXT.slice(0, typedChars)}
              <span className="inline-block w-1 animate-pulse text-amber-300">|</span>
            </p>
          </motion.div>
        )}

        {(phase === 'burst' || phase === 'pause') && (
          <motion.div
            key="phase-burst"
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{
              opacity: phase === 'pause' ? 0.65 : 1,
              scale: phase === 'pause' ? 0.96 : 1,
            }}
            exit={{ opacity: 0, scale: 0.85, filter: 'blur(6px)' }}
            transition={{ type: 'spring', stiffness: 260, damping: 18 }}
            className="relative z-10 rounded-3xl border border-amber-400/35 bg-slate-950/75 px-8 py-12 shadow-[0_0_90px_rgba(251,191,36,0.35)] backdrop-blur-2xl"
          >
            <h2 className="text-balance text-3xl font-extrabold leading-tight text-transparent bg-clip-text bg-gradient-to-l from-amber-300 via-yellow-200 to-sky-300 sm:text-5xl">
              حصلت على النتيييييييييجة!!! 🔥
            </h2>
            {phase === 'pause' && (
              <p className="mt-5 animate-pulse text-base font-medium text-slate-300">
                لحظة واحدة...
              </p>
            )}
          </motion.div>
        )}

        {phase === 'reveal' && (
          <motion.div
            key="phase-reveal"
            initial={{ opacity: 0, scale: 0.75, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 220, damping: 16 }}
            className="relative z-10 w-full rounded-3xl border border-violet-400/30 bg-slate-950/80 p-8 shadow-[0_24px_90px_rgba(139,92,246,0.32)] backdrop-blur-2xl sm:p-12"
          >
            <div className="mb-4 text-sm font-semibold text-amber-300">
              المتحدي: {participantName}
            </div>

            <h2 className="text-balance text-3xl font-extrabold leading-snug text-white sm:text-5xl">
              أمزح معاك 😂😂
            </h2>

            <p className="mt-4 text-balance text-2xl font-extrabold text-transparent bg-clip-text bg-gradient-to-l from-sky-300 via-violet-300 to-amber-300 sm:text-4xl">
              النتيجة عند الأدمييييييين ههههه!
            </p>

            <p className="mt-6 text-base font-medium text-slate-300 sm:text-lg">
              انتظر إعلان نتيجتك من الإدارة 👀
            </p>

            <div className="mt-9 flex justify-center">
              <motion.button
                type="button"
                onClick={onBackHome}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                transition={{ duration: 0.16 }}
                className="flex min-h-[44px] items-center gap-2 rounded-2xl border border-slate-600/70 bg-slate-900/80 px-6 py-3 text-sm font-bold text-slate-100 transition-colors hover:border-sky-400/60 hover:bg-slate-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-400"
              >
                <RotateCcw className="h-4 w-4" />
                <span className="whitespace-nowrap">العودة إلى الصفحة الرئيسية</span>
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
