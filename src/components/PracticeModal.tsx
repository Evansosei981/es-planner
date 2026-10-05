import React, { useState, useEffect } from 'react';
import {
  X,
  Flame,
  CheckCircle2,
  XCircle,
  ArrowRight,
  RotateCcw,
  Sparkles,
  Trophy,
  BookOpen,
  ChevronDown,
  ChevronUp,
  Star,
  Camera,
  Upload,
  Trash2,
  Loader2
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useApp } from '../context/AppContext';
import { PracticeQuestion, PracticeAttempt } from '../types/practice';
import { AnswerChecker } from '../practice/AnswerChecker';
import { getCourseColor } from '../theme/colors';
import { MathText } from './MathText';
import { QuestionImagePreview } from './QuestionImagePreview';
import { compressImageFile } from '../utils/imageCompressor';

interface PracticeModalProps {
  onClose: () => void;
  questions?: PracticeQuestion[];
}

export const PracticeModal: React.FC<PracticeModalProps> = ({ onClose, questions }) => {
  const {
    dailyQuestions,
    practiceStreak,
    completeDailyPractice,
    courses,
    toggleBookmarkQuestion,
    practiceSettings
  } = useApp();

  const activeQuestions = questions && questions.length > 0 ? questions : dailyQuestions;
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [answerImageBase64, setAnswerImageBase64] = useState<string>('');
  const [isEvaluatingImage, setIsEvaluatingImage] = useState(false);
  const [aiImageFeedback, setAiImageFeedback] = useState<{
    isCorrect: boolean;
    feedback: string;
    transcribedWork?: string;
  } | null>(null);
  const [isAnswerSubmitted, setIsAnswerSubmitted] = useState(false);
  const [attempts, setAttempts] = useState<PracticeAttempt[]>([]);
  const [isQuizComplete, setIsQuizComplete] = useState(false);
  const [finalScore, setFinalScore] = useState(0);
  const [newStreakCount, setNewStreakCount] = useState(practiceStreak.currentStreak);
  const [showSolutionExplanation, setShowSolutionExplanation] = useState(false);

  const currentQ = activeQuestions[currentIndex];

  const handleSelectOption = (option: string) => {
    if (isAnswerSubmitted) return;
    setSelectedAnswer(option);
  };

  const handleCheckAnswer = async () => {
    if ((!selectedAnswer && !answerImageBase64) || isAnswerSubmitted || !currentQ) return;

    let isCorrect = selectedAnswer
      ? AnswerChecker.checkAnswer(selectedAnswer, currentQ.correctAnswer, currentQ.type)
      : false;

    // If student uploaded an image of their handwritten work/diagram, evaluate it
    if (answerImageBase64) {
      setIsEvaluatingImage(true);
      try {
        const res = await fetch('/api/ai/grade-image-answer', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            question: currentQ.question,
            correctAnswer: currentQ.correctAnswer,
            explanation: currentQ.explanation,
            answerImageBase64,
            typedAnswer: selectedAnswer || ''
          })
        });

        if (res.ok) {
          const evalData = await res.json();
          setAiImageFeedback(evalData);
          if (evalData.isCorrect) {
            isCorrect = true;
          }
        }
      } catch (err) {
        console.warn('AI evaluation failed or offline, enabling self-check', err);
      } finally {
        setIsEvaluatingImage(false);
      }
    }

    const attempt: PracticeAttempt = {
      questionId: currentQ.id,
      selectedAnswer: selectedAnswer?.trim() || '[Handwritten Solution Image Attached]',
      answerImageUrl: answerImageBase64 || undefined,
      isCorrect,
      topic: currentQ.category,
      difficulty: currentQ.difficulty,
      courseName: currentQ.courseName,
      timestamp: Date.now()
    };

    const nextAttempts = [...attempts, attempt];
    setAttempts(nextAttempts);
    setIsAnswerSubmitted(true);
    setShowSolutionExplanation(!isCorrect || !!answerImageBase64);
  };

  const handleToggleAttemptCorrectness = (overrideCorrect: boolean) => {
    setAttempts(prev => {
      const copy = [...prev];
      if (copy.length > 0) {
        copy[copy.length - 1] = {
          ...copy[copy.length - 1],
          isCorrect: overrideCorrect
        };
      }
      return copy;
    });
  };

  const handleNextQuestion = () => {
    if (currentIndex < activeQuestions.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setSelectedAnswer(null);
      setAnswerImageBase64('');
      setAiImageFeedback(null);
      setIsAnswerSubmitted(false);
      setShowSolutionExplanation(false);
    } else {
      // Quiz complete!
      const correctCount = attempts.filter(a => a.isCorrect).length;
      setFinalScore(correctCount);

      const { updatedStreak } = completeDailyPractice(
        attempts,
        correctCount,
        activeQuestions.length
      );
      setNewStreakCount(updatedStreak.currentStreak);
      setIsQuizComplete(true);

      if (correctCount > 0) {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 }
        });
      }
    }
  };

  // Keyboard navigation shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        if (e.key === 'Enter') {
          if (!isAnswerSubmitted) handleCheckAnswer();
          else handleNextQuestion();
        }
        return;
      }

      if (e.key === 'Escape') {
        onClose();
        return;
      }

      // Option selection by 1-4 or A-D
      if (!isAnswerSubmitted && currentQ?.options && currentQ.options.length > 0) {
        const key = e.key.toUpperCase();
        if (key === '1' || key === 'A') handleSelectOption(currentQ.options[0]);
        else if (key === '2' || key === 'B') handleSelectOption(currentQ.options[1]);
        else if (key === '3' || key === 'C') handleSelectOption(currentQ.options[2]);
        else if (key === '4' || key === 'D') handleSelectOption(currentQ.options[3]);
      }

      // Enter to submit or next
      if (e.key === 'Enter') {
        if (!isAnswerSubmitted && selectedAnswer) {
          handleCheckAnswer();
        } else if (isAnswerSubmitted) {
          handleNextQuestion();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, selectedAnswer, isAnswerSubmitted, currentQ, activeQuestions.length]);

  // Support pasting image from clipboard (Ctrl+V / Cmd+V screenshot of work)
  useEffect(() => {
    const handlePaste = async (e: ClipboardEvent) => {
      if (isAnswerSubmitted || currentQ?.type !== 'short_answer') return;
      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        if (items[i].type.startsWith('image/')) {
          const file = items[i].getAsFile();
          if (file) {
            try {
              const compressed = await compressImageFile(file);
              setAnswerImageBase64(compressed);
            } catch (err) {
              console.warn("Failed to paste image", err);
            }
          }
          break;
        }
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [isAnswerSubmitted, currentQ]);

  const handleRestart = () => {
    setCurrentIndex(0);
    setSelectedAnswer(null);
    setIsAnswerSubmitted(false);
    setAttempts([]);
    setIsQuizComplete(false);
    setShowSolutionExplanation(false);
  };

  if (!currentQ && !isQuizComplete) {
    return (
      <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-[#15151E] border border-white/10 rounded-3xl p-8 text-center text-white">
          <BookOpen className="w-12 h-12 text-[#7C5CFC] mx-auto mb-3" />
          <h3 className="text-xl font-bold mb-2">No Questions Available</h3>
          <p className="text-xs text-gray-400 mb-6">
            Add exercises or upload materials in Daily Practice to build your question bank!
          </p>
          <button
            onClick={onClose}
            className="px-6 py-2.5 bg-[#7C5CFC] rounded-xl font-bold text-xs"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  // Course color matching
  const courseMatch = courses.find(
    c => c.name.toLowerCase() === currentQ?.courseName.toLowerCase()
  );
  const color = courseMatch ? getCourseColor(courseMatch.colorIndex) : "#7C5CFC";
  const optionLetters = ['A', 'B', 'C', 'D', 'E'];

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-[#15151E] border border-white/10 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-200">
        
        {/* Top Header */}
        <header className="px-5 py-4 border-b border-white/10 flex items-center justify-between bg-[#1A1A24]">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 text-[#FF7A00] text-xs font-bold">
              <Flame className="w-4 h-4 fill-[#FF7A00]" />
              <span>{isQuizComplete ? newStreakCount : practiceStreak.currentStreak} Day Streak</span>
            </div>
            <span aria-hidden="true" className="text-gray-600">·</span>
            <span className="text-xs font-semibold text-gray-300 truncate max-w-[180px]">
              {practiceSettings.preferredCourse && practiceSettings.preferredCourse !== 'all'
                ? `${practiceSettings.preferredCourse} Drill`
                : 'Daily Practice'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {currentQ && !isQuizComplete && (
              <button
                onClick={() => toggleBookmarkQuestion(currentQ.id)}
                className={`p-1.5 rounded-xl transition-colors ${
                  currentQ.isBookmarked
                    ? 'text-[#F59E0B] bg-[#F59E0B]/15'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
                title={currentQ.isBookmarked ? "Bookmarked question" : "Bookmark for later revision"}
              >
                <Star className={`w-4 h-4 ${currentQ.isBookmarked ? 'fill-[#F59E0B]' : ''}`} />
              </button>
            )}

            <button
              onClick={onClose}
              className="p-1.5 text-gray-400 hover:text-white rounded-xl hover:bg-white/5 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </header>

        {/* Content Area */}
        {!isQuizComplete ? (
          <div className="p-6 overflow-y-auto custom-scrollbar flex-1 space-y-5">
            {/* Progress indicators */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="text-gray-400">
                  Question {currentIndex + 1} of {activeQuestions.length}
                </span>
                <span className="font-bold" style={{ color }}>
                  {currentQ.courseName}
                </span>
              </div>
              <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-[#7C5CFC] to-[#00D4A1] transition-all duration-300"
                  style={{
                    width: `${((currentIndex + (isAnswerSubmitted ? 1 : 0)) / activeQuestions.length) * 100}%`
                  }}
                />
              </div>
            </div>

            {/* Question Text Card */}
            <div className="bg-[#1D1D29] border border-white/5 rounded-2xl p-5 shadow-lg space-y-3">
              <div className="flex items-center gap-2 text-xs text-gray-400 font-medium">
                <span className="text-[#00D4A1] font-semibold">{currentQ.category || "Core Concept"}</span>
                <span aria-hidden="true">·</span>
                <span className="capitalize">{currentQ.difficulty}</span>
                {currentQ.isAiGenerated && (
                  <>
                    <span aria-hidden="true">·</span>
                    <span className="text-[#4D8CFF] font-semibold">AI Generated</span>
                  </>
                )}
              </div>

              {/* Original Uploaded Problem Image */}
              {currentQ.imageUrl && (
                <QuestionImagePreview imageUrl={currentQ.imageUrl} alt={currentQ.question} />
              )}

              <h3 className="text-base sm:text-lg font-bold text-white leading-snug">
                <MathText content={currentQ.question} />
              </h3>
            </div>

            {/* Options or Text Input */}
            {currentQ.type === 'short_answer' && currentQ.options.length === 0 ? (
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <label className="font-semibold text-gray-300">
                      Your Answer (Text, Image, or Both):
                    </label>
                    <span className="text-[11px] text-gray-500">
                      Press Enter or click Submit
                    </span>
                  </div>

                  <input
                    type="text"
                    placeholder="Type your final result or leave blank if uploading handwritten work..."
                    value={selectedAnswer || ''}
                    disabled={isAnswerSubmitted}
                    onChange={e => setSelectedAnswer(e.target.value)}
                    className="w-full bg-[#1D1D29] border border-white/10 rounded-2xl p-3.5 text-white text-sm focus:outline-none focus:border-[#7C5CFC]"
                    autoFocus={!answerImageBase64}
                  />
                </div>

                {/* Handwritten / Diagram Answer Image Uploader */}
                <div className="bg-[#12121A] border border-white/5 rounded-2xl p-3.5 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-gray-300 flex items-center gap-1.5">
                      <Camera className="w-3.5 h-3.5 text-[#00D4A1]" />
                      <span>Attach Photo of Handwritten Work / Diagram:</span>
                    </span>
                    {answerImageBase64 && (
                      <span className="text-[10px] text-[#00D4A1] font-bold">Image Attached</span>
                    )}
                  </div>

                  {answerImageBase64 ? (
                    <div className="space-y-2">
                      <div className="max-w-xs">
                        <QuestionImagePreview imageUrl={answerImageBase64} alt="Student answer image" />
                      </div>
                      {!isAnswerSubmitted && (
                        <div className="flex items-center justify-end">
                          <button
                            type="button"
                            onClick={() => setAnswerImageBase64('')}
                            className="px-2.5 py-1 rounded-lg bg-[#EF4444]/20 hover:bg-[#EF4444]/30 text-[#EF4444] text-xs font-semibold flex items-center gap-1 transition-colors"
                          >
                            <Trash2 className="w-3 h-3" />
                            <span>Remove</span>
                          </button>
                        </div>
                      )}
                    </div>
                  ) : !isAnswerSubmitted ? (
                    <label
                      onDragOver={e => e.preventDefault()}
                      onDrop={async e => {
                        e.preventDefault();
                        const file = e.dataTransfer.files?.[0];
                        if (file && file.type.startsWith('image/')) {
                          try {
                            const compressed = await compressImageFile(file);
                            setAnswerImageBase64(compressed);
                          } catch (err) {
                            console.warn("Drop failed", err);
                          }
                        }
                      }}
                      className="flex flex-col items-center justify-center border border-dashed border-white/15 hover:border-[#00D4A1]/50 rounded-xl p-3.5 cursor-pointer hover:bg-white/[0.02] transition-colors group text-center"
                    >
                      <div className="flex items-center gap-2 text-gray-400 group-hover:text-white">
                        <Upload className="w-4 h-4 text-[#00D4A1]" />
                        <span className="text-xs font-semibold">
                          Upload, snap photo, or paste (Ctrl+V / Cmd+V)
                        </span>
                      </div>
                      <span className="text-[10px] text-gray-500 mt-0.5">Drag & drop image file or clipboard screenshot</span>
                      <input
                        type="file"
                        accept="image/*"
                        capture="environment"
                        className="hidden"
                        onChange={async e => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          try {
                            const compressed = await compressImageFile(file);
                            setAnswerImageBase64(compressed);
                          } catch (err) {
                            console.warn("File read failed", err);
                          }
                        }}
                      />
                    </label>
                  ) : null}
                </div>
              </div>
            ) : (
              <div className="space-y-2.5">
                {currentQ.options.map((option, idx) => {
                  const isSelected = selectedAnswer === option;
                  const isCorrectOption = option === currentQ.correctAnswer;
                  const keyLetter = optionLetters[idx] || String(idx + 1);

                  let optionStyle = "bg-[#1D1D29] border-white/10 hover:border-white/20 text-gray-200";
                  if (isSelected && !isAnswerSubmitted) {
                    optionStyle = "bg-[#7C5CFC]/20 border-[#7C5CFC] text-white ring-1 ring-[#7C5CFC]";
                  } else if (isAnswerSubmitted) {
                    if (isCorrectOption) {
                      optionStyle = "bg-[#10B981]/20 border-[#10B981] text-[#10B981] font-bold ring-1 ring-[#10B981]";
                    } else if (isSelected && !isCorrectOption) {
                      optionStyle = "bg-[#EF4444]/20 border-[#EF4444] text-[#EF4444] line-through";
                    } else {
                      optionStyle = "bg-[#1D1D29]/50 border-white/5 text-gray-500 opacity-60";
                    }
                  }

                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleSelectOption(option)}
                      disabled={isAnswerSubmitted}
                      className={`w-full p-4 rounded-2xl border text-left text-xs sm:text-sm font-medium transition-all flex items-center justify-between group active:scale-[0.99] ${optionStyle}`}
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <span className="w-6 h-6 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center font-mono text-xs font-bold text-gray-400 group-hover:text-white shrink-0">
                          {keyLetter}
                        </span>
                        <span className="flex-1">
                          <MathText content={option} />
                        </span>
                      </div>
                      {isAnswerSubmitted && isCorrectOption && (
                        <CheckCircle2 className="w-5 h-5 text-[#10B981] shrink-0 ml-2" />
                      )}
                      {isAnswerSubmitted && isSelected && !isCorrectOption && (
                        <XCircle className="w-5 h-5 text-[#EF4444] shrink-0 ml-2" />
                      )}
                    </button>
                  );
                })}
              </div>
            )}

            {/* Feedback & Solution Card */}
            {isAnswerSubmitted && (
              <div
                className={`p-4 rounded-2xl border text-xs leading-relaxed animate-in fade-in duration-200 ${
                  attempts[attempts.length - 1]?.isCorrect
                    ? 'bg-[#10B981]/15 border-[#10B981]/30 text-gray-200'
                    : 'bg-[#EF4444]/15 border-[#EF4444]/30 text-gray-200'
                }`}
              >
                <div className="flex items-center justify-between font-bold mb-1.5">
                  {attempts[attempts.length - 1]?.isCorrect ? (
                    <span className="text-[#10B981] flex items-center gap-1">
                      <CheckCircle2 className="w-4 h-4" /> Correct! Excellent!
                    </span>
                  ) : (
                    <span className="text-[#EF4444] flex items-center gap-1">
                      <XCircle className="w-4 h-4" /> Incorrect
                    </span>
                  )}

                  <button
                    onClick={() => setShowSolutionExplanation(prev => !prev)}
                    className="text-[11px] font-bold text-gray-300 hover:text-white underline flex items-center gap-1"
                  >
                    <span>{showSolutionExplanation ? 'Hide Solution' : 'View Solution'}</span>
                    {showSolutionExplanation ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  </button>
                </div>

                {showSolutionExplanation && (
                  <div className="mt-2 pt-2 border-t border-white/10 space-y-1">
                    <div className="font-bold text-[#00D4A1] flex items-center gap-1">
                      <span>Correct Answer:</span>
                      <MathText content={currentQ.correctAnswer} />
                    </div>
                    {currentQ.explanation && (
                      <div className="text-gray-300 leading-relaxed pt-1">
                        <MathText content={currentQ.explanation} />
                      </div>
                    )}
                  </div>
                )}

                {/* Handwritten Answer Inspection & Grading */}
                {attempts[attempts.length - 1]?.answerImageUrl && (
                  <div className="mt-3 pt-3 border-t border-white/10 space-y-2.5">
                    <div className="flex items-center justify-between text-xs font-bold text-gray-200">
                      <span className="flex items-center gap-1.5 text-[#00D4A1]">
                        <Camera className="w-3.5 h-3.5" />
                        <span>Your Submitted Handwritten Answer:</span>
                      </span>
                      <span className="text-[10px] text-gray-400 font-normal">Click to zoom</span>
                    </div>

                    <div className="max-w-xs">
                      <QuestionImagePreview
                        imageUrl={attempts[attempts.length - 1]?.answerImageUrl!}
                        alt="Your submitted solution"
                      />
                    </div>

                    {isEvaluatingImage && (
                      <div className="flex items-center gap-2 text-xs text-[#7C5CFC] font-semibold py-1">
                        <Loader2 className="w-4 h-4 animate-spin text-[#7C5CFC]" />
                        <span>AI Tutor is analyzing your handwritten steps...</span>
                      </div>
                    )}

                    {aiImageFeedback && (
                      <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-[11px] space-y-1">
                        <div className="font-bold flex items-center gap-1">
                          <Sparkles className="w-3.5 h-3.5 text-[#7C5CFC]" />
                          <span className={aiImageFeedback.isCorrect ? "text-[#00D4A1]" : "text-[#F59E0B]"}>
                            {aiImageFeedback.isCorrect ? "AI Check: Solution matches!" : "AI Check: Review recommended"}
                          </span>
                        </div>
                        <p className="text-gray-300 leading-normal">{aiImageFeedback.feedback}</p>
                      </div>
                    )}

                    {/* Student Self-Verification override */}
                    <div className="p-3 rounded-xl bg-[#0E0E14] border border-white/10 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-gray-300">
                          Did your handwritten solution match?
                        </span>
                        <span className="text-[10px] text-gray-500">Self-Grading</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleToggleAttemptCorrectness(true)}
                          className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                            attempts[attempts.length - 1]?.isCorrect
                              ? 'bg-[#10B981] text-black font-extrabold shadow'
                              : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10'
                          }`}
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Mark Correct</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleToggleAttemptCorrectness(false)}
                          className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                            !attempts[attempts.length - 1]?.isCorrect
                              ? 'bg-[#EF4444] text-white font-extrabold shadow'
                              : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10'
                          }`}
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          <span>Mark Incorrect</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          /* Completion Summary Screen */
          <div className="p-8 text-center overflow-y-auto custom-scrollbar flex-1 space-y-6">
            <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-[#FF7A00] to-[#7C5CFC] flex items-center justify-center text-4xl mx-auto shadow-xl shadow-[#FF7A00]/20">
              <Trophy className="w-10 h-10 text-white" />
            </div>

            <div>
              <h3 className="text-2xl font-extrabold text-white">
                Daily Challenge Complete!
              </h3>
              <p className="text-xs text-gray-400 mt-1">
                You solved {finalScore} out of {activeQuestions.length} correct
              </p>
            </div>

            {/* Streak Milestone */}
            <div className="bg-[#1D1D29] border border-[#FF7A00]/30 rounded-2xl p-4 flex items-center justify-around shadow-lg">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-[#FF7A00]/20 flex items-center justify-center text-[#FF7A00]">
                  <Flame className="w-7 h-7 fill-[#FF7A00]" />
                </div>
                <div className="text-left">
                  <span className="text-lg font-extrabold text-white block">
                    {newStreakCount} Day Streak
                  </span>
                  <span className="text-xs text-[#FF7A00] font-semibold">
                    Streak preserved for today
                  </span>
                </div>
              </div>
            </div>

            {/* Review List */}
            <div className="space-y-2 text-left">
              <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                Question Review
              </h4>
              {activeQuestions.map((q, idx) => {
                const att = attempts.find(a => a.questionId === q.id);
                return (
                  <div
                    key={q.id}
                    className="p-3 bg-[#1D1D29] border border-white/5 rounded-xl flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-2 truncate pr-2">
                      <span className="text-gray-500 font-bold">#{idx + 1}</span>
                      <span className="text-gray-200 truncate">
                        <MathText content={q.question} />
                      </span>
                      {att?.answerImageUrl && (
                        <span className="px-1.5 py-0.5 rounded bg-[#00D4A1]/20 text-[#00D4A1] text-[10px] font-bold shrink-0">
                          Photo Answer
                        </span>
                      )}
                    </div>
                    {att?.isCorrect ? (
                      <span className="text-[#10B981] font-bold flex items-center gap-1 shrink-0">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Correct
                      </span>
                    ) : (
                      <span className="text-[#EF4444] font-bold flex items-center gap-1 shrink-0">
                        <XCircle className="w-3.5 h-3.5" /> Incorrect
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Footer Actions */}
        <footer className="px-6 py-4 border-t border-white/10 bg-[#1A1A24] flex items-center gap-3">
          {!isQuizComplete ? (
            !isAnswerSubmitted ? (
              <button
                type="button"
                onClick={handleCheckAnswer}
                disabled={((!selectedAnswer || selectedAnswer.trim() === '') && !answerImageBase64) || isEvaluatingImage}
                className="w-full h-12 bg-[#7C5CFC] hover:bg-[#6c4be8] disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold rounded-2xl shadow-xl shadow-[#7C5CFC]/25 transition-all text-sm flex items-center justify-center gap-2"
              >
                {isEvaluatingImage ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Evaluating Image Answer...</span>
                  </>
                ) : (
                  <>
                    <span>Submit Answer</span>
                    <span className="text-[10px] text-white/60 font-mono hidden sm:inline">(Enter)</span>
                  </>
                )}
              </button>
            ) : (
              <button
                type="button"
                onClick={handleNextQuestion}
                className="w-full h-12 bg-[#00D4A1] hover:bg-[#00be90] active:scale-[0.99] text-black font-extrabold rounded-2xl shadow-xl shadow-[#00D4A1]/20 transition-all flex items-center justify-center gap-2 text-sm"
              >
                <span>
                  {currentIndex === activeQuestions.length - 1 ? "Finish Daily Practice" : "Next Question"}
                </span>
                <span className="text-[10px] text-black/60 font-mono hidden sm:inline">(Enter)</span>
                <ArrowRight className="w-4 h-4 stroke-[3]" />
              </button>
            )
          ) : (
            <div className="w-full flex gap-3">
              <button
                type="button"
                onClick={handleRestart}
                className="flex-1 h-12 bg-white/5 hover:bg-white/10 text-white font-bold rounded-2xl transition-colors flex items-center justify-center gap-2 text-xs"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Practice Again</span>
              </button>
              <button
                type="button"
                onClick={onClose}
                className="flex-1 h-12 bg-[#7C5CFC] hover:bg-[#6c4be8] text-white font-bold rounded-2xl shadow-xl shadow-[#7C5CFC]/25 transition-all flex items-center justify-center text-xs"
              >
                Done
              </button>
            </div>
          )}
        </footer>
      </div>
    </div>
  );
};
