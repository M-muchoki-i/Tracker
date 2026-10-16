import { useState, useMemo } from "react";
import {
  Search,
  X,
  ListFilter,
  Sparkles,
  ArrowUpDown,
  RotateCcw,
  Calendar,
} from "lucide-react";
import TaskItem from "./TaskItem.jsx";

export default function TaskList({
  tasks,
  onToggle,
  onEdit,
  onDeleteRequest,
  onSendEmail,
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all"); // 'all' | 'active' | 'completed' | 'scheduled'
  const [sortBy, setSortBy] = useState("newest"); // 'newest' | 'oldest' | 'title' | 'scheduled'

  // Calculate counts for badges
  const totalCount = tasks.length;
  const completedCount = useMemo(
    () => tasks.filter((t) => t.completed).length,
    [tasks],
  );
  const activeCount = totalCount - completedCount;
  const scheduledCount = useMemo(
    () => tasks.filter((t) => Boolean(t.scheduledDate)).length,
    [tasks],
  );

  // Filter and sort tasks
  const filteredTasks = useMemo(() => {
    return tasks
      .filter((task) => {
        // Status filter
        if (statusFilter === "active" && task.completed) return false;
        if (statusFilter === "completed" && !task.completed) return false;
        if (statusFilter === "scheduled" && !task.scheduledDate) return false;

        // Search query
        if (searchQuery.trim().length > 0) {
          const q = searchQuery.toLowerCase().trim();
          const matchTitle = (task.title || "").toLowerCase().includes(q);
          const matchDesc = (task.description || "").toLowerCase().includes(q);
          if (!matchTitle && !matchDesc) return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === "title") {
          return (a.title || "").localeCompare(b.title || "");
        }
        if (sortBy === "oldest") {
          return new Date(a.createdAt || 0) - new Date(b.createdAt || 0);
        }
        if (sortBy === "scheduled") {
          if (!a.scheduledDate && !b.scheduledDate) return 0;
          if (!a.scheduledDate) return 1;
          if (!b.scheduledDate) return -1;
          return a.scheduledDate.localeCompare(b.scheduledDate);
        }
        // Default newest first
        return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
      });
  }, [tasks, statusFilter, searchQuery, sortBy]);

  // Overall empty state (no tasks created at all)
  if (tasks.length === 0) {
    return (
      <div className="rounded-3xl border border-dashed border-slate-300 bg-white/70 p-12 text-center backdrop-blur-xs">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 shadow-xs mb-4">
          <Sparkles className="h-7 w-7 stroke-[2]" />
        </div>
        <h3 className="text-base font-bold text-slate-900">
          No tasks recorded yet
        </h3>
        <p className="mt-1 text-sm text-slate-500 max-w-sm mx-auto">
          Start planning your agenda by adding your first task and schedule date above.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search and Filters toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
        {/* Search input */}
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search tasks by title or notes…"
            className="w-full pl-9 pr-9 py-2.5 text-xs sm:text-sm text-slate-800 bg-white border border-slate-200 rounded-xl placeholder:text-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-3 focus:ring-indigo-500/15 transition-all shadow-2xs"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 text-slate-400 hover:text-slate-600 rounded-md cursor-pointer"
              title="Clear search"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Sort Select */}
        <div className="flex items-center gap-2">
          <div className="relative flex items-center">
            <ArrowUpDown className="absolute left-3 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="appearance-none pl-8 pr-8 py-2.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 focus:ring-3 focus:ring-indigo-500/15 cursor-pointer shadow-2xs"
            >
              <option value="newest">Newest first</option>
              <option value="scheduled">Scheduled date</option>
              <option value="oldest">Oldest first</option>
              <option value="title">Title (A-Z)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200/80 pb-2.5 overflow-x-auto">
        <button
          type="button"
          onClick={() => setStatusFilter("all")}
          className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
            statusFilter === "all"
              ? "bg-slate-900 text-white shadow-2xs"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
          }`}
        >
          <span>All</span>
          <span
            className={`px-1.5 py-0.2 rounded-full text-[10px] ${
              statusFilter === "all"
                ? "bg-slate-700 text-slate-200"
                : "bg-slate-200 text-slate-700"
            }`}
          >
            {totalCount}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setStatusFilter("active")}
          className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
            statusFilter === "active"
              ? "bg-indigo-600 text-white shadow-2xs"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
          }`}
        >
          <span>Active</span>
          <span
            className={`px-1.5 py-0.2 rounded-full text-[10px] ${
              statusFilter === "active"
                ? "bg-indigo-500 text-white"
                : "bg-slate-200 text-slate-700"
            }`}
          >
            {activeCount}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setStatusFilter("scheduled")}
          className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
            statusFilter === "scheduled"
              ? "bg-purple-600 text-white shadow-2xs"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
          }`}
        >
          <Calendar className="w-3 h-3" />
          <span>Scheduled</span>
          <span
            className={`px-1.5 py-0.2 rounded-full text-[10px] ${
              statusFilter === "scheduled"
                ? "bg-purple-500 text-white"
                : "bg-slate-200 text-slate-700"
            }`}
          >
            {scheduledCount}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setStatusFilter("completed")}
          className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
            statusFilter === "completed"
              ? "bg-emerald-600 text-white shadow-2xs"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
          }`}
        >
          <span>Completed</span>
          <span
            className={`px-1.5 py-0.2 rounded-full text-[10px] ${
              statusFilter === "completed"
                ? "bg-emerald-500 text-white"
                : "bg-slate-200 text-slate-700"
            }`}
          >
            {completedCount}
          </span>
        </button>
      </div>

      {/* Task list or filtered empty state */}
      {filteredTasks.length === 0 ? (
        <div className="rounded-3xl border border-slate-200 bg-white p-10 text-center my-4 shadow-xs">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-500 mb-3">
            <ListFilter className="h-6 w-6" />
          </div>
          <h4 className="text-sm font-bold text-slate-900">
            No matching tasks found
          </h4>
          <p className="mt-1 text-xs text-slate-500">
            Try adjusting your search query or switching the status filter tab.
          </p>
          {(searchQuery || statusFilter !== "all") && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery("");
                setStatusFilter("all");
              }}
              className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-indigo-600 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-xl transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset filters
            </button>
          )}
        </div>
      ) : (
        <ul className="space-y-3 pt-1 p-0 m-0">
          {filteredTasks.map((task) => (
            <TaskItem
              key={task.id}
              task={task}
              onToggle={onToggle}
              onEdit={onEdit}
              onDeleteRequest={onDeleteRequest}
              onSendEmail={onSendEmail}
            />
          ))}
        </ul>
      )}
    </div>
  );
}
