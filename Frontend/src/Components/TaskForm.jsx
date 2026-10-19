import { useState, useEffect, useRef } from "react";
import { Plus, Check, X, AlertCircle, Loader2, Calendar } from "lucide-react";

export default function TaskForm({
  initialValues,
  initialScheduledDate = null,
  onSubmit,
  onCancel,
  submitLabel = "Add Task",
  isEditing = false,
}) {
  const [title, setTitle] = useState(initialValues?.title ?? "");
  const [description, setDescription] = useState(
    initialValues?.description ?? "",
  );
  const [scheduledDate, setScheduledDate] = useState(() => {
    if (initialValues?.scheduledDate) return initialValues.scheduledDate;
    if (initialScheduledDate) return initialScheduledDate;
    return "";
  });
  const [prevInitialDate, setPrevInitialDate] = useState(initialScheduledDate);
  if (initialScheduledDate !== prevInitialDate && !isEditing) {
    setPrevInitialDate(initialScheduledDate);
    setScheduledDate(initialScheduledDate || "");
  }

  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const titleInputRef = useRef(null);

  // Autofocus input when in edit mode
  useEffect(() => {
    if (isEditing && titleInputRef.current) {
      titleInputRef.current.focus();
    }
  }, [isEditing]);

  const titleLength = title.trim().length;
  const isNearLimit = title.length > 180;

  // Preset quick helpers
  function setQuickDate(daysFromNow) {
    const d = new Date();
    d.setDate(d.getDate() + daysFromNow);
    const dateStr = d.toISOString().slice(0, 10);
    setScheduledDate(dateStr);
  }

  async function handleSubmit(e) {
    if (e) e.preventDefault();

    if (title.trim().length === 0) {
      setError("Please provide a title for the task.");
      titleInputRef.current?.focus();
      return;
    }

    if (title.trim().length > 200) {
      setError("Title must not exceed 200 characters.");
      return;
    }

    setError(null);
    setSaving(true);

    try {
      await onSubmit({
        title: title.trim(),
        description: description.trim(),
        scheduledDate: scheduledDate ? scheduledDate.trim() : null,
      });
      if (!isEditing) {
        setTitle("");
        setDescription("");
        setScheduledDate("");
      }
    } catch (err) {
      setError(err.message || "Failed to save task.");
    } finally {
      setSaving(false);
    }
  }

  function handleKeyDown(e) {
    // Submit on Ctrl+Enter or Cmd+Enter
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
      e.preventDefault();
      handleSubmit();
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className={`rounded-3xl transition-all ${
        isEditing
          ? "bg-slate-50/90 p-5 border border-indigo-100 ring-2 ring-indigo-500/10 shadow-sm"
          : "bg-white p-6 sm:p-7 border border-slate-200/80 shadow-xs hover:shadow-sm transition-shadow"
      }`}
    >
      {!isEditing && (
        <div className="flex items-center gap-2.5 mb-5">
          <span className="flex items-center justify-center w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 font-bold text-xs border border-indigo-100">
            <Plus className="w-4 h-4 stroke-[2.5]" />
          </span>
          <div>
            <h2 className="text-base font-bold text-slate-900 tracking-tight">
              Create New Task
            </h2>
            <p className="text-xs text-slate-500">
              Add details, set a schedule date, and track your progress.
            </p>
          </div>
        </div>
      )}

      <div className="space-y-4">
        {/* Title Input */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label
              htmlFor={isEditing ? "edit-task-title" : "task-title"}
              className="text-xs font-semibold uppercase tracking-wider text-slate-500"
            >
              Task Title <span className="text-rose-500">*</span>
            </label>
            <span
              className={`text-xs ${
                isNearLimit ? "text-amber-600 font-medium" : "text-slate-400"
              }`}
            >
              {title.length}/200
            </span>
          </div>

          <input
            id={isEditing ? "edit-task-title" : "task-title"}
            ref={titleInputRef}
            type="text"
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              if (error) setError(null);
            }}
            onKeyDown={handleKeyDown}
            disabled={saving}
            placeholder="e.g. Prepare executive presentation for Monday review"
            maxLength={200}
            className={`w-full px-4 py-2.5 text-sm text-slate-900 bg-white border rounded-xl placeholder:text-slate-400 focus:outline-none transition-all shadow-2xs ${
              error
                ? "border-rose-400 ring-2 ring-rose-500/10 focus:border-rose-500"
                : "border-slate-200 focus:border-indigo-500 focus:ring-3 focus:ring-indigo-500/15"
            } disabled:bg-slate-50 disabled:text-slate-500`}
          />
        </div>

        {/* Schedule Date & Presets */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label
              htmlFor={isEditing ? "edit-task-date" : "task-date"}
              className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-500"
            >
              <Calendar className="w-3.5 h-3.5 text-indigo-500" />
              <span>Schedule / Due Date</span>
              <span className="text-slate-400 font-normal lowercase">(optional)</span>
            </label>
            {scheduledDate && (
              <button
                type="button"
                onClick={() => setScheduledDate("")}
                className="text-[11px] text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
              >
                Clear date
              </button>
            )}
          </div>

          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <input
                id={isEditing ? "edit-task-date" : "task-date"}
                type="datetime-local"
                value={scheduledDate}
                onChange={(e) => setScheduledDate(e.target.value)}
                disabled={saving}
                className="w-full px-3.5 py-2 text-xs sm:text-sm text-slate-800 bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 focus:ring-3 focus:ring-indigo-500/15 shadow-2xs"
              />
            </div>

            {/* Quick buttons */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5">
              <button
                type="button"
                onClick={() => setQuickDate(0)}
                className="px-2.5 py-1.5 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 rounded-lg transition-colors cursor-pointer whitespace-nowrap"
              >
                Today
              </button>
              <button
                type="button"
                onClick={() => setQuickDate(1)}
                className="px-2.5 py-1.5 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 rounded-lg transition-colors cursor-pointer whitespace-nowrap"
              >
                Tomorrow
              </button>
              <button
                type="button"
                onClick={() => setQuickDate(7)}
                className="px-2.5 py-1.5 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 rounded-lg transition-colors cursor-pointer whitespace-nowrap"
              >
                Next Week
              </button>
            </div>
          </div>
        </div>

        {/* Description Textarea */}
        <div>
          <label
            htmlFor={isEditing ? "edit-task-description" : "task-description"}
            className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5"
          >
            Description <span className="text-slate-400 font-normal lowercase">(optional)</span>
          </label>

          <textarea
            id={isEditing ? "edit-task-description" : "task-description"}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={saving}
            placeholder="Add any extra details, deliverables, or notes…"
            rows={isEditing ? 3 : 2}
            className="w-full px-3.5 py-2.5 text-sm text-slate-800 bg-white border border-slate-200 rounded-xl placeholder:text-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-3 focus:ring-indigo-500/15 disabled:bg-slate-50 disabled:text-slate-500 transition-all resize-y shadow-2xs"
          />
        </div>

        {/* Validation Error Banner */}
        {error && (
          <div className="flex items-center gap-2 p-3 text-xs text-rose-700 bg-rose-50 border border-rose-200/80 rounded-xl animate-in fade-in">
            <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-500" />
            <p className="flex-1 font-medium">{error}</p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
          <p className="text-[11px] text-slate-400 hidden sm:block">
            Tip: Press <kbd className="px-1.5 py-0.5 text-[10px] font-mono bg-slate-100 text-slate-600 border border-slate-200 rounded-md">Ctrl</kbd> + <kbd className="px-1.5 py-0.5 text-[10px] font-mono bg-slate-100 text-slate-600 border border-slate-200 rounded-md">Enter</kbd> to save
          </p>

          <div className="flex items-center gap-2.5 ml-auto w-full sm:w-auto">
            {onCancel && (
              <button
                type="button"
                onClick={onCancel}
                disabled={saving}
                className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-semibold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 hover:text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-300 disabled:opacity-50 transition-all shadow-2xs cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
                Cancel
              </button>
            )}

            <button
              type="submit"
              disabled={saving || titleLength === 0}
              className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-5 py-2.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 rounded-xl focus:outline-none focus:ring-3 focus:ring-indigo-500/25 disabled:opacity-40 disabled:hover:bg-indigo-600 transition-all shadow-xs shadow-indigo-600/20 cursor-pointer"
            >
              {saving ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Saving…</span>
                </>
              ) : (
                <>
                  {isEditing ? (
                    <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                  ) : (
                    <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                  )}
                  <span>{submitLabel}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </form>
  );
}
