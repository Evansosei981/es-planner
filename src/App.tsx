import React, { useState } from 'react';
import { useApp } from './context/AppContext';
import { ActivationScreen } from './components/ActivationScreen';
import { AdminScreen } from './components/AdminScreen';
import { OnboardingFlow } from './components/OnboardingFlow';
import { TutorialModal } from './components/TutorialModal';
import { BottomNav } from './components/BottomNav';
import { HomeScreen } from './components/HomeScreen';
import { ScheduleScreen } from './components/ScheduleScreen';
import { JournalScreen } from './components/JournalScreen';
import { StudyScreen } from './components/StudyScreen';
import { ProgressScreen } from './components/ProgressScreen';
import { ClassesScreen } from './components/ClassesScreen';
import { TimerScreen } from './components/TimerScreen';
import { ProfileScreen } from './components/ProfileScreen';
import { EvansAiDrawer } from './components/EvansAiDrawer';
import { ClassNoteDialog } from './components/ClassNoteDialog';
import { PracticeModal } from './components/PracticeModal';
import { DailyPracticeDashboard } from './components/DailyPracticeDashboard';
import { DesktopNav } from './components/DesktopNav';
import { ExamRevisionModal } from './components/ExamRevisionModal';
import { PWAUpdatePrompt } from './components/PWAUpdatePrompt';
import { Course, Exam, StudySession } from './types';
import { PracticeQuestion } from './types/practice';

