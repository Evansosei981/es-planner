import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  X,
  Flame,
  Target,
  BookOpen,
  FolderOpen,
  Settings,
  Upload,
  FileText,
  Image as ImageIcon,
  CheckCircle2,
  AlertCircle,
  Plus,
  Trash2,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Check,
  ChevronRight,
  TrendingUp,
  Search,
  ChevronDown,
  ChevronUp,
  Bell,
  RefreshCw,
  Wifi,
  WifiOff,
  Clock,
  Layers,
  Star,
  Download,
  Edit3
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { StudentRecordedResource, PracticeQuestion } from '../types/practice';
import { DuplicateDetector } from '../practice/DuplicateDetector';
import { PracticeNotificationHelper } from '../practice/PracticeNotificationHelper';
import { DayKey } from '../practice/DayKey';
import { PracticeRepository } from '../practice/PracticeRepository';
import { MathText } from './MathText';
import { MathToolbar } from './MathToolbar';
import { QuestionImagePreview } from './QuestionImagePreview';

interface DailyPracticeDashboardProps {
  onClose: () => void;
  onStartChallenge: (customQuestions?: PracticeQuestion[]) => void;
}

type TabType = 'challenge' | 'resources' | 'bank' | 'progress' | 'settings';

export const DailyPracticeDashboard: React.FC<DailyPracticeDashboardProps> = ({
  onClose,
  onStartChallenge
}) => {
  const {
    practiceStreak,
    questionBank,
    resources,
    practiceSettings,
    todayPracticeResult,
    dailyQuestions,
    practiceOverallStats,
    isOnline,
    courses,
    updatePracticeSettings,
    deleteQuestion,
    updateQuestion,
    toggleBookmarkQuestion,
    deleteResource,
    loadStarterQuestionPack,
    processUploadedResource,
    addCustomQuestion
  } = useApp();

  const [activeTab, setActiveTab] = useState<TabType>('challenge');

  // Resource Upload State
  const [uploadTitle, setUploadTitle] = useState('');
  const [selectedCourse, setSelectedCourse] = useState(courses[0]?.name || 'Computer Science');
  const [uploadType, setUploadType] = useState<'file' | 'text'>('file');
  const [pastedText, setPastedText] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileBase64, setFileBase64] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadProgressStep, setUploadProgressStep] = useState<string>('');
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccessMsg, setUploadSuccessMsg] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Question Bank State
  const [searchQuery, setSearchQuery] = useState('');
  const [filterDifficulty, setFilterDifficulty] = useState<string>('all');
  const [filterCourse, setFilterCourse] = useState<string>('all');
  const [filterBookmarkedOnly, setFilterBookmarkedOnly] = useState(false);
  const [expandedQuestionId, setExpandedQuestionId] = useState<string | null>(null);
  const [showAddCustomDialog, setShowAddCustomDialog] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<PracticeQuestion | null>(null);

  // New Custom Question Dialog State
  const [customQuestionText, setCustomQuestionText] = useState('');
  const [customCourse, setCustomCourse] = useState(courses[0]?.name || 'General');
  const [customCategory, setCustomCategory] = useState('');
  const [customDifficulty, setCustomDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [customType, setCustomType] = useState<'multiple_choice' | 'true_false' | 'short_answer'>('multiple_choice');
  const [customOptions, setCustomOptions] = useState<string[]>(['Option A', 'Option B', 'Option C', 'Option D']);
  const [customAnswer, setCustomAnswer] = useState('Option A');
  const [customExplanation, setCustomExplanation] = useState('');
  const [customImageBase64, setCustomImageBase64] = useState('');
  const [customAnswerImageBase64, setCustomAnswerImageBase64] = useState('');

  // Resource Deletion Modal State
  const [resourceToDelete, setResourceToDelete] = useState<StudentRecordedResource | null>(null);
  const [deleteExtractedAlso, setDeleteExtractedAlso] = useState(true);

  // Escape key handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (showAddCustomDialog) setShowAddCustomDialog(false);
        else if (editingQuestion) setEditingQuestion(null);
        else if (resourceToDelete) setResourceToDelete(null);
        else onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showAddCustomDialog, editingQuestion, resourceToDelete, onClose]);

  // Handle File Selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 15 * 1024 * 1024) {
      setUploadError('File size exceeds 15MB limit. Please upload a smaller document.');
      return;
    }

    setSelectedFile(file);
    if (!uploadTitle) {
      const nameWithoutExt = file.name.replace(/\.[^/.]+$/, '');
      setUploadTitle(nameWithoutExt);
    }

    const reader = new FileReader();
    if (file.type.startsWith('image/')) {
      reader.onload = () => setFileBase64(reader.result as string);
      reader.readAsDataURL(file);
    } else {
      reader.onload = () => setPastedText(reader.result as string);
      reader.readAsText(file);
    }
  };

  // Drag and Drop File Handlers
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      if (file.size > 15 * 1024 * 1024) {
        setUploadError('File size exceeds 15MB limit.');
        return;
      }
      setSelectedFile(file);
      if (!uploadTitle) {
        const nameWithoutExt = file.name.replace(/\.[^/.]+$/, '');
        setUploadTitle(nameWithoutExt);
      }
      const reader = new FileReader();
      if (file.type.startsWith('image/')) {
        reader.onload = () => setFileBase64(reader.result as string);
        reader.readAsDataURL(file);
      } else {
        reader.onload = () => setPastedText(reader.result as string);
        reader.readAsText(file);
      }
    }
  };

  // Process Resource Submission
  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploadError(null);
    setUploadSuccessMsg(null);

    const title = uploadTitle.trim();
    if (!title) {
      setUploadError('Please provide a title for this resource.');
      return;
    }

    if (uploadType === 'file' && !selectedFile && !pastedText) {
      setUploadError('Please select a document or paste question text.');
      return;
    }

    if (uploadType === 'text' && !pastedText.trim()) {
      setUploadError('Please paste some text containing exercises or questions.');
      return;
    }

    const existingDup = DuplicateDetector.findDuplicateResource(
      title,
      selectedFile?.name || title,
      resources
    );
    if (existingDup) {
      const confirmProceed = window.confirm(
        `A resource named "${existingDup.title}" was already uploaded. Do you want to process and add questions from it again?`
      );
      if (!confirmProceed) return;
    }

    setIsProcessing(true);
    setUploadProgressStep('Uploading ✓');

    setTimeout(() => setUploadProgressStep('Reading document ✓'), 400);
    setTimeout(() => setUploadProgressStep('Extracting questions...'), 900);
    setTimeout(() => setUploadProgressStep('Identifying topics...'), 1400);
    setTimeout(() => setUploadProgressStep('Adding questions...'), 1900);

    const fileType = selectedFile?.type.startsWith('image/')
      ? 'image'
      : selectedFile?.name.endsWith('.pdf')
      ? 'pdf'
      : 'text';

    try {
      const result = await processUploadedResource({
        title,
        courseName: selectedCourse,
        fileType,
        fileName: selectedFile?.name || `${title}.txt`,
        text: pastedText,
        fileData: fileBase64,
        mimeType: selectedFile?.type
      });

      if (result.success) {
        setUploadSuccessMsg(`${result.count} questions added to your Question Bank! 🎉`);
        setUploadTitle('');
        setPastedText('');
        setSelectedFile(null);
        setFileBase64('');
        if (fileInputRef.current) fileInputRef.current.value = '';
      } else {
        setUploadError(result.error || 'Failed to process resource. Please try again.');
      }
    } catch (err: any) {
      setUploadError(err?.message || 'We could not process this resource. Please try again or upload a clearer file.');
    } finally {
      setIsProcessing(false);
      setUploadProgressStep('');
    }
  };

  // Add Custom Question Submit
  const handleSaveCustomQuestion = () => {
    if (!customQuestionText.trim()) return;

    addCustomQuestion({
      question: customQuestionText.trim(),
      courseName: customCourse,
      subject: customCourse,
      category: customCategory.trim() || 'General',
      difficulty: customDifficulty,
      type: customType,
      options: customType === 'multiple_choice' ? customOptions : (customType === 'true_false' ? ['True', 'False'] : []),
      correctAnswer: customAnswer.trim() || (customOptions[0] || 'A'),
      correctAnswerImageUrl: customAnswerImageBase64 || undefined,
      explanation: customExplanation.trim() || 'Custom question added by student.',
      imageUrl: customImageBase64 || undefined,
      isAiGenerated: false
    });

    setShowAddCustomDialog(false);
    setCustomQuestionText('');
    setCustomCategory('');
    setCustomExplanation('');
    setCustomImageBase64('');
    setCustomAnswerImageBase64('');
  };

  // Save Edit Question
  const handleSaveEditQuestion = () => {
    if (!editingQuestion) return;
    updateQuestion(editingQuestion.id, {
      question: editingQuestion.question,
      category: editingQuestion.category,
      difficulty: editingQuestion.difficulty,
      options: editingQuestion.options,
      correctAnswer: editingQuestion.correctAnswer,
      correctAnswerImageUrl: editingQuestion.correctAnswerImageUrl,
      explanation: editingQuestion.explanation,
      imageUrl: editingQuestion.imageUrl
    });
    setEditingQuestion(null);
  };

  // Export Question Bank as JSON
  const handleExportBank = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(questionBank, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `es_question_bank_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // Weak Topics Targeted Drill
  const handlePracticeWeakTopics = () => {
    const weakTopics = practiceOverallStats.needsPracticeTopics;
    const candidateQuestions = questionBank.filter(q =>
      weakTopics.some(t => t.toLowerCase() === q.category.toLowerCase())
    );
    const selected = candidateQuestions.length > 0 ? candidateQuestions.slice(0, 3) : questionBank.slice(0, 3);
    onStartChallenge(selected);
  };

  // Test Notification
  const handleTestNotification = async () => {
    const granted = await PracticeNotificationHelper.requestPermission();
    if (granted) {
      PracticeNotificationHelper.sendPracticeReminder(practiceSettings.dailyTarget);
    } else {
      alert('Notification permissions are disabled in your browser. Please allow notifications in site settings.');
    }
  };

  // Filtered Question Bank
  const filteredQuestions = questionBank.filter(q => {
    const matchesSearch =
      q.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      q.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      q.courseName.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesDifficulty =
      filterDifficulty === 'all' || q.difficulty === filterDifficulty;

    const matchesCourse =
      filterCourse === 'all' || q.courseName.toLowerCase() === filterCourse.toLowerCase();

    const matchesBookmark =
      !filterBookmarkedOnly || !!q.isBookmarked;

    return matchesSearch && matchesDifficulty && matchesCourse && matchesBookmark;
  });

  const isCompletedToday = !!todayPracticeResult?.completed;
  const targetCount = practiceSettings.dailyTarget;

  // Short weekly strip calculation (last 7 days ending with today)
  const weekDays = useMemo(() => {
    const results = PracticeRepository.loadResults();
    const resultMap = new Map(results.filter(r => r.completed).map(r => [r.dayKey, true]));
    const todayKey = DayKey.getTodayKey();

    const days: { label: string; dayKey: string; isToday: boolean; isCompleted: boolean }[] = [];
    const dayNames = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = DayKey.fromDate(d);
      const isToday = key === todayKey;
      const isCompleted = isToday ? !!todayPracticeResult?.completed : !!resultMap.get(key);
      days.push({
        label: dayNames[d.getDay()],
        dayKey: key,
        isToday,
        isCompleted
      });
    }
    return days;
  }, [todayPracticeResult]);

  return (
    <div className="fixed inset-0 z-50 bg-[#0B0B10]/95 backdrop-blur-xl flex flex-col overflow-hidden animate-in fade-in duration-200">
      {/* Top App Bar: One job, clean title, no permanent status */}
      <div className="px-5 py-4 border-b border-white/5 bg-[#15151E]/90 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#7C5CFC] to-[#00D4A1] flex items-center justify-center shadow-lg shadow-[#7C5CFC]/20">
            <span className="text-xl">🦈</span>
          </div>
          <div>
            <h1 className="text-lg font-extrabold text-white tracking-tight">Daily Practice</h1>
            <p className="text-xs text-gray-400">
              Personalized questions from your course materials
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Show Offline ONLY when relevant; no permanent status */}
          {!isOnline && (
            <div className="flex items-center gap-1.5 text-xs text-[#F59E0B] bg-[#F59E0B]/15 px-2.5 py-1 rounded-full border border-[#F59E0B]/30 font-semibold">
              <WifiOff className="w-3.5 h-3.5" />
              <span>Offline</span>
            </div>
          )}

          <button
            onClick={onClose}
            className="min-h-[44px] min-w-[44px] p-2 rounded-xl bg-white/5 hover:bg-white/10 active:scale-95 text-gray-300 hover:text-white transition-all flex items-center justify-center"
            aria-label="Close Daily Practice"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 max-w-xl w-full mx-auto pb-24 space-y-5">
        {/* Sub-view Back Button when outside of the main Today's Practice view */}
        {activeTab !== 'challenge' && (
          <div className="flex items-center justify-between pb-3 border-b border-white/5">
            <button
              onClick={() => setActiveTab('challenge')}
              className="flex items-center gap-2 text-xs font-bold text-[#7C5CFC] hover:text-[#9B82FD] transition-colors py-2 px-3 rounded-xl hover:bg-white/5 active:scale-95"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Today's Practice</span>
            </button>
            <span className="text-xs font-semibold text-gray-400">
              {activeTab === 'resources' && 'Learning Resources'}
              {activeTab === 'bank' && 'Question Bank'}
              {activeTab === 'progress' && 'Practice Analytics'}
              {activeTab === 'settings' && 'Practice Settings'}
            </span>
          </div>
        )}

        {/* ========================================================================= */}
        {/* ONE JOB: TODAY'S PRACTICE HERO SCREEN */}
        {/* ========================================================================= */}
        {activeTab === 'challenge' && (
          <div className="space-y-5">
            {/* HERO CARD ONLY */}
            <div className="bg-gradient-to-br from-[#1C1833] via-[#141424] to-[#101018] border border-[#7C5CFC]/30 rounded-3xl p-5 sm:p-6 shadow-xl shadow-[#7C5CFC]/10 space-y-4">
              {/* Mascot, "X questions today", and Streak Chip */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-[#7C5CFC]/20 text-[#7C5CFC] flex items-center justify-center text-2xl shadow-md shrink-0">
                    🦈
                  </div>
                  <div>
                    <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                      {isCompletedToday
                        ? "Today's target complete!"
                        : `${dailyQuestions.length} questions today`}
                    </h2>
                    <p className="text-xs text-gray-300 mt-0.5">
                      {isCompletedToday
                        ? "All done for today! Your streak is secured."
                        : "Solve a quick round to keep your memory sharp."}
                    </p>
                  </div>
                </div>

                {/* Streak Chip (Orange = streak) */}
                <div
                  className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold text-[#FF7A00] bg-[#FF7A00]/15 border border-[#FF7A00]/30 shrink-0"
                  title={`${practiceStreak.currentStreak} day streak`}
                >
                  <Flame className="w-4 h-4 fill-[#FF7A00]" />
                  <span>{practiceStreak.currentStreak} days</span>
                </div>
              </div>

              {/* ONE Progress Bar */}
              <div className="space-y-2 pt-1">
                <div className="flex justify-between items-center text-xs font-semibold">
                  <span className="text-gray-400">
                    {isCompletedToday ? "Target complete" : "Today's progress"}
                  </span>
                  <span className={isCompletedToday ? "text-[#00D4A1] font-bold" : "text-white font-bold"}>
                    {isCompletedToday ? targetCount : (todayPracticeResult?.score || 0)} of {targetCount} done
                  </span>
                </div>
                <div className="w-full h-3 bg-white/5 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-700 ease-out ${
                      isCompletedToday
                        ? 'bg-[#00D4A1]'
                        : 'bg-gradient-to-r from-[#7C5CFC] to-[#00D4A1]'
                    }`}
                    style={{
                      width: `${isCompletedToday ? 100 : Math.min(100, Math.round(((todayPracticeResult?.score || 0) / targetCount) * 100))}%`
                    }}
                  />
                </div>
              </div>

              {/* Accuracy as small secondary line & at most one line: "Focus on: Normalization" */}
              <div className="flex flex-wrap items-center justify-between text-xs text-gray-400 pt-0.5">
                <span>Accuracy: {practiceOverallStats.accuracyPercentage}%</span>
                {practiceOverallStats.needsPracticeTopics.length > 0 && (
                  <span className="text-gray-300">
                    Focus on: <strong className="text-white font-semibold">{practiceOverallStats.needsPracticeTopics[0]}</strong>
                  </span>
                )}
              </div>

              {/* Start Button: Purple = actions */}
              {questionBank.length === 0 ? (
                <div className="pt-2 text-center space-y-3">
                  <p className="text-xs text-gray-400">
                    No questions in your bank yet. Add learning material or load sample questions.
                  </p>
                  <div className="flex flex-wrap gap-2.5">
                    <button
                      onClick={() => setActiveTab('resources')}
                      className="flex-1 min-h-[48px] px-4 rounded-2xl bg-[#7C5CFC] hover:bg-[#6c4be8] active:scale-[0.98] text-white font-bold text-xs transition-all flex items-center justify-center gap-2"
                    >
                      <Upload className="w-4 h-4" />
                      <span>Upload Material</span>
                    </button>
                    <button
                      onClick={loadStarterQuestionPack}
                      className="min-h-[48px] px-4 rounded-2xl bg-white/10 hover:bg-white/15 active:scale-[0.98] text-white font-bold text-xs transition-all flex items-center justify-center gap-2"
                    >
                      <RefreshCw className="w-4 h-4" />
                      <span>Sample Pack</span>
                    </button>
                  </div>
                </div>
              ) : dailyQuestions.length === 0 && !isCompletedToday ? (
                <div className="pt-2 text-center space-y-3">
                  <p className="text-xs text-gray-400">
                    No available questions for "{practiceSettings.preferredCourse}".
                  </p>
                  <button
                    onClick={() => updatePracticeSettings({ preferredCourse: 'all' })}
                    className="w-full min-h-[48px] px-4 rounded-2xl bg-[#7C5CFC] hover:bg-[#6c4be8] active:scale-[0.98] text-white font-bold text-xs transition-all"
                  >
                    Switch to All Courses ({questionBank.length} questions)
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => onStartChallenge()}
                  className="w-full min-h-[48px] py-3.5 px-6 rounded-2xl bg-[#7C5CFC] hover:bg-[#6c4be8] active:scale-[0.98] text-white font-extrabold text-sm sm:text-base flex items-center justify-center gap-2 shadow-xl shadow-[#7C5CFC]/25 transition-all"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>
                    {isCompletedToday ? "Practice Again" : "Start Today's Practice"}
                  </span>
                  <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                </button>
              )}

              {/* Course Selector: small dropdown below Start, defaulting to "All courses" */}
              <div className="flex items-center justify-between pt-3 text-xs border-t border-white/5">
                <span className="text-gray-400 font-medium">Practice course</span>
                <select
                  value={practiceSettings.preferredCourse || 'all'}
                  onChange={e => updatePracticeSettings({ preferredCourse: e.target.value })}
                  className="bg-[#1D1D2B] text-white border border-white/10 rounded-xl px-3 py-1.5 text-xs font-semibold focus:outline-none focus:border-[#7C5CFC] transition-colors cursor-pointer"
                >
                  <option value="all">All courses</option>
                  {courses.map(c => (
                    <option key={c.id} value={c.name}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* SHORT WEEKLY STRIP (7 dots for days practiced) */}
            <div className="bg-[#14141E] border border-white/5 rounded-2xl p-4">
              <div className="flex items-center justify-between mb-3 text-xs">
                <span className="font-bold text-gray-300">This Week's Activity</span>
                <span className="text-[11px] text-gray-400">
                  {weekDays.filter(d => d.isCompleted).length} of 7 days completed
                </span>
              </div>

              <div className="grid grid-cols-7 gap-2">
                {weekDays.map(day => (
                  <div key={day.dayKey} className="flex flex-col items-center gap-1.5">
                    <span className="text-[11px] font-semibold text-gray-400">{day.label}</span>
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                        day.isCompleted
                          ? 'bg-[#00D4A1] text-black shadow-sm'
                          : day.isToday
                          ? 'bg-[#7C5CFC]/15 border-2 border-[#7C5CFC] text-[#7C5CFC]'
                          : 'bg-white/5 border border-white/10 text-gray-600'
                      }`}
                      title={`${day.dayKey}: ${day.isCompleted ? 'Completed' : 'Not practiced'}`}
                    >
                      {day.isCompleted ? (
                        <Check className="w-4 h-4 stroke-[3]" />
                      ) : day.isToday ? (
                        <div className="w-2 h-2 rounded-full bg-[#7C5CFC]" />
                      ) : (
                        <div className="w-1.5 h-1.5 rounded-full bg-white/20" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* COMPACT "MORE" LIST BELOW THE MAIN BUTTON */}
            <div className="space-y-2 pt-1">
              <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block px-1">
                More
              </span>

              <div className="bg-[#14141E] border border-white/5 rounded-2xl divide-y divide-white/5 overflow-hidden">
                <button
                  onClick={() => setActiveTab('resources')}
                  className="w-full px-4 py-3.5 flex items-center justify-between text-left hover:bg-white/[0.03] transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-[#00D4A1]/15 text-[#00D4A1] flex items-center justify-center shrink-0">
                      <FolderOpen className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-white block group-hover:text-[#00D4A1] transition-colors">
                        Resources
                      </span>
                      <span className="text-[11px] text-gray-400">
                        {resources.length} uploaded · Upload PDFs & notes
                      </span>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-500 group-hover:text-white transition-colors" />
                </button>

                <button
                  onClick={() => setActiveTab('bank')}
                  className="w-full px-4 py-3.5 flex items-center justify-between text-left hover:bg-white/[0.03] transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-[#7C5CFC]/15 text-[#7C5CFC] flex items-center justify-center shrink-0">
                      <BookOpen className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-white block group-hover:text-[#7C5CFC] transition-colors">
                        Question Bank
                      </span>
                      <span className="text-[11px] text-gray-400">
                        {questionBank.length} questions · Search & custom questions
                      </span>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-500 group-hover:text-white transition-colors" />
                </button>

                <button
                  onClick={() => setActiveTab('progress')}
                  className="w-full px-4 py-3.5 flex items-center justify-between text-left hover:bg-white/[0.03] transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-[#F59E0B]/15 text-[#F59E0B] flex items-center justify-center shrink-0">
                      <TrendingUp className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-white block group-hover:text-[#F59E0B] transition-colors">
                        Progress & History
                      </span>
                      <span className="text-[11px] text-gray-400">
                        Detailed attempt logs & trends
                      </span>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-500 group-hover:text-white transition-colors" />
                </button>

                <button
                  onClick={() => setActiveTab('settings')}
                  className="w-full px-4 py-3.5 flex items-center justify-between text-left hover:bg-white/[0.03] transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-white/10 text-gray-300 flex items-center justify-center shrink-0">
                      <Settings className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-white block group-hover:text-white transition-colors">
                        Settings
                      </span>
                      <span className="text-[11px] text-gray-400">
                        Target: {practiceSettings.dailyTarget} Qs/day · Reminders
                      </span>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-500 group-hover:text-white transition-colors" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 2: MY RESOURCES (STUDENT RESOURCE INPUT & EXTRACTION) */}
        {/* ========================================================================= */}
        {activeTab === 'resources' && (
          <div className="space-y-6">
            {/* Upload Box */}
            <div className="bg-[#15151E] border border-white/10 rounded-3xl p-6 shadow-xl space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    <Upload className="w-5 h-5 text-[#00D4A1]" />
                    <span>Upload Learning Material</span>
                  </h2>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Extract questions from your PDFs, lecture exercise sheets, past exams, or typed questions
                  </p>
                </div>
              </div>

              {/* Upload Type Switcher */}
              <div className="flex items-center gap-2 p-1 bg-white/5 rounded-xl w-fit">
                <button
                  type="button"
                  onClick={() => setUploadType('file')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    uploadType === 'file' ? 'bg-[#7C5CFC] text-white shadow' : 'text-gray-400 hover:text-white'
                  }`}
                >
                  Document / Image
                </button>
                <button
                  type="button"
                  onClick={() => setUploadType('text')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    uploadType === 'text' ? 'bg-[#7C5CFC] text-white shadow' : 'text-gray-400 hover:text-white'
                  }`}
                >
                  Type / Paste Questions
                </button>
              </div>

              <form onSubmit={handleUploadSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-gray-400 block mb-1">
                      Resource Title *
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Calculus Exercise 1, CS101 Past Paper"
                      value={uploadTitle}
                      onChange={e => setUploadTitle(e.target.value)}
                      className="w-full bg-[#1A1A26] border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-[#7C5CFC]"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-gray-400 block mb-1">
                      Associated Course
                    </label>
                    <select
                      value={selectedCourse}
                      onChange={e => setSelectedCourse(e.target.value)}
                      className="w-full bg-[#1A1A26] border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-[#7C5CFC]"
                    >
                      {courses.map(c => (
                        <option key={c.id} value={c.name}>
                          {c.name}
                        </option>
                      ))}
                      <option value="General Studies">General Studies</option>
                    </select>
                  </div>
                </div>

                {uploadType === 'file' ? (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    onDragOver={e => {
                      e.preventDefault();
                      setIsDragOver(true);
                    }}
                    onDragLeave={() => setIsDragOver(false)}
                    onDrop={handleDrop}
                    className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all ${
                      isDragOver
                        ? 'border-[#00D4A1] bg-[#00D4A1]/10'
                        : 'border-white/15 hover:border-[#7C5CFC]/50 bg-white/[0.02]'
                    }`}
                  >
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileChange}
                      accept=".pdf,.png,.jpg,.jpeg,.webp,.txt,.md"
                      className="hidden"
                    />
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <div className="w-12 h-12 rounded-2xl bg-[#7C5CFC]/15 flex items-center justify-center text-[#7C5CFC]">
                        <Upload className="w-6 h-6" />
                      </div>
                      <span className="text-sm font-bold text-white">
                        {selectedFile ? selectedFile.name : 'Click or drop PDF, image, or text file here'}
                      </span>
                      <span className="text-xs text-gray-500">
                        Supports PDF, PNG, JPG, TXT (up to 15MB)
                      </span>
                    </div>
                  </div>
                ) : (
                  <div>
                    <label className="text-xs font-semibold text-gray-400 block mb-1">
                      Paste Exercise Questions Text
                    </label>
                    <textarea
                      rows={5}
                      placeholder="1. What is the time complexity of Quick Sort? A) O(n) B) O(n log n) C) O(1) Answer: B&#10;2. Find the derivative of f(x) = x^2..."
                      value={pastedText}
                      onChange={e => setPastedText(e.target.value)}
                      className="w-full bg-[#1A1A26] border border-white/10 rounded-xl p-3.5 text-sm text-white focus:outline-none focus:border-[#7C5CFC] font-mono"
                    />
                  </div>
                )}

                {/* Animated Processing Status */}
                {isProcessing && (
                  <div className="bg-[#7C5CFC]/15 border border-[#7C5CFC]/30 rounded-2xl p-4 flex items-center gap-3 animate-pulse">
                    <RefreshCw className="w-5 h-5 text-[#7C5CFC] animate-spin" />
                    <div>
                      <span className="text-sm font-bold text-white block">
                        Processing resource...
                      </span>
                      <span className="text-xs text-[#00D4A1] font-semibold">
                        {uploadProgressStep || 'Reading document...'}
                      </span>
                    </div>
                  </div>
                )}

                {/* Error Banner */}
                {uploadError && (
                  <div className="bg-[#EF4444]/15 border border-[#EF4444]/30 rounded-2xl p-4 flex items-center gap-3 text-xs text-[#EF4444]">
                    <AlertCircle className="w-5 h-5 shrink-0" />
                    <span>{uploadError}</span>
                  </div>
                )}

                {/* Success Banner */}
                {uploadSuccessMsg && (
                  <div className="bg-[#00D4A1]/15 border border-[#00D4A1]/30 rounded-2xl p-4 flex items-center gap-3 text-xs text-[#00D4A1]">
                    <CheckCircle2 className="w-5 h-5 shrink-0" />
                    <span>{uploadSuccessMsg}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isProcessing}
                  className="w-full py-3.5 px-4 rounded-xl bg-[#00D4A1] hover:bg-[#00B88C] text-black font-extrabold text-sm flex items-center justify-center gap-2 shadow-lg disabled:opacity-50 transition-all"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Extract Questions & Add to Bank</span>
                </button>
              </form>
            </div>

            {/* Uploaded Resources List */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-base font-bold text-white">My Resources ({resources.length})</h3>
              </div>

              {resources.length === 0 ? (
                <div className="bg-[#15151E] border border-white/5 rounded-2xl p-8 text-center space-y-2">
                  <FolderOpen className="w-10 h-10 text-gray-500 mx-auto" />
                  <p className="text-sm font-semibold text-white">No learning resources added yet</p>
                  <p className="text-xs text-gray-400 max-w-sm mx-auto">
                    Upload an exercise sheet, past question PDF, or paste text above to extract your custom questions!
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {resources.map(res => (
                    <div
                      key={res.id}
                      className="bg-[#15151E] border border-white/5 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center shrink-0 text-[#7C5CFC]">
                          {res.fileType === 'pdf' ? (
                            <FileText className="w-5 h-5 text-[#EF4444]" />
                          ) : res.fileType === 'image' ? (
                            <ImageIcon className="w-5 h-5 text-[#00D4A1]" />
                          ) : (
                            <FileText className="w-5 h-5 text-[#4D8CFF]" />
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-sm font-bold text-white">{res.title}</h4>
                            <span className="text-xs text-gray-400">
                              · {res.status === 'completed' ? `${res.questionsCount} questions` : res.status}
                            </span>
                          </div>
                          <span className="text-xs text-gray-400 block mt-0.5">
                            {res.fileName} • {new Date(res.uploadedAt).toLocaleDateString()}
                          </span>
                          {res.detectedTopics.length > 0 && (
                            <div className="flex flex-wrap items-center gap-1.5 mt-2 text-[11px] text-gray-400">
                              {res.detectedTopics.map((t, i) => (
                                <React.Fragment key={t}>
                                  <span>{t}</span>
                                  {i < res.detectedTopics.length - 1 && <span aria-hidden="true">·</span>}
                                </React.Fragment>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-end sm:self-center">
                        <button
                          onClick={() => {
                            setSearchQuery(res.title);
                            setActiveTab('bank');
                          }}
                          className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-semibold text-gray-300 hover:text-white"
                        >
                          View Questions
                        </button>
                        <button
                          onClick={() => setResourceToDelete(res)}
                          className="p-2 rounded-xl bg-[#EF4444]/10 hover:bg-[#EF4444]/20 text-[#EF4444] transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 3: QUESTION BANK */}
        {/* ========================================================================= */}
        {activeTab === 'bank' && (
          <div className="space-y-6">
            {/* Search & Filters Bar */}
            <div className="bg-[#15151E] border border-white/5 rounded-2xl p-4 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="relative flex-1 min-w-[200px]">
                  <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search question text, topic, course..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="w-full bg-[#1A1A26] border border-white/10 rounded-xl pl-9 pr-3.5 py-2 text-xs text-white focus:outline-none focus:border-[#7C5CFC]"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleExportBank}
                    className="px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition-colors"
                    title="Export question bank to JSON"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Export</span>
                  </button>

                  <button
                    onClick={() => setShowAddCustomDialog(true)}
                    className="px-4 py-2 rounded-xl bg-[#7C5CFC] hover:bg-[#6846EB] text-white text-xs font-bold flex items-center gap-1.5 shadow"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add Question</span>
                  </button>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setFilterBookmarkedOnly(prev => !prev)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                    filterBookmarkedOnly
                      ? 'bg-[#F59E0B]/20 text-[#F59E0B] border border-[#F59E0B]/40'
                      : 'bg-[#1A1A26] border border-white/10 text-gray-400 hover:text-white'
                  }`}
                >
                  <Star className={`w-3.5 h-3.5 ${filterBookmarkedOnly ? 'fill-[#F59E0B]' : ''}`} />
                  <span>Bookmarked</span>
                </button>

                <select
                  value={filterDifficulty}
                  onChange={e => setFilterDifficulty(e.target.value)}
                  className="bg-[#1A1A26] border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white"
                >
                  <option value="all">All Difficulties</option>
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                </select>

                <select
                  value={filterCourse}
                  onChange={e => setFilterCourse(e.target.value)}
                  className="bg-[#1A1A26] border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white"
                >
                  <option value="all">All Courses</option>
                  {courses.map(c => (
                    <option key={c.id} value={c.name}>
                      {c.name}
                    </option>
                  ))}
                </select>

                <button
                  onClick={() => {
                    setSearchQuery('');
                    setFilterDifficulty('all');
                    setFilterCourse('all');
                    setFilterBookmarkedOnly(false);
                  }}
                  className="text-xs text-gray-400 hover:text-white underline ml-auto"
                >
                  Reset Filters
                </button>
              </div>
            </div>

            {/* Questions List */}
            <div className="space-y-3">
              {filteredQuestions.length === 0 ? (
                <div className="bg-[#15151E] border border-white/5 rounded-2xl p-8 text-center space-y-2">
                  <p className="text-sm font-semibold text-white">No questions match your filter</p>
                  <p className="text-xs text-gray-400">
                    Try adjusting your search query, clearing the bookmark filter, or uploading a new resource.
                  </p>
                </div>
              ) : (
                filteredQuestions.map(q => {
                  const isExpanded = expandedQuestionId === q.id;

                  return (
                    <div
                      key={q.id}
                      className="bg-[#15151E] border border-white/5 rounded-2xl p-4 transition-all hover:border-white/15"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <div className="flex flex-wrap items-center gap-2 mb-1.5 text-xs text-gray-400 font-medium">
                            <span className="text-[#7C5CFC] font-semibold">{q.category}</span>
                            <span aria-hidden="true">·</span>
                            <span className="capitalize">{q.difficulty}</span>
                            <span aria-hidden="true">·</span>
                            <span>{q.courseName}</span>
                            {q.isAiGenerated && (
                              <>
                                <span aria-hidden="true">·</span>
                                <span className="text-[#4D8CFF] font-semibold">AI Generated</span>
                              </>
                            )}
                            {q.sourceResourceName && (
                              <>
                                <span aria-hidden="true">·</span>
                                <span className="truncate max-w-[200px] text-gray-400">
                                  {q.sourceResourceName}
                                </span>
                              </>
                            )}
                          </div>

                          <div className="text-sm font-semibold text-white leading-relaxed">
                            <MathText content={q.question} />
                          </div>

                          {q.imageUrl && (
                            <div className="mt-2.5 max-w-sm">
                              <QuestionImagePreview imageUrl={q.imageUrl} alt={q.question} />
                            </div>
                          )}
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            onClick={() => toggleBookmarkQuestion(q.id)}
                            className={`p-1.5 rounded-lg transition-colors ${
                              q.isBookmarked
                                ? 'text-[#F59E0B] bg-[#F59E0B]/10'
                                : 'text-gray-400 hover:text-white hover:bg-white/5'
                            }`}
                            title={q.isBookmarked ? "Remove bookmark" : "Bookmark question"}
                          >
                            <Star className={`w-4 h-4 ${q.isBookmarked ? 'fill-[#F59E0B]' : ''}`} />
                          </button>

                          <button
                            onClick={() => setEditingQuestion(q)}
                            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white"
                            title="Edit question"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => setExpandedQuestionId(isExpanded ? null : q.id)}
                            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white"
                          >
                            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                          </button>

                          <button
                            onClick={() => deleteQuestion(q.id)}
                            className="p-1.5 rounded-lg bg-[#EF4444]/10 hover:bg-[#EF4444]/20 text-[#EF4444]"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* Expandable details */}
                      {isExpanded && (
                        <div className="mt-3 pt-3 border-t border-white/5 space-y-2 text-xs">
                          {q.options && q.options.length > 0 && (
                            <div className="space-y-1">
                              <span className="font-semibold text-gray-400">Options:</span>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                                {q.options.map((opt, i) => (
                                  <div
                                    key={i}
                                    className={`p-2 rounded-lg border text-xs flex items-center justify-between ${
                                      opt === q.correctAnswer
                                        ? 'bg-[#00D4A1]/15 border-[#00D4A1]/40 text-[#00D4A1] font-bold'
                                        : 'bg-white/5 border-white/5 text-gray-300'
                                    }`}
                                  >
                                    <span>
                                      <MathText content={opt} />
                                    </span>
                                    {opt === q.correctAnswer && <span className="ml-1 text-[#00D4A1]">✓</span>}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          <div className="bg-[#1A1A26] rounded-xl p-3 space-y-1.5">
                            <div className="font-bold text-[#00D4A1] flex items-center gap-1.5">
                              <span>Solution / Answer:</span>
                              <MathText content={q.correctAnswer} />
                            </div>
                            {q.correctAnswerImageUrl && (
                              <div className="pt-2">
                                <span className="text-[11px] font-semibold text-gray-400 block mb-1">
                                  Worked Solution / Answer Diagram:
                                </span>
                                <div className="max-w-xs">
                                  <QuestionImagePreview
                                    imageUrl={q.correctAnswerImageUrl}
                                    alt="Worked solution image"
                                  />
                                </div>
                              </div>
                            )}
                            {q.explanation && (
                              <div className="text-gray-400 leading-relaxed pt-1">
                                <MathText content={q.explanation} />
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 4: PROGRESS & ANALYTICS */}
        {/* ========================================================================= */}
        {activeTab === 'progress' && (
          <div className="space-y-6">
            {/* Top Stats Overview */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-[#15151E] border border-white/5 rounded-2xl p-4 text-center">
                <span className="text-xs text-gray-400 font-semibold block mb-1">
                  Questions Solved
                </span>
                <span className="text-2xl font-black text-white">
                  {practiceOverallStats.totalSolved}
                </span>
              </div>

              <div className="bg-[#15151E] border border-white/5 rounded-2xl p-4 text-center">
                <span className="text-xs text-gray-400 font-semibold block mb-1">
                  Accuracy
                </span>
                <span className="text-2xl font-black text-[#00D4A1]">
                  {practiceOverallStats.accuracyPercentage}%
                </span>
              </div>

              <div className="bg-[#15151E] border border-white/5 rounded-2xl p-4 text-center">
                <span className="text-xs text-gray-400 font-semibold block mb-1">
                  Current Streak
                </span>
                <span className="text-2xl font-black text-[#FF7A00]">
                  🔥 {practiceOverallStats.currentStreak}
                </span>
              </div>

              <div className="bg-[#15151E] border border-white/5 rounded-2xl p-4 text-center">
                <span className="text-xs text-gray-400 font-semibold block mb-1">
                  Longest Streak
                </span>
                <span className="text-2xl font-black text-[#7C5CFC]">
                  🏆 {practiceOverallStats.longestStreak}
                </span>
              </div>
            </div>

            {/* Topic Breakdown */}
            <div className="bg-[#15151E] border border-white/5 rounded-3xl p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Layers className="w-5 h-5 text-[#7C5CFC]" />
                  <span>Topic Mastery Breakdown</span>
                </h3>

                {practiceOverallStats.needsPracticeTopics.length > 0 && (
                  <button
                    onClick={handlePracticeWeakTopics}
                    className="px-3.5 py-1.5 rounded-xl bg-[#7C5CFC]/20 hover:bg-[#7C5CFC]/30 text-white text-xs font-bold transition-all flex items-center gap-1.5"
                  >
                    <span>Drill Weak Topics Now</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {practiceOverallStats.topicBreakdown.length === 0 ? (
                <p className="text-xs text-gray-400 py-4 text-center">
                  Solve daily practice questions to view your accuracy breakdown by topic!
                </p>
              ) : (
                <div className="space-y-3">
                  {practiceOverallStats.topicBreakdown.map(topic => (
                    <div key={topic.topic} className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-white">{topic.topic}</span>
                        <span
                          className={`font-bold ${
                            topic.accuracy < 60
                              ? 'text-[#EF4444]'
                              : topic.accuracy >= 75
                              ? 'text-[#00D4A1]'
                              : 'text-[#F59E0B]'
                          }`}
                        >
                          {topic.accuracy}% ({topic.correctAttempts}/{topic.totalAttempts})
                        </span>
                      </div>
                      <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            topic.accuracy < 60
                              ? 'bg-[#EF4444]'
                              : topic.accuracy >= 75
                              ? 'bg-[#00D4A1]'
                              : 'bg-[#F59E0B]'
                          }`}
                          style={{ width: `${topic.accuracy}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Difficulty Breakdown */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="bg-[#15151E] border border-white/5 rounded-2xl p-4 text-center">
                <span className="text-xs font-bold text-[#00D4A1] block mb-1">Easy Questions</span>
                <span className="text-xl font-black text-white">
                  {practiceOverallStats.difficultyBreakdown.easy.total > 0
                    ? Math.round(
                        (practiceOverallStats.difficultyBreakdown.easy.correct /
                          practiceOverallStats.difficultyBreakdown.easy.total) *
                          100
                      )
                    : 0}%
                </span>
                <span className="text-[10px] text-gray-500 block">
                  {practiceOverallStats.difficultyBreakdown.easy.correct} of {practiceOverallStats.difficultyBreakdown.easy.total}
                </span>
              </div>

              <div className="bg-[#15151E] border border-white/5 rounded-2xl p-4 text-center">
                <span className="text-xs font-bold text-[#F59E0B] block mb-1">Medium Questions</span>
                <span className="text-xl font-black text-white">
                  {practiceOverallStats.difficultyBreakdown.medium.total > 0
                    ? Math.round(
                        (practiceOverallStats.difficultyBreakdown.medium.correct /
                          practiceOverallStats.difficultyBreakdown.medium.total) *
                          100
                      )
                    : 0}%
                </span>
                <span className="text-[10px] text-gray-500 block">
                  {practiceOverallStats.difficultyBreakdown.medium.correct} of {practiceOverallStats.difficultyBreakdown.medium.total}
                </span>
              </div>

              <div className="bg-[#15151E] border border-white/5 rounded-2xl p-4 text-center">
                <span className="text-xs font-bold text-[#EF4444] block mb-1">Hard Questions</span>
                <span className="text-xl font-black text-white">
                  {practiceOverallStats.difficultyBreakdown.hard.total > 0
                    ? Math.round(
                        (practiceOverallStats.difficultyBreakdown.hard.correct /
                          practiceOverallStats.difficultyBreakdown.hard.total) *
                          100
                      )
                    : 0}%
                </span>
                <span className="text-[10px] text-gray-500 block">
                  {practiceOverallStats.difficultyBreakdown.hard.correct} of {practiceOverallStats.difficultyBreakdown.hard.total}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 5: SETTINGS (DAILY TARGET, NOTIFICATIONS, AI OPTIONS) */}
        {/* ========================================================================= */}
        {activeTab === 'settings' && (
          <div className="space-y-6">
            {/* Daily Target Setting */}
            <div className="bg-[#15151E] border border-white/5 rounded-3xl p-6 space-y-4">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Target className="w-5 h-5 text-[#7C5CFC]" />
                  <span>Daily Practice Target</span>
                </h3>
                <p className="text-xs text-gray-400 mt-1">
                  Choose how many questions you want to solve every day. You can change this at any time.
                </p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[1, 2, 5, 10].map(count => (
                  <button
                    key={count}
                    onClick={() => updatePracticeSettings({ dailyTarget: count })}
                    className={`py-3.5 px-4 rounded-2xl border text-sm font-black transition-all ${
                      practiceSettings.dailyTarget === count
                        ? 'bg-[#7C5CFC] border-[#7C5CFC] text-white shadow-lg shadow-[#7C5CFC]/20'
                        : 'bg-white/5 border-white/10 text-gray-300 hover:text-white'
                    }`}
                  >
                    {count} {count === 1 ? 'Question' : 'Questions'} / day
                  </button>
                ))}
              </div>
            </div>

            {/* Course Focus Preference Setting */}
            <div className="bg-[#15151E] border border-white/5 rounded-3xl p-6 space-y-4">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-[#00D4A1]" />
                  <span>Default Course to Practice</span>
                </h3>
                <p className="text-xs text-gray-400 mt-1">
                  Choose whether your daily practice draws questions from all your courses or focuses on a specific course.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                <button
                  type="button"
                  onClick={() => updatePracticeSettings({ preferredCourse: 'all' })}
                  className={`p-3.5 rounded-2xl border text-xs font-bold text-left transition-all ${
                    (practiceSettings.preferredCourse || 'all') === 'all'
                      ? 'bg-[#7C5CFC]/20 border-[#7C5CFC] text-white ring-1 ring-[#7C5CFC]'
                      : 'bg-white/5 border-white/5 text-gray-400 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <span className="block text-white font-extrabold text-sm mb-0.5">All Courses (Mixed)</span>
                  <span className="text-[11px] text-gray-400">Comprehensive daily review across all courses</span>
                </button>

                {courses.map(course => {
                  const isSelected = practiceSettings.preferredCourse === course.name;
                  const count = questionBank.filter(
                    q => q.courseName.toLowerCase() === course.name.toLowerCase()
                  ).length;

                  return (
                    <button
                      key={course.id}
                      type="button"
                      onClick={() => updatePracticeSettings({ preferredCourse: course.name })}
                      className={`p-3.5 rounded-2xl border text-xs font-bold text-left transition-all ${
                        isSelected
                          ? 'bg-[#00D4A1]/20 border-[#00D4A1] text-white ring-1 ring-[#00D4A1]'
                          : 'bg-white/5 border-white/5 text-gray-400 hover:text-white hover:bg-white/10'
                      }`}
                    >
                      <span className="block text-white font-extrabold text-sm mb-0.5">{course.name}</span>
                      <span className="text-[11px] text-gray-400">{count} practice questions available</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Notification Reminders */}
            <div className="bg-[#15151E] border border-white/5 rounded-3xl p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <Bell className="w-5 h-5 text-[#00D4A1]" />
                    <span>Daily Practice Reminders</span>
                  </h3>
                  <p className="text-xs text-gray-400 mt-1">
                    Receive a friendly prompt when your daily challenge is ready
                  </p>
                </div>

                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={practiceSettings.reminderEnabled}
                    onChange={e => updatePracticeSettings({ reminderEnabled: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#00D4A1]"></div>
                </label>
              </div>

              {practiceSettings.reminderEnabled && (
                <div className="pt-2 flex flex-wrap items-center justify-between gap-4 border-t border-white/5">
                  <div className="flex items-center gap-3">
                    <Clock className="w-4 h-4 text-gray-400" />
                    <span className="text-xs font-semibold text-gray-300">Reminder Time:</span>
                    <input
                      type="time"
                      value={practiceSettings.reminderTime}
                      onChange={e => updatePracticeSettings({ reminderTime: e.target.value })}
                      className="bg-[#1A1A26] border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-[#00D4A1]"
                    />
                  </div>

                  <button
                    onClick={handleTestNotification}
                    className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-bold text-gray-300 hover:text-white transition-colors"
                  >
                    Send Test Reminder
                  </button>
                </div>
              )}
            </div>

            {/* AI Generated Questions Toggle */}
            <div className="bg-[#15151E] border border-white/5 rounded-3xl p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-[#4D8CFF]" />
                    <span>AI-Generated Questions (Optional)</span>
                  </h3>
                  <p className="text-xs text-gray-400 mt-1 max-w-lg">
                    When enabled, Evans AI can generate supplemental practice questions if your personal resource bank has insufficient questions.
                  </p>
                </div>

                <label className="relative inline-flex items-center cursor-pointer shrink-0">
                  <input
                    type="checkbox"
                    checked={practiceSettings.allowAiGeneratedQuestions}
                    onChange={e =>
                      updatePracticeSettings({ allowAiGeneratedQuestions: e.target.checked })
                    }
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#4D8CFF]"></div>
                </label>
              </div>
            </div>

            {/* Reset / Starter Pack */}
            <div className="bg-[#15151E] border border-white/5 rounded-3xl p-6 flex flex-wrap items-center justify-between gap-4">
              <div>
                <h4 className="text-sm font-bold text-white">Default Question Pack</h4>
                <p className="text-xs text-gray-400 mt-0.5">
                  Restore standard Computer Science, Mathematics, and Algorithms sample questions
                </p>
              </div>

              <button
                onClick={() => {
                  loadStarterQuestionPack();
                  alert('Default sample questions restored!');
                }}
                className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-bold text-gray-300 hover:text-white"
              >
                Restore Standard Pack
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Delete Resource Confirmation Modal */}
      {resourceToDelete && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#15151E] border border-white/10 rounded-3xl p-6 max-w-md w-full space-y-4">
            <h3 className="text-base font-bold text-white">Delete Learning Resource</h3>
            <p className="text-xs text-gray-400">
              Are you sure you want to delete <strong>"{resourceToDelete.title}"</strong>?
            </p>

            <label className="flex items-center gap-2 cursor-pointer text-xs text-gray-300">
              <input
                type="checkbox"
                checked={deleteExtractedAlso}
                onChange={e => setDeleteExtractedAlso(e.target.checked)}
                className="rounded text-[#7C5CFC]"
              />
              <span>Also delete the {resourceToDelete.questionsCount} extracted questions from your bank</span>
            </label>

            <div className="flex items-center justify-end gap-3 pt-3">
              <button
                onClick={() => setResourceToDelete(null)}
                className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-semibold text-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  deleteResource(resourceToDelete.id, deleteExtractedAlso);
                  setResourceToDelete(null);
                }}
                className="px-4 py-2 rounded-xl bg-[#EF4444] hover:bg-[#DC2626] text-white text-xs font-bold"
              >
                Delete Resource
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Custom Question Dialog */}
      {showAddCustomDialog && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#15151E] border border-white/10 rounded-3xl p-6 max-w-lg w-full space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white">Add Custom Practice Question</h3>
              <button
                onClick={() => setShowAddCustomDialog(false)}
                className="p-1 rounded-lg hover:bg-white/10 text-gray-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-gray-400 block mb-1">Question Text *</label>
                <textarea
                  rows={3}
                  value={customQuestionText}
                  onChange={e => setCustomQuestionText(e.target.value)}
                  placeholder="e.g. Compute the integral $\int_0^1 x^2 \, dx$ or evaluate $\lim_{x \to 0} \frac{\sin x}{x}$."
                  className="w-full bg-[#1A1A26] border border-white/10 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-[#7C5CFC]"
                />
                <MathToolbar
                  className="mt-2"
                  onInsert={sym => setCustomQuestionText(prev => prev + " " + sym)}
                  previewText={customQuestionText}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-gray-400 block mb-1">Course</label>
                  <select
                    value={customCourse}
                    onChange={e => setCustomCourse(e.target.value)}
                    className="w-full bg-[#1A1A26] border border-white/10 rounded-xl px-3 py-2 text-white"
                  >
                    {courses.map(c => (
                      <option key={c.id} value={c.name}>
                        {c.name}
                      </option>
                    ))}
                    <option value="General">General</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-gray-400 block mb-1">Topic / Category</label>
                  <input
                    type="text"
                    placeholder="e.g. Calculus, Sorting"
                    value={customCategory}
                    onChange={e => setCustomCategory(e.target.value)}
                    className="w-full bg-[#1A1A26] border border-white/10 rounded-xl px-3 py-2 text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-gray-400 block mb-1">Difficulty</label>
                  <select
                    value={customDifficulty}
                    onChange={e => setCustomDifficulty(e.target.value as any)}
                    className="w-full bg-[#1A1A26] border border-white/10 rounded-xl px-3 py-2 text-white"
                  >
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="hard">Hard</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-gray-400 block mb-1">Type</label>
                  <select
                    value={customType}
                    onChange={e => setCustomType(e.target.value as any)}
                    className="w-full bg-[#1A1A26] border border-white/10 rounded-xl px-3 py-2 text-white"
                  >
                    <option value="multiple_choice">Multiple Choice</option>
                    <option value="true_false">True / False</option>
                    <option value="short_answer">Short Answer</option>
                  </select>
                </div>
              </div>

              {customType === 'multiple_choice' && (
                <div className="space-y-2">
                  <label className="font-semibold text-gray-400 block">Options</label>
                  {customOptions.map((opt, idx) => (
                    <input
                      key={idx}
                      type="text"
                      value={opt}
                      onChange={e => {
                        const updated = [...customOptions];
                        updated[idx] = e.target.value;
                        setCustomOptions(updated);
                      }}
                      className="w-full bg-[#1A1A26] border border-white/10 rounded-xl px-3 py-1.5 text-white mb-1"
                    />
                  ))}
                </div>
              )}

              <div>
                <label className="font-semibold text-gray-400 block mb-1">Correct Answer / Solution</label>
                <input
                  type="text"
                  value={customAnswer}
                  onChange={e => setCustomAnswer(e.target.value)}
                  placeholder="The exact correct answer or option text"
                  className="w-full bg-[#1A1A26] border border-white/10 rounded-xl px-3 py-2 text-white"
                />
              </div>

              <div>
                <label className="font-semibold text-gray-400 block mb-1">
                  Attach Problem Image / Diagram (Optional)
                </label>
                {customImageBase64 ? (
                  <div className="relative rounded-xl overflow-hidden border border-white/10 max-h-40 bg-[#0E0E14] flex items-center justify-center p-2">
                    <img src={customImageBase64} alt="Attached" className="max-h-36 object-contain rounded-lg" />
                    <button
                      type="button"
                      onClick={() => setCustomImageBase64('')}
                      className="absolute top-2 right-2 px-2 py-1 rounded-lg bg-[#EF4444] text-white text-[11px] font-bold shadow"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <input
                    type="file"
                    accept="image/*"
                    onChange={e => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      const reader = new FileReader();
                      reader.onload = () => setCustomImageBase64(reader.result as string);
                      reader.readAsDataURL(file);
                    }}
                    className="w-full text-xs text-gray-400 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-white/10 file:text-white hover:file:bg-white/20 cursor-pointer"
                  />
                )}
              </div>

              {customType === 'short_answer' && (
                <div>
                  <label className="font-semibold text-gray-400 block mb-1">
                    Attach Model Solution / Answer Diagram (Optional)
                  </label>
                  {customAnswerImageBase64 ? (
                    <div className="relative rounded-xl overflow-hidden border border-white/10 max-h-40 bg-[#0E0E14] flex items-center justify-center p-2">
                      <img
                        src={customAnswerImageBase64}
                        alt="Solution Diagram"
                        className="max-h-36 object-contain rounded-lg"
                      />
                      <button
                        type="button"
                        onClick={() => setCustomAnswerImageBase64('')}
                        className="absolute top-2 right-2 px-2 py-1 rounded-lg bg-[#EF4444] text-white text-[11px] font-bold shadow"
                      >
                        Remove
                      </button>
                    </div>
                  ) : (
                    <input
                      type="file"
                      accept="image/*"
                      onChange={e => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        const reader = new FileReader();
                        reader.onload = () => setCustomAnswerImageBase64(reader.result as string);
                        reader.readAsDataURL(file);
                      }}
                      className="w-full text-xs text-gray-400 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-white/10 file:text-white hover:file:bg-white/20 cursor-pointer"
                    />
                  )}
                </div>
              )}

              <div>
                <label className="font-semibold text-gray-400 block mb-1">Explanation</label>
                <textarea
                  rows={2}
                  value={customExplanation}
                  onChange={e => setCustomExplanation(e.target.value)}
                  placeholder="Helpful step-by-step reasoning shown after submission"
                  className="w-full bg-[#1A1A26] border border-white/10 rounded-xl p-3 text-white"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3">
              <button
                onClick={() => setShowAddCustomDialog(false)}
                className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-semibold text-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveCustomQuestion}
                className="px-4 py-2 rounded-xl bg-[#7C5CFC] hover:bg-[#6846EB] text-white text-xs font-bold shadow"
              >
                Save Question
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Question Dialog */}
      {editingQuestion && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#15151E] border border-white/10 rounded-3xl p-6 max-w-lg w-full space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white">Edit Question</h3>
              <button
                onClick={() => setEditingQuestion(null)}
                className="p-1 rounded-lg hover:bg-white/10 text-gray-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-gray-400 block mb-1">Question Text</label>
                <textarea
                  rows={3}
                  value={editingQuestion.question}
                  onChange={e =>
                    setEditingQuestion({ ...editingQuestion, question: e.target.value })
                  }
                  className="w-full bg-[#1A1A26] border border-white/10 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-[#7C5CFC]"
                />
                <MathToolbar
                  className="mt-2"
                  onInsert={sym =>
                    setEditingQuestion(prev =>
                      prev ? { ...prev, question: prev.question + " " + sym } : null
                    )
                  }
                  previewText={editingQuestion.question}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-gray-400 block mb-1">Topic</label>
                  <input
                    type="text"
                    value={editingQuestion.category}
                    onChange={e =>
                      setEditingQuestion({ ...editingQuestion, category: e.target.value })
                    }
                    className="w-full bg-[#1A1A26] border border-white/10 rounded-xl px-3 py-2 text-white"
                  />
                </div>

                <div>
                  <label className="font-semibold text-gray-400 block mb-1">Difficulty</label>
                  <select
                    value={editingQuestion.difficulty}
                    onChange={e =>
                      setEditingQuestion({
                        ...editingQuestion,
                        difficulty: e.target.value as any
                      })
                    }
                    className="w-full bg-[#1A1A26] border border-white/10 rounded-xl px-3 py-2 text-white"
                  >
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="hard">Hard</option>
                  </select>
                </div>
              </div>

              {editingQuestion.options && editingQuestion.options.length > 0 && (
                <div className="space-y-2">
                  <label className="font-semibold text-gray-400 block">Options</label>
                  {editingQuestion.options.map((opt, idx) => (
                    <input
                      key={idx}
                      type="text"
                      value={opt}
                      onChange={e => {
                        const updated = [...(editingQuestion.options || [])];
                        updated[idx] = e.target.value;
                        setEditingQuestion({ ...editingQuestion, options: updated });
                      }}
                      className="w-full bg-[#1A1A26] border border-white/10 rounded-xl px-3 py-1.5 text-white mb-1"
                    />
                  ))}
                </div>
              )}

              <div>
                <label className="font-semibold text-gray-400 block mb-1">Correct Answer</label>
                <input
                  type="text"
                  value={editingQuestion.correctAnswer}
                  onChange={e =>
                    setEditingQuestion({ ...editingQuestion, correctAnswer: e.target.value })
                  }
                  className="w-full bg-[#1A1A26] border border-white/10 rounded-xl px-3 py-2 text-white"
                />
              </div>

              <div>
                <label className="font-semibold text-gray-400 block mb-1">
                  Problem Image / Diagram (Optional)
                </label>
                {editingQuestion.imageUrl ? (
                  <div className="relative rounded-xl overflow-hidden border border-white/10 max-h-40 bg-[#0E0E14] flex items-center justify-center p-2">
                    <img src={editingQuestion.imageUrl} alt="Attached" className="max-h-36 object-contain rounded-lg" />
                    <button
                      type="button"
                      onClick={() => setEditingQuestion({ ...editingQuestion, imageUrl: undefined })}
                      className="absolute top-2 right-2 px-2 py-1 rounded-lg bg-[#EF4444] text-white text-[11px] font-bold shadow"
                    >
                      Remove Image
                    </button>
                  </div>
                ) : (
                  <input
                    type="file"
                    accept="image/*"
                    onChange={e => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      const reader = new FileReader();
                      reader.onload = () =>
                        setEditingQuestion(prev =>
                          prev ? { ...prev, imageUrl: reader.result as string } : null
                        );
                      reader.readAsDataURL(file);
                    }}
                    className="w-full text-xs text-gray-400 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-white/10 file:text-white hover:file:bg-white/20 cursor-pointer"
                  />
                )}
              </div>

              {editingQuestion.type === 'short_answer' && (
                <div>
                  <label className="font-semibold text-gray-400 block mb-1">
                    Model Solution / Answer Diagram (Optional)
                  </label>
                  {editingQuestion.correctAnswerImageUrl ? (
                    <div className="relative rounded-xl overflow-hidden border border-white/10 max-h-40 bg-[#0E0E14] flex items-center justify-center p-2">
                      <img
                        src={editingQuestion.correctAnswerImageUrl}
                        alt="Solution Diagram"
                        className="max-h-36 object-contain rounded-lg"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setEditingQuestion({ ...editingQuestion, correctAnswerImageUrl: undefined })
                        }
                        className="absolute top-2 right-2 px-2 py-1 rounded-lg bg-[#EF4444] text-white text-[11px] font-bold shadow"
                      >
                        Remove Solution Image
                      </button>
                    </div>
                  ) : (
                    <input
                      type="file"
                      accept="image/*"
                      onChange={e => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        const reader = new FileReader();
                        reader.onload = () =>
                          setEditingQuestion(prev =>
                            prev ? { ...prev, correctAnswerImageUrl: reader.result as string } : null
                          );
                        reader.readAsDataURL(file);
                      }}
                      className="w-full text-xs text-gray-400 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-white/10 file:text-white hover:file:bg-white/20 cursor-pointer"
                    />
                  )}
                </div>
              )}

              <div>
                <label className="font-semibold text-gray-400 block mb-1">Explanation</label>
                <textarea
                  rows={2}
                  value={editingQuestion.explanation}
                  onChange={e =>
                    setEditingQuestion({ ...editingQuestion, explanation: e.target.value })
                  }
                  className="w-full bg-[#1A1A26] border border-white/10 rounded-xl p-3 text-white"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3">
              <button
                onClick={() => setEditingQuestion(null)}
                className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-semibold text-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEditQuestion}
                className="px-4 py-2 rounded-xl bg-[#00D4A1] hover:bg-[#00B88C] text-black text-xs font-bold shadow"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
