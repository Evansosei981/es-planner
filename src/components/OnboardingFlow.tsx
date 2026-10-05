import React, { useState } from 'react';
import { User, GraduationCap, Bell, ArrowRight, Check, Calendar, Target, BookOpen } from 'lucide-react';
import { useApp } from '../context/AppContext';

export const OnboardingFlow: React.FC = () => {
  const { completeOnboarding } = useApp();
  const [step, setStep] = useState<0 | 1>(0); // 0 = Carousel, 1 = Profile setup
  const [carouselIndex, setCarouselIndex] = useState(0);

  // Profile setup fields
  const [name, setName] = useState('');
  const [major, setMajor] = useState('');
  const [notificationMins, setNotificationMins] = useState(10);

  const pages = [
    {
      title: "Meet Evans",
      description: "Your university study tutor. Evans tracks your classes, explains difficult concepts step by step, and keeps your exams on schedule.",
      icon: GraduationCap,
      color: "#7C5CFC"
    },
    {
      title: "Plan Your Week",
      description: "Organize your lectures and focus study sessions in one unified timetable with smart reminders before class.",
      icon: Calendar,
      color: "#00D4A1"
    },
    {
      title: "Daily Practice",
      description: "Solve 5 quick practice questions each day from your course materials to master concepts and preserve your streak.",
      icon: Target,
      color: "#FF7A00"
    }
  ];

  const handleNextCarousel = () => {
    if (carouselIndex < pages.length - 1) {
      setCarouselIndex(carouselIndex + 1);
    } else {
      setStep(1);
    }
  };

  const handleFinishSetup = (e: React.FormEvent) => {
    e.preventDefault();
    const finalName = name.trim() || "Student";
    const finalMajor = major.trim() || "General Studies";
    completeOnboarding(finalName, finalMajor, notificationMins);
  };

  if (step === 0) {
    const page = pages[carouselIndex];
    const PageIcon = page.icon;

    return (
      <div className="min-h-screen bg-[#0B0B10] text-white flex flex-col justify-between p-6 max-w-lg mx-auto">
        <div className="flex justify-end pt-4">
          <button
            onClick={() => setStep(1)}
            className="min-h-[44px] px-3 text-xs font-bold text-gray-400 hover:text-white transition-colors flex items-center"
          >
            Skip
          </button>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center text-center px-4 my-auto">
          <div
            className="w-24 h-24 rounded-3xl flex items-center justify-center mb-8 shadow-xl transition-all"
            style={{ backgroundColor: `${page.color}15`, color: page.color }}
          >
            <PageIcon className="w-12 h-12 stroke-[1.75]" />
          </div>

          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight mb-3 text-white">
            {page.title}
          </h2>

          <p className="text-sm text-gray-400 max-w-sm leading-relaxed">
            {page.description}
          </p>
        </div>

        <div className="pb-8 space-y-6">
          {/* Indicators */}
          <div className="flex items-center justify-center gap-2">
            {pages.map((_, i) => (
              <div
                key={i}
                className={`h-2 rounded-full transition-all duration-300 ${
                  carouselIndex === i ? 'w-8 bg-[#7C5CFC]' : 'w-2 bg-white/20'
                }`}
              />
            ))}
          </div>

          <button
            onClick={handleNextCarousel}
            className="w-full min-h-[48px] py-3.5 bg-[#7C5CFC] hover:bg-[#6c4be8] active:scale-[0.99] text-white font-extrabold rounded-2xl flex items-center justify-center gap-2 shadow-xl shadow-[#7C5CFC]/25 transition-all text-sm sm:text-base cursor-pointer"
          >
            <span>{carouselIndex === pages.length - 1 ? "Set Up Profile" : "Continue"}</span>
            <ArrowRight className="w-4 h-4 stroke-[2.5]" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0B0B10] text-white flex flex-col justify-center p-6 max-w-md mx-auto">
      <div className="bg-[#15151E] border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl">
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-16 h-16 rounded-2xl bg-[#7C5CFC]/15 text-[#7C5CFC] flex items-center justify-center mb-3">
            <GraduationCap className="w-8 h-8 stroke-[1.75]" />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-white mb-1">
            Personalize Your Space
          </h1>
          <p className="text-xs text-gray-400 max-w-xs">
            Tell Evans your name and study details to tailor your timetable and practice.
          </p>
        </div>

        <form onSubmit={handleFinishSetup} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-gray-300 block mb-1">
              What's your name? *
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="e.g. Alex"
                className="w-full bg-[#1D1D29] border border-white/10 focus:border-[#7C5CFC] rounded-xl pl-10 pr-4 py-2.5 text-white text-sm outline-none transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-300 block mb-1">
              Field of study / Major *
            </label>
            <div className="relative">
              <BookOpen className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                value={major}
                onChange={e => setMajor(e.target.value)}
                placeholder="e.g. Computer Science"
                className="w-full bg-[#1D1D29] border border-white/10 focus:border-[#7C5CFC] rounded-xl pl-10 pr-4 py-2.5 text-white text-sm outline-none transition-colors"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-gray-300 flex items-center gap-1.5">
                <Bell className="w-3.5 h-3.5 text-[#7C5CFC]" />
                <span>Class Alerts</span>
              </label>
              <span className="text-xs font-bold text-[#00D4A1] tabular-nums">
                {notificationMins}m before
              </span>
            </div>
            <input
              type="range"
              min="5"
              max="60"
              step="5"
              value={notificationMins}
              onChange={e => setNotificationMins(parseInt(e.target.value))}
              className="w-full accent-[#7C5CFC] cursor-pointer"
            />
          </div>

          <button
            type="submit"
            className="w-full min-h-[48px] mt-4 bg-[#7C5CFC] hover:bg-[#6c4be8] active:scale-[0.99] text-white font-extrabold text-sm rounded-xl shadow-xl shadow-[#7C5CFC]/25 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <Check className="w-4 h-4 stroke-[2.5]" />
            <span>Start Using ES Planner</span>
          </button>
        </form>
      </div>
    </div>
  );
};