export const App: React.FC = () => {
  const { isActivated, userProfile } = useApp();

  // Screen routing states: survives rotation and tab reload
  const [currentTab, setCurrentTabState] = useState(() => {
    const saved = sessionStorage.getItem("es_active_tab");
    return saved !== null ? Number(saved) : 0;
  });

  const setCurrentTab = (tab: number) => {
    sessionStorage.setItem("es_active_tab", String(tab));
    setCurrentTabState(tab);
  };
  const [overlayScreen, setOverlayScreen] = useState<'none' | 'admin' | 'profile' | 'classes' | 'timer'>('none');
  const [selectedTimerSession, setSelectedTimerSession] = useState<StudySession | null>(null);

  // Modals & Navigation
  const [scheduleInitialTab, setScheduleInitialTab] = useState<'today' | 'weekly' | 'exams'>('weekly');
  const [selectedRevisionExam, setSelectedRevisionExam] = useState<Exam | null>(null);
  const [showEvansAi, setShowEvansAi] = useState(false);
  const [showPracticeModal, setShowPracticeModal] = useState(false);
  const [showPracticeDashboard, setShowPracticeDashboard] = useState(false);
  const [customPracticeQuestions, setCustomPracticeQuestions] = useState<PracticeQuestion[] | undefined>(undefined);
  const [showTutorial, setShowTutorial] = useState(() => {
    return !localStorage.getItem("es_has_seen_tutorial");
  });
  const [activeClassNoteCourse, setActiveClassNoteCourse] = useState<Course | null>(null);

  const handleDismissTutorial = () => {
    localStorage.setItem("es_has_seen_tutorial", "true");
    setShowTutorial(false);
  };

  // If app is not activated and not in admin mode
  if (!isActivated && overlayScreen !== 'admin') {
    return <ActivationScreen onAdminLogin={() => setOverlayScreen('admin')} />;
  }

  // Admin Screen
  if (overlayScreen === 'admin') {
    return <AdminScreen onNavigateBack={() => setOverlayScreen('none')} />;
  }

  // Onboarding flow if first time
  if (!userProfile.hasCompletedOnboarding) {
    return <OnboardingFlow />;
  }

  // Profile Screen overlay
  if (overlayScreen === 'profile') {
    return (
      <ProfileScreen
        onNavigateBack={() => setOverlayScreen('none')}
        onAdminLogin={() => setOverlayScreen('admin')}
        onStartTutorial={() => setShowTutorial(true)}
      />
    );
  }

  // Classes Screen overlay
  if (overlayScreen === 'classes') {
    return <ClassesScreen onNavigateBack={() => setOverlayScreen('none')} />;
  }

  // Focus Timer Screen overlay
  if (overlayScreen === 'timer' && selectedTimerSession) {
    return (
      <TimerScreen
        session={selectedTimerSession}
        onNavigateBack={() => {
          setSelectedTimerSession(null);
          setOverlayScreen('none');
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[var(--color-page-bg)] text-[var(--color-text-primary)] flex flex-col md:flex-row relative selection:bg-[#7C5CFC]/30">
      {/* Desktop Navigation Sidebar (visible on md+) */}
      <DesktopNav
        currentTab={currentTab}
        onTabChange={tabIndex => setCurrentTab(tabIndex)}
        onOpenEvansAi={() => setShowEvansAi(true)}
        onOpenDailyPractice={() => setShowPracticeDashboard(true)}
        onProfileClick={() => setOverlayScreen('profile')}
      />

      {/* Main Tab Content */}
      <main className="flex-1 w-full overflow-x-hidden min-h-screen">
        {currentTab === 0 && (
          <HomeScreen
            onProfileClick={() => setOverlayScreen('profile')}
            onNewSessionClick={() => setCurrentTab(3)}
            onAskEvansClick={() => setShowEvansAi(true)}
            onSeeAllSchedule={() => {
              setScheduleInitialTab('weekly');
              setCurrentTab(1);
            }}
            onStartTutorial={() => setShowTutorial(true)}
            onStartPractice={() => {
              setCustomPracticeQuestions(undefined);
              setShowPracticeModal(true);
            }}
            onOpenDailyPracticeHub={() => setShowPracticeDashboard(true)}
            onOpenDayPlanner={() => {
              setScheduleInitialTab('today');
              setCurrentTab(1);
            }}
            onPlanExamRevision={exam => setSelectedRevisionExam(exam)}
          />
        )}

        {currentTab === 1 && (
          <ScheduleScreen
            initialTab={scheduleInitialTab}
            onClassNoteClick={course => setActiveClassNoteCourse(course)}
            onManageClassesClick={() => setOverlayScreen('classes')}
            onPlanExamRevision={exam => setSelectedRevisionExam(exam)}
            onOpenStudyTimer={session => {
              setSelectedTimerSession(session);
              setOverlayScreen('timer');
            }}
            onOpenDailyPractice={() => setShowPracticeModal(true)}
          />
        )}

        {currentTab === 2 && <JournalScreen />}

        {currentTab === 3 && (
          <StudyScreen
            onSessionClick={session => {
              setSelectedTimerSession(session);
              setOverlayScreen('timer');
            }}
          />
        )}

        {currentTab === 4 && <ProgressScreen />}
      </main>

      {/* Mobile Floating Navigation (hidden on desktop md+) */}
      <div className="md:hidden">
        <BottomNav
          currentTab={currentTab}
          onTabChange={tabIndex => setCurrentTab(tabIndex)}
          onOpenEvansAi={() => setShowEvansAi(true)}
          onOpenDailyPractice={() => setShowPracticeDashboard(true)}
        />
      </div>

      {/* Evans AI Assistant Slide-over Sheet */}
      {showEvansAi && <EvansAiDrawer onClose={() => setShowEvansAi(false)} />}

      {/* Class Note Dialog */}
      {activeClassNoteCourse && (
        <ClassNoteDialog
          course={activeClassNoteCourse}
          onClose={() => setActiveClassNoteCourse(null)}
        />
      )}

      {/* Daily Practice Dashboard (Resources, Bank, Progress, Settings) */}
      {showPracticeDashboard && (
        <DailyPracticeDashboard
          onClose={() => setShowPracticeDashboard(false)}
          onStartChallenge={questions => {
            setCustomPracticeQuestions(questions);
            setShowPracticeDashboard(false);
            setShowPracticeModal(true);
          }}
        />
      )}

      {/* Daily Practice Quiz Modal */}
      {showPracticeModal && (
        <PracticeModal
          questions={customPracticeQuestions}
          onClose={() => {
            setShowPracticeModal(false);
            setCustomPracticeQuestions(undefined);
          }}
        />
      )}

      {/* Exam Revision Planner Modal (Feature 1) */}
      {selectedRevisionExam && (
        <ExamRevisionModal
          exam={selectedRevisionExam}
          onClose={() => setSelectedRevisionExam(null)}
        />
      )}

      {/* Interactive App Tour Modal */}
      {showTutorial && (
        <TutorialModal
          onDismiss={handleDismissTutorial}
          onStepChange={step => {
            if (step === 1) setCurrentTab(1); // Schedule
            if (step === 2) setCurrentTab(3); // Study
            if (step === 3) setCurrentTab(4); // Progress
            if (step === 4) setCurrentTab(2); // Journal
            if (step === 5) setCurrentTab(0); // AI
          }}
        />
      )}
      {/* Safe PWA Update Notification ("New version available, refresh") */}
      <PWAUpdatePrompt />
    </div>
  );
};
