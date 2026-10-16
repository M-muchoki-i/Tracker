// Wrapper around fetch() for talking to the backend REST API,
// with graceful fallback support for local storage demo mode
// when the backend server is not running.

const BASE = "/api";

async function request(path, options = {}) {
  let res;
  try {
    res = await fetch(BASE + path, {
      headers: { "Content-Type": "application/json" },
      ...options,
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
  listTasks: async () => {
    await new Promise((r) => setTimeout(r, 150)); // simulate quick local delay
    return getStoredTasks();
  },
  createTask: async (task) => {
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
    await new Promise((r) => setTimeout(r, 100));
    const tasks = getStoredTasks();
    saveStoredTasks(tasks.filter((t) => t.id !== id));
    return null;
  },
  sendEmail: async ({ to, subject, taskId, taskIds, sendAllScheduled }) => {
    await new Promise((r) => setTimeout(r, 200));
    const tasks = getStoredTasks();
    let selected = [];
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

