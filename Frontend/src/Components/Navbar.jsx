import {
  CheckSquare,
  Home,
  ListTodo,
  Calendar as CalendarIcon,
  Plus,
  Mail,
  Wifi,
  WifiOff,
  RefreshCw,
  LogIn,
  LogOut,
  Lock,
} from "lucide-react";

export default function Navbar({
  currentPage,
  onNavigate,
  tasks = [],
  user = null,
  isOfflineMode,
  onRetryBackend,
  onOpenNewTaskModal,
  onOpenEmailModal,
  onOpenAuthModal,
  onLogout,
}) {
  const pendingCount = tasks.filter((t) => !t.completed).length;
  const scheduledCount = tasks.filter((t) => Boolean(t.scheduledDate)).length;

  return (
    <header className="sticky top-0 z-40 w-full bg-white/85 backdrop-blur-md border-b border-slate-200/80 transition-all">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20 gap-3">
          {/* Brand Logo & Title */}
          <div
            onClick={() => onNavigate("home")}
            className="flex items-center gap-2.5 sm:gap-3 cursor-pointer group select-none flex-shrink-0"
          >
            <div className="flex items-center justify-center w-9 h-9 sm:w-11 sm:h-11 rounded-2xl bg-gradient-to-tr from-slate-900 via-indigo-950 to-indigo-600 text-white shadow-md shadow-indigo-950/20 group-hover:scale-105 transition-transform">
              <CheckSquare className="w-5 h-5 sm:w-6 sm:h-6 stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-base sm:text-xl font-extrabold tracking-tight text-slate-900">
                  Task Tracker
                </span>
                <span className="hidden sm:inline-block px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-indigo-50 text-indigo-700 border border-indigo-200/60 rounded-full">
                  Pro
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium hidden md:block">
                Modern Agenda & Calendar Suite
              </p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="flex items-center gap-1 bg-slate-100/80 p-1 rounded-2xl border border-slate-200/60">
            <button
              type="button"
              onClick={() => onNavigate("home")}
              className={`inline-flex items-center gap-1.5 px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                currentPage === "home"
                  ? "bg-white text-slate-900 shadow-xs shadow-slate-900/5 ring-1 ring-slate-200/80"
                  : "text-slate-600 hover:text-slate-900 hover:bg-white/50"
              }`}
            >
              <Home className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-indigo-600" />
              <span>Home</span>
            </button>

            <button
              type="button"
              onClick={() => onNavigate("tasks")}
              title={user ? "Manage tasks" : "Sign in required to view and manage tasks"}
              className={`inline-flex items-center gap-1.5 px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                currentPage === "tasks"
                  ? "bg-white text-slate-900 shadow-xs shadow-slate-900/5 ring-1 ring-slate-200/80"
                  : "text-slate-600 hover:text-slate-900 hover:bg-white/50"
              }`}
            >
              <ListTodo className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-indigo-600" />
              <span>Tasks</span>
              {user && pendingCount > 0 && (
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                    currentPage === "tasks"
                      ? "bg-indigo-600 text-white"
                      : "bg-slate-200 text-slate-700"
                  }`}
                >
                  {pendingCount}
                </span>
              )}
              {!user && (
                <Lock className="w-3 h-3 text-slate-400" />
              )}
            </button>

            <button
              type="button"
              onClick={() => onNavigate("calendar")}
              title={user ? "View Calendar" : "Sign in required to view calendar"}
              className={`inline-flex items-center gap-1.5 px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                currentPage === "calendar"
                  ? "bg-white text-slate-900 shadow-xs shadow-slate-900/5 ring-1 ring-slate-200/80"
                  : "text-slate-600 hover:text-slate-900 hover:bg-white/50"
              }`}
            >
              <CalendarIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-purple-600" />
              <span>Calendar</span>
              {user && scheduledCount > 0 && (
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                    currentPage === "calendar"
                      ? "bg-purple-600 text-white"
                      : "bg-slate-200 text-slate-700"
                  }`}
                >
                  {scheduledCount}
                </span>
              )}
              {!user && (
                <Lock className="w-3 h-3 text-slate-400" />
              )}
            </button>
          </nav>

          {/* Action Buttons & Auth */}
          <div className="flex items-center gap-2 sm:gap-2.5 flex-shrink-0">
            {/* Quick Gmail Button */}
            <button
              type="button"
              onClick={onOpenEmailModal}
              className="hidden xl:inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200/80 rounded-xl transition-all cursor-pointer shadow-2xs"
              title={user ? "Send task agenda to Gmail" : "Sign in required to send tasks to Gmail"}
            >
              <Mail className="w-3.5 h-3.5" />
              <span>Gmail</span>
              {!user && <Lock className="w-2.5 h-2.5 text-rose-400" />}
            </button>

            {/* Quick Add Task Button */}
            <button
              type="button"
              onClick={onOpenNewTaskModal}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 sm:py-2 text-xs sm:text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 rounded-xl transition-all cursor-pointer shadow-xs shadow-indigo-600/25"
              title={user ? "Create a new task" : "Sign in required to create a task"}
            >
              <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[2.5]" />
              <span className="hidden sm:inline">New Task</span>
              {!user && <Lock className="w-3 h-3 text-indigo-200" />}
            </button>

            {/* User Auth Profile or Sign In Button */}
            {user ? (
              <div className="flex items-center gap-1.5 pl-1.5 border-l border-slate-200">
                <div
                  className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-slate-100/90 border border-slate-200/70"
                  title={`Signed in as ${user.email}`}
                >
                  <div className="w-6 h-6 rounded-lg bg-gradient-to-tr from-indigo-700 to-indigo-500 text-white flex items-center justify-center text-xs font-bold uppercase shadow-2xs">
                    {user.name ? user.name[0] : user.email[0]}
                  </div>
                  <span className="text-xs font-bold text-slate-800 max-w-[85px] sm:max-w-[120px] truncate hidden md:inline">
                    {user.name ? user.name.split(" ")[0] : user.email.split("@")[0]}
                  </span>
                  <button
                    type="button"
                    onClick={onLogout}
                    className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                    title="Sign Out"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => onOpenAuthModal("signin")}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 sm:py-2 text-xs sm:text-sm font-bold text-indigo-600 bg-indigo-50/80 hover:bg-indigo-100 hover:text-indigo-700 border border-indigo-200/80 rounded-xl transition-all shadow-2xs hover:shadow-xs cursor-pointer"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Sign In</span>
              </button>
            )}

            {/* Connection Status Badge */}
            <div className="hidden lg:flex items-center">
              {isOfflineMode ? (
                <div
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-[11px] font-semibold bg-amber-50 text-amber-900 border border-amber-200"
                  title="Local Storage fallback mode"
                >
                  <WifiOff className="w-3 h-3 text-amber-600" />
                  <span>Demo</span>
                  <button
                    onClick={onRetryBackend}
                    className="p-0.5 hover:bg-amber-100 rounded cursor-pointer"
                    title="Retry connecting to port 3000"
                  >
                    <RefreshCw className="w-2.5 h-2.5" />
                  </button>
                </div>
              ) : (
                <div
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-[11px] font-semibold bg-emerald-50 text-emerald-900 border border-emerald-200"
                  title="Backend API Connected"
                >
                  <Wifi className="w-3 h-3 text-emerald-600" />
                  <span>Online</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
