import React, { useMemo, useState } from 'react';
import {
  BookOpen,
  Plus,
  CheckCircle2,
  GraduationCap,
  Calendar,
  Flame,
  ArrowRight,
  ChevronRight,
  Clock,
  CalendarClock,
  Zap,
  Sparkles,
  Smartphone
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { getCourseColor } from '../theme/colors';
import { Exam } from '../types';
import { DayKey } from '../practice/DayKey';
import { InstallModal } from './InstallModal';
import { PWAInstallButton } from './PWAInstallButton';

export interface HomeScreenProps {
  onProfileClick: () => void;
  onNewSessionClick: () => void;
  onAskEvansClick: () => void;
  onSeeAllSchedule: () => void;
  onStartTutorial?: () => void;
  onStartPractice: () => void;
  onOpenDailyPracticeHub: () => void;
  onOpenDayPlanner?: () => void;
  onPlanExamRevision?: (exam: Exam) => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  onProfileClick,
  onNewSessionClick,
  onAskEvansClick,
  onSeeAllSchedule,
  onStartPractice,
  onOpenDailyPracticeHub,
  onOpenDayPlanner,
  onPlanExamRevision
}) => {
  const {
    userProfile,
    todaySchedule,
    upcomingExams,
    totalStudyMinutes,
    weeklyGoal,
    completedSessionsCount,
    currentTime,
    practiceStreak,
    todayPracticeResult,
    dailyQuestions,
    practiceSettings,
    courses,
    updatePracticeSettings,
    dayTasks,
    revisionPlans,
    autoFitTodayTasks
  } = useApp();

  const [autoFitStatus, setAutoFitStatus] = useState<string | null>(null);
  const [showInstallModal, setShowInstallModal] = useState(false);

  const todayKey = DayKey.getTodayKey();
  const todayTasks = useMemo(() => dayTasks.filter(t => t.dateKey === todayKey), [dayTasks, todayKey]);
  const todayTasksTotal = todayTasks.length;
  const todayTasksCompleted = todayTasks.filter(t => t.completed).length;
  const topPrioritiesCount = todayTasks.filter(t => t.isTopPriority).length;

  const handleQuickAutoFit = () => {
    const res = autoFitTodayTasks();
    setAutoFitStatus(`${res.fittedCount} fitted`);
    setTimeout(() => setAutoFitStatus(null), 3000);
  };

  const greetingName = userProfile.name.trim() || "Student";

  // Calmer, shorter greeting logic
  const { salutation, todayFormatted, nextExamChip } = useMemo(() => {
    const now = new Date();
    const hour = now.getHours();
    let timeGreeting = "Good morning";
    if (hour >= 12 && hour < 17) {
      timeGreeting = "Good afternoon";
    } else if (hour >= 17) {
      timeGreeting = "Good evening";
    }

    const formatted = now.toLocaleDateString(undefined, {
      weekday: 'long',
      month: 'short',
      day: 'numeric'
    });

    const nextExam = upcomingExams[0];
    let examChip: { text: string; bg: string; border: string; label: string } | null = null;
    if (nextExam) {
      const daysLeft = Math.max(0, Math.ceil((nextExam.timestampMillis - currentTime) / (1000 * 60 * 60 * 24)));
      if (daysLeft <= 14) {
        if (daysLeft < 3) {
          examChip = {
            text: 'text-[#EF4444]',
            bg: 'bg-[#EF4444]/15',
            border: 'border-[#EF4444]/30',
            label: daysLeft === 0 ? 'Exam Today' : daysLeft === 1 ? 'Exam Tomorrow' : `${nextExam.courseName} in ${daysLeft}d`
          };
        } else if (daysLeft < 7) {
          examChip = {
            text: 'text-[#F59E0B]',
            bg: 'bg-[#F59E0B]/15',
            border: 'border-[#F59E0B]/30',
            label: `${nextExam.courseName} in ${daysLeft}d`
          };
        } else {
          examChip = {
            text: 'text-gray-300',
            bg: 'bg-white/5',
            border: 'border-white/10',
            label: `${nextExam.courseName} in ${daysLeft}d`
          };
        }
      }
    }

    return {
      salutation: timeGreeting,
      todayFormatted: formatted,
      nextExamChip: examChip
    };
  }, [upcomingExams, currentTime]);

  // Exam urgency helper: Red (< 3 days), Amber (< 7 days), Neutral (>= 7 days)
  const getExamUrgency = (daysLeft: number) => {
    if (daysLeft < 3) {
      return {
        text: 'text-[#EF4444]',
        bg: 'bg-[#EF4444]/15',
        border: 'border-[#EF4444]/30',
        dot: 'bg-[#EF4444]',
        label: daysLeft === 0 ? 'Today!' : daysLeft === 1 ? 'Tomorrow' : `${daysLeft} days left`
      };
    }
    if (daysLeft < 7) {
      return {
        text: 'text-[#F59E0B]',
        bg: 'bg-[#F59E0B]/15',
        border: 'border-[#F59E0B]/30',
        dot: 'bg-[#F59E0B]',
        label: `${daysLeft} days left`
      };
    }
    return {
      text: 'text-gray-300',
      bg: 'bg-white/5',
      border: 'border-white/10',
      dot: 'bg-gray-400',
      label: `${daysLeft} days left`
    };
  };

  const studiedHours = totalStudyMinutes / 60;
  const goalHours = weeklyGoal.targetHoursPerWeek || 20;
  const progressRatio = Math.min(1, studiedHours / goalHours);
  const progressPercent = Math.round(progressRatio * 100);

  const nextExam = upcomingExams[0];
  const nextExamDaysLeft = nextExam
    ? Math.max(0, Math.ceil((nextExam.timestampMillis - currentTime) / (1000 * 60 * 60 * 24)))
    : null;
  const nextExamUrgency = nextExamDaysLeft !== null ? getExamUrgency(nextExamDaysLeft) : null;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-36 sm:pb-32 space-y-6">
      {/* Top Header Bar */}
      <header className="flex items-center justify-between gap-4 pb-1">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2 text-xs text-gray-400 font-medium">
            <span>{todayFormatted}</span>
            {nextExamChip && (
              <>
                <span aria-hidden="true">·</span>
                <span
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold ${nextExamChip.bg} ${nextExamChip.text} border ${nextExamChip.border}`}
                >
                  <Clock className="w-3 h-3 shrink-0" />
                  <span>{nextExamChip.label}</span>
                </span>
              </>
            )}
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
            {salutation}, {greetingName}
          </h1>
        </div>

        <div className="flex items-center gap-2">
          {/* In-app Install app button (appears when browser allows installing) */}
          <PWAInstallButton />

          {/* Consistent circular student avatar with min 48px touch target */}
          <button
            onClick={onProfileClick}
            className="relative min-w-[48px] min-h-[48px] p-0.5 rounded-full flex items-center justify-center border border-white/10 hover:border-[#7C5CFC] active:scale-95 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7C5CFC] shrink-0"
            title="Student Profile & Settings"
            aria-label="Student Profile & Settings"
          >
            {userProfile.profileImagePath ? (
              <img
                src={userProfile.profileImagePath}
                alt={greetingName}
                className="w-10 h-10 rounded-full object-cover ring-2 ring-white/10"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#7C5CFC] to-[#00D4A1] flex items-center justify-center font-bold text-white text-sm shadow-md ring-2 ring-white/10">
                {greetingName.charAt(0).toUpperCase()}
              </div>
            )}
          </button>
        </div>
      </header>

      {/* Responsive Dashboard Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Main Column (8 cols on lg screens) */}
        <div className="lg:col-span-8 space-y-6">
          {/* VISUAL HERO 1: Daily Practice Challenge Card */}
          <section className="bg-white dark:bg-gradient-to-br dark:from-[#1C1833] dark:via-[#141424] dark:to-[#101018] border border-[#D9DCE8] dark:border-[#7C5CFC]/30 rounded-3xl p-5 sm:p-6 shadow-sm dark:shadow-xl dark:shadow-[#7C5CFC]/10 relative overflow-hidden">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-[#7C5CFC]/15 dark:bg-[#7C5CFC]/20 text-[#5B3FE0] dark:text-[#7C5CFC] flex items-center justify-center font-black text-xl shadow-sm shrink-0">
                  🦈
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base sm:text-lg font-extrabold text-[#14161F] dark:text-white tracking-tight">
                      Daily Practice
                    </h2>
                    <span className="text-xs text-[#555A70] dark:text-gray-400 font-medium hidden sm:inline">
                      · Target: {practiceSettings.dailyTarget} Qs/day
                    </span>
                  </div>
                  {/* Clean unquoted natural copy */}
                  <p className="text-xs text-[#555A70] dark:text-gray-300 mt-0.5">
                    {todayPracticeResult?.completed
                      ? "Today's challenge complete. Streak preserved!"
                      : `${dailyQuestions.length} questions waiting today`}
                  </p>
                </div>
              </div>

              {/* Clean unboxed streak: shown only once on Home */}
              <div
                className="flex items-center gap-1.5 text-xs font-bold text-[#A84B00] dark:text-[#FF7A00] shrink-0"
                title={`${practiceStreak.currentStreak} day daily practice streak`}
              >
                <Flame className="w-4 h-4 fill-[#A84B00] dark:fill-[#FF7A00]" />
                <span>{practiceStreak.currentStreak} Day Streak</span>
              </div>
            </div>

            {/* Progress Bar & Status */}
            <div className="my-4 space-y-1.5">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-[#555A70] dark:text-gray-400">
                  {todayPracticeResult?.completed ? "Target Completed" : "Progress toward target"}
                </span>
                {/* Natural copy: unquoted */}
                <span className="text-[#0B7A50] dark:text-[#00D4A1] font-bold">
                  {todayPracticeResult?.completed
                    ? `${practiceSettings.dailyTarget} of ${practiceSettings.dailyTarget} done`
                    : `${todayPracticeResult?.score || 0} of ${practiceSettings.dailyTarget} done`}
                </span>
              </div>
              <div className="w-full h-2.5 bg-[#E3E6F0] dark:bg-white/5 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-[#5B3FE0] to-[#0E9F78] dark:from-[#7C5CFC] dark:to-[#00D4A1] transition-all duration-700 ease-out"
                  style={{
                    width: `${todayPracticeResult?.completed ? 100 : Math.min(100, Math.round(((todayPracticeResult?.score || 0) / practiceSettings.dailyTarget) * 100))}%`
                  }}
                />
              </div>
            </div>

            {/* Course Chips with Hidden Scrollbar & Right Edge Fade Hint */}
            <div className="pt-1 pb-2">
              <div className="relative">
                <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1 pr-8">
                  <span className="text-[11px] font-bold text-[#555A70] dark:text-gray-400 whitespace-nowrap mr-0.5">
                    Course:
                  </span>
                  <button
                    type="button"
                    onClick={() => updatePracticeSettings({ preferredCourse: 'all' })}
                    className={`min-h-[36px] px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap active:scale-95 transition-all ${
                      (practiceSettings.preferredCourse || 'all') === 'all'
                        ? 'bg-[rgba(109,74,255,0.12)] text-[#5B3FE0] border border-[#6D4AFF]/30 dark:bg-[#7C5CFC] dark:text-white dark:border-transparent shadow-sm'
                        : 'bg-[#EEF0F8] text-[#555A70] hover:bg-[#E2E5F2] dark:bg-white/5 dark:text-gray-400 dark:hover:text-white dark:hover:bg-white/10'
                    }`}
                  >
                    All Courses
                  </button>
                  {courses.map(c => {
                    const isSelected = practiceSettings.preferredCourse === c.name;
                    return (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => updatePracticeSettings({ preferredCourse: c.name })}
                        className={`min-h-[36px] px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap active:scale-95 transition-all ${
                          isSelected
                            ? 'bg-[rgba(109,74,255,0.12)] text-[#5B3FE0] border border-[#6D4AFF]/30 dark:bg-[#00D4A1] dark:text-black dark:border-transparent font-extrabold shadow-sm'
                            : 'bg-[#EEF0F8] text-[#555A70] hover:bg-[#E2E5F2] dark:bg-white/5 dark:text-gray-400 dark:hover:text-white dark:hover:bg-white/10'
                        }`}
                      >
                        {c.name}
                      </button>
                    );
                  })}
                </div>
                {/* Edge fade hint indicating horizontal scroll */}
                <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-white dark:from-[#141424] to-transparent z-10" />
              </div>
            </div>

            {/* Action Buttons with 48px Touch Targets & Micro-Motion */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                onClick={onStartPractice}
                className="flex-1 min-w-[200px] min-h-[48px] px-5 bg-gradient-to-r from-[#5B3FE0] to-[#0E9F78] dark:from-[#7C5CFC] dark:to-[#00D4A1] hover:opacity-95 active:scale-[0.98] text-white font-extrabold rounded-2xl shadow-md dark:shadow-lg dark:shadow-[#7C5CFC]/25 transition-all flex items-center justify-center gap-2 text-xs sm:text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
              >
                <span>
                  {todayPracticeResult?.completed
                    ? "Practice Again / Review Questions"
                    : practiceSettings.preferredCourse && practiceSettings.preferredCourse !== 'all'
                    ? `Start ${practiceSettings.preferredCourse} Practice`
                    : "Start Today's Practice"}
                </span>
                <ArrowRight className="w-4 h-4 stroke-[2.5]" />
              </button>

              <button
                onClick={onOpenDailyPracticeHub}
                className="min-h-[48px] px-4 bg-[#EEF0F8] hover:bg-[#E2E5F2] text-[#555A70] hover:text-[#14161F] dark:bg-white/5 dark:hover:bg-white/10 dark:text-gray-300 dark:hover:text-white border border-[#D9DCE8] dark:border-white/10 rounded-2xl font-bold text-xs transition-all flex items-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7C5CFC]"
              >
                <span>Question Bank</span>
              </button>
            </div>
          </section>

          {/* FEATURE 2 ENTRY: Plan My Day Card */}
          <section className="bg-white dark:bg-gradient-to-br dark:from-[#1C1833] dark:via-[#151525] dark:to-[#101019] border border-[#D9DCE8] dark:border-[#7C5CFC]/30 rounded-3xl p-5 sm:p-6 shadow-sm dark:shadow-xl relative overflow-hidden">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#7C5CFC]/20 text-[#7C5CFC] flex items-center justify-center font-black text-xl shadow-md shrink-0">
                  <Zap className="w-5 h-5 fill-[#7C5CFC]" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-extrabold text-white tracking-tight flex items-center gap-2">
                    <span>Plan My Day</span>
                    {topPrioritiesCount > 0 && (
                      <span className="text-[10px] font-bold text-[#FF7A00] bg-[#FF7A00]/15 px-2 py-0.5 rounded-full border border-[#FF7A00]/30">
                        {topPrioritiesCount} top {topPrioritiesCount === 1 ? 'priority' : 'priorities'}
                      </span>
                    )}
                  </h3>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Timeline auto-fits classes, study blocks, and tasks into free slots
                  </p>
                </div>
              </div>

              {/* Task progress chip */}
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-bold text-gray-300">
                <span className={todayTasksTotal > 0 && todayTasksCompleted === todayTasksTotal ? "text-[#00D4A1]" : "text-white"}>
                  {todayTasksTotal > 0 ? `${todayTasksCompleted} of ${todayTasksTotal} tasks done` : "Ready to plan"}
                </span>
              </div>
            </div>

            {/* Progress bar if tasks exist */}
            {todayTasksTotal > 0 && (
              <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden mb-4">
                <div
                  className="h-full bg-gradient-to-r from-[#7C5CFC] to-[#00D4A1] transition-all duration-700 ease-out"
                  style={{ width: `${Math.round((todayTasksCompleted / todayTasksTotal) * 100)}%` }}
                />
              </div>
            )}

            {/* Action Buttons with 48px touch targets */}
            <div className="flex flex-wrap items-center gap-3 pt-1">
              <button
                onClick={onOpenDayPlanner}
                className="flex-1 min-w-[160px] min-h-[48px] px-4 bg-[#7C5CFC] hover:bg-[#6c4be8] active:scale-[0.98] text-white font-extrabold rounded-2xl shadow-lg shadow-[#7C5CFC]/25 transition-all flex items-center justify-center gap-2 text-xs sm:text-sm"
              >
                <Zap className="w-4 h-4 fill-white" />
                <span>Open Day Planner</span>
              </button>

              <button
                onClick={handleQuickAutoFit}
                className="min-h-[48px] px-4 bg-white/5 hover:bg-white/10 active:scale-[0.98] border border-white/10 rounded-2xl text-gray-200 hover:text-white font-bold text-xs transition-all flex items-center gap-2"
              >
                <Sparkles className="w-4 h-4 text-[#00D4A1]" />
                <span>{autoFitStatus || "Auto-Fit"}</span>
              </button>
            </div>
          </section>

          {/* Today's Schedule Timeline */}
          <section className="bg-[#15151E] border border-white/5 rounded-3xl p-5 sm:p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">
                  Today's Timeline
                </h3>
                <p className="text-xs text-gray-400 mt-0.5">
                  Scheduled lectures and study sessions for today
                </p>
              </div>

              <button
                onClick={onSeeAllSchedule}
                className="min-h-[44px] px-2 text-xs font-semibold text-[#7C5CFC] hover:text-[#9B82FD] transition-colors flex items-center gap-1"
              >
                <span>Full Timetable</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Compact Empty State (~85px) so Weekly Goal and Exams are visible without scrolling */}
            {todaySchedule.length === 0 ? (
              <div className="py-3 px-4 rounded-2xl bg-[#171722] border border-white/5 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-xl bg-[#00D4A1]/15 text-[#00D4A1] flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-white truncate">No classes scheduled today</p>
                    <p className="text-[11px] text-gray-400 truncate">Time for focused study or rest</p>
                  </div>
                </div>
                <button
                  onClick={onNewSessionClick}
                  className="min-h-[40px] px-3.5 rounded-xl bg-white/5 hover:bg-white/10 active:scale-95 text-xs font-bold text-white border border-white/10 transition-all shrink-0 flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5 text-[#00D4A1]" />
                  <span>Plan Study</span>
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {todaySchedule.map((item, idx) => {
                  if (item.type === 'class') {
                    const c = item.data as import('../types').Course;
                    const color = getCourseColor(c.colorIndex);
                    const startTime = `${String(c.startHour).padStart(2, '0')}:${String(c.startMinute).padStart(2, '0')}`;
                    const endTime = `${String(c.endHour).padStart(2, '0')}:${String(c.endMinute).padStart(2, '0')}`;

                    return (
                      <div
                        key={`class-${c.id}-${idx}`}
                        className="p-3.5 rounded-2xl bg-[#1A1A24] border border-white/5 flex items-center gap-3.5 hover:border-white/15 transition-all"
                      >
                        <div
                          className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                          style={{ backgroundColor: `${color}20`, color }}
                        >
                          <GraduationCap className="w-5 h-5" />
                        </div>

                        <div className="flex-1 min-w-0">
                          <h4 className="font-bold text-white text-sm truncate">{c.name}</h4>
                          <div className="flex items-center gap-2 text-xs text-gray-400 mt-0.5">
                            <span>{c.lecturer || "Instructor"}</span>
                            {c.room && (
                              <>
                                <span aria-hidden="true">·</span>
                                <span>Room {c.room}</span>
                              </>
                            )}
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <span className="text-xs font-bold text-white block tabular-nums">
                            {startTime} – {endTime}
                          </span>
                          <span className="text-[11px] font-semibold text-[#7C5CFC]">
                            Lecture
                          </span>
                        </div>
                      </div>
                    );
                  } else {
                    const s = item.data as import('../types').StudySession;
                    const color = getCourseColor(s.colorIndex);
                    const endMinutes = s.startHour * 60 + s.startMinute + s.durationMinutes;
                    const startTime = `${String(s.startHour).padStart(2, '0')}:${String(s.startMinute).padStart(2, '0')}`;
                    const endTime = `${String(Math.floor(endMinutes / 60)).padStart(2, '0')}:${String(endMinutes % 60).padStart(2, '0')}`;

                    return (
                      <div
                        key={`study-${s.id}-${idx}`}
                        className="p-3.5 rounded-2xl bg-[#1A1A24] border border-white/5 flex items-center gap-3.5 hover:border-white/15 transition-all"
                      >
                        <div
                          className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                          style={{ backgroundColor: `${color}20`, color }}
                        >
                          <BookOpen className="w-5 h-5" />
                        </div>

                        <div className="flex-1 min-w-0">
                          <h4 className="font-bold text-white text-sm truncate">{s.courseName}</h4>
                          <span className="text-xs text-gray-400 mt-0.5 block">
                            Study Session · {s.durationMinutes} mins
                          </span>
                        </div>

                        <div className="text-right shrink-0">
                          <span className="text-xs font-bold text-white block tabular-nums">
                            {startTime} – {endTime}
                          </span>
                          <span className="text-[11px] font-semibold text-[#00D4A1]">
                            Study
                          </span>
                        </div>
                      </div>
                    );
                  }
                })}
              </div>
            )}
          </section>
        </div>

        {/* Secondary Column (4 cols on lg screens) */}
        <div className="lg:col-span-4 space-y-6">
          {/* VISUAL HERO 2: Upcoming Exam Spotlight */}
          <section className="bg-gradient-to-br from-[#1A1726] to-[#12121A] border border-white/10 rounded-3xl p-5 sm:p-6 shadow-xl space-y-3.5">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
                <CalendarClock className="w-4 h-4 text-[#7C5CFC]" />
                <span>Next Exam</span>
              </h3>
              <span className="text-xs text-gray-400 font-semibold">
                {upcomingExams.length} scheduled
              </span>
            </div>

            {nextExam && nextExamUrgency ? (
              <div className="space-y-3">
                {/* Spotlight Exam Hero Card */}
                <div className={`p-4 rounded-2xl bg-[#14141E] border ${nextExamUrgency.border} relative overflow-hidden`}>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <div
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: getCourseColor(nextExam.colorIndex) }}
                      />
                      <span className="text-xs font-bold text-gray-300 uppercase tracking-wider truncate">
                        {nextExam.courseName}
                      </span>
                    </div>

                    {/* Urgency Badge: Red < 3d, Amber < 7d, Neutral >= 7d */}
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${nextExamUrgency.bg} ${nextExamUrgency.text} border ${nextExamUrgency.border}`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${nextExamUrgency.dot}`} />
                      <span>{nextExamUrgency.label}</span>
                    </span>
                  </div>

                  <h4 className="text-base font-extrabold text-white leading-snug">
                    {nextExam.examTitle}
                  </h4>

                  <div className="flex items-center gap-3 text-xs text-gray-400 mt-2">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-gray-400" />
                      <span>
                        {new Date(nextExam.timestampMillis).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric'
                        })}
                      </span>
                    </span>
                    {courses.find(c => c.name.toLowerCase() === nextExam.courseName.toLowerCase())?.room && (
                      <>
                        <span aria-hidden="true">·</span>
                        <span>Room {courses.find(c => c.name.toLowerCase() === nextExam.courseName.toLowerCase())?.room}</span>
                      </>
                    )}
                  </div>

                  {/* Plan My Revision Button (Feature 1 Entry) */}
                  <div className="pt-3">
                    <button
                      onClick={() => onPlanExamRevision?.(nextExam)}
                      className="w-full min-h-[44px] px-3.5 py-2 rounded-xl bg-[#7C5CFC] hover:bg-[#6c4be8] active:scale-[0.98] text-white font-extrabold text-xs shadow-md shadow-[#7C5CFC]/25 transition-all flex items-center justify-center gap-2"
                    >
                      <Sparkles className="w-3.5 h-3.5 stroke-[2.5]" />
                      <span>{revisionPlans[nextExam.id] ? "View Revision Plan" : "Plan My Revision"}</span>
                    </button>
                  </div>
                </div>

                {/* Secondary Exams listed as lighter divider rows */}
                {upcomingExams.length > 1 && (
                  <div className="pt-1 divide-y divide-white/5 text-xs">
                    {upcomingExams.slice(1, 3).map(exam => {
                      const daysLeft = Math.max(0, Math.ceil((exam.timestampMillis - currentTime) / (1000 * 60 * 60 * 24)));
                      const urgency = getExamUrgency(daysLeft);
                      const color = getCourseColor(exam.colorIndex);

                      return (
                        <div
                          key={exam.id}
                          className="py-2.5 flex items-center justify-between text-xs"
                        >
                          <div className="flex items-center gap-2 min-w-0 pr-2">
                            <div
                              className="w-2 h-2 rounded-full shrink-0"
                              style={{ backgroundColor: color }}
                            />
                            <div className="truncate">
                              <span className="font-bold text-white block truncate">
                                {exam.examTitle}
                              </span>
                              <span className="text-[11px] text-gray-400 truncate block">
                                {exam.courseName}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onPlanExamRevision?.(exam);
                              }}
                              className="min-h-[32px] px-2 py-1 text-[11px] font-bold text-[#7C5CFC] hover:text-white bg-[#7C5CFC]/10 hover:bg-[#7C5CFC] rounded-lg transition-all flex items-center gap-1 shrink-0 active:scale-95"
                              title="Plan revision for this exam"
                            >
                              <Sparkles className="w-3 h-3" />
                              <span>Plan</span>
                            </button>
                            <span className={`text-[11px] font-bold shrink-0 ${urgency.text}`}>
                              {daysLeft === 0 ? "Today" : `${daysLeft}d left`}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ) : (
              <div className="py-4 text-center space-y-1">
                <p className="text-xs text-gray-400">
                  No upcoming exams scheduled.
                </p>
                <button
                  onClick={onSeeAllSchedule}
                  className="text-xs font-bold text-[#7C5CFC] hover:underline"
                >
                  Add exams in Schedule
                </button>
              </div>
            )}
          </section>

          {/* LIGHTER ELEMENT 1: Weekly Goal (No heavy nested card) */}
          <section className="p-5 rounded-3xl bg-[#14141D] border border-white/5 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white tracking-tight">Weekly Goal</h3>
              <span className="text-xs font-bold text-[#00D4A1]">{progressPercent}%</span>
            </div>

            <div className="space-y-2">
              <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-[#7C5CFC] to-[#00D4A1] rounded-full transition-all duration-700 ease-out"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>

              <div className="flex justify-between items-center text-xs text-gray-400 pt-0.5">
                <span>
                  <strong className="text-white">{studiedHours.toFixed(1)}</strong> of {goalHours.toFixed(0)} hrs logged
                </span>
                <span>
                  <strong className="text-white">{completedSessionsCount}</strong> sessions
                </span>
              </div>
            </div>
          </section>

          {/* LIGHTER ELEMENT 2: Quick Actions (Plain rows / tactile buttons, no nested cards) */}
          <section className="p-5 rounded-3xl bg-[#14141D] border border-white/5 space-y-3">
            <h3 className="text-sm font-bold text-white tracking-tight">Quick Actions</h3>

            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={onNewSessionClick}
                className="min-h-[48px] p-2.5 rounded-2xl bg-white/[0.03] hover:bg-white/[0.07] active:scale-[0.98] border border-white/5 text-left transition-all group flex flex-col justify-center"
              >
                <div className="flex items-center gap-1.5 mb-0.5">
                  <Plus className="w-4 h-4 text-[#00D4A1]" />
                  <span className="text-xs font-bold text-white">Study</span>
                </div>
                <span className="text-[10px] text-gray-400 truncate">Focus timer</span>
              </button>

              <button
                onClick={onOpenDayPlanner}
                className="min-h-[48px] p-2.5 rounded-2xl bg-white/[0.03] hover:bg-white/[0.07] active:scale-[0.98] border border-white/5 text-left transition-all group flex flex-col justify-center"
              >
                <div className="flex items-center gap-1.5 mb-0.5">
                  <Zap className="w-4 h-4 text-[#7C5CFC]" />
                  <span className="text-xs font-bold text-white">Planner</span>
                </div>
                <span className="text-[10px] text-gray-400 truncate">Day timeline</span>
              </button>

              <button
                onClick={onAskEvansClick}
                className="min-h-[48px] p-2.5 rounded-2xl bg-white/[0.03] hover:bg-white/[0.07] active:scale-[0.98] border border-white/5 text-left transition-all group flex flex-col justify-center"
              >
                <div className="flex items-center gap-1.5 mb-0.5">
                  <img
                    src="/assistant_avatar.png"
                    alt="Evans"
                    className="w-4 h-4 rounded-full object-cover ring-1 ring-white/20 shrink-0"
                  />
                  <span className="text-xs font-bold text-white">Evans</span>
                </div>
                <span className="text-[10px] text-gray-400 truncate">Study tutor</span>
              </button>
            </div>
          </section>
        </div>
      </div>

      {/* Android Install & APK Packaging Modal */}
      <InstallModal
        isOpen={showInstallModal}
        onClose={() => setShowInstallModal(false)}
      />
    </div>
  );
};
