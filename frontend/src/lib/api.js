import axios from "axios";

const BASE = process.env.REACT_APP_BACKEND_URL;
const API = `${BASE}/api`;

const client = axios.create({ baseURL: API });

client.interceptors.request.use((config) => {
  const token = localStorage.getItem("psy_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export const api = {
  // auth
  register: (data) => client.post("/auth/register", data).then((r) => r.data),
  login: (data) => client.post("/auth/login", data).then((r) => r.data),
  me: () => client.get("/auth/me").then((r) => r.data),

  // pillars / goals
  listPillars: () => client.get("/pillars").then((r) => r.data),
  suggestions: (pillar) =>
    client.get(`/pillars/${pillar}/suggestions`).then((r) => r.data),
  setSelectedPillars: (pillars) =>
    client.post("/onboarding/pillars", { pillars }).then((r) => r.data),
  createGoal: (data) => client.post("/goals", data).then((r) => r.data),
  listGoals: () => client.get("/goals").then((r) => r.data),
  tasksToday: () => client.get("/tasks/today").then((r) => r.data),
  toggleTask: (id) => client.patch(`/tasks/${id}`).then((r) => r.data),

  // journal
  journalFrames: () => client.get("/journal/frames").then((r) => r.data),
  createJournal: (data) => client.post("/journal", data).then((r) => r.data),
  listJournal: () => client.get("/journal").then((r) => r.data),

  // stats
  stats: () => client.get("/stats").then((r) => r.data),
};

export default api;
