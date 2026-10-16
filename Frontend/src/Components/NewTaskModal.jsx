import { X } from "lucide-react";
import TaskForm from "./TaskForm.jsx";

export default function NewTaskModal({ isOpen, onClose, onSubmit, initialDate = null }) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="relative w-full max-w-lg bg-white rounded-3xl p-6 sm:p-7 shadow-2xl border border-slate-100 ring-1 ring-slate-900/10 text-left transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
          <h3 className="text-lg font-bold text-slate-900 tracking-tight">
            Create New Task
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <TaskForm
          initialScheduledDate={initialDate}
          onSubmit={async (values) => {
            await onSubmit(values);
            onClose();
          }}
          onCancel={onClose}
        />
      </div>
    </div>
  );
}

