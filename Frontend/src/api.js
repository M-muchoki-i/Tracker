// Wrapper around fetch() for talking to the backend REST API,
// with graceful fallback support for local storage demo mode
// when the backend server is not running.

const BASE = "/api";
const TOKEN_KEY = "task_tracker_auth_token";
const USER_KEY = "task_tracker_auth_user";

export function getStoredToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setStoredAuth(user, token) {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  if (user) localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearStoredAuth() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

export function getStoredUser() {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

async function request(path, options = {}) {
  let res;
  const token = getStoredToken();
  const headers = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };

  try {
    res = await fetch(BASE + path, {
      ...options,
      headers,
    });
  } catch {
    // Network failure (server down, CORS, or connection refused)
    const err = new Error(
      "Could not reach the server. Is the backend running on port 3000?",
    );
    err.isNetworkError = true;
    throw err;
  }

  if (res.status === 204) return null; // DELETE responses have no body

  let data;
  try {
    data = await res.json();
  } catch {
    throw new Error(
      `Invalid JSON response from server (Status: ${res.status})`,
    );
  }

  if (!res.ok) {
    throw new Error(data.error || `Request failed with status ${res.status}`);
  }
  return data;
}

export const api = {
  health: () => request("/health"),

  // Auth API
  signup: async (credentials) => {
    const data = await request("/auth/signup", {
      method: "POST",
      body: JSON.stringify(credentials),
    });
    if (data.token && data.user) {
      setStoredAuth(data.user, data.token);
    }
    return data;
  },
  login: async (credentials) => {
    const data = await request("/auth/login", {
      method: "POST",
      body: JSON.stringify(credentials),
    });
    if (data.token && data.user) {
      setStoredAuth(data.user, data.token);
    }
    return data;
  },
  getMe: () => request("/auth/me"),
  logout: () => {
    clearStoredAuth();
  },

  // Tasks API
  listTasks: async () => {
    const data = await request("/tasks");
    if (Array.isArray(data)) return data;
    if (data && Array.isArray(data.tasks)) return data.tasks;
    if (data && Array.isArray(data.data)) return data.data;
    return [];
  },
  createTask: (task) =>
    request("/tasks", { method: "POST", body: JSON.stringify(task) }),
  updateTask: (id, changes) =>
    request(`/tasks/${id}`, { method: "PATCH", body: JSON.stringify(changes) }),
  deleteTask: (id) => request(`/tasks/${id}`, { method: "DELETE" }),
  sendEmail: (payload) =>
    request("/tasks/send-email", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  sendTaskEmail: (id, payload) =>
    request(`/tasks/${id}/send-email`, {
      method: "POST",
      body: JSON.stringify(payload),
    }),
};

export function buildGmailComposeUrl({ to = "", subject = "", body = "" }) {
  const params = new URLSearchParams({
    view: "cm",
    fs: "1",
    to: to.trim(),
    su: subject.trim(),
    body: body.trim(),
  });
  return `https://mail.google.com/mail/?${params.toString()}`;
}

const STORAGE_KEY = "task_tracker_local_tasks_v3";

const SAMPLE_TASKS = [
  {
    id: "sample-1",
    title: "Executive strategy review meeting 📊",
    description: "Discuss Q4 roadmap, backend scalability, and milestone deliverables.",
    completed: false,
    scheduledDate: new Date().toISOString().slice(0, 16),
    createdAt: new Date(Date.now() - 3600000 * 5).toISOString(),
  },
  {
    id: "sample-2",
    title: "Design classy dashboard & calendar widget ✨",
    description: "Incorporate smooth transitions, sleek metric badges, and responsive agenda.",
    completed: true,
    scheduledDate: new Date(Date.now() - 86400000).toISOString().slice(0, 10),
    createdAt: new Date(Date.now() - 3600000 * 24).toISOString(),
  },
  {
    id: "sample-3",
    title: "Send task agenda to Gmail ✉️",
    description: "Verify Nodemailer backend dispatch and 1-click web Gmail compose fallback.",
    completed: false,
    scheduledDate: new Date(Date.now() + 86400000).toISOString().slice(0, 10),
    createdAt: new Date().toISOString(),
  },
];

function getStoredTasks() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(SAMPLE_TASKS));
      return SAMPLE_TASKS;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : SAMPLE_TASKS;
  } catch {
    return SAMPLE_TASKS;
  }
}

