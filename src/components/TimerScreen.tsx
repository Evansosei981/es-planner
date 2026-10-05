import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  ArrowLeft,
  Play,
  Pause,
  RotateCcw,
  CheckCircle,
  FileText,
  Sparkles,
  Minus,
  Plus
} from 'lucide-react';
import { StudySession } from '../types';
import { useApp } from '../context/AppContext';
import { getCourseColor } from '../theme/colors';
import { playSound } from '../utils/sound';

interface TimerScreenProps {
  session: StudySession;
  onNavigateBack: () => void;
}

export const TimerScreen: React.FC<TimerScreenProps> = ({ session, onNavigateBack }) => {
  const { toggleSessionComplete, addLearningNote } = useApp();

  const [durationMinutes, setDurationMinutes] = useState(session.durationMinutes || 25);
  const totalSeconds = durationMinutes * 60;

  // Restore state from localStorage if session was running
  const [remainingSeconds, setRemainingSeconds] = useState(totalSeconds);
  const [isRunning, setIsRunning] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [reflectionText, setReflectionText] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const targetEndTimeRef = useRef<number | null>(null);
  const wakeLockRef = useRef<any>(null);
  const color = getCourseColor(session.colorIndex);

  // Initialize and check saved timer for this session
  useEffect(() => {
    const saved = localStorage.getItem(`es_timer_${session.id}`);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.durationMinutes) {
          setDurationMinutes(parsed.durationMinutes);
        }
        if (parsed.isRunning && parsed.targetEndTime > Date.now()) {
          targetEndTimeRef.current = parsed.targetEndTime;
          setRemainingSeconds(Math.max(0, Math.ceil((parsed.targetEndTime - Date.now()) / 1000)));
          setIsRunning(true);
        } else if (parsed.remainingSeconds !== undefined) {
          setRemainingSeconds(parsed.remainingSeconds);
        }
      } catch {}
    }
  }, [session.id]);

  // Keep screen awake while running using Web Wake Lock API
  useEffect(() => {
    if (isRunning && 'wakeLock' in navigator) {
      navigator.wakeLock.request('screen')
        .then(wl => {
          wakeLockRef.current = wl;
        })
        .catch(() => {});
    } else {
      if (wakeLockRef.current) {
        wakeLockRef.current.release().catch(() => {});
        wakeLockRef.current = null;
      }
    }

    return () => {
      if (wakeLockRef.current) {
        wakeLockRef.current.release().catch(() => {});
      }
    };
  }, [isRunning]);

  // Timer interval with wall-clock time so it survives backgrounding & rotation
  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (isRunning) {
      if (!targetEndTimeRef.current) {
        targetEndTimeRef.current = Date.now() + remainingSeconds * 1000;
      }

      // Save state to localStorage
      localStorage.setItem(`es_timer_${session.id}`, JSON.stringify({
        isRunning: true,
        targetEndTime: targetEndTimeRef.current,
        durationMinutes
      }));

      interval = setInterval(() => {
        if (!targetEndTimeRef.current) return;
        const now = Date.now();
        const diffSeconds = Math.max(0, Math.ceil((targetEndTimeRef.current - now) / 1000));

        setRemainingSeconds(diffSeconds);

        if (diffSeconds <= 0) {
          setIsRunning(false);
          setIsFinished(true);
          targetEndTimeRef.current = null;
          localStorage.removeItem(`es_timer_${session.id}`);
          playSound('study_break');
        }
      }, 500);
    } else {
      targetEndTimeRef.current = null;
      localStorage.setItem(`es_timer_${session.id}`, JSON.stringify({
        isRunning: false,
        remainingSeconds,
        durationMinutes
      }));
    }

    return () => clearInterval(interval);
  }, [isRunning, remainingSeconds, session.id, durationMinutes]);

  // Handle visibility changes (returning to tab / waking phone)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && isRunning && targetEndTimeRef.current) {
        const diffSeconds = Math.max(0, Math.ceil((targetEndTimeRef.current - Date.now()) / 1000));
        setRemainingSeconds(diffSeconds);
        if (diffSeconds <= 0) {
          setIsRunning(false);
          setIsFinished(true);
          targetEndTimeRef.current = null;
          playSound('study_break');
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [isRunning]);

  const handleStart = () => {
    if (!isRunning && remainingSeconds === totalSeconds) {
      playSound('study_starting');
    }
    targetEndTimeRef.current = Date.now() + remainingSeconds * 1000;
    setIsRunning(true);
  };

  const handlePause = () => {
    setIsRunning(false);
    targetEndTimeRef.current = null;
  };

  const handleReset = () => {
    setIsRunning(false);
    targetEndTimeRef.current = null;
    setRemainingSeconds(totalSeconds);
    setIsFinished(false);
    localStorage.removeItem(`es_timer_${session.id}`);
  };

  const handleSelectPreset = (mins: number) => {
    if (isRunning) return;
    setDurationMinutes(mins);
    setRemainingSeconds(mins * 60);
    setIsFinished(false);
  };

  const handleAdjustMinutes = (delta: number) => {
    if (isRunning) return;
    const newMins = Math.max(5, Math.min(180, durationMinutes + delta));
    setDurationMinutes(newMins);
    setRemainingSeconds(newMins * 60);
    setIsFinished(false);
  };

  // ONE Finish session action
  const handleFinishSession = () => {
    setIsSaving(true);
    setIsRunning(false);
    targetEndTimeRef.current = null;
    localStorage.removeItem(`es_timer_${session.id}`);

    // Mark session complete if not already
    if (!session.completed) {
      toggleSessionComplete(session.id);
    }

    // Save learning note if reflection text entered
    if (reflectionText.trim()) {
      addLearningNote({
        relatedId: session.id,
        type: 'STUDY_SESSION',
        title: session.courseName,
        content: reflectionText.trim()
      });
    }

    setTimeout(() => {
      onNavigateBack();
    }, 200);
  };

  const mins = Math.floor(remainingSeconds / 60);
  const secs = remainingSeconds % 60;

  // RULE: Ring is EMPTY at "Ready", fills as time passes!
  const elapsedSeconds = totalSeconds - remainingSeconds;
  const progressRatio = totalSeconds > 0 ? Math.min(1, Math.max(0, elapsedSeconds / totalSeconds)) : 0;
  // 880 is perimeter (2 * pi * r where r=140). Empty when offset=880, full when offset=0.
  const strokeDashoffset = 880 * (1 - progressRatio);

  return (
    <div className="min-h-screen bg-[var(--color-page-bg)] text-[var(--color-text-primary)] flex flex-col p-4 sm:p-6 max-w-lg mx-auto">
      {/* Header: Title left, Back left */}
      <header className="flex items-center justify-between pb-2 shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={onNavigateBack}
            className="min-w-[48px] min-h-[48px] -ml-2 rounded-2xl bg-[#EEF0F8] hover:bg-[#E2E5F2] text-[#555A70] hover:text-[#14161F] dark:bg-[#15151E] dark:hover:bg-[#1D1D29] dark:text-gray-300 dark:hover:text-white border border-[#D9DCE8] dark:border-white/5 transition-colors flex items-center justify-center active:scale-95"
            aria-label="Back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-[#14161F] dark:text-white">Study Timer</h1>
            <p className="text-xs font-semibold" style={{ color }}>
              {session.courseName}
            </p>
          </div>
        </div>

        {isFinished && (
          <span className="px-3 py-1 rounded-full text-xs font-bold text-[#0B7A50] dark:text-[#00D4A1] bg-[rgba(11,122,80,0.1)] dark:bg-[#00D4A1]/15 border border-[#0B7A50]/25 dark:border-[#00D4A1]/30 flex items-center gap-1.5 animate-pulse">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Finished!</span>
          </span>
        )}
      </header>

      {/* Main Timer Display */}
      <div className="flex-1 flex flex-col items-center justify-center py-4 space-y-6">
        {/* Circular Progress Gauge */}
        <div className="relative w-64 h-64 sm:w-72 sm:h-72 flex items-center justify-center select-none">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 300 300">
            {/* Background Track (#E3E6F0 in light, rgba(255,255,255,0.06) in dark) */}
            <circle
              cx="150"
              cy="150"
              r="140"
              fill="transparent"
              stroke="var(--color-progress-track)"
              strokeWidth="16"
            />
            {/* Active Progress: Starts empty at Ready, fills as time passes */}
            <circle
              cx="150"
              cy="150"
              r="140"
              fill="transparent"
              stroke={color}
              strokeWidth="16"
              strokeDasharray={880}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              className="transition-all duration-500 ease-linear"
            />
          </svg>

          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            <span className="font-mono text-5xl sm:text-6xl font-black tracking-tight text-[#14161F] dark:text-white tabular-nums">
              {String(mins).padStart(2, '0')}:{String(secs).padStart(2, '0')}
            </span>
            <span className="text-xs font-semibold uppercase tracking-widest text-gray-400 mt-2">
              {isRunning ? "Deep Focus" : isFinished ? "Completed" : "Ready"}
            </span>
          </div>
        </div>

        {/* Adjustable Duration: Presets (25/45/60/75) & Stepper */}
        {!isRunning && (
          <div className="space-y-2 w-full max-w-xs animate-in fade-in">
            <div className="flex items-center justify-between text-xs text-gray-400 px-1 font-semibold">
              <span>Duration Presets</span>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => handleAdjustMinutes(-5)}
                  className="w-6 h-6 rounded-lg bg-white/5 hover:bg-white/10 active:scale-95 flex items-center justify-center text-white"
                  title="Subtract 5 mins"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <span className="text-white font-bold tabular-nums">{durationMinutes}m</span>
                <button
                  type="button"
                  onClick={() => handleAdjustMinutes(5)}
                  className="w-6 h-6 rounded-lg bg-white/5 hover:bg-white/10 active:scale-95 flex items-center justify-center text-white"
                  title="Add 5 mins"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-4 gap-2">
              {[25, 45, 60, 75].map(preset => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => handleSelectPreset(preset)}
                  className={`h-9 rounded-xl text-xs font-bold transition-all ${
                    durationMinutes === preset
                      ? 'bg-[#7C5CFC] text-white shadow-md'
                      : 'bg-[#15151E] hover:bg-[#1D1D29] text-gray-300 border border-white/5'
                  }`}
                >
                  {preset}m
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Labelled Pause, Reset & Start/Resume Buttons */}
        <div className="flex items-center justify-center gap-3 pt-2">
          {/* Labelled Reset Button */}
          <button
            onClick={handleReset}
            className="min-h-[48px] px-4 rounded-2xl bg-[#15151E] border border-white/5 hover:bg-[#1D1D29] text-gray-300 hover:text-white flex items-center gap-2 text-xs font-bold transition-all active:scale-95 shadow-md"
            title="Reset timer"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Reset</span>
          </button>

          {/* Labelled Start / Pause / Resume Button */}
          {!isRunning ? (
            <button
              onClick={handleStart}
              className="min-h-[48px] px-7 rounded-2xl bg-[#7C5CFC] hover:bg-[#6c4be8] text-white font-extrabold text-sm flex items-center gap-2 shadow-xl shadow-[#7C5CFC]/30 active:scale-95 transition-all"
              title="Start focus timer"
            >
              <Play className="w-4 h-4 fill-white" />
              <span>{remainingSeconds < totalSeconds && remainingSeconds > 0 ? "Resume" : "Start"}</span>
            </button>
          ) : (
            <button
              onClick={handlePause}
              className="min-h-[48px] px-7 rounded-2xl bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-sm flex items-center gap-2 shadow-xl shadow-amber-500/25 active:scale-95 transition-all"
              title="Pause focus timer"
            >
              <Pause className="w-4 h-4 fill-black" />
              <span>Pause</span>
            </button>
          )}
        </div>
      </div>

      {/* Notes Field (positioned above keyboard) & ONE Finish Session Action */}
      <div className="bg-[#15151E] border border-white/5 rounded-3xl p-4 sm:p-5 shadow-xl space-y-3 shrink-0 mb-2">
        <div className="flex items-center justify-between">
          <label
            htmlFor="timer-notes"
            className="text-xs font-bold text-gray-300 uppercase tracking-wider flex items-center gap-1.5 cursor-pointer"
          >
            <FileText className="w-4 h-4 text-[#7C5CFC]" />
            <span>Session Notes</span>
          </label>
          <span className="text-[11px] text-gray-500">Saves to journal</span>
        </div>

        <textarea
          id="timer-notes"
          rows={2}
          value={reflectionText}
          onChange={e => setReflectionText(e.target.value)}
          placeholder="Key concepts reviewed or ideas to remember..."
          className="w-full bg-[#1D1D29] border border-white/10 focus:border-[#7C5CFC] rounded-2xl p-3 text-xs text-white placeholder-gray-500 outline-none resize-none transition-colors"
        />

        {/* ONE Finish session action (Purple = actions) */}
        <button
          onClick={handleFinishSession}
          disabled={isSaving}
          className="w-full min-h-[48px] bg-[#7C5CFC] hover:bg-[#6c4be8] active:scale-[0.99] text-white font-extrabold rounded-2xl shadow-xl shadow-[#7C5CFC]/25 transition-all flex items-center justify-center gap-2 text-xs sm:text-sm cursor-pointer"
        >
          <CheckCircle className="w-4 h-4" />
          <span>Finish Session</span>
        </button>
      </div>
    </div>
  );
};
