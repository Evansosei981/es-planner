import React, { useState, useMemo, useEffect } from 'react';
import {
  GraduationCap,
  BookOpen,
  Calendar,
  Plus,
  Trash2,
  FileEdit,
  Clock,
  Sparkles,
  CalendarDays,
  Zap
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Course, Exam } from '../types';
import { getCourseColor } from '../theme/colors';
import { DayPlannerScreen } from './DayPlannerScreen';
import { validateExamDate, detectDuplicateExam } from '../utils/dataSanitizer';

interface ScheduleScreenProps {
  onClassNoteClick: (course: Course) => void;
  onManageClassesClick: () => void;
  initialTab?: 'today' | 'weekly' | 'exams';
  onPlanExamRevision?: (exam: Exam) => void;
  onOpenStudyTimer?: (session: any) => void;
  onOpenDailyPractice?: () => void;
}

export const ScheduleScreen: React.FC<ScheduleScreenProps> = ({
  onClassNoteClick,
  onManageClassesClick,
  initialTab = 'weekly',
  onPlanExamRevision,
  onOpenStudyTimer,
  onOpenDailyPractice
}) => {
  const {
    courses,
    studySessions,
    upcomingExams,
    exams,
    addExam,
    deleteExam,
    currentTime,
    revisionPlans
  } = useApp();

  const [activeTab, setActiveTab] = useState<'today' | 'weekly' | 'exams'>(initialTab);

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  // Selected Day (1 = Monday ... 7 = Sunday)
  const currentDow = (() => {
    const d = new Date().getDay();
    return d === 0 ? 7 : d;
  })();
  const [selectedDay, setSelectedDay] = useState<number>(currentDow);

  // Add Exam Modal state
  const [showAddExamModal, setShowAddExamModal] = useState(false);
  const [examCourseName, setExamCourseName] = useState(courses[0]?.name || '');
  const [examTitle, setExamTitle] = useState('');
  const [examDate, setExamDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return d.toISOString().slice(0, 16);
  });
  const [examColorIdx, setExamColorIdx] = useState(0);
  const [examWarning, setExamWarning] = useState<string | null>(null);

  const dayNames = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

  // Week strip calculation: date numbers, today indicator, dots only for days with items
  const weekDays = useMemo(() => {
    const now = new Date();
    const currentDay = now.getDay();
    const diffToMonday = currentDay === 0 ? -6 : 1 - currentDay;
    const monday = new Date(now);
    monday.setDate(now.getDate() + diffToMonday);

    const dayLetters = ["M", "T", "W", "T", "F", "S", "S"];
    const days = [];

    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      const dayNum = i + 1; // 1 = Monday, ..., 7 = Sunday
      const isToday = d.toDateString() === now.toDateString();
      const hasItems =
        courses.some(c => c.dayOfWeek === dayNum) ||
        studySessions.some(s => s.dayOfWeek === dayNum);

      days.push({
        dayNum,
        dateNumber: d.getDate(),
        letter: dayLetters[i],
        isToday,
        hasItems,
        fullDateString: d.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })
      });
    }
    return days;
  }, [courses, studySessions]);

  const filteredCourses = courses.filter(c => c.dayOfWeek === selectedDay);
  const filteredSessions = studySessions.filter(s => s.dayOfWeek === selectedDay);

  const handleCreateExam = (e: React.FormEvent) => {
    e.preventDefault();
    if (!examCourseName.trim() || !examTitle.trim()) return;
    const timestampMillis = new Date(examDate).getTime() || Date.now() + 86400000;

    // Check validation and duplicate if warning not already acknowledged
    if (!examWarning) {
      const dup = detectDuplicateExam(exams, examCourseName, examTitle, timestampMillis);
      if (dup) {
        setExamWarning(`Duplicate warning: An exam for "${dup.examTitle}" (${dup.courseName}) already exists on that date. Click "Save Exam" again to confirm.`);
        return;
      }

      const dateValidation = validateExamDate(timestampMillis);
      if (dateValidation.isPast) {
        setExamWarning("Warning: This exam date is in the past. Click \"Save Exam\" again to confirm.");
        return;
      }
    }

    addExam({
      courseName: examCourseName.trim(),
      examTitle: examTitle.trim(),
      timestampMillis,
      colorIndex: examColorIdx
    });
    setExamTitle('');
    setExamWarning(null);
    setShowAddExamModal(false);
  };

  // Exam urgency helper: Red (< 3d), Amber (< 7d), Neutral
  const getExamUrgency = (daysLeft: number) => {
    if (daysLeft < 3) {
      return {
        text: 'text-[#EF4444]',
        bg: 'bg-[#EF4444]/15',
        border: 'border-[#EF4444]/30',
        label: daysLeft === 0 ? 'Today!' : daysLeft === 1 ? 'Tomorrow' : `${daysLeft} days`
      };
    }
    if (daysLeft < 7) {
      return {
        text: 'text-[#F59E0B]',
        bg: 'bg-[#F59E0B]/15',
        border: 'border-[#F59E0B]/30',
        label: `${daysLeft} days`
      };
    }
    return {
      text: 'text-gray-400',
      bg: 'bg-white/5',
      border: 'border-white/10',
      label: `${daysLeft} days`
    };
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-36 md:pb-16 space-y-6">
      {/* Standard Header: Title left, Actions right */}
      <header className="flex items-center justify-between gap-4 pb-1">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
            {activeTab === 'today' ? "Day Planner" : activeTab === 'weekly' ? "Classes" : "Exams"}
          </h1>
          <p className="text-xs text-gray-400 mt-0.5">
            {activeTab === 'today'
              ? "Today's timeline, tasks, and auto-fit study slots"
              : activeTab === 'weekly'
              ? "Timetable, lectures, and weekly class schedule"
              : "Upcoming exams, countdowns, and revision plans"}
          </p>
        </div>

        {activeTab === 'weekly' && (
          <button
            onClick={onManageClassesClick}
            className="min-h-[44px] px-3.5 bg-[#7C5CFC] hover:bg-[#6c4be8] text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-md shadow-[#7C5CFC]/25 active:scale-95 transition-all"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Add Class</span>
          </button>
        )}

        {activeTab === 'exams' && (
          <button
            onClick={() => setShowAddExamModal(true)}
            className="min-h-[44px] px-3.5 bg-[#7C5CFC] hover:bg-[#6c4be8] text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-md shadow-[#7C5CFC]/25 active:scale-95 transition-all"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Add Exam</span>
          </button>
        )}
      </header>

      {/* Tabs */}
      <div className="flex border-b border-white/10 gap-6 sm:gap-8">
        <button
          onClick={() => setActiveTab('today')}
          className={`pb-3 text-sm font-bold tracking-tight transition-all relative flex items-center gap-1.5 ${
            activeTab === 'today' ? 'text-[#7C5CFC]' : 'text-gray-400 hover:text-white'
          }`}
        >
          <Zap className="w-4 h-4" />
          <span>Today</span>
          {activeTab === 'today' && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#7C5CFC] rounded-full" />
          )}
        </button>

        <button
          onClick={() => setActiveTab('weekly')}
          className={`pb-3 text-sm font-bold tracking-tight transition-all relative ${
            activeTab === 'weekly' ? 'text-[#7C5CFC]' : 'text-gray-400 hover:text-white'
          }`}
        >
          Timetable
          {activeTab === 'weekly' && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#7C5CFC] rounded-full" />
          )}
        </button>

        <button
          onClick={() => setActiveTab('exams')}
          className={`pb-3 text-sm font-bold tracking-tight transition-all relative flex items-center gap-1.5 ${
            activeTab === 'exams' ? 'text-[#7C5CFC]' : 'text-gray-400 hover:text-white'
          }`}
        >
          <span>Exams</span>
          {upcomingExams.length > 0 && (
            <span className="px-1.5 py-0.2 text-[10px] rounded-full bg-[#7C5CFC]/20 text-[#7C5CFC] font-extrabold">
              {upcomingExams.length}
            </span>
          )}
          {activeTab === 'exams' && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#7C5CFC] rounded-full" />
          )}
        </button>
      </div>

      {activeTab === 'today' && (
        <DayPlannerScreen
          embedded
          onOpenStudyTimer={onOpenStudyTimer}
          onOpenDailyPractice={onOpenDailyPractice}
        />
      )}

      {activeTab === 'weekly' && (
        <div className="space-y-5">
          {/* Week Strip: shows date numbers, marks today, dots ONLY for days with items */}
          <div className="bg-[#15151E] border border-white/5 rounded-2xl p-2.5 grid grid-cols-7 gap-1">
            {weekDays.map(day => {
              const isSelected = selectedDay === day.dayNum;

              return (
                <button
                  key={day.dayNum}
                  onClick={() => setSelectedDay(day.dayNum)}
                  className={`flex flex-col items-center justify-center py-2 px-1 rounded-xl transition-all relative select-none ${
                    isSelected
                      ? 'bg-[#7C5CFC] text-white shadow-lg shadow-[#7C5CFC]/25 font-bold'
                      : day.isToday
                      ? 'bg-white/10 text-white border border-[#7C5CFC]/50'
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <span className="text-[11px] font-semibold opacity-80">{day.letter}</span>
                  <span className="text-sm font-extrabold leading-snug mt-0.5 tabular-nums">
                    {day.dateNumber}
                  </span>

                  {/* Dot ONLY for days with items */}
                  {day.hasItems && (
                    <span
                      className={`w-1.5 h-1.5 rounded-full mt-1 ${
                        isSelected ? 'bg-white' : 'bg-[#7C5CFC]'
                      }`}
                    />
                  )}
                </button>
              );
            })}
          </div>

          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-white">
                {dayNames[selectedDay - 1]}
              </h2>
              {selectedDay === currentDow && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-[#7C5CFC]/20 text-[#7C5CFC] border border-[#7C5CFC]/30">
                  Today
                </span>
              )}
            </div>
            <span className="text-xs font-medium text-gray-400">
              {filteredCourses.length} classes · {filteredSessions.length} study
            </span>
          </div>

          {/* Empty State: Line icon (not emoji), clean copy */}
          {filteredCourses.length === 0 && filteredSessions.length === 0 ? (
            <div className="bg-[#15151E] border border-white/5 rounded-3xl p-10 text-center flex flex-col items-center justify-center space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-[#1D1D29] text-gray-400 flex items-center justify-center">
                <CalendarDays className="w-7 h-7 stroke-[1.75]" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-white">No classes yet.</h3>
                <p className="text-xs text-gray-400 max-w-xs">
                  {courses.length === 0
                    ? "Add your lectures or lab blocks to build your timetable."
                    : `Add a class or study block to build your timetable for ${dayNames[selectedDay - 1]}.`}
                </p>
              </div>
              <button
                onClick={onManageClassesClick}
                className="mt-1 min-h-[40px] px-4 py-2 bg-white/5 hover:bg-white/10 active:scale-95 text-white font-bold text-xs rounded-xl border border-white/10 transition-all flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Class</span>
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {/* Classes */}
              {filteredCourses.map(c => {
                const color = getCourseColor(c.colorIndex);
                const startTime = `${String(c.startHour).padStart(2, '0')}:${String(c.startMinute).padStart(2, '0')}`;
                const endTime = `${String(c.endHour).padStart(2, '0')}:${String(c.endMinute).padStart(2, '0')}`;

                return (
                  <div
                    key={`c-${c.id}`}
                    className="bg-[#15151E] border border-white/5 rounded-2xl p-4 flex items-center gap-3.5 hover:border-white/10 transition-colors group"
                  >
                    <div
                      className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 shadow-md font-bold text-base"
                      style={{ backgroundColor: `${color}20`, color }}
                    >
                      <GraduationCap className="w-5 h-5" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-white text-sm truncate">{c.name}</h4>
                      <p className="text-xs text-gray-400 truncate mt-0.5">
                        {c.room ? `Room ${c.room}` : 'Classroom'} {c.lecturer ? `· ${c.lecturer}` : ''}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <div className="text-right">
                        <span className="text-xs font-bold text-white block tabular-nums">
                          {startTime} – {endTime}
                        </span>
                        <span className="text-[10px] text-[#7C5CFC] font-semibold uppercase">Class</span>
                      </div>

                      <button
                        onClick={() => onClassNoteClick(c)}
                        title="Add Note or Video"
                        className="p-2 text-gray-400 hover:text-white rounded-xl hover:bg-white/5 transition-colors"
                      >
                        <FileEdit className="w-4 h-4 text-[#7C5CFC]" />
                      </button>
                    </div>
                  </div>
                );
              })}

              {/* Study Sessions */}
              {filteredSessions.map(s => {
                const color = getCourseColor(s.colorIndex);
                const endMin = s.startHour * 60 + s.startMinute + s.durationMinutes;
                const startTime = `${String(s.startHour).padStart(2, '0')}:${String(s.startMinute).padStart(2, '0')}`;
                const endTime = `${String(Math.floor(endMin / 60)).padStart(2, '0')}:${String(endMin % 60).padStart(2, '0')}`;

                return (
                  <div
                    key={`s-${s.id}`}
                    className="bg-[#15151E] border border-white/5 rounded-2xl p-4 flex items-center gap-3.5 hover:border-white/10 transition-colors"
                  >
                    <div
                      className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 shadow-md"
                      style={{ backgroundColor: `${color}20`, color }}
                    >
                      <BookOpen className="w-5 h-5" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-white text-sm truncate">{s.courseName}</h4>
                      <p className="text-xs text-gray-400 mt-0.5">
                        Study Session · {s.durationMinutes} mins
                      </p>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-xs font-bold text-white block tabular-nums">
                        {startTime} – {endTime}
                      </span>
                      <span className="text-[10px] text-[#00D4A1] font-semibold uppercase">Study</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Upcoming Exams Tab */}
      {activeTab === 'exams' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-white">Upcoming Exams</h2>
            <span className="text-xs text-gray-400 font-semibold">
              {upcomingExams.length} {upcomingExams.length === 1 ? 'exam' : 'exams'} scheduled
            </span>
          </div>

          {upcomingExams.length === 0 ? (
            <div className="bg-[#15151E] border border-white/5 rounded-3xl p-10 text-center flex flex-col items-center justify-center space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-[#1D1D29] text-gray-400 flex items-center justify-center">
                <Calendar className="w-7 h-7 stroke-[1.75]" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-white">No exams yet.</h3>
                <p className="text-xs text-gray-400 max-w-xs">
                  Keep track of midterms, quizzes, and finals by scheduling exam dates.
                </p>
              </div>
              <button
                onClick={() => {
                  setExamWarning(null);
                  setShowAddExamModal(true);
                }}
                className="min-h-[40px] px-4 py-2 bg-[#7C5CFC] hover:bg-[#6c4be8] text-white font-bold text-xs rounded-xl transition-all active:scale-95 flex items-center gap-1.5 shadow-md shadow-[#7C5CFC]/20"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Exam</span>
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {upcomingExams.map(exam => {
                const daysLeft = Math.max(0, Math.ceil((exam.timestampMillis - currentTime) / (1000 * 60 * 60 * 24)));
                const urgency = getExamUrgency(daysLeft);
                const color = getCourseColor(exam.colorIndex);

                return (
                  <div
                    key={exam.id}
                    className="p-4 bg-[#15151E] border border-white/5 rounded-2xl flex items-center justify-between gap-3 shadow-md"
                  >
                    <div className="flex items-center gap-3 min-w-0 pr-2">
                      <div
                        className="w-3 h-3 rounded-full shrink-0"
                        style={{ backgroundColor: color }}
                      />
                      <div className="truncate">
                        <span className="text-sm font-bold text-white block truncate">
                          {exam.examTitle}
                        </span>
                        <div className="flex items-center gap-2 text-xs text-gray-400 mt-0.5">
                          <span>{exam.courseName}</span>
                          <span>·</span>
                          <span>
                            {new Date(exam.timestampMillis).toLocaleDateString(undefined, {
                              month: 'short',
                              day: 'numeric'
                            })}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {/* Plan My Revision Button (Feature 1 Entry) */}
                      <button
                        onClick={() => onPlanExamRevision?.(exam)}
                        className="min-h-[40px] px-3.5 bg-[#7C5CFC] hover:bg-[#6c4be8] text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-md shadow-[#7C5CFC]/20 active:scale-95 transition-all"
                      >
                        <Sparkles className="w-3.5 h-3.5 stroke-[2.5]" />
                        <span>{revisionPlans[exam.id] ? "View Plan" : "Plan Revision"}</span>
                      </button>

                      <span className={`text-xs font-black ${urgency.text} px-2.5 py-1 rounded-full ${urgency.bg} border ${urgency.border}`}>
                        {urgency.label}
                      </span>
                      <button
                        onClick={() => deleteExam(exam.id)}
                        className="min-w-[40px] min-h-[40px] p-2 text-gray-500 hover:text-[#EF4444] rounded-xl hover:bg-white/5 transition-colors flex items-center justify-center"
                        title="Delete exam"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Add Exam Modal */}
      {showAddExamModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-[#15151E] border border-white/10 rounded-3xl p-6 shadow-2xl relative animate-in fade-in zoom-in-95">
            <h3 className="text-lg font-bold text-white mb-4">Add Upcoming Exam</h3>
            <form onSubmit={handleCreateExam} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-gray-400 block mb-1">
                  Course
                </label>
                {courses.length > 0 ? (
                  <select
                    value={examCourseName}
                    onChange={e => setExamCourseName(e.target.value)}
                    className="w-full bg-[#1D1D29] border border-white/10 focus:border-[#7C5CFC] rounded-xl px-3.5 py-2.5 text-white outline-none text-sm"
                  >
                    {courses.map(c => (
                      <option key={c.id} value={c.name}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    required
                    placeholder="Course Name"
                    value={examCourseName}
                    onChange={e => setExamCourseName(e.target.value)}
                    className="w-full bg-[#1D1D29] border border-white/10 focus:border-[#7C5CFC] rounded-xl px-3.5 py-2.5 text-white outline-none text-sm"
                  />
                )}
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-400 block mb-1">
                  Exam Title
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Midterm 1, Final Exam"
                  value={examTitle}
                  onChange={e => setExamTitle(e.target.value)}
                  className="w-full bg-[#1D1D29] border border-white/10 focus:border-[#7C5CFC] rounded-xl px-3.5 py-2.5 text-white outline-none text-sm"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-400 block mb-1">
                  Exam Date & Time
                </label>
                <input
                  type="datetime-local"
                  required
                  value={examDate}
                  onChange={e => setExamDate(e.target.value)}
                  className="w-full bg-[#1D1D29] border border-white/10 focus:border-[#7C5CFC] rounded-xl px-3.5 py-2.5 text-white outline-none text-sm"
                />
              </div>

              {examWarning && (
                <div className="p-3 bg-amber-500/15 border border-amber-500/30 rounded-xl text-xs text-amber-300">
                  {examWarning}
                </div>
              )}

              <div className="flex gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => {
                    setExamWarning(null);
                    setShowAddExamModal(false);
                  }}
                  className="flex-1 min-h-[44px] text-xs font-semibold text-gray-400 hover:text-white bg-white/5 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 min-h-[44px] text-xs font-bold text-white bg-[#7C5CFC] hover:bg-[#6c4be8] rounded-xl transition-colors shadow-lg shadow-[#7C5CFC]/20"
                >
                  {examWarning ? "Confirm & Save" : "Save Exam"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
