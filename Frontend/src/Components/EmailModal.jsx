import { useState } from "react";
import {
  Mail,
  X,
  Send,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { buildGmailComposeUrl } from "../api.js";

export default function EmailModal({
  isOpen,
  onClose,
  tasks = [],
  initialTaskId = null,
  initialDate = null,
  onSendEmailApi,
}) {
  const [recipient, setRecipient] = useState(() => {
    return localStorage.getItem("task_tracker_last_email") || "";
  });
  const [scope, setScope] = useState(() => {
    if (initialTaskId) return "single";
    if (initialDate) return "date";
    return "scheduled";
  });
  const [subject, setSubject] = useState(() => {
    if (initialTaskId) {
      const singleTask = tasks.find((t) => t.id === initialTaskId);
      return singleTask ? `Task Details: ${singleTask.title}` : "Task Details";
    }
    if (initialDate) {
      return `Scheduled Tasks for ${initialDate}`;
    }
    return `Task Tracker - Scheduled Agenda (${new Date().toLocaleDateString()})`;
  });
  const [sending, setSending] = useState(false);
  const [statusMessage, setStatusMessage] = useState(null); // { type: 'success' | 'info' | 'error', text, link }

  if (!isOpen) return null;

  // Determine which tasks to include based on scope
  const targetTasks = tasks.filter((t) => {
    if (scope === "single") return t.id === initialTaskId;
    if (scope === "date" && initialDate) {
      return t.scheduledDate && t.scheduledDate.startsWith(initialDate);
    }
    if (scope === "scheduled") return Boolean(t.scheduledDate);
    return true; // 'all'
  });

  function generatePlainSummary() {
    if (targetTasks.length === 0) return "No tasks selected.";
    return targetTasks
      .map(
        (t, idx) =>
          `${idx + 1}. [${t.completed ? "COMPLETED" : "PENDING"}] ${t.title}\n` +
          `   📅 Scheduled: ${t.scheduledDate || "None"}\n` +
          (t.description ? `   📝 Notes: ${t.description}\n` : ""),
      )
      .join("\n");
  }

  function handleOpenInGmail() {
    if (!recipient || !recipient.includes("@")) {
      setStatusMessage({
        type: "error",
        text: "Please enter a valid recipient email address.",
      });
      return;
    }

    localStorage.setItem("task_tracker_last_email", recipient.trim());
    const body =
      `Hello,\n\nHere is your task agenda from Task Tracker:\n\n` +
      generatePlainSummary() +
      `\n\nSent with Task Tracker`;

    const url = buildGmailComposeUrl({
      to: recipient,
      subject: subject || "Task Agenda",
      body,
    });

    window.open(url, "_blank", "noopener,noreferrer");
    setStatusMessage({
      type: "info",
      text: "Gmail compose window opened in a new tab!",
      link: url,
    });
  }

  async function handleSendViaBackend(e) {
    if (e) e.preventDefault();

    if (!recipient || !recipient.includes("@")) {
      setStatusMessage({
        type: "error",
        text: "Please provide a valid recipient email address.",
      });
      return;
    }

    localStorage.setItem("task_tracker_last_email", recipient.trim());
    setSending(true);
    setStatusMessage(null);

    try {
      const taskIds = targetTasks.map((t) => t.id);
      const res = await onSendEmailApi({
        to: recipient.trim(),
        subject: subject.trim(),
        taskIds,
      });

      if (res.sent) {
        setStatusMessage({
          type: "success",
          text: res.message || `Email sent successfully to ${recipient}!`,
        });
      } else {
        // Backend simulated or no SMTP configured
        setStatusMessage({
          type: "info",
          text: res.message || "Email prepared! You can also open directly in Gmail.",
          link: res.gmailUrl,
        });
      }
    } catch (err) {
      setStatusMessage({
        type: "error",
        text: err.message || "Failed to dispatch email via backend.",
      });
    } finally {
      setSending(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="email-modal-title"
    >
      <div
        className="relative w-full max-w-lg bg-white rounded-3xl p-6 sm:p-7 shadow-2xl border border-slate-100 ring-1 ring-slate-900/10 text-left transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-rose-500 to-amber-500 text-white flex items-center justify-center shadow-md shadow-rose-500/20">
              <Mail className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <h3
                id="email-modal-title"
                className="text-lg font-bold text-slate-900 tracking-tight"
              >
                Send to Gmail
              </h3>
              <p className="text-xs text-slate-500">
                Email your scheduled agenda or tasks directly to Gmail
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Form */}
        <form onSubmit={handleSendViaBackend} className="mt-5 space-y-4">
          {/* Scope Selector */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
              Tasks to Include
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {initialTaskId && (
                <button
                  type="button"
                  onClick={() => setScope("single")}
                  className={`px-3 py-2 text-xs font-medium rounded-xl border transition-all cursor-pointer ${
                    scope === "single"
                      ? "bg-indigo-50 border-indigo-300 text-indigo-700 font-semibold"
                      : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  Selected Task (1)
                </button>
              )}

              {initialDate && (
                <button
                  type="button"
                  onClick={() => setScope("date")}
                  className={`px-3 py-2 text-xs font-medium rounded-xl border transition-all cursor-pointer ${
                    scope === "date"
                      ? "bg-indigo-50 border-indigo-300 text-indigo-700 font-semibold"
                      : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  Date ({initialDate})
                </button>
              )}

              <button
                type="button"
                onClick={() => setScope("scheduled")}
                className={`px-3 py-2 text-xs font-medium rounded-xl border transition-all cursor-pointer ${
                  scope === "scheduled"
                    ? "bg-indigo-50 border-indigo-300 text-indigo-700 font-semibold"
                    : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                }`}
              >
                All Scheduled ({tasks.filter((t) => t.scheduledDate).length})
              </button>

              <button
                type="button"
                onClick={() => setScope("all")}
                className={`px-3 py-2 text-xs font-medium rounded-xl border transition-all cursor-pointer ${
                  scope === "all"
                    ? "bg-indigo-50 border-indigo-300 text-indigo-700 font-semibold"
                    : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                }`}
              >
                All Tasks ({tasks.length})
              </button>
            </div>
          </div>

          {/* Recipient Email */}
          <div>
            <label
              htmlFor="recipient-email"
              className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5"
            >
              Recipient Gmail / Email <span className="text-rose-500">*</span>
            </label>
            <input
              id="recipient-email"
              type="email"
              required
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              placeholder="e.g. yourname@gmail.com"
              className="w-full px-3.5 py-2.5 text-sm text-slate-800 bg-white border border-slate-200 rounded-xl placeholder:text-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-3 focus:ring-indigo-500/15 transition-all shadow-2xs"
            />
          </div>

          {/* Subject */}
          <div>
            <label
              htmlFor="email-subject"
              className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5"
            >
              Email Subject
            </label>
            <input
              id="email-subject"
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Email subject..."
              className="w-full px-3.5 py-2.5 text-sm text-slate-800 bg-white border border-slate-200 rounded-xl placeholder:text-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-3 focus:ring-indigo-500/15 transition-all shadow-2xs"
            />
          </div>

          {/* Live Preview Card */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Preview ({targetTasks.length} task{targetTasks.length === 1 ? "" : "s"})
              </span>
            </div>
            <div className="max-h-36 overflow-y-auto p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 space-y-1.5 font-mono leading-relaxed select-text">
              {targetTasks.length === 0 ? (
                <p className="text-slate-400 italic">No tasks match this filter.</p>
              ) : (
                targetTasks.map((t, idx) => (
                  <div key={t.id} className="pb-1 border-b border-slate-200/60 last:border-0">
                    <span className="font-semibold text-slate-800">
                      {idx + 1}. {t.title}
                    </span>
                    {t.scheduledDate && (
                      <span className="ml-2 text-indigo-600 font-normal">
                        ({t.scheduledDate})
                      </span>
                    )}
                    {t.description && (
                      <p className="text-[11px] text-slate-500 pl-4 truncate">
                        {t.description}
                      </p>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Status Message Notification */}
          {statusMessage && (
            <div
              className={`p-3.5 rounded-xl text-xs flex items-start gap-2.5 animate-in fade-in ${
                statusMessage.type === "success"
                  ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                  : statusMessage.type === "error"
                    ? "bg-rose-50 text-rose-800 border border-rose-200"
                    : "bg-blue-50 text-blue-800 border border-blue-200"
              }`}
            >
              {statusMessage.type === "success" ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
              ) : statusMessage.type === "error" ? (
                <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
              ) : (
                <Mail className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
              )}
              <div className="flex-1">
                <p className="font-medium">{statusMessage.text}</p>
                {statusMessage.link && (
                  <a
                    href={statusMessage.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 font-semibold underline text-blue-700 hover:text-blue-900 mt-1"
                  >
                    Click here to open in Gmail <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="pt-2 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={sending}
              className="px-4 py-2.5 text-xs font-semibold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer"
            >
              Cancel
            </button>

            {/* Direct Gmail compose button (instant, client-side, 0 setup required) */}
            <button
              type="button"
              onClick={handleOpenInGmail}
              disabled={sending || targetTasks.length === 0}
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 text-xs font-semibold text-slate-800 bg-slate-100 hover:bg-slate-200 border border-slate-200/80 rounded-xl transition-all cursor-pointer shadow-2xs"
              title="Open pre-filled draft in Gmail web app"
            >
              <ExternalLink className="w-3.5 h-3.5 text-slate-600" />
              <span>Open in Gmail</span>
            </button>

            {/* Backend SMTP send button */}
            <button
              type="submit"
              disabled={sending || targetTasks.length === 0}
              className="inline-flex items-center justify-center gap-1.5 px-5 py-2.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 rounded-xl transition-all shadow-xs shadow-indigo-600/25 disabled:opacity-50 cursor-pointer"
            >
              {sending ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Sending…</span>
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  <span>Send via Email API</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

