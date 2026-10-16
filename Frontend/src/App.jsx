import { useEffect, useState, useMemo } from "react";
import { api, localApi } from "./api.js";
import Navbar from "./Components/Navbar.jsx";
import HomePage from "./Components/HomePage.jsx";
import TaskForm from "./Components/TaskForm.jsx";
import TaskList from "./Components/TaskList.jsx";
import CalendarView from "./Components/CalendarView.jsx";
import EmailModal from "./Components/EmailModal.jsx";
import NewTaskModal from "./Components/NewTaskModal.jsx";
import ConfirmDialog from "./Components/ConfirmDialog.jsx";
import {
  AlertCircle,
  X,
  CheckCircle2,
  ListTodo,
} from "lucide-react";

export default function App() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [taskToDelete, setTaskToDelete] = useState(null);
  const [isOfflineMode, setIsOfflineMode] = useState(false);
  const [toast, setToast] = useState(null);

  // Page routing: 'home' | 'tasks' | 'calendar'
  const [currentPage, setCurrentPage] = useState(() => {
    const hash = window.location.hash.toLowerCase();
    if (hash.includes("calendar")) return "calendar";
    if (hash.includes("tasks")) return "tasks";
    return "home";
  });

  // Modal states
  const [isNewTaskModalOpen, setIsNewTaskModalOpen] = useState(false);
  const [emailModalState, setEmailModalState] = useState({
    isOpen: false,
    taskId: null,
    date: null,
  });

  // Active client according to current mode
  const currentClient = isOfflineMode ? localApi : api;

  // Sync hash on navigation
  function navigateTo(page) {
    setCurrentPage(page);
    window.location.hash = page === "home" ? "/" : `/${page}`;
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  // Handle browser back/forward buttons
  useEffect(() => {
    function handleHashChange() {
      const hash = window.location.hash.toLowerCase();
      if (hash.includes("calendar")) setCurrentPage("calendar");
      else if (hash.includes("tasks")) setCurrentPage("tasks");
      else setCurrentPage("home");
    }
    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  // Auto-dismiss toast after 4 seconds
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(timer);
  }, [toast]);

  // Fetch initial tasks on mount
  useEffect(() => {
    let ignore = false;

    async function fetchInitialTasks() {
      try {
        const data = await api.listTasks();
        if (!ignore) {
          setTasks(Array.isArray(data) ? data : []);
          setIsOfflineMode(false);
          setLoading(false);
        }
      } catch (err) {
        if (!ignore) {
          if (err.isNetworkError) {
            const localData = await localApi.listTasks();
            if (!ignore) {
              setTasks(Array.isArray(localData) ? localData : []);
              setIsOfflineMode(true);
              setError(
                "Backend server not detected on port 3000. Running in Local Demo mode.",
              );
              setLoading(false);
            }
          } else {
            setError(err.message);
            setLoading(false);
          }
        }
      }
    }

    fetchInitialTasks();

    return () => {
      ignore = true;
    };
  }, []);

  async function handleRetryBackend() {
    setLoading(true);
    setError(null);
    try {
      const data = await api.listTasks();
      setTasks(Array.isArray(data) ? data : []);
      setIsOfflineMode(false);
      setToast({ type: "success", message: "Connected to backend API on port 3000!" });
    } catch (err) {
      if (err.isNetworkError) {
        setError("Backend server still not reachable on port 3000.");
      } else {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate(values) {
    try {
      const created = await currentClient.createTask(values);
      setTasks((prev) => [created, ...prev]);
      setToast({
        type: "success",
        message: values.scheduledDate
          ? `Task scheduled for ${values.scheduledDate.slice(0, 10)}!`
          : "Task added successfully!",
      });
    } catch (err) {
      if (err.isNetworkError && !isOfflineMode) {
        setIsOfflineMode(true);
        const fallbackCreated = await localApi.createTask(values);
        setTasks((prev) => [fallbackCreated, ...prev]);
        setError("Backend server on port 3000 is not running. Task saved in local demo mode. To connect SQLite, start the backend with 'npm run dev' or 'cd Backend && npm run dev'.");
        return;
      }
      setError(err.message);
      throw err;
    }
  }

  async function handleToggle(task) {
    const nextCompleted = !task.completed;
    setTasks((prev) =>
      prev.map((t) => (t.id === task.id ? { ...t, completed: nextCompleted } : t)),
    );

    try {
      const updated = await currentClient.updateTask(task.id, {
        completed: nextCompleted,
      });
      setTasks((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
    } catch (err) {
      if (err.isNetworkError && !isOfflineMode) {
        setIsOfflineMode(true);
        const updated = await localApi.updateTask(task.id, { completed: nextCompleted });
        setTasks((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
        return;
      }
      setTasks((prev) =>
        prev.map((t) => (t.id === task.id ? { ...t, completed: task.completed } : t)),
      );
      setError(err.message);
    }
  }

  async function handleEdit(id, values) {
    try {
      const updated = await currentClient.updateTask(id, values);
      setTasks((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
      setToast({ type: "success", message: "Task updated successfully!" });
    } catch (err) {
      if (err.isNetworkError && !isOfflineMode) {
        setIsOfflineMode(true);
        const updated = await localApi.updateTask(id, values);
        setTasks((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
        return;
      }
      setError(err.message);
      throw err;
    }
  }

  async function handleConfirmDelete() {
    if (!taskToDelete) return;
    try {
      await currentClient.deleteTask(taskToDelete.id);
      setTasks((prev) => prev.filter((t) => t.id !== taskToDelete.id));
      setToast({ type: "success", message: `"${taskToDelete.title}" deleted.` });
      setTaskToDelete(null);
    } catch (err) {
      if (err.isNetworkError && !isOfflineMode) {
        setIsOfflineMode(true);
        await localApi.deleteTask(taskToDelete.id);
        setTasks((prev) => prev.filter((t) => t.id !== taskToDelete.id));
        setTaskToDelete(null);
        return;
      }
      setError(err.message);
      setTaskToDelete(null);
    }
  }

  function handleOpenEmail(options = {}) {
    setEmailModalState({
      isOpen: true,
      taskId: options.taskId || null,
      date: options.date || null,
    });
  }

  return (
    <div className="min-h-screen bg-slate-50/80 text-slate-900 selection:bg-indigo-600 selection:text-white flex flex-col">
      {/* Decorative ambient gradient backdrop */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0 opacity-40">
        <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-indigo-200/40 blur-3xl" />
        <div className="absolute top-1/2 -left-40 w-96 h-96 rounded-full bg-purple-200/30 blur-3xl" />
      </div>

      {/* Sticky Top Navigation Bar */}
      <Navbar
        currentPage={currentPage}
        onNavigate={navigateTo}
        tasks={tasks}
        isOfflineMode={isOfflineMode}
        onRetryBackend={handleRetryBackend}
        onOpenNewTaskModal={() => setIsNewTaskModalOpen(true)}
        onOpenEmailModal={() => handleOpenEmail({})}
      />

      {/* Main Content View Container */}
      <div className="relative z-10 flex-1 max-w-6xl w-full mx-auto py-8 sm:py-10 px-4 sm:px-6 lg:px-8 space-y-6">
        {/* Floating Toast Notification */}
        {toast && (
          <div className="fixed bottom-6 right-6 z-50 flex items-center justify-between gap-3 px-5 py-3.5 bg-slate-900 text-white text-xs sm:text-sm font-semibold rounded-2xl shadow-2xl shadow-slate-900/30 border border-slate-800 animate-in fade-in slide-in-from-bottom-3">
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <span>{toast.message}</span>
            </div>
            <button
              onClick={() => setToast(null)}
              className="text-slate-400 hover:text-white p-1 rounded-lg cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Global Error Banner */}
        {error && (
          <div className="flex items-start justify-between gap-3 p-4 bg-rose-50 border border-rose-200 rounded-3xl text-rose-800 text-xs sm:text-sm animate-in fade-in shadow-2xs">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-rose-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-semibold text-rose-900">{error}</p>
                {isOfflineMode && (
                  <p className="mt-1 text-xs text-rose-700">
                    Running in demo mode. Start backend on port 3000 (<code className="bg-rose-100 px-1 rounded text-[11px] font-mono">npm run dev</code> or <code className="bg-rose-100 px-1 rounded text-[11px] font-mono">npm start</code>) to sync to SQLite.
                  </p>
                )}
              </div>
            </div>
            <button
              onClick={() => setError(null)}
              className="p-1 text-rose-500 hover:text-rose-800 hover:bg-rose-100 rounded-xl transition-colors cursor-pointer"
              aria-label="Dismiss error"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Loading Spinner */}
        {loading ? (
          <div className="bg-white rounded-3xl p-16 border border-slate-200 text-center space-y-3">
            <div className="inline-flex p-3.5 rounded-2xl bg-indigo-50 text-indigo-600 animate-pulse">
              <ListTodo className="w-7 h-7" />
            </div>
            <p className="text-base font-bold text-slate-700">
              Loading your workspace…
            </p>
          </div>
        ) : (
          <>
            {/* VIEW 1: HOME PAGE */}
            {currentPage === "home" && (
              <HomePage
                tasks={tasks}
                onNavigate={navigateTo}
                onToggleTask={handleToggle}
                onOpenNewTaskModal={() => setIsNewTaskModalOpen(true)}
                onOpenEmailModal={() => handleOpenEmail({})}
              />
            )}

            {/* VIEW 2: TASKS PAGE */}
            {currentPage === "tasks" && (
              <div className="max-w-3xl mx-auto space-y-6 animate-in fade-in duration-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                      Task Manager
                    </h2>
                    <p className="text-xs sm:text-sm text-slate-500">
                      Organize, schedule, and track all your tasks.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleOpenEmail({})}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200/80 rounded-xl transition-all cursor-pointer shadow-2xs"
                  >
                    <span>Send to Gmail</span>
                  </button>
                </div>

                {/* Create Task Form */}
                <TaskForm onSubmit={handleCreate} />

                {/* Filterable, Sortable Task List */}
                <TaskList
                  tasks={tasks}
                  onToggle={handleToggle}
                  onEdit={handleEdit}
                  onDeleteRequest={setTaskToDelete}
                  onSendEmail={(task) => handleOpenEmail({ taskId: task.id })}
                />
              </div>
            )}

            {/* VIEW 3: CALENDAR PAGE */}
            {currentPage === "calendar" && (
              <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                      Calendar Schedule
                    </h2>
                    <p className="text-xs sm:text-sm text-slate-500">
                      Visual calendar timeline and daily agenda breakdowns.
                    </p>
                  </div>
                </div>

                <CalendarView
                  tasks={tasks}
                  onToggleTask={handleToggle}
                  onOpenTaskFormWithDate={(dateStr) => {
                    setIsNewTaskModalOpen(true);
                  }}
                  onOpenEmailModal={handleOpenEmail}
                />
              </div>
            )}
          </>
        )}
      </div>

      {/* Global Task Creation Modal */}
      <NewTaskModal
        isOpen={isNewTaskModalOpen}
        onClose={() => setIsNewTaskModalOpen(false)}
        onSubmit={handleCreate}
      />

      {/* Email / Gmail Modal */}
      <EmailModal
        isOpen={emailModalState.isOpen}
        tasks={tasks}
        initialTaskId={emailModalState.taskId}
        initialDate={emailModalState.date}
        onClose={() =>
          setEmailModalState({ isOpen: false, taskId: null, date: null })
        }
        onSendEmailApi={async (payload) => {
          return await currentClient.sendEmail(payload);
        }}
      />

      {/* Delete Confirmation Modal */}
      {taskToDelete && (
        <ConfirmDialog
          title="Delete Task"
          message={`Are you sure you want to delete "${taskToDelete.title}"? This action cannot be undone.`}
          confirmLabel="Delete Task"
          onConfirm={handleConfirmDelete}
          onCancel={() => setTaskToDelete(null)}
        />
      )}

      {/* Footer */}
      <footer className="mt-auto py-6 border-t border-slate-200/80 bg-white/50 text-center text-xs text-slate-400">
        <p>
          Task Tracker • Elegant full-stack workflow with Calendar & Gmail sync
        </p>
      </footer>
    </div>
  );
}
