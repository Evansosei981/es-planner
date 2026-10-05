import React, { useState } from 'react';
import { User, GraduationCap, Clock, Check, ArrowRight, Target, Sparkles } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { sanitizeTitle, validateClassTime } from '../utils/dataSanitizer';

export const OnboardingFlow: React.FC = () => {
  const { completeOnboarding, addCourse, updatePracticeSettings } = useApp();
  const [currentStep, setCurrentStep] = useState<0 | 1 | 2>(0);

  // Step 1: Student details
  const [name, setName] = useState('');
  const [major, setMajor] = useState('');

  // Step 2: First class (optional)
  const [courseName, setCourseName] = useState('');
  const [dayOfWeek, setDayOfWeek] = useState(1);
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('11:00');
  const [room, setRoom] = useState('');
  const [classError, setClassError] = useState('');

  // Step 3: Daily Practice Target
  const [dailyTarget, setDailyTarget] = useState<number>(3);

  const days = [
    { num: 1, label: 'Mon' },
    { num: 2, label: 'Tue' },
    { num: 3, label: 'Wed' },
    { num: 4, label: 'Thu' },
    { num: 5, label: 'Fri' },
    { num: 6, label: 'Sat' },
    { num: 7, label: 'Sun' }
  ];

  // Advance from Step 1 (Name)
  const handleStep1Next = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setCurrentStep(1);
  };

  // Step 2 (First Class) - Submit or Skip
  const handleStep2SaveClass = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!courseName.trim()) {
      setCurrentStep(2);
      return;
    }

    const [sH, sM] = startTime.split(':').map(Number);
    const [eH, eM] = endTime.split(':').map(Number);
    const timeValidation = validateClassTime(sH, sM, eH, eM);

    if (!timeValidation.valid) {
      setClassError(timeValidation.error || "End time must be after start time");
      return;
    }

    addCourse({
      name: sanitizeTitle(courseName),
      dayOfWeek,
      startHour: sH,
      startMinute: sM,
      endHour: eH,
      endMinute: eM,
      room: room.trim(),
      lecturer: '',
      colorIndex: 0
    });

    setCurrentStep(2);
  };

  // Step 3 Finish
  const handleFinishOnboarding = () => {
    updatePracticeSettings({ dailyTarget });
    const finalName = name.trim() || "Student";
    const finalMajor = major.trim() || "";
    completeOnboarding(finalName, finalMajor, 10);
  };

  return (
    <div className="min-h-screen bg-[#0B0B10] text-white flex flex-col justify-center p-4 sm:p-6 max-w-lg mx-auto">
      {/* Step Indicators */}
      <div className="mb-6 flex items-center justify-between px-2">
        <div className="flex items-center gap-2">
          {[0, 1, 2].map(stepIdx => (
            <div
              key={stepIdx}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                currentStep === stepIdx
                  ? 'w-8 bg-[#7C5CFC]'
                  : currentStep > stepIdx
                  ? 'w-4 bg-[#00D4A1]'
                  : 'w-4 bg-white/20'
              }`}
            />
          ))}
        </div>
        <span className="text-xs text-gray-400 font-semibold">
          Step {currentStep + 1} of 3
        </span>
      </div>

      <div className="bg-[#15151E] border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl">
        {/* STEP 1: Name & Major */}
        {currentStep === 0 && (
          <form onSubmit={handleStep1Next} className="space-y-5 animate-in fade-in duration-200">
            <div className="text-center space-y-2 pb-2">
              <div className="w-16 h-16 rounded-2xl bg-[#7C5CFC]/15 text-[#7C5CFC] flex items-center justify-center mx-auto mb-2">
                <User className="w-8 h-8" />
              </div>
              <h2 className="text-2xl font-black text-white tracking-tight">
                Welcome to ES Planner
              </h2>
              <p className="text-xs text-gray-400 max-w-xs mx-auto">
                What should Evans, your AI tutor and study planner, call you?
              </p>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-gray-300 block mb-1">
                  Your Name
                </label>
                <input
                  type="text"
                  autoFocus
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="e.g. Alex"
                  className="w-full bg-[#1D1D29] border border-white/10 focus:border-[#7C5CFC] rounded-xl px-4 py-3 text-white text-sm outline-none transition-colors"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-300 block mb-1">
                  Field of Study / Major <span className="text-gray-500 font-normal">(optional)</span>
                </label>
                <input
                  type="text"
                  value={major}
                  onChange={e => setMajor(e.target.value)}
                  placeholder="e.g. Computer Science, Medicine, Law"
                  className="w-full bg-[#1D1D29] border border-white/10 focus:border-[#7C5CFC] rounded-xl px-4 py-3 text-white text-sm outline-none transition-colors"
                />
              </div>
            </div>

            <div className="pt-3 flex items-center gap-3">
              <button
                type="button"
                onClick={() => handleStep1Next()}
                className="flex-1 min-h-[48px] px-4 rounded-xl border border-white/10 hover:bg-white/5 text-gray-400 hover:text-white text-xs font-bold transition-all"
              >
                Skip
              </button>
              <button
                type="submit"
                className="flex-1 min-h-[48px] px-4 rounded-xl bg-[#7C5CFC] hover:bg-[#6c4be8] active:scale-95 text-white text-xs font-bold transition-all shadow-md shadow-[#7C5CFC]/25 flex items-center justify-center gap-1.5"
              >
                <span>Continue</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>
        )}

        {/* STEP 2: Add First Class (or skip) */}
        {currentStep === 1 && (
          <form onSubmit={handleStep2SaveClass} className="space-y-4 animate-in fade-in duration-200">
            <div className="text-center space-y-1.5 pb-1">
              <div className="w-14 h-14 rounded-2xl bg-[#00D4A1]/15 text-[#00D4A1] flex items-center justify-center mx-auto mb-2">
                <GraduationCap className="w-7 h-7" />
              </div>
              <h2 className="text-xl font-black text-white tracking-tight">
                Add Your First Class
              </h2>
              <p className="text-xs text-gray-400 max-w-xs mx-auto">
                Schedule a lecture to kickstart your timetable, or skip to explore.
              </p>
            </div>

            {classError && (
              <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl p-2.5 text-center">
                {classError}
              </p>
            )}

            <div>
              <label className="text-xs font-semibold text-gray-300 block mb-1">
                Course Name
              </label>
              <input
                type="text"
                value={courseName}
                onChange={e => {
                  setCourseName(e.target.value);
                  setClassError('');
                }}
                placeholder="e.g. Data Structures, Linear Algebra"
                className="w-full bg-[#1D1D29] border border-white/10 focus:border-[#7C5CFC] rounded-xl px-4 py-2.5 text-white text-sm outline-none transition-colors"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-300 block mb-1.5">
                Day of Week
              </label>
              <div className="grid grid-cols-7 gap-1">
                {days.map(d => (
                  <button
                    key={d.num}
                    type="button"
                    onClick={() => setDayOfWeek(d.num)}
                    className={`py-2 text-xs font-bold rounded-lg transition-all ${
                      dayOfWeek === d.num
                        ? 'bg-[#7C5CFC] text-white shadow-md shadow-[#7C5CFC]/20'
                        : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    {d.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-gray-300 block mb-1">
                  Start Time
                </label>
                <input
                  type="time"
                  value={startTime}
                  onChange={e => {
                    setStartTime(e.target.value);
                    setClassError('');
                  }}
                  className="w-full bg-[#1D1D29] border border-white/10 focus:border-[#7C5CFC] rounded-xl px-3 py-2 text-white text-xs outline-none"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-300 block mb-1">
                  End Time
                </label>
                <input
                  type="time"
                  value={endTime}
                  onChange={e => {
                    setEndTime(e.target.value);
                    setClassError('');
                  }}
                  className="w-full bg-[#1D1D29] border border-white/10 focus:border-[#7C5CFC] rounded-xl px-3 py-2 text-white text-xs outline-none"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-300 block mb-1">
                Room / Venue <span className="text-gray-500 font-normal">(optional)</span>
              </label>
              <input
                type="text"
                value={room}
                onChange={e => setRoom(e.target.value)}
                placeholder="e.g. Science Hall 101"
                className="w-full bg-[#1D1D29] border border-white/10 focus:border-[#7C5CFC] rounded-xl px-4 py-2.5 text-white text-sm outline-none"
              />
            </div>

            <div className="pt-2 flex items-center gap-3">
              <button
                type="button"
                onClick={() => setCurrentStep(2)}
                className="flex-1 min-h-[46px] px-4 rounded-xl border border-white/10 hover:bg-white/5 text-gray-400 hover:text-white text-xs font-bold transition-all"
              >
                Skip for now
              </button>
              <button
                type="submit"
                className="flex-1 min-h-[46px] px-4 rounded-xl bg-[#7C5CFC] hover:bg-[#6c4be8] active:scale-95 text-white text-xs font-bold transition-all shadow-md shadow-[#7C5CFC]/25 flex items-center justify-center gap-1.5"
              >
                <span>{courseName.trim() ? "Add & Continue" : "Continue"}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>
        )}

        {/* STEP 3: Daily Practice Target */}
        {currentStep === 2 && (
          <div className="space-y-5 animate-in fade-in duration-200">
            <div className="text-center space-y-1.5 pb-1">
              <div className="w-14 h-14 rounded-2xl bg-[#FF7A00]/15 text-[#FF7A00] flex items-center justify-center mx-auto mb-2">
                <Target className="w-7 h-7" />
              </div>
              <h2 className="text-xl font-black text-white tracking-tight">
                Daily Practice Target
              </h2>
              <p className="text-xs text-gray-400 max-w-xs mx-auto">
                How many quick practice questions would you like to solve each day to build concept mastery?
              </p>
            </div>

            <div className="space-y-2.5">
              {[
                { count: 3, label: '3 questions / day', badge: 'Recommended', time: '~3-5 minutes' },
                { count: 5, label: '5 questions / day', badge: 'Standard', time: '~6-8 minutes' },
                { count: 10, label: '10 questions / day', badge: 'Intensive', time: '~12-15 minutes' }
              ].map(opt => (
                <button
                  key={opt.count}
                  type="button"
                  onClick={() => setDailyTarget(opt.count)}
                  className={`w-full p-4 rounded-2xl border text-left transition-all flex items-center justify-between cursor-pointer ${
                    dailyTarget === opt.count
                      ? 'bg-[#7C5CFC]/15 border-[#7C5CFC] text-white shadow-lg shadow-[#7C5CFC]/10'
                      : 'bg-[#1D1D29] border-white/5 text-gray-300 hover:border-white/10'
                  }`}
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-white">{opt.label}</span>
                      <span
                        className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full ${
                          dailyTarget === opt.count
                            ? 'bg-[#7C5CFC] text-white'
                            : 'bg-white/10 text-gray-400'
                        }`}
                      >
                        {opt.badge}
                      </span>
                    </div>
                    <span className="text-xs text-gray-400 mt-0.5 block">Estimated {opt.time}</span>
                  </div>
                  {dailyTarget === opt.count && (
                    <div className="w-6 h-6 rounded-full bg-[#7C5CFC] text-white flex items-center justify-center shrink-0">
                      <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                    </div>
                  )}
                </button>
              ))}
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={handleFinishOnboarding}
                className="w-full min-h-[48px] rounded-xl bg-[#7C5CFC] hover:bg-[#6c4be8] active:scale-98 text-white text-sm font-bold transition-all shadow-xl shadow-[#7C5CFC]/25 flex items-center justify-center gap-2"
              >
                <Sparkles className="w-4 h-4" />
                <span>Start Learning</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
