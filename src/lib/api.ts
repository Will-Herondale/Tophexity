import axios from "axios";
import type { AuthTokens, LoginPayload, RegisterPayload } from "@/types/auth";
import type { Profile, ProfileCreatePayload, ProfileUpdatePayload, ProfileVersion } from "@/types/profile";
import type { CareerDetail, CareerListResponse, CareerSearchParams } from "@/types/career";
import type { Recommendation, RecommendationListResponse, RecommendationCreatePayload } from "@/types/recommendation";
import type { Roadmap, RoadmapListResponse, RoadmapCreatePayload } from "@/types/roadmap";
import type { BackupPlan, BackupPlanListResponse, BackupPlanCreatePayload } from "@/types/backup";
import type { PortfolioItem, PortfolioItemCreatePayload, PortfolioItemUpdatePayload, PortfolioListResponse } from "@/types/portfolio";
import type { ChatSession, ChatMessageCreatePayload, ChatSessionUpdatePayload, ChatStats, ChatExportResponse, ChatRebuildMemoryResponse } from "@/types/chat";

const API_PREFIX = "/v1";

const api = axios.create({
  baseURL: API_PREFIX,
  headers: { "Content-Type": "application/json" },
  timeout: 300000,
});

function getAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("access_token");
}

function getRefreshToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("refresh_token");
}

function setTokens(tokens: AuthTokens) {
  localStorage.setItem("access_token", tokens.access_token);
  localStorage.setItem("refresh_token", tokens.refresh_token);
  localStorage.setItem("user_id", tokens.user_id);
  localStorage.setItem("email", tokens.email);
  document.cookie = `access_token=${tokens.access_token}; path=/; max-age=1800; SameSite=Lax`;
}

function clearTokens() {
  localStorage.removeItem("access_token");
  localStorage.removeItem("refresh_token");
  localStorage.removeItem("user_id");
  localStorage.removeItem("email");
  document.cookie = "access_token=; path=/; max-age=0";
}

api.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value: unknown) => void;
  reject: (reason?: unknown) => void;
}> = [];

function processQueue(error: unknown) {
  failedQueue.forEach((prom) => {
    if (error) prom.reject(error);
    else prom.resolve(undefined);
  });
  failedQueue = [];
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const url: string = originalRequest?.url || "";
    const isAuthEndpoint = url.includes("/auth/login") || url.includes("/auth/register") || url.includes("/auth/refresh");
    if (error.response?.status === 401 && !originalRequest._retry && !isAuthEndpoint) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then(() => api(originalRequest));
      }
      originalRequest._retry = true;
      isRefreshing = true;
      const refreshToken = getRefreshToken();
      if (!refreshToken) {
        clearTokens();
        if (typeof window !== "undefined") window.location.href = "/login";
        isRefreshing = false;
        return Promise.reject(error);
      }
      try {
        const { data } = await axios.post(`${API_PREFIX}/auth/refresh`, {
          refresh_token: refreshToken,
        });
        setTokens(data);
        processQueue(null);
        return api(originalRequest);
      } catch (refreshError) {
        clearTokens();
        processQueue(refreshError);
        if (typeof window !== "undefined") window.location.href = "/login";
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }
    return Promise.reject(error);
  }
);

export async function register(payload: RegisterPayload) {
  const { data } = await api.post("/auth/register", payload);
  return data;
}

export async function login(payload: LoginPayload): Promise<AuthTokens> {
  const { data } = await api.post<AuthTokens>("/auth/login", payload);
  setTokens(data);
  return data;
}

export async function logout() {
  try {
    await api.post("/auth/logout");
  } catch {
    // Logout even if backend call fails
  } finally {
    clearTokens();
  }
}

export async function getMe() {
  const { data } = await api.get("/auth/me");
  return data;
}

export async function getProfile(): Promise<Profile> {
  const { data } = await api.get("/users/profile");
  return data;
}

export async function createProfile(payload: ProfileCreatePayload): Promise<Profile> {
  const { data } = await api.post("/users/profile", payload);
  return data;
}

export async function updateProfile(payload: ProfileUpdatePayload): Promise<Profile> {
  const { data } = await api.put("/users/profile", payload);
  return data;
}

export async function getProfileVersions(): Promise<ProfileVersion[]> {
  const { data } = await api.get("/users/profile/versions");
  return data;
}

export async function getCareers(params: CareerSearchParams = {}): Promise<CareerListResponse> {
  const { data } = await api.get("/careers", { params });
  return data;
}

export async function getCareerById(id: string): Promise<CareerDetail> {
  const { data } = await api.get(`/careers/${id}`);
  return data;
}

export async function importCareers(careers: Record<string, unknown>[]) {
  const { data } = await api.post("/careers/import", { careers });
  return data;
}

export async function createRecommendation(payload: RecommendationCreatePayload) {
  const { data } = await api.post("/recommendations", payload);
  return data;
}

export async function getRecommendationsHistory(page = 1, pageSize = 10): Promise<RecommendationListResponse> {
  const { data } = await api.get("/recommendations/history", { params: { page, page_size: pageSize } });
  return data;
}

