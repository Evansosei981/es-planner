import React, { useEffect } from 'react';
import {
  Trophy,
  TrendingUp,
  BookOpen,
  Award,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Target,
  Flame,
  BarChart3,
  GraduationCap
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useApp } from '../context/AppContext';
import { getCourseColor } from '../theme/colors';

export const ProgressScreen: React.FC = () => {
  const {
    totalStudyMinutes,
    weeklyGoal,
    courseStats,
    completedSessionsCount,
    courses,
    practiceOverallStats,
    practiceStreak
  } = useApp();

  const totalHours = totalStudyMinutes / 60;
  const goalHours = weeklyGoal.targetHoursPerWeek || 20;
  const progressRatio = Math.min(1, totalHours / goalHours);
  const progressPercent = Math.round(progressRatio * 100);
  const isGoalAchieved = progressRatio >= 1;

  // Trigger celebration confetti when weekly goal reached
  useEffect(() => {
    if (isGoalAchieved) {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 }
      });
    }
  }, [isGoalAchieved]);

  const maxCourseMinutes = Math.max(1, ...courseStats.map(c => c.totalMinutes));

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-36 md:pb-16 space-y-6">
      {/* Standard Header: Title left, Actions/Summary right */}
      <header className="flex items-center justify-between gap-4 pb-1">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
            Progress
          </h1>
          <p className="text-xs text-gray-400 mt-0.5">
            Weekly study analytics and concept retention
          </p>
        </div>

        {/* Streak shown once on Progress screen */}
        {practiceStreak.currentStreak > 0 && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold text-[#FF7A00] bg-[#FF7A00]/15 border border-[#FF7A00]/30 shrink-0">
            <Flame className="w-4 h-4 fill-[#FF7A00]" />
            <span>{practiceStreak.currentStreak} Day Streak</span>
          </div>
        )}
      </header>

      {/* ONE HEADLINE METRIC & WEEKLY PROGRESS RING */}
      <section className="bg-[#15151E] border border-white/5 rounded-3xl p-6 shadow-xl flex flex-col items-center text-center relative overflow-hidden">
        {/* Subtle glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-[#7C5CFC]/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative w-44 h-44 flex items-center justify-center my-2">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 200 200">
            <circle
              cx="100"
              cy="100"
              r="85"
              fill="transparent"
              stroke="rgba(255, 255, 255, 0.06)"
              strokeWidth="18"
            />
            <circle
              cx="100"
              cy="100"
              r="85"
              fill="transparent"
              stroke="url(#progressGradient)"
              strokeWidth="18"
              strokeDasharray={534}
              strokeDashoffset={534 * (1 - progressRatio)}
              strokeLinecap="round"
              className="transition-all duration-1000 ease-out"
            />
            <defs>
              <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#7C5CFC" />
                <stop offset="100%" stopColor="#00D4A1" />
              </linearGradient>
            </defs>
          </svg>

          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            <span className="text-3xl sm:text-4xl font-black text-white leading-none tabular-nums">
              {totalHours.toFixed(1)}h
            </span>
            <span className="text-xs text-gray-400 mt-1 font-semibold">
              of {goalHours.toFixed(0)}h goal
            </span>
          </div>
        </div>

        <div className="mt-3 flex items-center gap-2">
          {isGoalAchieved ? (
            <div className="flex items-center gap-2 text-[#00D4A1] font-bold text-xs sm:text-sm bg-[#00D4A1]/15 px-4 py-1.5 rounded-full border border-[#00D4A1]/30">
              <Trophy className="w-4 h-4" />
              <span>Weekly Goal Achieved!</span>
            </div>
          ) : (
            <span className="text-xs sm:text-sm font-bold text-[#7C5CFC] bg-[#7C5CFC]/15 px-4 py-1.5 rounded-full border border-[#7C5CFC]/30">
              {progressPercent}% of weekly target
            </span>
          )}
        </div>
      </section>

      {/* DISTINCT METRIC TILES (No duplicate of totalHours!) */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-[#15151E] border border-white/5 rounded-2xl p-4 flex flex-col items-center text-center shadow-md">
          <span className="text-2xl font-black text-[#00D4A1] tracking-tight tabular-nums">
            {completedSessionsCount}
          </span>
          <span className="text-[11px] font-semibold text-gray-400 mt-1">Completed Sessions</span>
        </div>

        <div className="bg-[#15151E] border border-white/5 rounded-2xl p-4 flex flex-col items-center text-center shadow-md">
          <span className="text-2xl font-black text-[#7C5CFC] tracking-tight tabular-nums">
            {practiceOverallStats.accuracyPercentage}%
          </span>
          <span className="text-[11px] font-semibold text-gray-400 mt-1">Practice Accuracy</span>
        </div>

        <div className="bg-[#15151E] border border-white/5 rounded-2xl p-4 flex flex-col items-center text-center shadow-md">
          <span className="text-2xl font-black text-white tracking-tight tabular-nums">
            {courses.length}
          </span>
          <span className="text-[11px] font-semibold text-gray-400 mt-1">Enrolled Courses</span>
        </div>
      </div>

      {/* HOURS BY COURSE BREAKDOWN */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-white tracking-tight">Hours by Course</h2>
          <span className="text-xs text-gray-400">Total logged</span>
        </div>

        {courseStats.length === 0 ? (
          <div className="bg-[#15151E] border border-white/5 rounded-3xl p-8 text-center flex flex-col items-center justify-center space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-[#1D1D29] text-gray-400 flex items-center justify-center">
              <BarChart3 className="w-6 h-6 stroke-[1.75]" />
            </div>
            <p className="text-xs text-gray-400 max-w-xs">
              Complete study sessions with the focus timer to track your per-course hours here.
            </p>
          </div>
        ) : (
          <div className="bg-[#15151E] border border-white/5 rounded-3xl p-5 shadow-xl space-y-4">
            {courseStats.map(stat => {
              const color = getCourseColor(stat.colorIndex);
              const barPercent = Math.min(100, Math.round((stat.totalMinutes / maxCourseMinutes) * 100));
              const hours = (stat.totalMinutes / 60).toFixed(1);

              return (
                <div key={stat.courseId} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span className="text-white truncate max-w-[240px]">
                      {stat.courseName}
                    </span>
                    <span style={{ color }} className="font-bold tabular-nums">
                      {hours}h
                    </span>
                  </div>
                  <div className="w-full h-2.5 bg-white/5 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{
                        width: `${barPercent}%`,
                        backgroundColor: color
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* PRACTICE MASTERY & TOPIC FOCUS (Moved from Daily Practice) */}
      <section className="space-y-3 pt-1">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Target className="w-4 h-4 text-[#7C5CFC]" />
            <span>Topic Mastery & Focus Areas</span>
          </h2>
          <span className="text-xs text-gray-400 font-semibold tabular-nums">
            {practiceOverallStats.totalSolved} solved
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Needs Practice */}
          <div className="bg-[#15151E] border border-white/5 rounded-3xl p-5 space-y-3">
            <div className="flex items-center gap-2 text-[#EF4444]">
              <AlertCircle className="w-4 h-4" />
              <h3 className="text-sm font-bold text-white">Focus Areas (Needs Practice)</h3>
            </div>

            {practiceOverallStats.needsPracticeTopics.length > 0 ? (
              <div className="flex flex-wrap items-center gap-2">
                {practiceOverallStats.needsPracticeTopics.map(topic => (
                  <span
                    key={topic}
                    className="px-2.5 py-1 rounded-xl bg-[#EF4444]/10 border border-[#EF4444]/25 text-[#EF4444] text-xs font-semibold"
                  >
                    {topic}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-xs text-gray-400">
                No weak areas detected yet. Keep answering daily questions to track focus areas.
              </p>
            )}
          </div>

          {/* Mastered Topics */}
          <div className="bg-[#15151E] border border-white/5 rounded-3xl p-5 space-y-3">
            <div className="flex items-center gap-2 text-[#00D4A1]">
              <CheckCircle2 className="w-4 h-4" />
              <h3 className="text-sm font-bold text-white">Mastered Topics</h3>
            </div>

            {practiceOverallStats.strongTopics.length > 0 ? (
              <div className="flex flex-wrap items-center gap-2">
                {practiceOverallStats.strongTopics.map(topic => (
                  <span
                    key={topic}
                    className="px-2.5 py-1 rounded-xl bg-[#00D4A1]/10 border border-[#00D4A1]/25 text-[#00D4A1] text-xs font-semibold"
                  >
                    {topic}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-xs text-gray-400">
                Solve questions accurately in Daily Practice to build up your mastered topics list.
              </p>
            )}
          </div>
        </div>
      </section>
    </div>
  );
};
