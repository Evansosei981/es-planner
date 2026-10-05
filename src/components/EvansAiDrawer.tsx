import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  ArrowLeft,
  Send,
  Plus,
  Trash2,
  Copy,
  Check,
  Sparkles,
  RefreshCw,
  Clock,
  WifiOff,
  MoreVertical,
  BookOpen,
  ChevronRight,
  HelpCircle,
  Calendar,
  Layers,
  X
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { MathText } from './MathText';
import { Course } from '../types';

interface EvansAiDrawerProps {
  onClose: () => void;
}

export const EvansAiDrawer: React.FC<EvansAiDrawerProps> = ({ onClose }) => {
  const {
    userProfile,
    courses,
    upcomingExams,
    todaySchedule,
    currentTime,
    practiceOverallStats,
    isOnline,
    addCustomQuestion,
    aiChatSessions,
    aiChatMessages,
    currentAiSessionId,
    createNewAiSession,
    loadAiSession,
    deleteAiSession,
    sendAiMessage,
    isGeneratingAi
  } = useApp();

  const [prompt, setPrompt] = useState('');
  const [showHistorySheet, setShowHistorySheet] = useState(false);
  const [showOverflowMenu, setShowOverflowMenu] = useState(false);
  const [copiedMessageId, setCopiedMessageId] = useState<number | null>(null);
  const [addedPracticeMsgId, setAddedPracticeMsgId] = useState<number | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const studentName = userProfile.name.trim() || "Student";

  const activeMessages = aiChatMessages.filter(
    m => m.sessionId === currentAiSessionId
  );

  // Auto-scroll on new messages or typing indicator
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeMessages.length, isGeneratingAi]);

  // Dynamic Suggestion Chips based on real student data (only when data exists)
  const suggestionChips = useMemo(() => {
    const chips: string[] = [];

    // 1. Next upcoming exam chip
    const nextExam = upcomingExams[0];
    if (nextExam) {
      const daysLeft = Math.max(0, Math.ceil((nextExam.timestampMillis - currentTime) / (1000 * 60 * 60 * 24)));
      chips.push(
        daysLeft === 0
          ? `Give me a last-minute revision summary for my ${nextExam.courseName} exam today`
          : daysLeft === 1
          ? `Quiz me on high-yield questions for tomorrow's ${nextExam.courseName} exam`
          : `Help me review ${nextExam.courseName} (${nextExam.examTitle}) in ${daysLeft} days`
      );
    }

    // 2. Weakest practice topic chip
    const weakTopic = practiceOverallStats.needsPracticeTopics[0];
    if (weakTopic) {
      chips.push(`Explain ${weakTopic} step-by-step with an intuitive example`);
    }

    // 3. Today's classes chip
    const todayClasses = todaySchedule.filter(s => s.type === 'class');
    if (todayClasses.length > 0) {
      const currentClass = todayClasses[0].data as Course;
      chips.push(`Break down core concepts from my ${currentClass.name} lecture`);
    }

    // Only return real data chips (no fake fallback)
    return chips.slice(0, 4);
  }, [upcomingExams, currentTime, practiceOverallStats.needsPracticeTopics, todaySchedule]);

  // Auto-grow textarea height on input
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setPrompt(e.target.value);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 112)}px`;
    }
  };

  const handleSendPrompt = (textToSend?: string) => {
    const message = textToSend !== undefined ? textToSend : prompt;
    if (!message.trim() || isGeneratingAi) return;
    setPrompt('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
    sendAiMessage(message.trim());
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendPrompt();
    }
  };

  const handleCopyMessage = (text: string, id: number) => {
    navigator.clipboard.writeText(text);
    setCopiedMessageId(id);
    setTimeout(() => setCopiedMessageId(null), 2000);
  };

  // Find previous user prompt for Retry action
  const getPrevUserPrompt = (currentIndex: number) => {
    for (let i = currentIndex - 1; i >= 0; i--) {
      if (activeMessages[i].isUser) {
        return activeMessages[i].text;
      }
    }
    return '';
  };

  // Add Evans solution to Daily Practice Question Bank
  const handleAddToPractice = (msgText: string, msgId: number, promptText?: string) => {
    const questionTitle = promptText || "Review concept from Evans session";
    addCustomQuestion({
      question: questionTitle,
      courseName: courses[0]?.name || "General Studies",
      subject: courses[0]?.name || "General Studies",
      category: "Evans AI Review",
      difficulty: "medium",
      type: "short_answer",
      options: [],
      correctAnswer: "Refer to Evans explanation below",
      explanation: msgText.slice(0, 600),
      isAiGenerated: true
    });

    setAddedPracticeMsgId(msgId);
    setTimeout(() => setAddedPracticeMsgId(null), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#0B0B10] flex flex-col overflow-hidden animate-in fade-in duration-200">
      {/* STANDARD TOP APP BAR */}
      <header className="px-4 py-3 bg-[#15151E] border-b border-white/10 flex items-center justify-between shrink-0 z-30">
        <div className="flex items-center gap-3 min-w-0">
          {/* Back button with 48px touch target */}
          <button
            onClick={onClose}
            className="min-w-[48px] min-h-[48px] p-2 rounded-xl text-gray-300 hover:text-white hover:bg-white/5 active:scale-95 transition-all flex items-center justify-center -ml-2 shrink-0"
            title="Back to planner"
            aria-label="Back to planner"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          {/* Evans Avatar & Status Identity */}
          <div className="flex items-center gap-2.5 min-w-0">
            <img
              src="/assistant_avatar.png"
              alt="Evans"
              className="w-9 h-9 rounded-full object-cover ring-2 ring-white/15 shrink-0"
            />
            <div className="min-w-0">
              <h1 className="text-sm font-bold text-white leading-tight truncate">
                Evans
              </h1>
              <div className="flex items-center gap-1.5 text-[11px] font-medium leading-none mt-0.5">
                {isOnline ? (
                  <>
                    <span className="w-1.5 h-1.5 rounded-full bg-[#00D4A1]" />
                    <span className="text-[#00D4A1]">Study Tutor</span>
                  </>
                ) : (
                  <>
                    <span className="w-1.5 h-1.5 rounded-full bg-[#F59E0B]" />
                    <span className="text-[#F59E0B]">Offline</span>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1 shrink-0 relative">
          <button
            onClick={() => createNewAiSession()}
            className="min-w-[44px] min-h-[44px] p-2 text-gray-300 hover:text-white rounded-xl hover:bg-white/5 active:scale-95 transition-all flex items-center justify-center"
            title="Start New Chat"
            aria-label="Start New Chat"
          >
            <Plus className="w-5 h-5" />
          </button>

          {/* Overflow menu toggle */}
          <button
            onClick={() => setShowOverflowMenu(!showOverflowMenu)}
            className="min-w-[44px] min-h-[44px] p-2 text-gray-300 hover:text-white rounded-xl hover:bg-white/5 active:scale-95 transition-all flex items-center justify-center"
            title="Menu"
            aria-label="Chat options"
          >
            <MoreVertical className="w-5 h-5" />
          </button>

          {/* Overflow Menu Dropdown */}
          {showOverflowMenu && (
            <div className="absolute right-0 top-12 w-48 bg-[#1B1B26] border border-white/10 rounded-2xl shadow-2xl p-1.5 z-40 animate-in fade-in zoom-in-95 duration-150">
              <button
                onClick={() => {
                  createNewAiSession();
                  setShowOverflowMenu(false);
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold text-gray-200 hover:text-white hover:bg-white/5 text-left transition-colors"
              >
                <Plus className="w-4 h-4 text-[#7C5CFC]" />
                <span>New Conversation</span>
              </button>

              <button
                onClick={() => {
                  setShowHistorySheet(true);
                  setShowOverflowMenu(false);
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold text-gray-200 hover:text-white hover:bg-white/5 text-left transition-colors"
              >
                <Clock className="w-4 h-4 text-gray-400" />
                <span>Chat History ({aiChatSessions.length})</span>
              </button>

              {currentAiSessionId && (
                <button
                  onClick={() => {
                    deleteAiSession(currentAiSessionId);
                    setShowOverflowMenu(false);
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold text-[#EF4444] hover:bg-[#EF4444]/10 text-left transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Clear This Chat</span>
                </button>
              )}
            </div>
          )}
        </div>
      </header>

      {/* Clear Offline Banner when offline */}
      {!isOnline && (
        <div className="bg-[#F59E0B]/15 border-b border-[#F59E0B]/30 px-4 py-2 flex items-center gap-2 text-xs text-[#F59E0B] shrink-0">
          <WifiOff className="w-4 h-4 shrink-0" />
          <span>You are currently offline. Answers will resume once reconnected.</span>
        </div>
      )}

      {/* CHAT MESSAGES STREAM */}
      <main className="flex-1 overflow-y-auto px-4 py-5 max-w-3xl w-full mx-auto space-y-5">
        {activeMessages.length === 0 ? (
          /* EMPTY STATE */
          <div className="h-full flex flex-col items-center justify-center text-center p-4 my-auto space-y-4">
            <div className="w-16 h-16 rounded-full ring-4 ring-[#7C5CFC]/20 overflow-hidden shadow-xl mb-1">
              <img
                src="/assistant_avatar.png"
                alt="Evans"
                className="w-full h-full object-cover"
              />
            </div>

            {/* Greeting using student's name */}
            <div className="space-y-1">
              <h2 className="text-lg sm:text-xl font-extrabold text-white tracking-tight">
                Hi {studentName}, I'm Evans
              </h2>
              <p className="text-xs text-gray-400 max-w-sm mx-auto leading-relaxed">
                I'm your personal study tutor. Ask me step-by-step questions about your lectures, math equations, or upcoming exams.
              </p>
            </div>

            {/* Suggestion Chips generated dynamically from student's data (only when data exists) */}
            {suggestionChips.length > 0 ? (
              <div className="w-full max-w-md pt-2 space-y-2">
                <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block text-left px-1">
                  Suggested for you
                </span>
                <div className="space-y-2">
                  {suggestionChips.map((chip, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSendPrompt(chip)}
                      className="w-full text-left p-3.5 rounded-2xl bg-[#15151E] hover:bg-[#1C1C28] active:scale-[0.99] border border-white/5 hover:border-white/15 text-xs text-gray-200 transition-all flex items-center justify-between group shadow-sm"
                    >
                      <span className="pr-2 leading-snug">{chip}</span>
                      <ChevronRight className="w-4 h-4 text-gray-500 group-hover:text-white shrink-0 transition-colors" />
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="pt-2 text-xs text-gray-500 max-w-xs text-center">
                Type any study question or math formula below to begin.
              </div>
            )}
          </div>
        ) : (
          /* CHAT MESSAGE BUBBLES */
          activeMessages.map((msg, index) => {
            const isUser = msg.isUser;
            const prevPrompt = !isUser ? getPrevUserPrompt(index) : '';

            return (
              <div
                key={msg.id}
                className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}
              >
                {!isUser && (
                  <img
                    src="/assistant_avatar.png"
                    alt="Evans"
                    className="w-8 h-8 rounded-full object-cover shrink-0 mt-1 ring-1 ring-white/15"
                  />
                )}

                <div className="max-w-[85%] sm:max-w-[80%] space-y-2">
                  {/* Bubble Container */}
                  <div
                    className={`rounded-3xl px-4 py-3.5 text-[15px] sm:text-[16px] leading-relaxed break-words shadow-md ${
                      isUser
                        ? 'chat-user-bubble bg-[#6D4AFF] dark:bg-[#7C5CFC] text-white rounded-br-xs font-normal'
                        : msg.isError
                        ? 'bg-[#2A1515] border border-[#EF4444]/30 text-[#C42B2B] dark:text-[#FCA5A5] rounded-bl-xs'
                        : 'chat-evans-bubble bg-[#EEF0F8] text-[#14161F] border border-[#D9DCE8] dark:bg-[#15151E] dark:text-gray-100 dark:border-white/5 rounded-bl-xs'
                    }`}
                  >
                    {msg.isLoading ? (
                      /* Typing Indicator */
                      <div className="flex items-center gap-2 py-1 text-xs text-gray-400 font-medium">
                        <span className="w-2 h-2 rounded-full bg-[#7C5CFC] animate-ping" />
                        <span>Evans is thinking step by step...</span>
                      </div>
                    ) : msg.isError ? (
                      /* Friendly Error with Retry */
                      <div className="space-y-3">
                        <p className="text-xs sm:text-sm font-medium">
                          Couldn't reach Evans. Check your connection.
                        </p>
                        {prevPrompt && (
                          <button
                            type="button"
                            onClick={() => handleSendPrompt(prevPrompt)}
                            className="px-3 py-1.5 rounded-xl bg-[#EF4444]/20 hover:bg-[#EF4444]/30 text-white font-bold text-xs transition-colors flex items-center gap-1.5"
                          >
                            <RefreshCw className="w-3.5 h-3.5" />
                            <span>Retry</span>
                          </button>
                        )}
                      </div>
                    ) : (
                      /* Proper rendering of math, code and formatted paragraphs */
                      <MessageContent text={msg.text} />
                    )}
                  </div>

                  {/* Micro Actions under Evans Replies (16px text, copy button, simpler explanation, retry, add to practice) */}
                  {!isUser && !msg.isLoading && !msg.isError && (
                    <div className="flex flex-wrap items-center gap-2 pt-1 px-1">
                      {/* Copy reply button */}
                      <button
                        type="button"
                        onClick={() => handleCopyMessage(msg.text, msg.id)}
                        className="px-2.5 py-1 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] active:scale-95 text-gray-400 hover:text-white text-xs font-medium transition-all flex items-center gap-1"
                        title="Copy answer"
                      >
                        {copiedMessageId === msg.id ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-[#00D4A1]" />
                            <span className="text-[#00D4A1]">Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>Copy</span>
                          </>
                        )}
                      </button>

                      {/* Simpler explanation action */}
                      <button
                        type="button"
                        onClick={() =>
                          handleSendPrompt("Can you explain that in simpler terms with a real-world analogy?")
                        }
                        className="px-2.5 py-1 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] active:scale-95 text-gray-400 hover:text-white text-xs font-medium transition-all flex items-center gap-1"
                        title="Request simpler explanation"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-[#7C5CFC]" />
                        <span>Simpler explanation</span>
                      </button>

                      {/* Retry action */}
                      {prevPrompt && (
                        <button
                          type="button"
                          onClick={() => handleSendPrompt(prevPrompt)}
                          className="px-2.5 py-1 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] active:scale-95 text-gray-400 hover:text-white text-xs font-medium transition-all flex items-center gap-1"
                          title="Retry question"
                        >
                          <RefreshCw className="w-3.5 h-3.5" />
                          <span>Retry</span>
                        </button>
                      )}

                      {/* Add to Daily Practice Action */}
                      <button
                        type="button"
                        onClick={() => handleAddToPractice(msg.text, msg.id, prevPrompt)}
                        className="px-2.5 py-1 rounded-xl bg-[#00D4A1]/10 hover:bg-[#00D4A1]/20 active:scale-95 text-[#00D4A1] text-xs font-semibold transition-all flex items-center gap-1 border border-[#00D4A1]/20"
                        title="Add this concept or question to your Daily Practice bank"
                      >
                        {addedPracticeMsgId === msg.id ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-[#00D4A1]" />
                            <span>Added to Practice!</span>
                          </>
                        ) : (
                          <>
                            <Plus className="w-3.5 h-3.5" />
                            <span>Add to Daily Practice</span>
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </main>

      {/* COMPOSER BAR */}
      <footer className="p-3 sm:p-4 bg-[#15151E] border-t border-white/10 shrink-0">
        <form
          onSubmit={e => {
            e.preventDefault();
            handleSendPrompt();
          }}
          className="max-w-3xl mx-auto flex items-end gap-2.5"
        >
          {/* Multiline input growing up to 4 lines */}
          <div className="flex-1 bg-[#1C1C28] border border-white/10 focus-within:border-[#7C5CFC] rounded-2xl px-3.5 py-2.5 transition-colors">
            <textarea
              ref={textareaRef}
              rows={1}
              value={prompt}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder="Ask Evans anything (math, code, concepts)..."
              disabled={isGeneratingAi}
              className="w-full bg-transparent text-sm text-white placeholder-gray-500 outline-none resize-none max-h-28 custom-scrollbar leading-relaxed"
            />
          </div>

          {/* Solid purple send button when enabled, gray when empty, 48px touch target */}
          <button
            type="submit"
            disabled={!prompt.trim() || isGeneratingAi}
            className={`min-w-[48px] min-h-[48px] rounded-2xl flex items-center justify-center transition-all shrink-0 ${
              prompt.trim() && !isGeneratingAi
                ? 'bg-[#7C5CFC] hover:bg-[#6c4be8] active:scale-95 text-white shadow-lg shadow-[#7C5CFC]/30 cursor-pointer'
                : 'bg-white/10 text-gray-500 cursor-not-allowed'
            }`}
            title="Send message"
            aria-label="Send message"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </footer>

      {/* CHAT HISTORY MODAL / SLIDE-OVER */}
      {showHistorySheet && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex justify-start animate-in fade-in duration-150">
          <div className="w-80 max-w-[85vw] bg-[#14141E] h-full p-4 flex flex-col border-r border-white/10 shadow-2xl animate-in slide-in-from-left duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-3">
              <span className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#7C5CFC]" />
                <span>Conversations</span>
              </span>
              <button
                onClick={() => setShowHistorySheet(false)}
                className="p-1.5 text-gray-400 hover:text-white rounded-lg hover:bg-white/5"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <button
              onClick={() => {
                createNewAiSession();
                setShowHistorySheet(false);
              }}
              className="w-full py-2.5 px-3 mb-3 bg-[#7C5CFC] hover:bg-[#6c4be8] text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-md transition-all active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>New Conversation</span>
            </button>

            <div className="flex-1 overflow-y-auto space-y-1.5 custom-scrollbar pr-1">
              {aiChatSessions.map(session => (
                <div
                  key={session.id}
                  onClick={() => {
                    loadAiSession(session.id);
                    setShowHistorySheet(false);
                  }}
                  className={`flex items-center justify-between p-3 rounded-xl cursor-pointer text-xs transition-colors group ${
                    session.id === currentAiSessionId
                      ? 'bg-[#7C5CFC]/20 border border-[#7C5CFC]/40 text-white font-bold'
                      : 'text-gray-300 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <span className="truncate flex-1 pr-2">{session.title}</span>
                  <button
                    onClick={e => {
                      e.stopPropagation();
                      deleteAiSession(session.id);
                    }}
                    className="opacity-0 group-hover:opacity-100 p-1 text-gray-500 hover:text-[#EF4444] rounded transition-opacity"
                    title="Delete chat"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
          <div className="flex-1" onClick={() => setShowHistorySheet(false)} />
        </div>
      )}
    </div>
  );
};

