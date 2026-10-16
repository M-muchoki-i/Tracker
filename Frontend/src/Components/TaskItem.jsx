import { useState } from "react";
import {
  Check,
  Pencil,
  Trash2,
  Clock,
  Calendar,
  Mail,
  AlertCircle,
} from "lucide-react";
import TaskForm from "./TaskForm.jsx";

// Safely format timestamps without ever producing "Invalid Date"
function formatTaskDate(dateString) {
  if (!dateString) return null;
  const d = new Date(dateString);
  if (isNaN(d.getTime())) return null;
  return d.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getScheduleBadgeInfo(scheduledDate, isCompleted) {
  if (!scheduledDate) return null;

  const todayStr = new Date().toISOString().slice(0, 10);
  const taskDateStr = scheduledDate.slice(0, 10);
  const isPast = taskDateStr < todayStr;
  const isToday = taskDateStr === todayStr;

  let label = taskDateStr;
  try {
    const [y, m, d] = taskDateStr.split("-").map(Number);
    const dateObj = new Date(y, m - 1, d);
    label = dateObj.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  } catch {
    label = taskDateStr;
  }

  if (scheduledDate.includes("T")) {
    const timePart = scheduledDate.split("T")[1].slice(0, 5);
    label += ` at ${timePart}`;
  }

  if (isCompleted) {
    return {
      label: `Scheduled: ${label}`,
      style: "bg-slate-100 text-slate-500 border-slate-200",
      isOverdue: false,
    };
  }

  if (isPast) {
    return {
      label: `Overdue: ${label}`,
      style: "bg-rose-50 text-rose-700 border-rose-200 font-semibold",
      isOverdue: true,
    };
  }

  if (isToday) {
    return {
      label: `Today: ${label}`,
      style: "bg-indigo-50 text-indigo-700 border-indigo-200 font-semibold",
      isOverdue: false,
    };
  }

  return {
    label: `Due: ${label}`,
    style: "bg-slate-50 text-slate-600 border-slate-200",
    isOverdue: false,
  };
}

export default function TaskItem({
  task,
  onToggle,
  onEdit,
  onDeleteRequest,
  onSendEmail,
}) {
  const [editing, setEditing] = useState(false);
  const formattedCreated = formatTaskDate(task.createdAt);
  const scheduleInfo = getScheduleBadgeInfo(task.scheduledDate, task.completed);

  if (editing) {
    return (
      <li className="list-none mb-3">
        <TaskForm
          initialValues={task}
          isEditing={true}
          submitLabel="Save Changes"
          onSubmit={async (values) => {
            await onEdit(task.id, values);
            setEditing(false);
          }}
          onCancel={() => setEditing(false)}
        />
      </li>
    );
  }

  return (
    <li
      className={`group list-none relative rounded-2xl border transition-all duration-200 mb-3 overflow-hidden ${
        task.completed
          ? "bg-slate-50/60 border-slate-200/70 hover:border-slate-300"
          : scheduleInfo?.isOverdue
            ? "bg-white border-rose-200/80 shadow-2xs hover:shadow-md hover:border-rose-300"
            : "bg-white border-slate-200/90 shadow-2xs hover:shadow-md hover:border-indigo-200"
      }`}
    >
      {/* Accent left border indicator */}
      <div
        className={`absolute top-0 bottom-0 left-0 w-1 ${
          task.completed
            ? "bg-emerald-500"
            : scheduleInfo?.isOverdue
              ? "bg-rose-500"
              : "bg-indigo-500"
        }`}
      />

      <div className="p-4 sm:p-5 pl-5 sm:pl-6">
        <div className="flex items-start justify-between gap-3">
          {/* Checkbox and Content */}
          <div className="flex items-start gap-3.5 flex-1 min-w-0">
            <button
              type="button"
              role="checkbox"
              aria-checked={task.completed}
              onClick={() => onToggle(task)}
              className={`flex-shrink-0 mt-0.5 w-5 h-5 rounded-lg border flex items-center justify-center transition-all cursor-pointer ${
                task.completed
                  ? "bg-emerald-500 border-emerald-500 text-white shadow-xs shadow-emerald-500/30"
                  : "bg-white border-slate-300 hover:border-indigo-500 hover:bg-indigo-50/50"
              }`}
              title={
                task.completed ? "Mark as uncompleted" : "Mark as completed"
              }
            >
              {task.completed && <Check className="w-3.5 h-3.5 stroke-[3]" />}
            </button>

            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span
                  onClick={() => onToggle(task)}
                  className={`text-sm sm:text-base font-semibold break-words cursor-pointer select-none transition-colors ${
                    task.completed
                      ? "line-through text-slate-400 font-normal"
                      : "text-slate-900 hover:text-indigo-600"
                  }`}
                >
                  {task.title}
                </span>

                {/* Status Pill */}
                <span
                  className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium tracking-wide ${
                    task.completed
                      ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/10"
                      : "bg-indigo-50 text-indigo-700 ring-1 ring-indigo-600/10"
                  }`}
                >
                  {task.completed ? "Completed" : "Active"}
                </span>

                {/* Schedule Badge */}
                {scheduleInfo && (
                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] border ${scheduleInfo.style}`}
                  >
                    {scheduleInfo.isOverdue ? (
                      <AlertCircle className="w-3 h-3 text-rose-600" />
                    ) : (
                      <Calendar className="w-3 h-3" />
                    )}
                    <span>{scheduleInfo.label}</span>
                  </span>
                )}
              </div>

              {/* Description */}
              {task.description && (
                <p
                  className={`mt-1.5 text-xs sm:text-sm whitespace-pre-wrap break-words leading-relaxed ${
                    task.completed ? "text-slate-400" : "text-slate-600"
                  }`}
                >
                  {task.description}
                </p>
              )}

              {/* Created Date */}
              {formattedCreated && (
                <div className="mt-3 flex items-center gap-1.5 text-[11px] text-slate-400 font-medium">
                  <Clock className="w-3 h-3" />
                  <span>Created {formattedCreated}</span>
                </div>
              )}
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-1 sm:gap-1.5 flex-shrink-0">
            {/* Send to Gmail button */}
            <button
              type="button"
              onClick={() => onSendEmail(task)}
              className="inline-flex items-center justify-center p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all cursor-pointer"
              title="Send task to Gmail"
              aria-label={`Send task "${task.title}" to Gmail`}
            >
              <Mail className="w-4 h-4" />
            </button>

            {/* Edit button */}
            <button
              type="button"
              onClick={() => setEditing(true)}
              className="inline-flex items-center justify-center p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all cursor-pointer"
              title="Edit task"
              aria-label={`Edit task "${task.title}"`}
            >
              <Pencil className="w-4 h-4" />
            </button>

            {/* Delete button */}
            <button
              type="button"
              onClick={() => onDeleteRequest(task)}
              className="inline-flex items-center justify-center p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all cursor-pointer"
              title="Delete task"
              aria-label={`Delete task "${task.title}"`}
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </li>
  );
}
