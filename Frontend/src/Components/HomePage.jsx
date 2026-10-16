import { useMemo } from "react";
import {
  ListTodo,
  Calendar as CalendarIcon,
  Mail,
  CheckCircle2,
  Clock,
  ArrowRight,
  Plus,
  Sparkles,
  Zap,
  ShieldCheck,
  Layers,
  ChevronRight,
  CalendarDays,
} from "lucide-react";

export default function HomePage({
  tasks = [],
  onNavigate,
  onToggleTask,
  onOpenNewTaskModal,
  onOpenEmailModal,
}) {
  // Time-based greeting
  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  }, []);

  const todayDateFormatted = useMemo(() => {
    return new Date().toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  }, []);

  const todayStr = useMemo(() => new Date().toISOString().slice(0, 10), []);

  // Filter tasks
  const todayTasks = useMemo(() => {
    return tasks.filter((t) => {
      return t.scheduledDate && t.scheduledDate.slice(0, 10) === todayStr;
    });
  }, [tasks, todayStr]);

  const upcomingTasks = useMemo(() => {
    return tasks
      .filter((t) => !t.completed && t.scheduledDate && t.scheduledDate.slice(0, 10) > todayStr)
      .slice(0, 4);
  }, [tasks, todayStr]);

  const totalTasks = tasks.length;
  const completedTasks = useMemo(
    () => tasks.filter((t) => t.completed).length,
    [tasks],
  );
  const pendingTasks = totalTasks - completedTasks;
  const scheduledCount = useMemo(
    () => tasks.filter((t) => Boolean(t.scheduledDate)).length,
    [tasks],
  );
  const completionPercent =
    totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  return (
    <div className="space-y-10 pb-12 animate-in fade-in duration-300">
      {/* Hero Banner */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 text-white p-7 sm:p-10 md:p-12 shadow-xl border border-slate-800">
        {/* Subtle decorative glow */}
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 rounded-full bg-indigo-500/20 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -mb-20 w-80 h-80 rounded-full bg-purple-500/15 blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-2xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-white/10 text-indigo-200 border border-white/15 backdrop-blur-md">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            <span>{todayDateFormatted}</span>
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight leading-tight sm:leading-none">
            {greeting}, <br />
            <span className="bg-gradient-to-r from-indigo-300 via-indigo-100 to-white bg-clip-text text-transparent">
              Master Your Schedule.
            </span>
          </h1>

          <p className="text-sm sm:text-base text-slate-300 leading-relaxed font-normal pt-1">
            Stay organized, plan your week on the calendar, and dispatch your daily task
            agenda straight to Gmail with zero hassle.
          </p>

          {/* Action CTAs */}
          <div className="flex flex-wrap items-center gap-3 pt-3">
            <button
              type="button"
              onClick={() => onNavigate("tasks")}
              className="inline-flex items-center gap-2 px-5 py-3 text-sm font-bold text-slate-950 bg-white hover:bg-slate-100 rounded-2xl transition-all shadow-md hover:shadow-lg cursor-pointer transform active:scale-95"
            >
              <span>Manage Tasks</span>
              <ArrowRight className="w-4 h-4 text-indigo-600" />
            </button>

            <button
              type="button"
              onClick={() => onNavigate("calendar")}
              className="inline-flex items-center gap-2 px-5 py-3 text-sm font-bold text-white bg-white/10 hover:bg-white/20 border border-white/20 rounded-2xl transition-all backdrop-blur-md cursor-pointer"
            >
              <CalendarIcon className="w-4 h-4 text-indigo-300" />
              <span>View Calendar</span>
            </button>

            <button
              type="button"
              onClick={onOpenEmailModal}
              className="inline-flex items-center gap-2 px-4 py-3 text-sm font-semibold text-rose-300 hover:text-white bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 rounded-2xl transition-all cursor-pointer"
            >
              <Mail className="w-4 h-4" />
              <span>Send to Gmail</span>
            </button>
          </div>
        </div>
      </section>

      {/* Overview Metrics Cards */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Total Tasks */}
        <div
          onClick={() => onNavigate("tasks")}
          className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs hover:shadow-md hover:border-indigo-300 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Total Tasks
            </span>
            <div className="w-9 h-9 rounded-xl bg-slate-100 group-hover:bg-indigo-50 text-slate-600 group-hover:text-indigo-600 flex items-center justify-center transition-colors">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-900">
              {totalTasks}
            </span>
            <span className="text-xs font-semibold text-indigo-600 group-hover:translate-x-0.5 transition-transform inline-flex items-center gap-0.5">
              View <ChevronRight className="w-3 h-3" />
            </span>
          </div>
        </div>

        {/* Scheduled Tasks */}
        <div
          onClick={() => onNavigate("calendar")}
          className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs hover:shadow-md hover:border-purple-300 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-purple-700">
              Scheduled
            </span>
            <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center transition-colors">
              <CalendarIcon className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-2xl sm:text-3xl font-extrabold text-purple-900">
              {scheduledCount}
            </span>
            <span className="text-xs font-semibold text-purple-600 group-hover:translate-x-0.5 transition-transform inline-flex items-center gap-0.5">
              Calendar <ChevronRight className="w-3 h-3" />
            </span>
          </div>
        </div>

        {/* Due Today */}
        <div
          onClick={() => onNavigate("tasks")}
          className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs hover:shadow-md hover:border-amber-300 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-700">
              Due Today
            </span>
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center transition-colors">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-2xl sm:text-3xl font-extrabold text-amber-900">
              {todayTasks.filter((t) => !t.completed).length}
            </span>
            <span className="text-xs font-semibold text-amber-600 group-hover:translate-x-0.5 transition-transform inline-flex items-center gap-0.5">
              Focus <ChevronRight className="w-3 h-3" />
            </span>
          </div>
        </div>

        {/* Completion Progress */}
        <div
          onClick={() => onNavigate("tasks")}
          className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs hover:shadow-md hover:border-emerald-300 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">
              Completed
            </span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center transition-colors">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-2xl sm:text-3xl font-extrabold text-emerald-900">
              {completionPercent}%
            </span>
            <span className="text-xs font-semibold text-emerald-600">
              {completedTasks}/{totalTasks}
            </span>
          </div>
        </div>
      </section>

      {/* Main Two-Column Layout: Today's Focus & Feature Shortcuts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-7">
        {/* Today's Focus Widget (2 Cols) */}
        <section className="lg:col-span-2 bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100">
                  <CalendarDays className="w-5 h-5 stroke-[2.2]" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-slate-900">
                    Today's Agenda
                  </h3>
                  <p className="text-xs text-slate-500">
                    {todayTasks.length} task{todayTasks.length === 1 ? "" : "s"} scheduled for today
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onOpenNewTaskModal}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-xl transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Task</span>
                </button>
              </div>
            </div>

            {/* Today's task list */}
            <div className="mt-4">
              {todayTasks.length === 0 ? (
                <div className="py-10 text-center text-slate-400">
                  <Sparkles className="w-8 h-8 mx-auto mb-2 text-indigo-300 stroke-[1.5]" />
                  <p className="text-sm font-semibold text-slate-700">
                    No tasks scheduled for today
                  </p>
                  <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                    Enjoy your day or click below to schedule tasks or view all items.
                  </p>
                  <button
                    type="button"
                    onClick={onOpenNewTaskModal}
                    className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs shadow-indigo-600/20 cursor-pointer transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Create a Task</span>
                  </button>
                </div>
              ) : (
                <ul className="space-y-2.5 p-0 m-0">
                  {todayTasks.map((task) => (
                    <li
                      key={task.id}
                      className={`flex items-start justify-between gap-3 p-3.5 rounded-2xl border transition-all ${
                        task.completed
                          ? "bg-slate-50 border-slate-200/80 text-slate-500"
                          : "bg-white border-slate-200 text-slate-900 shadow-2xs hover:border-indigo-200"
                      }`}
                    >
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        <button
                          type="button"
                          onClick={() => onToggleTask(task)}
                          className={`mt-0.5 w-5 h-5 rounded-lg border flex items-center justify-center transition-all cursor-pointer flex-shrink-0 ${
                            task.completed
                              ? "bg-emerald-500 border-emerald-500 text-white"
                              : "bg-white border-slate-300 hover:border-indigo-500"
                          }`}
                        >
                          {task.completed && (
                            <CheckCircle2 className="w-3.5 h-3.5 stroke-[2.5]" />
                          )}
                        </button>
                        <div className="flex-1 min-w-0">
                          <p
                            className={`text-sm font-semibold break-words ${
                              task.completed
                                ? "line-through text-slate-400 font-normal"
                                : "text-slate-900"
                            }`}
                          >
                            {task.title}
                          </p>
                          {task.description && (
                            <p className="text-xs text-slate-500 mt-0.5 truncate">
                              {task.description}
                            </p>
                          )}
                        </div>
                      </div>

                      {task.scheduledDate?.includes("T") && (
                        <span className="text-[11px] font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-lg whitespace-nowrap">
                          {task.scheduledDate.split("T")[1].slice(0, 5)}
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          <div className="pt-5 mt-4 border-t border-slate-100 flex items-center justify-between">
            <button
              type="button"
              onClick={() => onNavigate("tasks")}
              className="text-xs font-bold text-indigo-600 hover:text-indigo-800 inline-flex items-center gap-1 cursor-pointer"
            >
              <span>Go to full task list</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>

            {todayTasks.length > 0 && (
              <button
                type="button"
                onClick={onOpenEmailModal}
                className="text-xs font-semibold text-rose-600 hover:text-rose-800 inline-flex items-center gap-1 cursor-pointer"
              >
                <Mail className="w-3.5 h-3.5" />
                <span>Send today's agenda to Gmail</span>
              </button>
            )}
          </div>
        </section>

        {/* Quick Launch & Features (1 Col) */}
        <section className="space-y-4">
          {/* Calendar Widget Card */}
          <div
            onClick={() => onNavigate("calendar")}
            className="bg-gradient-to-br from-indigo-900 to-indigo-950 text-white rounded-3xl p-6 shadow-md border border-indigo-800/60 cursor-pointer group hover:scale-[1.01] transition-transform"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-300">
                Interactive Schedule
              </span>
              <CalendarIcon className="w-5 h-5 text-indigo-300" />
            </div>
            <h4 className="text-lg font-bold mt-2">
              Month & Day Calendar
            </h4>
            <p className="text-xs text-indigo-200/80 mt-1 leading-relaxed">
              Browse monthly schedules, organize agenda by day, and spot upcoming milestones.
            </p>
            <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-xs font-bold text-white group-hover:translate-x-1 transition-transform">
              <span>Open Calendar View</span>
              <ArrowRight className="w-4 h-4" />
            </div>
          </div>

          {/* Gmail Integration Card */}
          <div
            onClick={onOpenEmailModal}
            className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow cursor-pointer group"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-rose-600">
                Email Dispatch
              </span>
              <Mail className="w-5 h-5 text-rose-500" />
            </div>
            <h4 className="text-lg font-bold text-slate-900 mt-2">
              Sync to Gmail
            </h4>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              1-click pre-filled draft in Gmail or direct background delivery via Nodemailer.
            </p>
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-rose-700 group-hover:translate-x-1 transition-transform">
              <span>Send Tasks to Gmail</span>
              <ArrowRight className="w-4 h-4" />
            </div>
          </div>

          {/* Quick Stats Pill */}
          <div className="bg-slate-100/70 rounded-3xl p-4 border border-slate-200/60 text-xs text-slate-600 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-500" />
              <span className="font-semibold text-slate-800">
                {pendingTasks} Pending Tasks
              </span>
            </div>
            <button
              type="button"
              onClick={() => onNavigate("tasks")}
              className="font-bold text-indigo-600 hover:underline cursor-pointer"
            >
              Start now
            </button>
          </div>
        </section>
      </div>

      {/* Feature Pillars Showcase */}
      <section className="pt-4">
        <h3 className="text-center text-xs font-bold uppercase tracking-wider text-slate-400 mb-6">
          Everything You Need in One Unified Workspace
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-2xs">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-4">
              <ListTodo className="w-5 h-5" />
            </div>
            <h4 className="text-base font-bold text-slate-900 mb-1">
              Smart Task Management
            </h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              Add titles, detailed notes, and toggle completion with optimistic UI updates. Fast keyboard shortcut (<kbd className="font-mono bg-slate-100 px-1 rounded text-[10px]">Ctrl+Enter</kbd>) support.
            </p>
          </div>

          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-2xs">
            <div className="w-10 h-10 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center mb-4">
              <CalendarIcon className="w-5 h-5" />
            </div>
            <h4 className="text-base font-bold text-slate-900 mb-1">
              Visual Calendar & Agenda
            </h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              Month-by-month scheduling with automated overdue detection and instant day agenda drill-downs. Never miss a deadline again.
            </p>
          </div>

          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-2xs">
            <div className="w-10 h-10 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mb-4">
              <Mail className="w-5 h-5" />
            </div>
            <h4 className="text-base font-bold text-slate-900 mb-1">
              Direct Gmail Sync
            </h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              Compose elegant formatted HTML and plain text summaries right into Gmail web, or dispatch via background SMTP API.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}