function saveStoredTasks(tasks) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  } catch {
    // Ignore storage quota errors
  }
}

export const localApi = {
  // Auth fallback
  signup: async ({ name, email }) => {
    await new Promise((r) => setTimeout(r, 150));
    const user = { id: 999, name, email, createdAt: new Date().toISOString() };
    const token = "demo-local-token-" + Date.now();
    setStoredAuth(user, token);
    return { user, token };
  },
  login: async ({ email }) => {
    await new Promise((r) => setTimeout(r, 150));
    const user = { id: 999, name: email.split("@")[0], email, createdAt: new Date().toISOString() };
    const token = "demo-local-token-" + Date.now();
    setStoredAuth(user, token);
    return { user, token };
  },
  getMe: async () => {
    const user = getStoredUser();
    if (!user) throw new Error("Not logged in");
    return { user };
  },
  logout: () => {
    clearStoredAuth();
  },

  listTasks: async () => {
    const user = getStoredUser();
    if (!user) throw new Error("Authentication required. Please sign in or log in to view tasks.");
    await new Promise((r) => setTimeout(r, 150));
    return getStoredTasks();
  },
  createTask: async (task) => {
    const user = getStoredUser();
    if (!user) throw new Error("Authentication required. Please sign in or log in before creating a task.");
    await new Promise((r) => setTimeout(r, 100));
    const tasks = getStoredTasks();
    const newTask = {
      id: "task-" + Date.now(),
      title: task.title,
      description: task.description || "",
      completed: false,
      scheduledDate: task.scheduledDate || null,
      createdAt: new Date().toISOString(),
    };
    saveStoredTasks([newTask, ...tasks]);
    return newTask;
  },
  updateTask: async (id, changes) => {
    const user = getStoredUser();
    if (!user) throw new Error("Authentication required. Please sign in or log in.");
    await new Promise((r) => setTimeout(r, 100));
    const tasks = getStoredTasks();
    let updatedTask = null;
    const nextTasks = tasks.map((t) => {
      if (t.id === id) {
        updatedTask = { ...t, ...changes, updatedAt: new Date().toISOString() };
        return updatedTask;
      }
      return t;
    });
    if (!updatedTask) throw new Error("Task not found.");
    saveStoredTasks(nextTasks);
    return updatedTask;
  },
  deleteTask: async (id) => {
    const user = getStoredUser();
    if (!user) throw new Error("Authentication required. Please sign in or log in.");
    await new Promise((r) => setTimeout(r, 100));
    const tasks = getStoredTasks();
    saveStoredTasks(tasks.filter((t) => t.id !== id));
    return null;
  },
  sendEmail: async ({ to, subject, taskId, taskIds, sendAllScheduled }) => {
    const user = getStoredUser();
    if (!user) throw new Error("Authentication required. Please sign in or log in before sending emails.");
    await new Promise((r) => setTimeout(r, 200));
    const tasks = getStoredTasks();
    let selected;
    if (taskId) {
      selected = tasks.filter((t) => t.id === taskId);
    } else if (Array.isArray(taskIds) && taskIds.length > 0) {
      selected = tasks.filter((t) => taskIds.includes(t.id));
    } else if (sendAllScheduled) {
      selected = tasks.filter((t) => Boolean(t.scheduledDate));
    } else {
      selected = tasks;
    }

    const emailSubject =
      subject || (selected.length === 1 ? `Task: ${selected[0].title}` : `Task Agenda (${selected.length} tasks)`);

    const bodyText = selected
      .map(
        (t, idx) =>
          `${idx + 1}. [${t.completed ? "DONE" : "PENDING"}] ${t.title}\n   Scheduled: ${
            t.scheduledDate || "None"
          }\n   ${t.description ? `Notes: ${t.description}` : ""}`,
      )
      .join("\n\n");

    const gmailUrl = buildGmailComposeUrl({
      to,
      subject: emailSubject,
      body: bodyText,
    });

    return {
      success: true,
      sent: false,
      simulated: true,
      message: "Ready to send via Gmail!",
      gmailUrl,
      taskCount: selected.length,
    };
  },
  sendTaskEmail: async (id, payload) => {
    return localApi.sendEmail({ ...payload, taskId: id });
  },
};
