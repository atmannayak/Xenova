import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Activity, ShieldCheck, Zap } from 'lucide-react';

const LOADING_STEPS = [
  { text: 'Initializing Xenova engine...', icon: Sparkles },
  { text: 'Connecting secure workspace...', icon: ShieldCheck },
  { text: 'Syncing finance & productivity data...', icon: Activity },
  { text: 'Ready!', icon: Zap },
];

export default function SplashScreen({ onComplete }) {
  const [progress, setProgress] = useState(0);
  const [stepIndex, setStepIndex] = useState(0);

  useEffect(() => {
    // Progress Bar Counter Simulation
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => {
            if (onComplete) onComplete();
          }, 400);
          return 100;
        }
        return prev + 2;
      });
    }, 30);

    return () => clearInterval(interval);
  }, [onComplete]);

  useEffect(() => {
    if (progress > 75) setStepIndex(3);
    else if (progress > 50) setStepIndex(2);
    else if (progress > 25) setStepIndex(1);
    else setStepIndex(0);
  }, [progress]);

  const CurrentIcon = LOADING_STEPS[stepIndex].icon;

  return (
    <motion.div
      initial={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 1.05, filter: 'blur(10px)' }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-zinc-950 text-zinc-100 overflow-hidden select-none"
    >
      {/* Ambient Pulsing Background Glows */}
      <motion.div
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.25, 0.45, 0.25],
        }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[30rem] h-[30rem] bg-indigo-600/20 rounded-full blur-[120px] pointer-events-none"
      />
      <motion.div
        animate={{
          scale: [1.2, 1, 1.2],
          opacity: [0.2, 0.35, 0.2],
        }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[24rem] h-[24rem] bg-purple-600/20 rounded-full blur-[100px] pointer-events-none"
      />

      {/* Main Content Container */}
      <div className="relative z-10 flex flex-col items-center max-w-sm px-6 text-center">
        
        {/* Animated Brand Icon Ring */}
        <div className="relative mb-8">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 10, repeat: Infinity, ease: 'linear' }}
            className="absolute -inset-3 rounded-2xl bg-gradient-to-tr from-indigo-500 via-purple-500 to-indigo-500 opacity-40 blur-sm"
          />
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className="relative w-20 h-20 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center shadow-2xl"
          >
            <Sparkles className="w-10 h-10 text-indigo-400" />
          </motion.div>
        </div>

        {/* Title */}
        <motion.h1
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-3xl font-extrabold tracking-wider text-white mb-2"
        >
          XENOVA
        </motion.h1>

        {/* Dynamic Loading Step Text */}
        <div className="h-6 flex items-center justify-center gap-2 text-xs font-medium text-zinc-400 mb-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={stepIndex}
              initial={{ y: 6, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -6, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="flex items-center gap-2"
            >
              <CurrentIcon className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
              <span>{LOADING_STEPS[stepIndex].text}</span>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Progress Bar Container */}
        <div className="w-full bg-zinc-900/80 border border-zinc-800/80 p-1 rounded-full overflow-hidden shadow-inner mb-3">
          <motion.div
            className="h-2 bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-400 rounded-full"
            style={{ width: `${progress}%` }}
            transition={{ ease: 'easeOut' }}
          />
        </div>

        {/* Percentage Counter */}
        <span className="text-[11px] font-mono text-zinc-500 tracking-wider">
          {progress}%
        </span>
      </div>
    </motion.div>
  );
}