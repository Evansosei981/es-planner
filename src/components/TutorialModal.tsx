import React, { useState } from 'react';
import {
  X,
  ArrowRight,
  Check,
  Sparkles,
  Calendar,
  Clock,
  TrendingUp,
  FileText,
  GraduationCap
} from 'lucide-react';

interface TutorialModalProps {
  onDismiss: () => void;
  onStepChange?: (step: number) => void;
}

export const TutorialModal: React.FC<TutorialModalProps> = ({ onDismiss, onStepChange }) => {
  const [currentStep, setCurrentStep] = useState(0);

  const steps = [
    {
      title: "Welcome to ES Planner",
      description: "Your university scheduling, focus timer, and academic study assistant designed to keep you ahead.",
      badge: "Overview",
      icon: GraduationCap,
      color: "#7C5CFC"
    },
    {
      title: "Classes & Timetable",
      description: "Manage lecture rooms, instructors, and upcoming exams with color-coded urgency countdowns.",
      badge: "Classes Tab",
      icon: Calendar,
      color: "#00D4A1"
    },
    {
      title: "Study Sessions & Timer",
      description: "Plan dedicated revision blocks and launch the built-in circular focus timer with screen wake lock.",
      badge: "Study Tab",
      icon: Clock,
      color: "#7C5CFC"
    },
    {
      title: "Progress & Topics",
      description: "Track weekly study hours toward your goal and review strong vs needs-practice topic mastery.",
      badge: "Progress Tab",
      icon: TrendingUp,
      color: "#00D4A1"
    },
    {
      title: "Learning Journal",
      description: "Log reflections, key formulas, and lecture notes directly after your classes and study blocks.",
      badge: "Journal Tab",
      icon: FileText,
      color: "#FF7A00"
    },
    {
      title: "Evans Study Tutor",
      description: "Tap Evans anytime for step-by-step problem explanations, math LaTeX solutions, and retention check questions.",
      badge: "Evans Tutor",
      icon: Sparkles,
      color: "#7C5CFC"
    }
  ];

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      const next = currentStep + 1;
      setCurrentStep(next);
      onStepChange?.(next);
    } else {
      onDismiss();
    }
  };

  const step = steps[currentStep];
  const StepIcon = step.icon;

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-[#15151E] border border-white/10 rounded-3xl p-6 shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
        <button
          onClick={onDismiss}
          className="absolute top-4 right-4 min-w-[44px] min-h-[44px] p-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/5 transition-colors flex items-center justify-center"
          aria-label="Close Tour"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex flex-col items-center text-center pt-2">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4 shadow-lg"
            style={{ backgroundColor: `${step.color}15`, color: step.color }}
          >
            <StepIcon className="w-8 h-8 stroke-[1.75]" />
          </div>

          <span
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold mb-3 border"
            style={{
              backgroundColor: `${step.color}15`,
              color: step.color,
              borderColor: `${step.color}30`
            }}
          >
            <Sparkles className="w-3 h-3" />
            <span>{step.badge}</span>
          </span>

          <h3 className="text-xl font-extrabold text-white mb-2 tracking-tight">
            {step.title}
          </h3>

          <p className="text-xs sm:text-sm text-gray-300 max-w-xs mb-8 leading-relaxed">
            {step.description}
          </p>

          <div className="w-full flex items-center justify-between pt-4 border-t border-white/5">
            <div className="flex gap-1.5">
              {steps.map((_, i) => (
                <div
                  key={i}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    currentStep === i ? 'w-6 bg-[#7C5CFC]' : 'w-1.5 bg-white/20'
                  }`}
                />
              ))}
            </div>

            <button
              onClick={handleNext}
              className="min-h-[44px] px-5 bg-[#7C5CFC] hover:bg-[#6c4be8] active:scale-95 text-white font-bold rounded-xl flex items-center gap-2 shadow-lg shadow-[#7C5CFC]/25 text-xs sm:text-sm transition-all cursor-pointer"
            >
              <span>{currentStep === steps.length - 1 ? "Get Started" : "Next"}</span>
              {currentStep === steps.length - 1 ? (
                <Check className="w-4 h-4 stroke-[2.5]" />
              ) : (
                <ArrowRight className="w-4 h-4 stroke-[2.5]" />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
