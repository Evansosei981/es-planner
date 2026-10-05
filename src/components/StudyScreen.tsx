import React, { useState, useRef } from 'react';
import {
  BookOpen,
  CheckCircle2,
  Circle,
  Plus,
  Trash2,
  Play,
  Clock,
  X,
  MoreVertical,
  RotateCcw
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { StudySession } from '../types';
import { getCourseColor } from '../theme/colors';

interface StudyScreenProps {
  onSessionClick: (session: StudySession) => void;
}

export const StudyScreen: React.FC<StudyScreenProps> = ({ onSessionClick }) => {
  const {
    courses,
    studySessions,
    addStudySession,
    toggleSessionComplete,
    deleteStudySession
  } = useApp();

  const [showAddModal, setShowAddModal] = useState(false);
  const [activeMenuSessionId, setActiveMenuSessionId] = useState<number | null>(null);

  // Undo deletion state
  const [undoSession, setUndoSession] = useState<Omit<StudySession, 'id'> | null>(null);
  const undoTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // New Study Session state
  const [selectedCourseId, setSelectedCourseId] = useState<number>(courses[0]?.id || 0);
  const [dayOfWeek, setDayOfWeek] = useState(1);
  const [startTime, setStartTime] = useState('16:00');
  const [durationMinutes, setDurationMinutes] = useState(45);

  const completedCount = studySessions.filter(s => s.completed).length;
  const totalCount = studySessions.length;
  const progressRatio = totalCount > 0 ? completedCount / totalCount : 0;
  const progressPercent = Math.round(progressRatio * 100);

  const dayNames = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
  const currentDow = (() => {
    const d = new Date().getDay();
    return d === 0 ? 7 : d;
  })();

  const handleCreateSession = (e: React.FormEvent) => {
    e.preventDefault();
    const course = courses.find(c => c.id === selectedCourseId);
    const [sH, sM] = startTime.split(':').map(Number);

    addStudySession({
      courseId: course?.id || 0,
      courseName: course?.name || "General Study",
      colorIndex: course?.colorIndex || 0,
      dayOfWeek,
      startHour: isNaN(sH) ? 16 : sH,
      startMinute: isNaN(sM) ? 0 : sM,
      durationMinutes
    });

    setShowAddModal(false);
  };

  const handleStartQuickTimer = (mins: number = 25) => {
    onSessionClick({
      id: Date.now(),
      courseId: 0,
      courseName: "Focus Session",
      colorIndex: 0,
      dayOfWeek: currentDow,
      startHour: new Date().getHours(),
      startMinute: new Date().getMinutes(),
      durationMinutes: mins,
      completed: false,
      dateMillis: Date.now()
    });
  };

  const handleDeleteWithUndo = (session: StudySession) => {
    // Save session data for undo
    setUndoSession({
      courseId: session.courseId,
      courseName: session.courseName,
      colorIndex: session.colorIndex,
      dayOfWeek: session.dayOfWeek,
      startHour: session.startHour,
      startMinute: session.startMinute,
      durationMinutes: session.durationMinutes,
      completed: session.completed,
      dateMillis: session.dateMillis
    });

    deleteStudySession(session.id);
    setActiveMenuSessionId(null);

    if (undoTimeoutRef.current) clearTimeout(undoTimeoutRef.current);
    undoTimeoutRef.current = setTimeout(() => {
      setUndoSession(null);
    }, 4500);
  };

  const handleUndo = () => {
    if (undoSession) {
      addStudySession(undoSession);
      setUndoSession(null);
      if (undoTimeoutRef.current) clearTimeout(undoTimeoutRef.current);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-36 md:pb-16 space-y-6">
      {/* Standard Header: Title left, Actions right */}
      <header className="flex items-center justify-between gap-4 pb-1">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
            Study
          </h1>
          <p className="text-xs text-gray-400 mt-0.5">
            Focus sessions and revision blocks
          </p>
        </div>

        {/* Single Add Action in Header (Does not collide with Ask Evans floating button) */}
        <button
          onClick={() => setShowAddModal(true)}
          className="min-h-[44px] px-3.5 bg-[#7C5CFC] hover:bg-[#6c4be8] text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-md shadow-[#7C5CFC]/25 active:scale-95 transition-all"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>Add Session</span>
        </button>
      </header>

      {/* Progress Bar for Completed Sessions (Green = completed) */}
      {totalCount > 0 && (
        <div className="bg-[#15151E] border border-white/5 rounded-2xl p-4 space-y-2">
          <div className="flex justify-between items-center text-xs font-semibold">
            <span className="text-gray-400">Completion Progress</span>
            <span className="text-[#00D4A1] font-bold">
              {completedCount} of {totalCount} completed ({progressPercent}%)
            </span>
          </div>
          <div className="w-full h-2.5 bg-white/5 rounded-full overflow-hidden">
            <div
              className="h-full bg-[#00D4A1] rounded-full transition-all duration-700 ease-out"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      )}

      {/* Empty State */}
      {studySessions.length === 0 ? (
        <div className="bg-[#15151E] border border-white/5 rounded-3xl p-8 sm:p-10 text-center flex flex-col items-center justify-center my-6 space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-[#1D1D29] text-[#7C5CFC] flex items-center justify-center">
            <BookOpen className="w-7 h-7" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-white">No study sessions planned</h3>
            <p className="text-xs text-gray-400 max-w-xs">
              Focus timer works with or without enrolled courses. Start a timer now or plan recurring sessions.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <button
              onClick={() => handleStartQuickTimer(25)}
              className="min-h-[44px] px-5 py-2.5 bg-[#7C5CFC] hover:bg-[#6c4be8] text-white font-bold rounded-xl flex items-center gap-2 shadow-lg shadow-[#7C5CFC]/25 text-xs transition-all active:scale-95 cursor-pointer"
            >
              <Play className="w-4 h-4 fill-white" />
              <span>Start Focus Timer</span>
            </button>
            <button
              onClick={() => setShowAddModal(true)}
              className="min-h-[44px] px-4 py-2.5 bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white font-bold rounded-xl border border-white/10 flex items-center gap-2 text-xs transition-all active:scale-95 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Plan Study Session</span>
            </button>
          </div>
        </div>
      ) : (
        /* Sessions Grouped by Day of Week with "Today" Marker */
        <div className="space-y-6">
          {([1, 2, 3, 4, 5, 6, 7] as const).map(day => {
            const daySessions = studySessions.filter(s => s.dayOfWeek === day);
            if (daySessions.length === 0) return null;
            const isToday = day === currentDow;

            return (
              <div key={day} className="space-y-2.5">
                <div className="flex items-center gap-2 px-1">
                  <h3 className="text-sm font-bold text-gray-300 uppercase tracking-wider">
                    {dayNames[day - 1]}
                  </h3>
                  {isToday && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-[#7C5CFC]/20 text-[#7C5CFC] border border-[#7C5CFC]/30">
                      Today
                    </span>
                  )}
                </div>

                <div className="space-y-2.5">
                  {daySessions.map(session => {
                    const color = getCourseColor(session.colorIndex);
                    const endMin = session.startHour * 60 + session.startMinute + session.durationMinutes;
                    const startTimeStr = `${String(session.startHour).padStart(2, '0')}:${String(session.startMinute).padStart(2, '0')}`;
                    const endTimeStr = `${String(Math.floor(endMin / 60)).padStart(2, '0')}:${String(endMin % 60).padStart(2, '0')}`;

                    return (
                      <div
                        key={session.id}
                        className={`bg-[#15151E] border rounded-2xl p-3.5 sm:p-4 flex items-center gap-3.5 transition-all shadow-md relative ${
                          session.completed
                            ? 'border-white/5 opacity-70 bg-[#15151E]/60'
                            : 'border-white/5 hover:border-white/15'
                        }`}
                      >
                        {/* Toggle Checkbox: Green = completed */}
                        <button
                          onClick={e => {
                            e.stopPropagation();
                            toggleSessionComplete(session.id);
                          }}
                          className="shrink-0 p-1 text-gray-400 hover:text-[#00D4A1] transition-colors focus:outline-none"
                          title="Toggle Complete"
                        >
                          {session.completed ? (
                            <CheckCircle2 className="w-6 h-6 text-[#00D4A1] fill-[#00D4A1]/20 stroke-[2.5]" />
                          ) : (
                            <Circle className="w-6 h-6 stroke-[2]" style={{ color }} />
                          )}
                        </button>

                        {/* Content clickable to open Focus Timer */}
                        <div
                          onClick={() => onSessionClick(session)}
                          className="flex-1 min-w-0 cursor-pointer"
                        >
                          <div className="flex items-center gap-2">
                            <h4
                              className={`font-bold text-sm truncate ${
                                session.completed ? 'line-through text-gray-400' : 'text-white'
                              }`}
                            >
                              {session.courseName}
                            </h4>
                            {session.isRevisionBlock && (
                              <span className="px-1.5 py-0.2 rounded text-[10px] font-extrabold bg-[#FF7A00]/20 text-[#FF7A00] border border-[#FF7A00]/30 shrink-0">
                                Revision
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-2 mt-0.5 text-xs text-gray-400">
                            {session.topic && (
                              <>
                                <span className="text-gray-300 font-medium truncate max-w-[140px] sm:max-w-xs">{session.topic}</span>
                                <span>·</span>
                              </>
                            )}
                            <span className="font-semibold text-gray-300">
                              {startTimeStr} – {endTimeStr}
                            </span>
                            <span>·</span>
                            <span>{session.durationMinutes} mins</span>
                          </div>
                        </div>

                        {/* Actions: Hide play on completed sessions! */}
                        <div className="flex items-center gap-1.5 shrink-0">
                          {!session.completed && (
                            <button
                              onClick={() => onSessionClick(session)}
                              className="min-h-[40px] px-3 bg-[#7C5CFC]/15 hover:bg-[#7C5CFC]/25 text-[#7C5CFC] rounded-xl transition-all flex items-center gap-1.5 text-xs font-bold active:scale-95"
                              title="Start Focus Timer"
                            >
                              <Play className="w-3.5 h-3.5 fill-[#7C5CFC]" />
                              <span className="hidden sm:inline">Focus</span>
                            </button>
                          )}

                          {/* Overflow / Delete Menu */}
                          <div className="relative">
                            <button
                              onClick={e => {
                                e.stopPropagation();
                                setActiveMenuSessionId(activeMenuSessionId === session.id ? null : session.id);
                              }}
                              className="p-2 text-gray-400 hover:text-white rounded-xl hover:bg-white/5 transition-colors"
                              title="Options"
                            >
                              <MoreVertical className="w-4 h-4" />
                            </button>

                            {activeMenuSessionId === session.id && (
                              <div className="absolute right-0 top-10 w-36 bg-[#1D1D2B] border border-white/10 rounded-xl shadow-xl p-1 z-30 animate-in fade-in zoom-in-95">
                                <button
                                  onClick={e => {
                                    e.stopPropagation();
                                    handleDeleteWithUndo(session);
                                  }}
                                  className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold text-[#EF4444] hover:bg-[#EF4444]/10 transition-colors"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                  <span>Delete Session</span>
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Undo Snackbar */}
      {undoSession && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-40 bg-[#1D1D2B] border border-white/10 text-white px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-3 animate-in fade-in slide-in-from-bottom-2">
          <span className="text-xs font-medium">Study session removed</span>
          <button
            onClick={handleUndo}
            className="text-xs font-extrabold text-[#7C5CFC] hover:underline flex items-center gap-1"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Undo</span>
          </button>
        </div>
      )}

      {/* Add Study Session Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-[#15151E] border border-white/10 rounded-3xl p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-white">Plan Study Session</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-2 text-gray-400 hover:text-white rounded-xl"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSession} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-gray-400 block mb-1.5">
                  Select Course <span className="text-gray-500 font-normal">(optional)</span>
                </label>
                <select
                  value={selectedCourseId}
                  onChange={e => setSelectedCourseId(Number(e.target.value))}
                  className="w-full bg-[#1D1D29] border border-white/10 focus:border-[#7C5CFC] rounded-xl px-3.5 py-2.5 text-white outline-none text-sm"
                >
                  <option value={0}>General Study / Focus (No course)</option>
                  {courses.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-400 block mb-1.5">
                  Day of Week
                </label>
                <select
                  value={dayOfWeek}
                  onChange={e => setDayOfWeek(Number(e.target.value))}
                  className="w-full bg-[#1D1D29] border border-white/10 focus:border-[#7C5CFC] rounded-xl px-3.5 py-2.5 text-white outline-none text-sm"
                >
                  {dayNames.map((d, i) => (
                    <option key={i + 1} value={i + 1}>
                      {d} {i + 1 === currentDow ? '(Today)' : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-400 block mb-1.5">
                  Start Time
                </label>
                <input
                  type="time"
                  required
                  value={startTime}
                  onChange={e => setStartTime(e.target.value)}
                  className="w-full bg-[#1D1D29] border border-white/10 focus:border-[#7C5CFC] rounded-xl px-3.5 py-2.5 text-white outline-none text-sm"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-400 block mb-1.5">
                  Duration
                </label>
                <div className="grid grid-cols-4 gap-2 mb-2">
                  {[25, 45, 60, 90].map(mins => (
                    <button
                      key={mins}
                      type="button"
                      onClick={() => setDurationMinutes(mins)}
                      className={`py-2 text-xs font-bold rounded-xl transition-all ${
                        durationMinutes === mins
                          ? 'bg-[#7C5CFC] text-white shadow-md'
                          : 'bg-white/5 text-gray-300 hover:bg-white/10'
                      }`}
                    >
                      {mins}m
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 min-h-[44px] text-xs font-semibold text-gray-400 hover:text-white bg-white/5 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 min-h-[44px] text-xs font-bold text-white bg-[#7C5CFC] hover:bg-[#6c4be8] rounded-xl transition-colors shadow-lg shadow-[#7C5CFC]/20 cursor-pointer"
                >
                  Save Session
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