export async function getRecommendationById(id: string): Promise<Recommendation> {
  const { data } = await api.get(`/recommendations/${id}`);
  return data;
}

export async function generateRecommendation(payload?: { include_profile?: boolean; max_results?: number }, timeout = 300000) {
  const { data } = await api.post("/intelligence/recommendations/generate", payload || {}, { timeout });
  return data;
}

export async function regenerateRecommendation(id: string, timeout = 300000) {
  const { data } = await api.post(`/intelligence/recommendations/${id}/regenerate`, {}, { timeout });
  return data;
}

export async function getRoadmapsHistory(page = 1, pageSize = 10): Promise<RoadmapListResponse> {
  const { data } = await api.get("/roadmaps/history", { params: { page, page_size: pageSize } });
  return data;
}

export async function getRoadmapById(id: string): Promise<Roadmap> {
  const { data } = await api.get(`/roadmaps/${id}`);
  return data;
}

export async function generateRoadmap(payload: { career_id: string; roadmap_type?: string; custom_duration_months?: number }, timeout = 300000) {
  const { data } = await api.post("/intelligence/roadmaps/generate", payload, { timeout });
  return data;
}

export async function updateRoadmap(id: string, payload: { status: string }): Promise<Roadmap> {
  const { data } = await api.patch(`/roadmaps/${id}`, payload);
  return data;
}

export async function getBackupPlansHistory(page = 1, pageSize = 10): Promise<BackupPlanListResponse> {
  const { data } = await api.get("/backups/history", { params: { page, page_size: pageSize } });
  return data;
}

export async function getBackupPlanById(id: string): Promise<BackupPlan> {
  const { data } = await api.get(`/backups/${id}`);
  return data;
}

export async function generateBackupPlan(payload: { career_id: string; max_scenarios?: number }, timeout = 300000) {
  const { data } = await api.post("/intelligence/backups/generate", payload, { timeout });
  return data;
}

export async function updateBackupPlan(id: string, payload: { status: string }): Promise<BackupPlan> {
  const { data } = await api.patch(`/backups/${id}`, payload);
  return data;
}

export async function getPortfolioItems(params: { page?: number; page_size?: number; item_type?: string } = {}): Promise<PortfolioListResponse> {
  const { data } = await api.get("/portfolio/items", { params });
  return data;
}

export async function getPortfolioItemById(id: string): Promise<PortfolioItem> {
  const { data } = await api.get(`/portfolio/items/${id}`);
  return data;
}

export async function createPortfolioItem(payload: PortfolioItemCreatePayload): Promise<PortfolioItem> {
  const { data } = await api.post("/portfolio/items", payload);
  return data;
}

export async function updatePortfolioItem(id: string, payload: PortfolioItemUpdatePayload): Promise<PortfolioItem> {
  const { data } = await api.put(`/portfolio/items/${id}`, payload);
  return data;
}

export async function deletePortfolioItem(id: string) {
  const { data } = await api.delete(`/portfolio/items/${id}`);
  return data;
}

export async function getChatSessions(page = 1, pageSize = 50) {
  const { data } = await api.get("/chat/sessions", { params: { page, page_size: pageSize } });
  return data;
}

export async function createChatSession(title?: string) {
  const { data } = await api.post("/chat/sessions", { title });
  return data;
}

export async function getChatSession(sessionId: string): Promise<ChatSession> {
  const { data } = await api.get(`/chat/sessions/${sessionId}`);
  return data;
}

export async function sendChatMessages(sessionId: string, messages: ChatMessageCreatePayload[]) {
  const { data } = await api.post(`/chat/sessions/${sessionId}/messages`, messages, { timeout: 120000 });
  // Backend wraps response in { value: [...], Count: N } instead of returning array directly
  return data.value || data;
}

export async function deleteChatSession(sessionId: string) {
  const { data } = await api.delete(`/chat/sessions/${sessionId}`);
  return data;
}

export async function testAi(message?: string) {
  const { data } = await api.post("/ai/test", { message });
  return data;
}

export async function updateCareer(id: string, payload: Partial<{ title: string; description: string; average_salary: number; growth_outlook: string; demand_level: string; required_education: Record<string, string>; typical_skills: Record<string, string> }>): Promise<CareerDetail> {
  const { data } = await api.put(`/careers/${id}`, payload);
  return data;
}

export async function deleteCareer(id: string) {
  const { data } = await api.delete(`/careers/${id}`);
  return data;
}

export async function updateChatSession(sessionId: string, payload: ChatSessionUpdatePayload): Promise<ChatSession> {
  const { data } = await api.patch(`/chat/sessions/${sessionId}`, payload);
  return data;
}

export async function getChatStats(): Promise<ChatStats> {
  const { data } = await api.get("/chat/stats");
  return data;
}

export async function exportChatSession(sessionId: string, format: "json" | "markdown" | "text" = "json"): Promise<ChatExportResponse> {
  const { data } = await api.get(`/chat/sessions/${sessionId}/export`, { params: { format } });
  return data;
}

export async function rebuildChatMemory(sessionId: string): Promise<ChatRebuildMemoryResponse> {
  const { data } = await api.post(`/chat/sessions/${sessionId}/rebuild-memory`);
  return data;
}

export default api;
