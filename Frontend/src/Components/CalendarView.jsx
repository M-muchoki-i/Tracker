import { useState, useMemo } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  CheckCircle2,
  Clock,
  Plus,
  Mail,
  AlertCircle,
  Sparkles,
} from "lucide-react";

export default function CalendarView({
  tasks = [],
  onSelectDate,
  onToggleTask,
  onOpenTaskFormWithDate,
  onOpenEmailModal,
}) {
  const [currentDate, setCurrentDate] = useState(() => new Date());
  const [selectedDateStr, setSelectedDateStr] = useState(() => {
    return new Date().toISOString().slice(0, 10);
  });

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // Helper to format YYYY-MM-DD
  function toDateKey(y, m, d) {
    const mm = String(m + 1).padStart(2, "0");
    const dd = String(d).padStart(2, "0");
    return `${y}-${mm}-${dd}`;
  }

  const todayStr = useMemo(() => new Date().toISOString().slice(0, 10), []);

  // Map tasks by date key (YYYY-MM-DD)
  const tasksByDate = useMemo(() => {
    const map = {};
    for (const task of tasks) {
      if (task.scheduledDate) {
        const dateKey = task.scheduledDate.slice(0, 10);
        if (!map[dateKey]) map[dateKey] = [];
        map[dateKey].push(task);
      }
    }
    return map;
  }, [tasks]);

  // Calendar calculations
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfWeek = new Date(year, month, 1).getDay(); // 0 is Sunday

  // Month navigation
  function prevMonth() {
    setCurrentDate(new Date(year, month - 1, 1));
  }

  function nextMonth() {
    setCurrentDate(new Date(year, month + 1, 1));
  }

  function jumpToToday() {
    const now = new Date();
    setCurrentDate(now);
    setSelectedDateStr(now.toISOString().slice(0, 10));
  }

  const monthName = currentDate.toLocaleString("default", {
    month: "long",
    year: "numeric",
  });

  // Selected date tasks
  const selectedDayTasks = tasksByDate[selectedDateStr] || [];
  const selectedFormatted = useMemo(() => {
    if (!selectedDateStr) return "";
    const [y, m, d] = selectedDateStr.split("-").map(Number);
    const dateObj = new Date(y, m - 1, d);
    return dateObj.toLocaleDateString("en-US", {
      weekday: "long",
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }, [selectedDateStr]);

  // Overdue tasks count
  const overdueTasks = useMemo(() => {
    return tasks.filter((t) => {
      if (t.completed || !t.scheduledDate) return false;
      return t.scheduledDate.slice(0, 10) < todayStr;
    });
  }, [tasks, todayStr]);

  return (
    <div className="space-y-6">
      {/* Calendar Card Container */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-xs">
        {/* Calendar Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-11 h-11 rounded-2xl bg-indigo-50 text-indigo-600 border border-indigo-100">
              <CalendarIcon className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight text-slate-900">
                {monthName}
              </h2>
              <p className="text-xs text-slate-500">
                Interactive schedule calendar & agenda
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={jumpToToday}
              className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
            >
              Today
            </button>
            <div className="flex items-center bg-slate-100 p-1 rounded-xl">
              <button
                type="button"
                onClick={prevMonth}
                className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-white rounded-lg transition-all cursor-pointer"
                title="Previous month"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={nextMonth}
                className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-white rounded-lg transition-all cursor-pointer"
                title="Next month"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Days of week */}
        <div className="grid grid-cols-7 gap-1 sm:gap-2 mt-4 text-center">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
            <div
              key={day}
              className="py-2 text-[11px] font-bold uppercase tracking-wider text-slate-400"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Month Days Grid */}
        <div className="grid grid-cols-7 gap-1 sm:gap-2 mt-1">
          {/* Empty padding before day 1 */}
          {Array.from({ length: firstDayOfWeek }).map((_, i) => (
            <div key={`empty-${i}`} className="h-14 sm:h-20 rounded-2xl bg-slate-50/40" />
          ))}

          {/* Days */}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const dayNum = i + 1;
            const dateKey = toDateKey(year, month, dayNum);
            const isToday = dateKey === todayStr;
            const isSelected = dateKey === selectedDateStr;
            const dayTasks = tasksByDate[dateKey] || [];
            const hasTasks = dayTasks.length > 0;
            const allDone = hasTasks && dayTasks.every((t) => t.completed);
            const isPast = dateKey < todayStr;
            const hasOverdue = !allDone && isPast && hasTasks;

            return (
              <button
                key={dateKey}
                type="button"
                onClick={() => {
                  setSelectedDateStr(dateKey);
                  if (onSelectDate) onSelectDate(dateKey);
                }}
                className={`group relative h-14 sm:h-20 p-1.5 sm:p-2 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                  isSelected
                    ? "bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-600/25 ring-2 ring-indigo-600/20"
                    : isToday
                      ? "bg-indigo-50/70 border-indigo-200 text-slate-900 font-semibold"
                      : "bg-white hover:bg-slate-50/80 border-slate-100 text-slate-800"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span
                    className={`text-xs sm:text-sm font-semibold rounded-lg px-1.5 py-0.5 ${
                      isSelected
                        ? "text-white"
                        : isToday
                          ? "bg-indigo-600 text-white font-bold"
                          : "text-slate-700"
                    }`}
                  >
                    {dayNum}
                  </span>

                  {hasTasks && (
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full ${
                        isSelected
                          ? "bg-white/20 text-white"
                          : allDone
                            ? "bg-emerald-100 text-emerald-800"
                            : hasOverdue
                              ? "bg-rose-100 text-rose-800"
                              : "bg-indigo-100 text-indigo-800"
                      }`}
                    >
                      {dayTasks.length}
                    </span>
                  )}
                </div>

                {/* Dots / mini status indicators */}
                <div className="flex items-center gap-1 overflow-hidden mt-auto">
                  {dayTasks.slice(0, 3).map((t, tIdx) => (
                    <div
                      key={t.id || tIdx}
                      className={`w-1.5 h-1.5 rounded-full ${
                        isSelected
                          ? "bg-white"
                          : t.completed
                            ? "bg-emerald-500"
                            : hasOverdue
                              ? "bg-rose-500"
                              : "bg-indigo-500"
                      }`}
                    />
                  ))}
                  {dayTasks.length > 3 && (
                    <span
                      className={`text-[9px] font-bold ${
                        isSelected ? "text-white/80" : "text-slate-400"
                      }`}
                    >
                      +
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected Day Agenda Drawer */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-600">
              Selected Agenda
            </span>
            <h3 className="text-lg font-bold text-slate-900 mt-0.5">
              {selectedFormatted}
            </h3>
          </div>

          <div className="flex items-center gap-2">
            {selectedDayTasks.length > 0 && (
              <button
                type="button"
                onClick={() => onOpenEmailModal({ date: selectedDateStr })}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200/60 rounded-xl transition-all cursor-pointer shadow-2xs"
                title="Send this day's tasks to Gmail"
              >
                <Mail className="w-3.5 h-3.5" />
                <span>Send to Gmail</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => onOpenTaskFormWithDate(selectedDateStr)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-all cursor-pointer shadow-xs shadow-indigo-600/20"
            >
              <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Schedule Task</span>
            </button>
          </div>
        </div>

        {/* Selected Day Task List */}
        <div className="mt-4">
          {selectedDayTasks.length === 0 ? (
            <div className="py-8 text-center text-slate-400">
              <Sparkles className="w-8 h-8 mx-auto mb-2 text-slate-300 stroke-[1.5]" />
              <p className="text-sm font-medium text-slate-600">
                No tasks scheduled for {selectedFormatted}
              </p>
              <p className="text-xs text-slate-400 mt-1">
                Click "Schedule Task" above to add an agenda item.
              </p>
            </div>
          ) : (
            <ul className="space-y-2.5 m-0 p-0">
              {selectedDayTasks.map((t) => (
                <li
                  key={t.id}
                  className={`flex items-start justify-between gap-3 p-3.5 rounded-2xl border transition-all ${
                    t.completed
                      ? "bg-slate-50 border-slate-200/80 text-slate-500"
                      : "bg-white border-slate-200/90 text-slate-800 shadow-2xs"
                  }`}
                >
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <button
                      type="button"
                      onClick={() => onToggleTask(t)}
                      className={`mt-0.5 w-5 h-5 rounded-lg border flex items-center justify-center transition-all cursor-pointer flex-shrink-0 ${
                        t.completed
                          ? "bg-emerald-500 border-emerald-500 text-white"
                          : "bg-white border-slate-300 hover:border-indigo-500"
                      }`}
                    >
                      {t.completed && (
                        <CheckCircle2 className="w-3.5 h-3.5 stroke-[2.5]" />
                      )}
                    </button>
                    <div className="flex-1 min-w-0">
                      <p
                        className={`text-sm font-medium break-words ${
                          t.completed ? "line-through text-slate-400" : "text-slate-800"
                        }`}
                      >
                        {t.title}
                      </p>
                      {t.description && (
                        <p className="text-xs text-slate-500 mt-0.5 whitespace-pre-wrap">
                          {t.description}
                        </p>
                      )}
                      <div className="flex items-center gap-2 mt-2 text-[11px] text-slate-400">
                        <Clock className="w-3 h-3" />
                        <span>
                          {t.scheduledDate.includes("T")
                            ? t.scheduledDate.split("T")[1]
                            : "All day"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Send single task to Gmail */}
                  <button
                    type="button"
                    onClick={() => onOpenEmailModal({ taskId: t.id })}
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                    title="Send this task to Gmail"
                  >
                    <Mail className="w-4 h-4" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Overdue Alert banner if any */}
      {overdueTasks.length > 0 && (
        <div className="flex items-center justify-between gap-3 p-4 bg-amber-50/80 border border-amber-200 rounded-2xl text-amber-900 text-xs sm:text-sm">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0" />
            <div>
              <span className="font-semibold">
                {overdueTasks.length} Overdue Task{overdueTasks.length === 1 ? "" : "s"}:
              </span>{" "}
              {overdueTasks.map((t) => t.title).slice(0, 2).join(", ")}
              {overdueTasks.length > 2 && "..."}
            </div>
          </div>
          <button
            type="button"
            onClick={() => onOpenEmailModal({ taskIds: overdueTasks.map((t) => t.id) })}
            className="inline-flex items-center gap-1 px-3 py-1 bg-amber-200/60 hover:bg-amber-200 text-amber-950 font-semibold rounded-lg text-xs cursor-pointer transition-colors"
          >
            <Mail className="w-3 h-3" /> Email Reminder
          </button>
        </div>
      )}
    </div>
  );
}

