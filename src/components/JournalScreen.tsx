import React, { useState, useMemo } from 'react';
import {
  BookOpen,
  GraduationCap,
  Plus,
  Trash2,
  Video,
  FileText,
  Search,
  X,
  Sparkles,
  Calendar,
  Filter
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { LearningNote } from '../types';

export const JournalScreen: React.FC = () => {
  const { learningNotes, addLearningNote, deleteLearningNote } = useApp();
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<'ALL' | 'COURSE' | 'STUDY_SESSION'>('ALL');

  // New Note state
  const [title, setTitle] = useState('');
  const [type, setType] = useState<'COURSE' | 'STUDY_SESSION'>('COURSE');
  const [content, setContent] = useState('');
  const [videoUri, setVideoUri] = useState('');

  // Sorted by date descending (most recent first) and filtered
  const filteredNotes = useMemo(() => {
    return [...learningNotes]
      .sort((a, b) => b.dateMillis - a.dateMillis)
      .filter(note => {
        const matchesType = typeFilter === 'ALL' || note.type === typeFilter;
        const q = searchQuery.toLowerCase().trim();
        const matchesQuery = !q ||
          note.title.toLowerCase().includes(q) ||
          note.content.toLowerCase().includes(q);
        return matchesType && matchesQuery;
      });
  }, [learningNotes, typeFilter, searchQuery]);

  const handleCreateNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() && !content.trim()) return;

    addLearningNote({
      relatedId: 1,
      type,
      title: title.trim() || (type === 'COURSE' ? "Class Note" : "Study Note"),
      content: content.trim(),
      videoUri: videoUri.trim() || null
    });

    setTitle('');
    setContent('');
    setVideoUri('');
    setShowAddModal(false);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-36 md:pb-16 space-y-5">
      {/* Standard Header: Title left, Actions right */}
      <header className="flex items-center justify-between gap-4 pb-1">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
            Journal
          </h1>
          <p className="text-xs text-gray-400 mt-0.5">
            Reflections, lecture takeaways, and problem solutions
          </p>
        </div>

        {/* Quick Add Note (Purple = actions) */}
        <button
          onClick={() => setShowAddModal(true)}
          className="min-h-[44px] px-3.5 bg-[#7C5CFC] hover:bg-[#6c4be8] text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-md shadow-[#7C5CFC]/25 active:scale-95 transition-all"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>New Note</span>
        </button>
      </header>

      {/* Search & Filter Controls */}
      <div className="flex flex-col sm:flex-row gap-2.5">
        <div className="flex-1 relative">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search notes, concepts, topics..."
            className="w-full bg-[#15151E] border border-white/5 focus:border-[#7C5CFC] rounded-2xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-gray-500 outline-none transition-colors"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Filter Chips */}
        <div className="flex items-center gap-1.5 bg-[#15151E] border border-white/5 rounded-2xl p-1 shrink-0">
          {[
            { id: 'ALL', label: 'All' },
            { id: 'COURSE', label: 'Classes' },
            { id: 'STUDY_SESSION', label: 'Study' }
          ].map(f => (
            <button
              key={f.id}
              onClick={() => setTypeFilter(f.id as any)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                typeFilter === f.id
                  ? 'bg-[#7C5CFC] text-white shadow-sm'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Notes List or Empty State */}
      {filteredNotes.length === 0 ? (
        <div className="bg-[#15151E] border border-white/5 rounded-3xl p-10 text-center flex flex-col items-center justify-center space-y-3 my-4">
          <div className="w-14 h-14 rounded-2xl bg-[#1D1D29] text-gray-400 flex items-center justify-center">
            <FileText className="w-7 h-7 stroke-[1.75]" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-white">
              {searchQuery ? "No matching notes found" : "Your journal is empty"}
            </h3>
            <p className="text-xs text-gray-400 max-w-xs">
              {searchQuery
                ? "Try searching for a different keyword or topic."
                : "Capture key formulas, lecture takeaways, and questions to review before exams."}
            </p>
          </div>
          <button
            onClick={() => {
              if (searchQuery) {
                setSearchQuery('');
                setTypeFilter('ALL');
              } else {
                setShowAddModal(true);
              }
            }}
            className="mt-1 min-h-[44px] px-4 py-2 bg-[#7C5CFC] hover:bg-[#6c4be8] active:scale-95 text-white font-bold text-xs rounded-xl shadow-md shadow-[#7C5CFC]/25 transition-all flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>{searchQuery ? "Clear Search" : "Write First Note"}</span>
          </button>
        </div>
      ) : (
        <div className="space-y-3.5">
          {filteredNotes.map(note => {
            const isClass = note.type === 'COURSE';
            const color = isClass ? '#00D4A1' : '#7C5CFC';
            const dateStr = new Date(note.dateMillis).toLocaleDateString(undefined, {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            });

            return (
              <div
                key={note.id}
                className="bg-[#15151E] border border-white/5 rounded-2xl p-4 sm:p-5 shadow-lg space-y-3 relative hover:border-white/15 transition-all group"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm"
                      style={{ backgroundColor: `${color}15`, color }}
                    >
                      {isClass ? (
                        <GraduationCap className="w-5 h-5 stroke-[2]" />
                      ) : (
                        <BookOpen className="w-5 h-5 stroke-[2]" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-bold text-white text-sm sm:text-base leading-snug truncate">
                        {note.title}
                      </h4>
                      <div className="flex items-center gap-2 text-[11px] text-gray-400 mt-0.5">
                        <span className="tabular-nums">{dateStr}</span>
                        <span>·</span>
                        <span style={{ color }} className="font-semibold">
                          {isClass ? "Class Note" : "Study Note"}
                        </span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => deleteLearningNote(note.id)}
                    className="min-h-[40px] min-w-[40px] p-2 text-gray-500 hover:text-[#EF4444] rounded-xl hover:bg-white/5 transition-colors flex items-center justify-center"
                    title="Delete Note"
                    aria-label="Delete Note"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {note.content && (
                  <p className="text-xs sm:text-sm text-gray-200 leading-relaxed whitespace-pre-wrap bg-[#1D1D29]/60 p-3.5 rounded-xl border border-white/5">
                    {note.content}
                  </p>
                )}

                {note.videoUri && (
                  <div className="rounded-xl overflow-hidden bg-black/60 border border-white/10 p-2">
                    <div className="flex items-center gap-2 text-xs text-[#00D4A1] font-semibold mb-2 px-1">
                      <Video className="w-4 h-4" />
                      <span>Video Attachment</span>
                    </div>
                    {note.videoUri.startsWith('data:video') || note.videoUri.startsWith('blob:') || note.videoUri.startsWith('http') ? (
                      <video
                        src={note.videoUri}
                        controls
                        className="w-full max-h-56 rounded-lg bg-black"
                      />
                    ) : (
                      <div className="p-3 bg-white/5 rounded-lg text-xs text-gray-400 font-mono break-all">
                        {note.videoUri}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Add Note Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-lg bg-[#15151E] border-t sm:border border-white/10 rounded-t-3xl sm:rounded-3xl p-5 sm:p-6 shadow-2xl relative max-h-[92vh] overflow-y-auto animate-in slide-in-from-bottom duration-200">
            {/* Sheet drag bar on mobile */}
            <div className="w-12 h-1 bg-white/20 rounded-full mx-auto mb-4 sm:hidden" />

            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-bold text-white tracking-tight">Log Learning Note</h3>
                <p className="text-xs text-gray-400">Save key concepts from class or study</p>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-2 text-gray-400 hover:text-white rounded-xl hover:bg-white/5 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateNote} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-gray-300 block mb-1.5">
                  Category
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setType('COURSE')}
                    className={`h-11 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                      type === 'COURSE'
                        ? 'bg-[#00D4A1] text-black shadow-md'
                        : 'bg-[#1D1D29] text-gray-400 hover:text-white border border-white/5'
                    }`}
                  >
                    <GraduationCap className="w-4 h-4" />
                    <span>Class Note</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setType('STUDY_SESSION')}
                    className={`h-11 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                      type === 'STUDY_SESSION'
                        ? 'bg-[#7C5CFC] text-white shadow-md'
                        : 'bg-[#1D1D29] text-gray-400 hover:text-white border border-white/5'
                    }`}
                  >
                    <BookOpen className="w-4 h-4" />
                    <span>Study Session</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-300 block mb-1">
                  Title / Subject *
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="e.g. Distributed Consensus Algorithms"
                  className="w-full bg-[#1D1D29] border border-white/10 focus:border-[#7C5CFC] rounded-xl px-3.5 py-2.5 text-white outline-none text-sm transition-colors"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-300 block mb-1">
                  Notes / Takeaways *
                </label>
                <textarea
                  rows={4}
                  required
                  value={content}
                  onChange={e => setContent(e.target.value)}
                  placeholder="Summarize key formulas, definitions, code snippets, or ideas..."
                  className="w-full bg-[#1D1D29] border border-white/10 focus:border-[#7C5CFC] rounded-xl p-3 text-xs sm:text-sm text-white placeholder-gray-500 outline-none resize-none transition-colors"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-300 block mb-1">
                  Media / Recording Link (Optional)
                </label>
                <input
                  type="url"
                  value={videoUri}
                  onChange={e => setVideoUri(e.target.value)}
                  placeholder="https://... lecture video or voice link"
                  className="w-full bg-[#1D1D29] border border-white/10 focus:border-[#7C5CFC] rounded-xl px-3.5 py-2.5 text-white outline-none text-xs sm:text-sm transition-colors"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 min-h-[44px] text-xs font-semibold text-gray-400 hover:text-white bg-white/5 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 min-h-[44px] text-xs font-bold text-white bg-[#7C5CFC] hover:bg-[#6c4be8] active:scale-[0.98] rounded-xl transition-colors shadow-lg shadow-[#7C5CFC]/25"
                >
                  Save Note
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
