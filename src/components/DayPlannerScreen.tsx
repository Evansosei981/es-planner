import React, { useState, useMemo, useRef } from 'react';
import {
  Calendar,
  Clock,
  Plus,
  Trash2,
  CheckCircle2,
  Circle,
  Sparkles,
  Zap,
  ArrowRight,
  ArrowDownRight,
  AlertCircle,
  Bell,
  RotateCcw,
  Check,
  ChevronRight,
  GraduationCap,
  BookOpen,
  Target,
  ArrowLeft,
  X,
  Sliders,
  Flame
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { DayTask, TaskPriority } from '../types/planner';
import { DayKey } from '../practice/DayKey';
import { getCourseColor } from '../theme/colors';

interface DayPlannerScreenProps {
  onNavigateBack?: () => void;
  onOpenStudyTimer?: (session: any) => void;
  onOpenDailyPractice?: () => void;
  embedded?: boolean;
}

export const DayPlannerScreen: React.FC<DayPlannerScreenProps> = ({
  onNavigateBack,
  onOpenStudyTimer,
  onOpenDailyPractice,
  embedded = false
}) => {
  const {
    courses,
    studySessions,
    exams,
    dayTasks,
    dayPlannerPrefs,
    tasksNeedingDecision,
    todayPracticeResult,
    practiceSettings,
    addDayTask,
    updateDayTask,
    deleteDayTask,
    toggleDayTaskComplete,
    autoFitTodayTasks,
    resolveTaskRollover,
    updateDayPlannerPrefs
  } = useApp();

  const todayKey = DayKey.getTodayKey();
  const todayTasks = useMemo(() => dayTasks.filter(t => t.dateKey === todayKey), [dayTasks, todayKey]);

  // Top priorities (max 3)
  const topPrioritiesCount = todayTasks.filter(t => t.isTopPriority).length;

  // New task form state
  const [showAddModal, setShowAddModal] = useState(false);
  const [taskTitle, setTaskTitle] = useState('');
  const [taskMinutes, setTaskMinutes] = useState(45);
  const [taskPriority, setTaskPriority] = useState<TaskPriority>('medium');
  const [taskCourse, setTaskCourse] = useState<string>(courses[0]?.name || '');
  const [taskIsTopPriority, setTaskIsTopPriority] = useState(false);

  // Rollover decision modal
  const [showRolloverModal, setShowRolloverModal] = useState(tasksNeedingDecision.length > 0);
  const [shortenMinutes, setShortenMinutes] = useState<Record<string, number>>({});

  // Auto-fit feedback toast
  const [autoFitFeedback, setAutoFitFeedback] = useState<{ fitted: number; unfitted: number } | null>(null);

  // Undo deletion state
  const [undoTask, setUndoTask] = useState<DayTask | null>(null);
  const undoTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Prefs drawer
  const [showPrefsModal, setShowPrefsModal] = useState(false);

  // Calculate completed count and ratio
  const completedTasksCount = todayTasks.filter(t => t.completed).length;
  const totalTasksCount = todayTasks.length;
  const progressPercent = totalTasksCount > 0 ? Math.round((completedTasksCount / totalTasksCount) * 100) : 0;

  // Split tasks into fitted vs unfitted ("Move to tomorrow")
  const fittedTasks = todayTasks.filter(t => t.scheduledTime);
  const unfittedTasks = todayTasks.filter(t => !t.scheduledTime);

  // Compile full today's chronological timeline:
  // classes + revision blocks + study sessions + practice target + fitted tasks
  const fullTimeline = useMemo(() => {
    const now = new Date();
    const jsDay = now.getDay();
    const dow = jsDay === 0 ? 7 : jsDay;

    type TimelineItem = {
      id: string;
      title: string;
      subtitle: string;
      startH: number;
      startM: number;
      endH: number;
      endM: number;
      type: 'class' | 'study' | 'revision' | 'practice' | 'task';
      color: string;
      completed: boolean;
      data?: any;
    };

    const items: TimelineItem[] = [];

    // 1. Classes today
    courses.filter(c => c.dayOfWeek === dow).forEach(c => {
      items.push({
        id: `class-${c.id}`,
        title: c.name,
        subtitle: `Lecture · ${c.room ? `Room ${c.room}` : c.lecturer}`,
        startH: c.startHour,
        startM: c.startMinute,
        endH: c.endHour,
        endM: c.endMinute,
        type: 'class',
        color: getCourseColor(c.colorIndex),
        completed: false,
        data: c
      });
    });

    // 2. Study sessions & Revision blocks
    studySessions.forEach(s => {
      let isToday = false;
      if (s.dateMillis) {
        const sDate = new Date(s.dateMillis);
        isToday = sDate.getFullYear() === now.getFullYear() &&
                  sDate.getMonth() === now.getMonth() &&
                  sDate.getDate() === now.getDate();
      } else if (s.dayOfWeek === dow) {
        isToday = true;
      }

      if (isToday) {
        const endMin = s.startHour * 60 + s.startMinute + s.durationMinutes;
        items.push({
          id: `study-${s.id}`,
          title: s.courseName,
          subtitle: s.isRevisionBlock ? `Exam Revision · ${s.topic || 'Review'}` : `Focus Session · ${s.durationMinutes}m`,
          startH: s.startHour,
          startM: s.startMinute,
          endH: Math.floor(endMin / 60),
          endM: endMin % 60,
          type: s.isRevisionBlock ? 'revision' : 'study',
          color: s.isRevisionBlock ? '#FF7A00' : getCourseColor(s.colorIndex),
          completed: s.completed,
          data: s
        });
      }
    });

    // 3. Daily Practice target automatically placed as morning/afternoon block
    items.push({
      id: 'daily-practice-target',
      title: "Daily Practice Target",
      subtitle: todayPracticeResult?.completed ? "Target completed" : `${practiceSettings.dailyTarget} questions to solve`,
      startH: 16,
      startM: 0,
      endH: 16,
      endM: 20,
      type: 'practice',
      color: '#00D4A1',
      completed: !!todayPracticeResult?.completed
    });

    // 4. Fitted tasks
    fittedTasks.forEach(t => {
      if (t.scheduledTime) {
        items.push({
          id: `task-${t.id}`,
          title: t.title,
          subtitle: `${t.courseName ? `${t.courseName} · ` : ''}${t.estimatedMinutes}m · ${t.priority.toUpperCase()} priority`,
          startH: t.scheduledTime.startHour,
          startM: t.scheduledTime.startMinute,
          endH: t.scheduledTime.endHour,
          endM: t.scheduledTime.endMinute,
          type: 'task',
          color: t.priority === 'high' ? '#EF4444' : t.priority === 'medium' ? '#7C5CFC' : '#64748B',
          completed: t.completed,
          data: t
        });
      }
    });

    // Sort chronologically
    return items.sort((a, b) => (a.startH * 60 + a.startM) - (b.startH * 60 + b.startM));
  }, [courses, studySessions, fittedTasks, todayPracticeResult, practiceSettings.dailyTarget]);

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskTitle.trim()) return;

    addDayTask({
      title: taskTitle.trim(),
      estimatedMinutes: taskMinutes,
      priority: taskPriority,
      courseName: taskCourse || undefined,
      isTopPriority: taskIsTopPriority && topPrioritiesCount < 3
    });

    setTaskTitle('');
    setTaskMinutes(45);
    setTaskIsTopPriority(false);
    setShowAddModal(false);
  };

  const handleTriggerAutoFit = () => {
    const res = autoFitTodayTasks();
    setAutoFitFeedback({ fitted: res.fittedCount, unfitted: res.unfittedCount });
    setTimeout(() => setAutoFitFeedback(null), 3500);
  };

  const handleDeleteWithUndo = (task: DayTask) => {
    setUndoTask(task);
    deleteDayTask(task.id);

    if (undoTimeoutRef.current) clearTimeout(undoTimeoutRef.current);
    undoTimeoutRef.current = setTimeout(() => {
      setUndoTask(null);
    }, 4500);
  };

  const handleUndo = () => {
    if (undoTask) {
      addDayTask(undoTask);
      setUndoTask(null);
      if (undoTimeoutRef.current) clearTimeout(undoTimeoutRef.current);
    }
  };

  const formattedToday = new Date().toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'short',
    day: 'numeric'
  });

  return (
    <div className={embedded ? "space-y-6 animate-in fade-in duration-150" : "max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-36 md:pb-16 space-y-6 animate-in fade-in duration-150"}>
      {/* Top Header Pattern (Shown only when full-screen standalone) */}
      {!embedded && (
        <header className="flex items-center justify-between gap-4 pb-1">
          <div className="flex items-center gap-3">
            {onNavigateBack && (
              <button
                onClick={onNavigateBack}
                className="min-w-[48px] min-h-[48px] -ml-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/5 transition-colors flex items-center justify-center active:scale-95"
                aria-label="Back"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
            )}
            <div>
              <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
                Day Planner
              </h1>
              <p className="text-xs text-gray-400 mt-0.5">
                {formattedToday} · Schedule, tasks and auto-fit
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Settings / Nudge preferences */}
            <button
              onClick={() => setShowPrefsModal(true)}
              className="min-h-[44px] min-w-[44px] p-2 text-gray-400 hover:text-white rounded-xl hover:bg-white/5 transition-colors flex items-center justify-center"
              title="Planner preferences"
              aria-label="Planner preferences"
            >
              <Sliders className="w-4 h-4" />
            </button>

            {/* Add Task Button (Purple = actions) */}
            <button
              onClick={() => setShowAddModal(true)}
              className="min-h-[44px] px-3.5 bg-[#7C5CFC] hover:bg-[#6c4be8] text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-md shadow-[#7C5CFC]/25 active:scale-95 transition-all"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>Add Task</span>
            </button>
          </div>
        </header>
      )}

      {/* Progress & Auto-Fit Control Bar */}
      <div className="bg-[#15151E] border border-white/5 rounded-3xl p-5 shadow-xl space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-gray-400">{formattedToday} · Progress</span>
            <div className="flex items-center gap-2">
              <span className="text-lg font-black text-white">
                {completedTasksCount} of {totalTasksCount} done
              </span>
              {totalTasksCount > 0 && (
                <span className="text-xs font-bold text-[#00D4A1]">
                  ({progressPercent}%)
                </span>
              )}
            </div>
          </div>

          {/* Action Toolbar */}
          <div className="flex items-center gap-2 shrink-0">
            {embedded && (
              <>
                <button
                  onClick={() => setShowPrefsModal(true)}
                  className="min-h-[44px] min-w-[44px] p-2 text-gray-400 hover:text-white rounded-xl hover:bg-white/5 transition-colors flex items-center justify-center border border-white/5"
                  title="Planner preferences"
                  aria-label="Planner preferences"
                >
                  <Sliders className="w-4 h-4" />
                </button>

                <button
                  onClick={() => setShowAddModal(true)}
                  className="min-h-[44px] px-3.5 bg-[#7C5CFC] hover:bg-[#6c4be8] text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-md shadow-[#7C5CFC]/25 active:scale-95 transition-all"
                >
                  <Plus className="w-4 h-4 stroke-[2.5]" />
                  <span>Add Task</span>
                </button>
              </>
            )}

            {/* Auto-Fit Button */}
            <button
              onClick={handleTriggerAutoFit}
              disabled={todayTasks.length === 0}
              className="min-h-[44px] px-4 py-2.5 rounded-2xl bg-gradient-to-r from-[#7C5CFC] to-[#00D4A1] hover:opacity-95 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed text-white font-extrabold text-xs shadow-lg shadow-[#7C5CFC]/20 transition-all flex items-center gap-2 cursor-pointer"
            >
              <Zap className="w-4 h-4 fill-white" />
              <span>Auto-Fit Day</span>
            </button>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full h-2.5 bg-white/5 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-[#7C5CFC] to-[#00D4A1] transition-all duration-700 ease-out"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Auto-fit Toast Notification */}
        {autoFitFeedback && (
          <div className="p-3 bg-[#00D4A1]/15 border border-[#00D4A1]/30 rounded-xl text-xs text-[#00D4A1] font-semibold flex items-center gap-2 animate-in fade-in">
            <Check className="w-4 h-4 stroke-[3]" />
            <span>
              Auto-fit complete: {autoFitFeedback.fitted} tasks placed into free slots.
              {autoFitFeedback.unfitted > 0 && ` ${autoFitFeedback.unfitted} tasks moved to tomorrow.`}
            </span>
          </div>
        )}
      </div>

      {/* Top Priorities Strip (Max 3) */}
      <div className="space-y-2">
        <div className="flex items-center justify-between px-1">
          <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
            Top Priorities ({topPrioritiesCount}/3)
          </span>
          <span className="text-[11px] text-gray-500">
            Focus blocks for high-yield productivity
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          {todayTasks.filter(t => t.isTopPriority).map(task => (
            <div
              key={task.id}
              className={`p-3.5 rounded-2xl border flex items-center justify-between gap-2.5 transition-all ${
                task.completed
                  ? 'bg-[#15151E]/50 border-white/5 opacity-60'
                  : 'bg-[#15151E] border-[#7C5CFC]/30 shadow-md'
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <button
                  onClick={() => toggleDayTaskComplete(task.id)}
                  className="shrink-0 text-gray-400 hover:text-[#00D4A1] transition-colors"
                >
                  {task.completed ? (
                    <CheckCircle2 className="w-5 h-5 text-[#00D4A1] fill-[#00D4A1]/20 stroke-[2.5]" />
                  ) : (
                    <Circle className="w-5 h-5 text-[#7C5CFC] stroke-[2]" />
                  )}
                </button>
                <div className="min-w-0">
                  <h4 className={`text-xs font-bold truncate ${task.completed ? 'line-through text-gray-400' : 'text-white'}`}>
                    {task.title}
                  </h4>
                  <span className="text-[10px] text-gray-400 block tabular-nums">
                    {task.estimatedMinutes}m · {task.priority.toUpperCase()}
                  </span>
                </div>
              </div>

              {task.scheduledTime && (
                <span className="text-[10px] font-bold text-[#7C5CFC] bg-[#7C5CFC]/15 px-2 py-0.5 rounded-full tabular-nums shrink-0">
                  {String(task.scheduledTime.startHour).padStart(2, '0')}:{String(task.scheduledTime.startMinute).padStart(2, '0')}
                </span>
              )}
            </div>
          ))}

          {topPrioritiesCount < 3 && (
            <button
              onClick={() => {
                setTaskIsTopPriority(true);
                setShowAddModal(true);
              }}
              className="min-h-[50px] p-3 rounded-2xl border border-dashed border-white/10 hover:border-[#7C5CFC]/50 text-gray-400 hover:text-white flex items-center justify-center gap-2 text-xs font-semibold transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Top Priority ({topPrioritiesCount}/3)</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Today Timeline */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
            Today's Timeline
          </span>
          <span className="text-[11px] text-gray-500">
            Classes, revision blocks & auto-fitted tasks
          </span>
        </div>

        {fullTimeline.length === 0 ? (
          <div className="bg-[#15151E] border border-white/5 rounded-3xl p-10 text-center flex flex-col items-center justify-center space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-[#1D1D29] text-gray-400 flex items-center justify-center">
              <Calendar className="w-7 h-7 stroke-[1.75]" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-white">Nothing planned today</h3>
              <p className="text-xs text-gray-400 max-w-xs">
                Add a task or tap auto-fit to fill your schedule with productive study windows.
              </p>
            </div>
            <button
              onClick={() => setShowAddModal(true)}
              className="mt-1 min-h-[44px] px-4 py-2 bg-[#7C5CFC] hover:bg-[#6c4be8] text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add First Task</span>
            </button>
          </div>
        ) : (
          <div className="space-y-2.5">
            {fullTimeline.map((item, idx) => {
              const startStr = `${String(item.startH).padStart(2, '0')}:${String(item.startM).padStart(2, '0')}`;
              const endStr = `${String(item.endH).padStart(2, '0')}:${String(item.endM).padStart(2, '0')}`;

              return (
                <div
                  key={`${item.id}-${idx}`}
                  className={`p-3.5 sm:p-4 rounded-2xl border flex items-center justify-between gap-3.5 transition-all ${
                    item.completed
                      ? 'bg-[#15151E]/60 border-white/5 opacity-60'
                      : 'bg-[#15151E] border-white/5 hover:border-white/15 shadow-sm'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {/* Checkbox for tasks, or icon for class/study */}
                    {item.type === 'task' ? (
                      <button
                        onClick={() => toggleDayTaskComplete((item.data as DayTask).id)}
                        className="shrink-0 p-1 text-gray-400 hover:text-[#00D4A1] transition-colors"
                      >
                        {item.completed ? (
                          <CheckCircle2 className="w-6 h-6 text-[#00D4A1] fill-[#00D4A1]/20 stroke-[2.5]" />
                        ) : (
                          <Circle className="w-6 h-6 stroke-[2]" style={{ color: item.color }} />
                        )}
                      </button>
                    ) : item.type === 'class' ? (
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                        style={{ backgroundColor: `${item.color}20`, color: item.color }}
                      >
                        <GraduationCap className="w-5 h-5" />
                      </div>
                    ) : item.type === 'revision' ? (
                      <div className="w-10 h-10 rounded-xl bg-[#FF7A00]/15 text-[#FF7A00] flex items-center justify-center shrink-0">
                        <Flame className="w-5 h-5 fill-[#FF7A00]" />
                      </div>
                    ) : item.type === 'practice' ? (
                      <div className="w-10 h-10 rounded-xl bg-[#00D4A1]/15 text-[#00D4A1] flex items-center justify-center shrink-0">
                        <Target className="w-5 h-5" />
                      </div>
                    ) : (
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                        style={{ backgroundColor: `${item.color}20`, color: item.color }}
                      >
                        <BookOpen className="w-5 h-5" />
                      </div>
                    )}

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className={`text-sm font-bold truncate ${item.completed ? 'line-through text-gray-400' : 'text-white'}`}>
                          {item.title}
                        </h4>
                        {item.type === 'revision' && (
                          <span className="px-1.5 py-0.2 rounded text-[10px] font-extrabold bg-[#FF7A00]/20 text-[#FF7A00] shrink-0">
                            Exam Prep
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-gray-400 block mt-0.5 truncate">
                        {item.subtitle}
                      </span>
                    </div>
                  </div>

                  {/* Time Badge and Actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    <div className="text-right">
                      <span className="text-xs font-bold text-white block tabular-nums">
                        {startStr} – {endStr}
                      </span>
                      <span className="text-[11px] font-semibold capitalize" style={{ color: item.color }}>
                        {item.type}
                      </span>
                    </div>

                    {item.type === 'task' && (
                      <button
                        onClick={() => handleDeleteWithUndo(item.data as DayTask)}
                        className="min-h-[36px] min-w-[36px] p-2 text-gray-500 hover:text-[#EF4444] rounded-lg hover:bg-white/5 transition-colors flex items-center justify-center"
                        title="Delete task"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Unfitted Tasks: Move to tomorrow tray */}
      {unfittedTasks.length > 0 && (
        <div className="bg-[#181824] border border-white/10 rounded-3xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-[#F59E0B]">
              <ArrowDownRight className="w-4 h-4" />
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                Unscheduled / Move to Tomorrow ({unfittedTasks.length})
              </h3>
            </div>
            <span className="text-[11px] text-gray-400">
              Tasks that didn't fit into today's study window
            </span>
          </div>

          <div className="space-y-2">
            {unfittedTasks.map(task => (
              <div
                key={task.id}
                className="p-3 rounded-2xl bg-[#14141E] border border-white/5 flex items-center justify-between gap-3"
              >
                <div className="min-w-0">
                  <h4 className="text-xs font-bold text-white truncate">
                    {task.title}
                  </h4>
                  <span className="text-[11px] text-gray-400 block tabular-nums">
                    {task.estimatedMinutes}m · {task.priority.toUpperCase()} priority
                  </span>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={() => {
                      // Schedule manually for 20:00
                      updateDayTask(task.id, {
                        scheduledTime: { startHour: 20, startMinute: 0, endHour: 20, endMinute: task.estimatedMinutes }
                      });
                    }}
                    className="min-h-[36px] px-3 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-semibold text-gray-300 hover:text-white transition-colors"
                  >
                    Fit Evening
                  </button>
                  <button
                    onClick={() => handleDeleteWithUndo(task)}
                    className="min-h-[36px] min-w-[36px] p-2 text-gray-500 hover:text-[#EF4444] rounded-xl hover:bg-white/5 transition-colors flex items-center justify-center"
                    title="Remove task"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Undo Snackbar */}
      {undoTask && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-40 bg-[#1D1D2B] border border-white/10 text-white px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-3 animate-in fade-in slide-in-from-bottom-2">
          <span className="text-xs font-medium">Task removed</span>
          <button
            onClick={handleUndo}
            className="text-xs font-extrabold text-[#7C5CFC] hover:underline flex items-center gap-1"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Undo</span>
          </button>
        </div>
      )}

      {/* Rollover Review Modal: "Keep, shorten or drop?" (after 2 rollovers) */}
      {showRolloverModal && tasksNeedingDecision.length > 0 && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-[#15151E] border border-white/10 rounded-3xl p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-2.5 text-[#F59E0B]">
              <AlertCircle className="w-5 h-5" />
              <h3 className="text-base font-bold text-white">
                Task Rollover Review
              </h3>
            </div>
            <p className="text-xs text-gray-400 leading-relaxed">
              These tasks have rolled over 2 or more times. Would you like to keep them, shorten their duration, or drop them?
            </p>

            <div className="space-y-3 max-h-60 overflow-y-auto custom-scrollbar">
              {tasksNeedingDecision.map(task => (
                <div key={task.id} className="p-3 rounded-2xl bg-[#1D1D29] border border-white/5 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white">{task.title}</span>
                    <span className="text-[10px] text-[#F59E0B] font-semibold">
                      Rolled {task.rolloverCount}x
                    </span>
                  </div>

                  <div className="flex gap-1.5">
                    <button
                      onClick={() => resolveTaskRollover(task.id, 'keep')}
                      className="flex-1 min-h-[36px] text-xs font-bold text-white bg-white/5 hover:bg-white/10 rounded-xl transition-colors"
                    >
                      Keep
                    </button>
                    <button
                      onClick={() => {
                        const mins = shortenMinutes[task.id] || Math.max(15, Math.floor(task.estimatedMinutes / 2));
                        resolveTaskRollover(task.id, 'shorten', mins);
                      }}
                      className="flex-1 min-h-[36px] text-xs font-bold text-[#00D4A1] bg-[#00D4A1]/15 hover:bg-[#00D4A1]/25 rounded-xl transition-colors"
                    >
                      Shorten to 20m
                    </button>
                    <button
                      onClick={() => resolveTaskRollover(task.id, 'drop')}
                      className="flex-1 min-h-[36px] text-xs font-bold text-[#EF4444] bg-[#EF4444]/15 hover:bg-[#EF4444]/25 rounded-xl transition-colors"
                    >
                      Drop
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={() => setShowRolloverModal(false)}
              className="w-full min-h-[44px] rounded-xl bg-[#7C5CFC] text-white text-xs font-bold hover:bg-[#6c4be8] transition-colors"
            >
              Done Reviewing
            </button>
          </div>
        </div>
      )}

      {/* Add Task Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-lg bg-[#15151E] border-t sm:border border-white/10 rounded-t-3xl sm:rounded-3xl p-5 sm:p-6 shadow-2xl relative max-h-[92vh] overflow-y-auto animate-in slide-in-from-bottom duration-200">
            <div className="w-12 h-1 bg-white/20 rounded-full mx-auto mb-3 sm:hidden" />

            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-bold text-white tracking-tight">Add Day Task</h3>
                <p className="text-xs text-gray-400">Schedule tasks for today with auto-fit</p>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-2 text-gray-400 hover:text-white rounded-xl hover:bg-white/5 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateTask} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-gray-300 block mb-1">
                  Task Title *
                </label>
                <input
                  type="text"
                  required
                  value={taskTitle}
                  onChange={e => setTaskTitle(e.target.value)}
                  placeholder="e.g. Complete calculus exercise 4"
                  className="w-full bg-[#1D1D29] border border-white/10 focus:border-[#7C5CFC] rounded-xl px-3.5 py-2.5 text-white outline-none text-sm transition-colors"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-gray-300 block mb-1">
                    Estimated Duration
                  </label>
                  <select
                    value={taskMinutes}
                    onChange={e => setTaskMinutes(Number(e.target.value))}
                    className="w-full bg-[#1D1D29] border border-white/10 focus:border-[#7C5CFC] rounded-xl px-3 py-2 text-white outline-none text-xs"
                  >
                    <option value={15}>15 minutes (Quick)</option>
                    <option value={25}>25 minutes (Pomodoro)</option>
                    <option value={45}>45 minutes (Standard)</option>
                    <option value={60}>60 minutes (Deep Focus)</option>
                    <option value={90}>90 minutes (Lab / Drill)</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-300 block mb-1">
                    Priority
                  </label>
                  <select
                    value={taskPriority}
                    onChange={e => setTaskPriority(e.target.value as any)}
                    className="w-full bg-[#1D1D29] border border-white/10 focus:border-[#7C5CFC] rounded-xl px-3 py-2 text-white outline-none text-xs"
                  >
                    <option value="high">High (Urgent)</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-300 block mb-1">
                  Optional Course Association
                </label>
                <select
                  value={taskCourse}
                  onChange={e => setTaskCourse(e.target.value)}
                  className="w-full bg-[#1D1D29] border border-white/10 focus:border-[#7C5CFC] rounded-xl px-3 py-2 text-white outline-none text-xs"
                >
                  <option value="">No Course (General)</option>
                  {courses.map(c => (
                    <option key={c.id} value={c.name}>{c.name}</option>
                  ))}
                </select>
              </div>

              {/* Top Priority Toggle (Max 3) */}
              <div className="flex items-center justify-between p-3 bg-[#1D1D29] rounded-xl border border-white/5">
                <div>
                  <span className="text-xs font-bold text-white block">Mark as Top Priority</span>
                  <span className="text-[11px] text-gray-400">Shown in today's focus row (max 3)</span>
                </div>
                <input
                  type="checkbox"
                  checked={taskIsTopPriority}
                  disabled={topPrioritiesCount >= 3 && !taskIsTopPriority}
                  onChange={e => setTaskIsTopPriority(e.target.checked)}
                  className="w-5 h-5 accent-[#7C5CFC] rounded cursor-pointer"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 min-h-[44px] text-xs font-semibold text-gray-400 hover:text-white bg-white/5 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 min-h-[44px] text-xs font-bold text-white bg-[#7C5CFC] hover:bg-[#6c4be8] active:scale-[0.98] rounded-xl transition-colors shadow-lg shadow-[#7C5CFC]/25"
                >
                  Save Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Preferences / Morning Nudge Drawer */}
      {showPrefsModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-[#15151E] border border-white/10 rounded-3xl p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Bell className="w-4 h-4 text-[#7C5CFC]" />
                <span>Day Planner Preferences</span>
              </h3>
              <button
                onClick={() => setShowPrefsModal(false)}
                className="text-gray-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3.5 text-xs text-gray-300">
              <div className="flex items-center justify-between p-3 bg-[#181824] rounded-xl border border-white/5">
                <div>
                  <span className="font-bold text-white block">Morning Planning Nudge</span>
                  <span className="text-[11px] text-gray-400">Nudges you once a day with your schedule summary</span>
                </div>
                <input
                  type="checkbox"
                  checked={dayPlannerPrefs.morningNudgeEnabled}
                  onChange={e => updateDayPlannerPrefs({ morningNudgeEnabled: e.target.checked })}
                  className="w-5 h-5 accent-[#7C5CFC] cursor-pointer"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-gray-400 block mb-1">
                  Nudge Time
                </label>
                <input
                  type="time"
                  value={dayPlannerPrefs.morningNudgeTime}
                  onChange={e => updateDayPlannerPrefs({ morningNudgeTime: e.target.value })}
                  className="w-full bg-[#181824] border border-white/10 rounded-xl px-3 py-2 text-white outline-none focus:border-[#7C5CFC]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="text-[11px] font-semibold text-gray-400 block mb-1">
                    Study Window Start
                  </label>
                  <input
                    type="time"
                    value={dayPlannerPrefs.defaultStudyWindowStart}
                    onChange={e => updateDayPlannerPrefs({ defaultStudyWindowStart: e.target.value })}
                    className="w-full bg-[#181824] border border-white/10 rounded-xl px-3 py-2 text-white outline-none focus:border-[#7C5CFC]"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-gray-400 block mb-1">
                    Study Window End
                  </label>
                  <input
                    type="time"
                    value={dayPlannerPrefs.defaultStudyWindowEnd}
                    onChange={e => updateDayPlannerPrefs({ defaultStudyWindowEnd: e.target.value })}
                    className="w-full bg-[#181824] border border-white/10 rounded-xl px-3 py-2 text-white outline-none focus:border-[#7C5CFC]"
                  />
                </div>
              </div>
            </div>

            <button
              onClick={() => setShowPrefsModal(false)}
              className="w-full min-h-[44px] rounded-xl bg-[#7C5CFC] text-white text-xs font-bold hover:bg-[#6c4be8] transition-colors"
            >
              Save Preferences
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
