import React, { useState } from 'react';
import { Course } from '../types';
import { X, Video, FileText, Check } from 'lucide-react';
import { useApp } from '../context/AppContext';

interface ClassNoteDialogProps {
  course: Course;
  onClose: () => void;
}

export const ClassNoteDialog: React.FC<ClassNoteDialogProps> = ({ course, onClose }) => {
  const { addLearningNote } = useApp();
  const [content, setContent] = useState('');
  const [videoUri, setVideoUri] = useState('');

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() && !videoUri.trim()) return;

    addLearningNote({
      relatedId: course.id,
      type: "COURSE",
      title: course.name,
      content: content.trim(),
      videoUri: videoUri.trim() || null
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-[#15151E] border border-white/10 rounded-3xl p-6 shadow-2xl relative animate-in fade-in zoom-in-95">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-bold text-white">Log Class Note</h3>
            <p className="text-xs text-[#7C5CFC] font-semibold">{course.name}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-white rounded-xl"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-gray-400 block mb-1.5 uppercase">
              Class Notes / Takeaways
            </label>
            <textarea
              rows={4}
              required
              value={content}
              onChange={e => setContent(e.target.value)}
              placeholder="What did you learn in today's lecture? Formulas, definitions, homework..."
              className="w-full bg-[#1D1D29] border border-white/10 focus:border-[#7C5CFC] rounded-2xl p-3.5 text-xs text-white placeholder-gray-500 outline-none resize-none"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-400 block mb-1.5 uppercase flex items-center gap-1.5">
              <Video className="w-3.5 h-3.5 text-[#00D4A1]" />
              Video / Audio URL (Optional)
            </label>
            <input
              type="url"
              value={videoUri}
              onChange={e => setVideoUri(e.target.value)}
              placeholder="https://... attachment link"
              className="w-full bg-[#1D1D29] border border-white/10 focus:border-[#7C5CFC] rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-gray-500 outline-none"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 text-xs font-semibold text-gray-400 hover:text-white bg-white/5 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 py-3 text-xs font-bold text-white bg-[#7C5CFC] hover:bg-[#6c4be8] rounded-xl transition-colors shadow-lg shadow-[#7C5CFC]/25 flex items-center justify-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              <span>Save Note</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
