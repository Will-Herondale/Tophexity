import axios from "axios";
import type { AuthTokens, LoginPayload, RegisterPayload } from "@/types/auth";
import type { Profile, ProfileCreatePayload, ProfileUpdatePayload, ProfileVersion } from "@/types/profile";
import type { CareerDetail, CareerListResponse, CareerSearchParams } from "@/types/career";
import type { Recommendation, RecommendationListResponse, RecommendationCreatePayload } from "@/types/recommendation";
import type { Roadmap, RoadmapListResponse, RoadmapCreatePayload } from "@/types/roadmap";
import type { BackupPlan, BackupPlanListResponse, BackupPlanCreatePayload } from "@/types/backup";
import type { PortfolioItem, PortfolioItemCreatePayload, PortfolioItemUpdatePayload, PortfolioListResponse } from "@/types/portfolio";
import type { ChatSession, ChatMessageCreatePayload } from "@/types/chat";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "https://tophexity-func.azurewebsites.net";
const API_PREFIX = "/v1";

const api = axios.create({
  baseURL: `${API_BASE}${API_PREFIX}`,
  headers: { "Content-Type": "application/json" },
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
    if (error.response?.status === 401 && !originalRequest._retry) {
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
        const { data } = await axios.post(`${API_BASE}${API_PREFIX}/auth/refresh`, {
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

export async function createRoadmap(payload: RoadmapCreatePayload) {
  const { data } = await api.post("/roadmaps", payload);
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

export async function createBackupPlan(payload: BackupPlanCreatePayload) {
  const { data } = await api.post("/backups", payload);
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
  const { data } = await api.post(`/chat/sessions/${sessionId}/messages`, messages);
  return data;
}

export async function deleteChatSession(sessionId: string) {
  const { data } = await api.delete(`/chat/sessions/${sessionId}`);
  return data;
}

export async function testAi(message?: string) {
  const { data } = await api.post("/ai/test", { message });
  return data;
}

export default api;
