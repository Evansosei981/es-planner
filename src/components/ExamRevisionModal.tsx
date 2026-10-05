import React, { useState, useMemo } from 'react';
import {
  X,
  Calendar,
  Clock,
  Sparkles,
  AlertTriangle,
  RotateCcw,
  Check,
  Trash2,
  Edit2,
  ChevronDown,
  ChevronUp,
  Settings,
  Flame,
  ArrowRight,
  BookOpen,
  Plus
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Exam } from '../types';
import { ExamRevisionSettings, ExamRevisionPlan, RevisionBlock } from '../types/planner';
import { generateExamRevisionPlan, DEFAULT_REVISION_SETTINGS } from '../utils/revisionPlanner';
import { getCourseColor } from '../theme/colors';

interface ExamRevisionModalProps {
  exam: Exam;
  onClose: () => void;
}

export const ExamRevisionModal: React.FC<ExamRevisionModalProps> = ({ exam, onClose }) => {
  const {
    courses,
    exams,
    studySessions,
    dayTasks,
    practiceOverallStats,
    questionBank,
    revisionPlans,
    saveExamRevisionPlan,
    deleteExamRevisionPlan
  } = useApp();

  const existingPlan = revisionPlans[exam.id];

  const isExamDateEdited = Boolean(
    existingPlan &&
    existingPlan.examDateMillis &&
    Math.abs(existingPlan.examDateMillis - exam.timestampMillis) > 60000
  );

  // Settings state (initialized from existing plan settings or defaults)
  const [settings, setSettings] = useState<ExamRevisionSettings>(() => {
    return existingPlan?.settings || { ...DEFAULT_REVISION_SETTINGS };
  });

  const [showSettingsAccordion, setShowSettingsAccordion] = useState(false);
  const [editingBlockId, setEditingBlockId] = useState<number | null>(null);
  const [editTopic, setEditTopic] = useState('');
  const [editDuration, setEditDuration] = useState(50);
  const [editStartH, setEditStartH] = useState(16);
  const [editStartM, setEditStartM] = useState(0);

  // Active plan state for preview before saving
  const [previewPlan, setPreviewPlan] = useState<ExamRevisionPlan>(() => {
    if (existingPlan) {
      return existingPlan;
    }
    return generateExamRevisionPlan({
      exam,
      allExams: exams,
      courses,
      classes: courses,
      existingStudySessions: studySessions,
      dayTasks,
      practiceOverallStats,
      questionBank,
      settings
    });
  });

  const [isSavedSuccess, setIsSavedSuccess] = useState(false);

  const dayLabels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  // Toggle days off
  const handleToggleDayOff = (dayNum: number) => {
    setSettings(prev => {
      const exists = prev.daysOff.includes(dayNum);
      const daysOff = exists
        ? prev.daysOff.filter(d => d !== dayNum)
        : [...prev.daysOff, dayNum];
      return { ...prev, daysOff };
    });
  };

  // Regenerate plan with current settings
  const handleRegenerate = () => {
    const freshPlan = generateExamRevisionPlan({
      exam,
      allExams: exams,
      courses,
      classes: courses,
      existingStudySessions: studySessions,
      dayTasks,
      practiceOverallStats,
      questionBank,
      settings,
      existingPlan: previewPlan
    });
    setPreviewPlan(freshPlan);
  };

  // Remove individual block from plan preview
  const handleRemoveBlock = (blockId: number) => {
    setPreviewPlan(prev => {
      const blocks = prev.blocks.filter(b => b.id !== blockId);
      const daysLeft = Math.max(0, Math.ceil((prev.examDateMillis - Date.now()) / (1000 * 60 * 60 * 24)));
      return {
        ...prev,
        blocks,
        readinessSummary: `${daysLeft} days left, ${blocks.length} blocks planned`
      };
    });
  };

  // Start editing a block
  const handleStartEditBlock = (block: RevisionBlock) => {
    setEditingBlockId(block.id);
    setEditTopic(block.topic);
    setEditDuration(block.durationMinutes);
    setEditStartH(block.startHour);
    setEditStartM(block.startMinute);
  };

  const handleSaveEditBlock = (blockId: number) => {
    setPreviewPlan(prev => ({
      ...prev,
      blocks: prev.blocks.map(b => {
        if (b.id !== blockId) return b;
        return {
          ...b,
          topic: editTopic.trim() || b.topic,
          durationMinutes: editDuration,
          startHour: editStartH,
          startMinute: editStartM
        };
      })
    }));
    setEditingBlockId(null);
  };

  // Confirm and persist plan to app
  const handleConfirmPlan = () => {
    saveExamRevisionPlan(previewPlan);
    setIsSavedSuccess(true);
    setTimeout(() => {
      onClose();
    }, 600);
  };

  // Group blocks by formattedDate
  const blocksByDate = useMemo(() => {
    const groups: Record<string, RevisionBlock[]> = {};
    for (const b of previewPlan.blocks) {
      if (!groups[b.formattedDate]) {
        groups[b.formattedDate] = [];
      }
      groups[b.formattedDate].push(b);
    }
    return groups;
  }, [previewPlan.blocks]);

  const sortedDateKeys = Object.keys(blocksByDate).sort();
  const color = getCourseColor(exam.colorIndex);

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-xl bg-[#15151E] border-t sm:border border-white/10 rounded-t-3xl sm:rounded-3xl p-5 sm:p-6 shadow-2xl flex flex-col max-h-[94vh] overflow-hidden animate-in slide-in-from-bottom duration-200">
        {/* Mobile drag pill */}
        <div className="w-12 h-1 bg-white/20 rounded-full mx-auto mb-3 sm:hidden" />

        {/* Top Header Pattern: Title left, Actions right */}
        <header className="flex items-center justify-between pb-3 border-b border-white/10 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div
              className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 shadow-md"
              style={{ backgroundColor: `${color}20`, color }}
            >
              <Sparkles className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div className="min-w-0">
              <h2 className="text-base sm:text-lg font-extrabold text-white tracking-tight truncate">
                Revision Planner
              </h2>
              <p className="text-xs text-gray-400 truncate">
                {exam.courseName} · {exam.examTitle}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="min-w-[44px] min-h-[44px] p-2 text-gray-400 hover:text-white rounded-xl hover:bg-white/5 transition-colors flex items-center justify-center -mr-1"
            aria-label="Close revision planner"
          >
            <X className="w-5 h-5" />
          </button>
        </header>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto custom-scrollbar py-4 space-y-4">
          {/* Readiness Line Banner */}
          <div className="bg-gradient-to-r from-[#1C1833] to-[#141424] border border-[#7C5CFC]/30 rounded-2xl p-4 flex items-center justify-between gap-3 shadow-md">
            <div className="flex items-center gap-2.5">
              <div className="w-2.5 h-2.5 rounded-full bg-[#00D4A1] animate-pulse" />
              <div>
                <span className="text-xs font-extrabold text-white block">
                  {previewPlan.readinessSummary}
                </span>
                <span className="text-[11px] text-gray-400">
                  Calculated from Free-Slot Finder & Daily Practice weakness
                </span>
              </div>
            </div>

            <button
              onClick={handleRegenerate}
              className="min-h-[40px] px-3 rounded-xl bg-white/5 hover:bg-white/10 active:scale-95 text-xs font-bold text-[#7C5CFC] hover:text-[#9B82FD] transition-all flex items-center gap-1.5 border border-[#7C5CFC]/20 shrink-0"
              title="Regenerate revision schedule"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Regenerate</span>
            </button>
          </div>

          {/* Exam Date Edited Alert (Edge Case) */}
          {isExamDateEdited && (
            <div className="bg-[#FF7A00]/15 border border-[#FF7A00]/30 rounded-2xl p-4 text-xs space-y-2">
              <div className="flex items-center gap-2 text-[#FF7A00] font-bold">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>Exam Date Was Changed</span>
              </div>
              <p className="text-gray-300 leading-relaxed">
                The date for this exam was updated to{' '}
                <strong className="text-white">
                  {new Date(exam.timestampMillis).toLocaleDateString(undefined, {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric'
                  })}
                </strong>
                . Would you like to regenerate your revision blocks to align with this new date?
              </p>
              <div className="pt-1">
                <button
                  type="button"
                  onClick={handleRegenerate}
                  className="px-3.5 py-2 rounded-xl bg-[#FF7A00] hover:bg-[#e66e00] text-black font-extrabold text-xs transition-colors flex items-center gap-1.5 shadow-md active:scale-95"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Regenerate for New Date</span>
                </button>
              </div>
            </div>
          )}

          {/* Warning Banner if insufficient time (Rule 7) */}
          {previewPlan.warningMessage && (
            <div className="bg-[#EF4444]/15 border border-[#EF4444]/30 rounded-2xl p-3.5 text-xs text-gray-200 space-y-2">
              <div className="flex items-start gap-2 text-[#EF4444] font-bold">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>Revision Capacity Alert</span>
              </div>
              <p className="leading-relaxed text-gray-300">
                {previewPlan.warningMessage}
              </p>
              <div className="pt-1 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setSettings(prev => ({ ...prev, maxHoursPerDay: Math.min(4, prev.maxHoursPerDay + 1) }));
                    handleRegenerate();
                  }}
                  className="px-3 py-1.5 rounded-xl bg-[#EF4444]/20 hover:bg-[#EF4444]/30 text-white font-bold text-[11px] transition-colors"
                >
                  Add 1 hour/day to cap
                </button>
                <button
                  type="button"
                  onClick={() => setShowSettingsAccordion(true)}
                  className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white font-semibold text-[11px] transition-colors"
                >
                  Adjust Study Window
                </button>
              </div>
            </div>
          )}

          {/* Settings Accordion (Collapsible) */}
          <div className="bg-[#181824] border border-white/5 rounded-2xl overflow-hidden">
            <button
              onClick={() => setShowSettingsAccordion(!showSettingsAccordion)}
              className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-white/[0.02] transition-colors"
            >
              <div className="flex items-center gap-2 text-xs font-bold text-gray-300">
                <Settings className="w-4 h-4 text-[#7C5CFC]" />
                <span>Planner Settings</span>
                <span className="text-[11px] font-normal text-gray-500">
                  ({settings.studyWindowStart}–{settings.studyWindowEnd}, {settings.maxHoursPerDay}h/day max)
                </span>
              </div>
              {showSettingsAccordion ? (
                <ChevronUp className="w-4 h-4 text-gray-400" />
              ) : (
                <ChevronDown className="w-4 h-4 text-gray-400" />
              )}
            </button>

            {showSettingsAccordion && (
              <div className="p-4 pt-1 border-t border-white/5 space-y-3.5 text-xs animate-in fade-in">
                {/* Window Start & End */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-semibold text-gray-400 block mb-1">
                      Window Start
                    </label>
                    <input
                      type="time"
                      value={settings.studyWindowStart}
                      onChange={e => setSettings(prev => ({ ...prev, studyWindowStart: e.target.value }))}
                      className="w-full bg-[#14141E] border border-white/10 rounded-xl px-3 py-2 text-white outline-none focus:border-[#7C5CFC]"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-gray-400 block mb-1">
                      Window End
                    </label>
                    <input
                      type="time"
                      value={settings.studyWindowEnd}
                      onChange={e => setSettings(prev => ({ ...prev, studyWindowEnd: e.target.value }))}
                      className="w-full bg-[#14141E] border border-white/10 rounded-xl px-3 py-2 text-white outline-none focus:border-[#7C5CFC]"
                    />
                  </div>
                </div>

                {/* Max hours per day & Block length */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-semibold text-gray-400 block mb-1">
                      Max Study Hours/Day
                    </label>
                    <select
                      value={settings.maxHoursPerDay}
                      onChange={e => setSettings(prev => ({ ...prev, maxHoursPerDay: Number(e.target.value) }))}
                      className="w-full bg-[#14141E] border border-white/10 rounded-xl px-3 py-2 text-white outline-none focus:border-[#7C5CFC]"
                    >
                      {[1, 1.5, 2, 2.5, 3, 4].map(h => (
                        <option key={h} value={h}>
                          {h} {h === 1 ? 'hour' : 'hours'}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-gray-400 block mb-1">
                      Block & Break Duration
                    </label>
                    <select
                      value={settings.blockMinutes}
                      onChange={e => setSettings(prev => ({ ...prev, blockMinutes: Number(e.target.value) }))}
                      className="w-full bg-[#14141E] border border-white/10 rounded-xl px-3 py-2 text-white outline-none focus:border-[#7C5CFC]"
                    >
                      <option value={25}>25m study + 5m break</option>
                      <option value={45}>45m study + 10m break</option>
                      <option value={50}>50m study + 10m break (Default)</option>
                      <option value={75}>75m study + 15m break</option>
                    </select>
                  </div>
                </div>

                {/* Days Off Chips */}
                <div>
                  <label className="text-[11px] font-semibold text-gray-400 block mb-1.5">
                    Days Off (No revision scheduled)
                  </label>
                  <div className="grid grid-cols-7 gap-1">
                    {dayLabels.map((lbl, idx) => {
                      const dayNum = idx + 1;
                      const isOff = settings.daysOff.includes(dayNum);
                      return (
                        <button
                          key={dayNum}
                          type="button"
                          onClick={() => handleToggleDayOff(dayNum)}
                          className={`h-8 rounded-lg text-xs font-bold transition-all ${
                            isOff
                              ? 'bg-[#EF4444] text-white shadow-sm'
                              : 'bg-[#14141E] text-gray-400 hover:text-white border border-white/5'
                          }`}
                        >
                          {lbl}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="pt-1 flex justify-end">
                  <button
                    type="button"
                    onClick={handleRegenerate}
                    className="min-h-[40px] px-4 rounded-xl bg-[#7C5CFC] hover:bg-[#6c4be8] active:scale-95 text-white font-bold transition-all"
                  >
                    Apply & Re-plan
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Plan Day-by-Day Preview */}
          <div className="space-y-3 pt-1">
            <div className="flex items-center justify-between px-1">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                Schedule Preview ({previewPlan.blocks.length} sessions)
              </span>
              <span className="text-[11px] text-gray-500">
                Spaced repetition weighted by topic weakness
              </span>
            </div>

            {previewPlan.blocks.length === 0 ? (
              <div className="p-8 text-center bg-[#181824] border border-white/5 rounded-2xl space-y-2">
                <BookOpen className="w-8 h-8 text-gray-500 mx-auto" />
                <p className="text-xs text-gray-300 font-bold">No revision blocks fit in the current window.</p>
                <p className="text-[11px] text-gray-400 max-w-xs mx-auto">
                  Adjust your study window start/end times or increase the daily hours cap.
                </p>
              </div>
            ) : (
              sortedDateKeys.map(dateKey => {
                const dayBlocks = blocksByDate[dateKey];
                const firstBlock = dayBlocks[0];
                const blockDate = new Date(firstBlock.dateMillis);
                const dayName = blockDate.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' });

                return (
                  <div key={dateKey} className="bg-[#181824] border border-white/5 rounded-2xl p-3.5 space-y-2.5">
                    <div className="flex items-center justify-between text-xs font-bold px-1">
                      <span className="text-gray-300">{dayName}</span>
                      <span className="text-[11px] text-[#7C5CFC] font-semibold">
                        {dayBlocks.length} {dayBlocks.length === 1 ? 'block' : 'blocks'} · {dayBlocks.reduce((sum, b) => sum + b.durationMinutes, 0)}m
                      </span>
                    </div>

                    <div className="space-y-2">
                      {dayBlocks.map(block => {
                        const isEditing = editingBlockId === block.id;
                        const startStr = `${String(block.startHour).padStart(2, '0')}:${String(block.startMinute).padStart(2, '0')}`;
                        const endMin = block.startHour * 60 + block.startMinute + block.durationMinutes;
                        const endStr = `${String(Math.floor(endMin / 60)).padStart(2, '0')}:${String(endMin % 60).padStart(2, '0')}`;

                        if (isEditing) {
                          return (
                            <div key={block.id} className="p-3 bg-[#12121A] border border-[#7C5CFC]/40 rounded-xl space-y-2.5 animate-in fade-in">
                              <div className="flex items-center justify-between text-xs font-bold text-white">
                                <span>Edit Revision Block</span>
                                <button
                                  onClick={() => setEditingBlockId(null)}
                                  className="text-gray-400 hover:text-white"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </div>

                              <div>
                                <label className="text-[10px] text-gray-400 font-semibold block mb-1">
                                  Topic Title
                                </label>
                                <input
                                  type="text"
                                  value={editTopic}
                                  onChange={e => setEditTopic(e.target.value)}
                                  className="w-full bg-[#181824] border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white outline-none focus:border-[#7C5CFC]"
                                />
                              </div>

                              <div className="grid grid-cols-2 gap-2 text-xs">
                                <div>
                                  <label className="text-[10px] text-gray-400 font-semibold block mb-1">
                                    Start Time
                                  </label>
                                  <input
                                    type="time"
                                    value={`${String(editStartH).padStart(2, '0')}:${String(editStartM).padStart(2, '0')}`}
                                    onChange={e => {
                                      const parts = e.target.value.split(':').map(Number);
                                      if (parts.length === 2 && !isNaN(parts[0])) {
                                        setEditStartH(parts[0]);
                                        setEditStartM(parts[1]);
                                      }
                                    }}
                                    className="w-full bg-[#181824] border border-white/10 rounded-lg px-2 py-1.5 text-white outline-none text-xs"
                                  />
                                </div>
                                <div>
                                  <label className="text-[10px] text-gray-400 font-semibold block mb-1">
                                    Duration (mins)
                                  </label>
                                  <input
                                    type="number"
                                    min={15}
                                    max={120}
                                    step={5}
                                    value={editDuration}
                                    onChange={e => setEditDuration(Number(e.target.value))}
                                    className="w-full bg-[#181824] border border-white/10 rounded-lg px-2 py-1.5 text-white outline-none text-xs"
                                  />
                                </div>
                              </div>

                              <div className="flex gap-2 pt-1">
                                <button
                                  type="button"
                                  onClick={() => setEditingBlockId(null)}
                                  className="flex-1 py-1.5 rounded-lg bg-white/5 text-gray-400 hover:text-white text-xs font-semibold"
                                >
                                  Cancel
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleSaveEditBlock(block.id)}
                                  className="flex-1 py-1.5 rounded-lg bg-[#7C5CFC] text-white text-xs font-bold"
                                >
                                  Save Changes
                                </button>
                              </div>
                            </div>
                          );
                        }

                        return (
                          <div
                            key={block.id}
                            className={`p-3 rounded-xl border flex items-center justify-between gap-2.5 transition-colors group ${
                              block.isPracticeReview
                                ? 'bg-[#141420] border-[#FF7A00]/25'
                                : 'bg-[#14141E] border-white/5 hover:border-white/15'
                            }`}
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div
                                className={`w-2 h-2 rounded-full shrink-0 ${
                                  block.isPracticeReview ? 'bg-[#FF7A00]' : 'bg-[#7C5CFC]'
                                }`}
                              />
                              <div className="min-w-0">
                                <div className="flex items-center gap-2">
                                  <h4 className="font-bold text-white text-xs truncate">
                                    {block.topic}
                                  </h4>
                                  {block.isPracticeReview && (
                                    <span className="px-1.5 py-0.2 rounded text-[10px] font-extrabold bg-[#FF7A00]/15 text-[#FF7A00] shrink-0">
                                      Mock/Review
                                    </span>
                                  )}
                                </div>
                                <span className="text-[11px] text-gray-400 block mt-0.5 tabular-nums">
                                  {startStr} – {endStr} · {block.durationMinutes} mins
                                </span>
                              </div>
                            </div>

                            {/* Block Action Controls */}
                            <div className="flex items-center gap-1 shrink-0">
                              <button
                                onClick={() => handleStartEditBlock(block)}
                                className="min-w-[36px] min-h-[36px] p-2 text-gray-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors flex items-center justify-center"
                                title="Edit block"
                                aria-label="Edit block"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleRemoveBlock(block.id)}
                                className="min-w-[36px] min-h-[36px] p-2 text-gray-400 hover:text-[#EF4444] rounded-lg hover:bg-[#EF4444]/10 transition-colors flex items-center justify-center"
                                title="Remove block"
                                aria-label="Remove block"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Bottom Primary Action (Purple = actions) */}
        <footer className="pt-3 border-t border-white/10 shrink-0">
          <button
            onClick={handleConfirmPlan}
            disabled={previewPlan.blocks.length === 0}
            className={`w-full min-h-[48px] py-3.5 px-6 rounded-2xl font-extrabold text-sm flex items-center justify-center gap-2 shadow-xl transition-all cursor-pointer ${
              isSavedSuccess
                ? 'bg-[#00D4A1] text-black shadow-[#00D4A1]/25'
                : 'bg-[#7C5CFC] hover:bg-[#6c4be8] active:scale-[0.98] text-white shadow-[#7C5CFC]/25'
            }`}
          >
            {isSavedSuccess ? (
              <>
                <Check className="w-4 h-4 stroke-[3]" />
                <span>Revision Plan Saved!</span>
              </>
            ) : (
              <>
                <Check className="w-4 h-4 stroke-[2.5]" />
                <span>Confirm & Add to Study Plan</span>
                <ArrowRight className="w-4 h-4 stroke-[2.5]" />
              </>
            )}
          </button>
        </footer>
      </div>
    </div>
  );
};