/**
 * MessageContent parses Markdown code blocks (```language ... ```)
 * and LaTeX math ($...$ and $$...$$) using MathText.
 */
const MessageContent: React.FC<{ text: string }> = ({ text }) => {
  const parts = useMemo(() => {
    const codeBlockRegex = /```([a-zA-Z0-9_-]*)\n?([\s\S]*?)```/g;
    type Segment = { type: 'code' | 'text'; content: string; language?: string };
    const segments: Segment[] = [];
    let lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = codeBlockRegex.exec(text)) !== null) {
      if (match.index > lastIndex) {
        segments.push({
          type: 'text',
          content: text.slice(lastIndex, match.index)
        });
      }
      segments.push({
        type: 'code',
        language: match[1] || 'plaintext',
        content: match[2].trim()
      });
      lastIndex = match.index + match[0].length;
    }

    if (lastIndex < text.length) {
      segments.push({
        type: 'text',
        content: text.slice(lastIndex)
      });
    }

    return segments.length > 0 ? segments : [{ type: 'text' as const, content: text }];
  }, [text]);

  const [copiedCodeIdx, setCopiedCodeIdx] = useState<number | null>(null);

  const handleCopyCode = (code: string, idx: number) => {
    navigator.clipboard.writeText(code);
    setCopiedCodeIdx(idx);
    setTimeout(() => setCopiedCodeIdx(null), 2000);
  };

  return (
    <div className="space-y-2 leading-relaxed">
      {parts.map((p, idx) => {
        if (p.type === 'code') {
          return (
            <div
              key={idx}
              className="my-2.5 rounded-2xl bg-[#0C0C12] border border-white/10 overflow-hidden text-xs"
            >
              <div className="flex items-center justify-between px-3 py-1.5 bg-white/5 border-b border-white/5 text-gray-400 font-mono text-[11px]">
                <span>{p.language || 'code'}</span>
                <button
                  type="button"
                  onClick={() => handleCopyCode(p.content, idx)}
                  className="flex items-center gap-1 hover:text-white transition-colors"
                >
                  {copiedCodeIdx === idx ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-[#00D4A1]" />
                      <span className="text-[#00D4A1]">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy Code</span>
                    </>
                  )}
                </button>
              </div>
              <pre className="p-3.5 overflow-x-auto text-emerald-300 font-mono text-xs sm:text-sm custom-scrollbar">
                <code>{p.content}</code>
              </pre>
            </div>
          );
        }

        return (
          <div key={idx} className="whitespace-pre-wrap">
            <MathText content={p.content} />
          </div>
        );
      })}
    </div>
  );
};
