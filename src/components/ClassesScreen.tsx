import React, { useState } from 'react';
import {
  ArrowLeft,
  Plus,
  Trash2,
  GraduationCap,
  X,
  Check,
  AlertCircle,
  Clock
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Course } from '../types';
import { getCourseColor, COURSE_COLORS } from '../theme/colors';

interface ClassesScreenProps {
  onNavigateBack: () => void;
}

const COLOR_OPTIONS = [
  { index: 0, label: 'Indigo', color: '#7C5CFC' },
  { index: 1, label: 'Teal', color: '#00D4A1' },
  { index: 2, label: 'Blue', color: '#4D8CFF' },
  { index: 3, label: 'Amber', color: '#F59E0B' },
  { index: 4, label: 'Coral', color: '#EF4444' },
  { index: 5, label: 'Violet', color: '#A855F7' }
];

export const ClassesScreen: React.FC<ClassesScreenProps> = ({ onNavigateBack }) => {
  const { courses, addCourse, deleteCourse } = useApp();
  const [showAddModal, setShowAddModal] = useState(false);

  // New Course fields
  const [name, setName] = useState('');
  const [lecturer, setLecturer] = useState('');
  const [room, setRoom] = useState('');
  // Multi-day chips support (1=Monday, ..., 7=Sunday)
  const [selectedDays, setSelectedDays] = useState<number[]>([1]);
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('11:00');
  const [colorIndex, setColorIndex] = useState(0);

  const dayNames = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
  const dayLabels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  // End-after-start validation
  const [sH, sM] = startTime.split(':').map(Number);
  const [eH, eM] = endTime.split(':').map(Number);
  const startMinutes = (isNaN(sH) ? 9 : sH) * 60 + (isNaN(sM) ? 0 : sM);
  const endMinutes = (isNaN(eH) ? 11 : eH) * 60 + (isNaN(eM) ? 0 : eM);
  const isTimeInvalid = endMinutes <= startMinutes;

  const toggleDay = (dayNum: number) => {
    if (selectedDays.includes(dayNum)) {
      if (selectedDays.length > 1) {
        setSelectedDays(selectedDays.filter(d => d !== dayNum));
      }
    } else {
      setSelectedDays([...selectedDays, dayNum].sort((a, b) => a - b));
    }
  };

  const handleCreateCourse = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || isTimeInvalid || selectedDays.length === 0) return;

    // Create a course record for each selected day
    selectedDays.forEach(day => {
      addCourse({
        name: name.trim(),
        lecturer: lecturer.trim(),
        room: room.trim(),
        dayOfWeek: day,
        startHour: isNaN(sH) ? 9 : sH,
        startMinute: isNaN(sM) ? 0 : sM,
        endHour: isNaN(eH) ? 11 : eH,
        endMinute: isNaN(eM) ? 0 : eM,
        colorIndex
      });
    });

    setName('');
    setLecturer('');
    setRoom('');
    setSelectedDays([1]);
    setShowAddModal(false);
  };

  return (
    <div className="min-h-screen bg-[#0B0B10] text-white flex flex-col pb-36 md:pb-16">
      {/* Standard Header Pattern: Title left, Actions right */}
      <header className="px-5 py-4 border-b border-white/10 flex items-center justify-between bg-[#15151E] sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <button
            onClick={onNavigateBack}
            className="min-w-[44px] min-h-[44px] -ml-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/5 transition-colors flex items-center justify-center active:scale-95"
            aria-label="Back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl font-bold tracking-tight">Classes</h1>
            <p className="text-xs text-gray-400">{courses.length} courses scheduled</p>
          </div>
        </div>

        {/* Action button on right (Purple = actions) */}
        <button
          onClick={() => setShowAddModal(true)}
          className="min-h-[44px] px-3.5 bg-[#7C5CFC] hover:bg-[#6c4be8] text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-md shadow-[#7C5CFC]/25 active:scale-95 transition-all"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>Add Class</span>
        </button>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-5 max-w-lg mx-auto w-full space-y-6">
        {courses.length === 0 ? (
          <div className="bg-[#15151E] border border-white/5 rounded-3xl p-10 text-center flex flex-col items-center justify-center my-8 space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-[#1D1D29] text-[#7C5CFC] flex items-center justify-center">
              <GraduationCap className="w-7 h-7" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-white">No classes scheduled</h3>
              <p className="text-xs text-gray-400 max-w-xs">
                Add lectures and seminar schedules to build your weekly timetable.
              </p>
            </div>
            <button
              onClick={() => setShowAddModal(true)}
              className="min-h-[44px] px-4 py-2 bg-[#7C5CFC] hover:bg-[#6c4be8] text-white text-xs font-bold rounded-xl flex items-center gap-2 shadow-lg shadow-[#7C5CFC]/20 active:scale-95 transition-all"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>Add Class</span>
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {([1, 2, 3, 4, 5, 6, 7] as const).map(day => {
              const dayCourses = courses.filter(c => c.dayOfWeek === day);
              if (dayCourses.length === 0) return null;

              return (
                <div key={day} className="space-y-2.5">
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider px-1">
                    {dayNames[day - 1]}
                  </h3>
                  <div className="space-y-2.5">
                    {dayCourses.map(course => {
                      const color = getCourseColor(course.colorIndex);
                      const startTimeStr = `${String(course.startHour).padStart(2, '0')}:${String(course.startMinute).padStart(2, '0')}`;
                      const endTimeStr = `${String(course.endHour).padStart(2, '0')}:${String(course.endMinute).padStart(2, '0')}`;
                      const initials = course.name.slice(0, 2).toUpperCase();

                      return (
                        <div
                          key={course.id}
                          className="bg-[#15151E] border border-white/5 rounded-2xl p-4 flex items-center gap-3.5 hover:border-white/10 transition-colors shadow-md"
                        >
                          <div
                            className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 shadow-md font-extrabold text-sm"
                            style={{ backgroundColor: `${color}20`, color }}
                          >
                            {initials}
                          </div>

                          <div className="flex-1 min-w-0">
                            <h4 className="font-bold text-white text-sm truncate">
                              {course.name}
                            </h4>
                            <p className="text-xs text-gray-400 truncate mt-0.5">
                              {course.room ? `Room ${course.room}` : 'Classroom'} {course.lecturer ? `· ${course.lecturer}` : ''}
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-xs font-bold tabular-nums" style={{ color }}>
                                {startTimeStr} – {endTimeStr}
                              </span>
                            </div>
                          </div>

                          <button
                            onClick={() => deleteCourse(course.id)}
                            className="p-2 text-gray-500 hover:text-[#EF4444] rounded-xl hover:bg-white/5 transition-colors shrink-0"
                            title="Delete class"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* ADD CLASS: BOTTOM SHEET ON MOBILE / MODAL ON DESKTOP */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-lg bg-[#15151E] border-t sm:border border-white/10 rounded-t-3xl sm:rounded-3xl p-5 sm:p-6 shadow-2xl relative max-h-[92vh] overflow-y-auto animate-in slide-in-from-bottom duration-200">
            {/* Sheet Drag Pill on mobile */}
            <div className="w-12 h-1 bg-white/20 rounded-full mx-auto mb-4 sm:hidden" />

            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-bold text-white tracking-tight">Add Class</h3>
                <p className="text-xs text-gray-400">Schedule lecture or lab blocks</p>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-2 text-gray-400 hover:text-white rounded-xl hover:bg-white/5 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateCourse} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-gray-300 block mb-1">
                  Course Name *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="e.g. Distributed Systems"
                  className="w-full bg-[#1D1D29] border border-white/10 focus:border-[#7C5CFC] rounded-xl px-3.5 py-2.5 text-white outline-none text-sm transition-colors"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-gray-300 block mb-1">
                    Lecturer / Instructor
                  </label>
                  <input
                    type="text"
                    value={lecturer}
                    onChange={e => setLecturer(e.target.value)}
                    placeholder="e.g. Dr. Asante"
                    className="w-full bg-[#1D1D29] border border-white/10 focus:border-[#7C5CFC] rounded-xl px-3.5 py-2.5 text-white outline-none text-sm transition-colors"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-300 block mb-1">
                    Room / Hall
                  </label>
                  <input
                    type="text"
                    value={room}
                    onChange={e => setRoom(e.target.value)}
                    placeholder="e.g. CS Lab 3"
                    className="w-full bg-[#1D1D29] border border-white/10 focus:border-[#7C5CFC] rounded-xl px-3.5 py-2.5 text-white outline-none text-sm transition-colors"
                  />
                </div>
              </div>

              {/* Multi-Day Chips */}
              <div>
                <label className="text-xs font-semibold text-gray-300 block mb-1.5">
                  Class Days (Select all that apply)
                </label>
                <div className="grid grid-cols-7 gap-1.5">
                  {dayLabels.map((lbl, idx) => {
                    const dayNum = idx + 1;
                    const isSelected = selectedDays.includes(dayNum);
                    return (
                      <button
                        key={dayNum}
                        type="button"
                        onClick={() => toggleDay(dayNum)}
                        className={`h-9 rounded-xl text-xs font-bold transition-all ${
                          isSelected
                            ? 'bg-[#7C5CFC] text-white shadow-md'
                            : 'bg-[#1D1D29] text-gray-400 hover:text-white border border-white/5'
                        }`}
                      >
                        {lbl}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Time Pickers with End-After-Start Validation */}
              <div className="space-y-1.5">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-gray-300 block mb-1">
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
                    <label className="text-xs font-semibold text-gray-300 block mb-1">
                      End Time
                    </label>
                    <input
                      type="time"
                      required
                      value={endTime}
                      onChange={e => setEndTime(e.target.value)}
                      className={`w-full bg-[#1D1D29] border rounded-xl px-3.5 py-2.5 text-white outline-none text-sm ${
                        isTimeInvalid ? 'border-[#EF4444]' : 'border-white/10 focus:border-[#7C5CFC]'
                      }`}
                    />
                  </div>
                </div>

                {isTimeInvalid && (
                  <p className="text-xs text-[#EF4444] font-medium flex items-center gap-1.5 pt-0.5">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>End time must be after start time.</span>
                  </p>
                )}
              </div>

              {/* Color Swatches with Labels */}
              <div>
                <label className="text-xs font-semibold text-gray-300 block mb-2">
                  Course Color Tag
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {COLOR_OPTIONS.map(opt => {
                    const isSelected = colorIndex === opt.index;
                    return (
                      <button
                        key={opt.index}
                        type="button"
                        onClick={() => setColorIndex(opt.index)}
                        className={`p-2.5 rounded-xl border flex items-center gap-2.5 transition-all text-xs font-bold ${
                          isSelected
                            ? 'border-white/40 bg-white/10 text-white'
                            : 'border-white/5 bg-[#1D1D29] text-gray-400 hover:text-white'
                        }`}
                      >
                        <div
                          className="w-4 h-4 rounded-full flex items-center justify-center shrink-0"
                          style={{ backgroundColor: opt.color }}
                        >
                          {isSelected && <Check className="w-2.5 h-2.5 text-white stroke-[3]" />}
                        </div>
                        <span className="truncate">{opt.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Buttons */}
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
                  disabled={isTimeInvalid || selectedDays.length === 0}
                  className="flex-1 min-h-[44px] text-xs font-bold text-white bg-[#7C5CFC] hover:bg-[#6c4be8] disabled:opacity-40 disabled:cursor-not-allowed rounded-xl transition-colors shadow-lg shadow-[#7C5CFC]/25"
                >
                  Save {selectedDays.length > 1 ? `Classes (${selectedDays.length} days)` : 'Class'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
