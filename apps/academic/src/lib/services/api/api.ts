import axios, {
  AxiosError,
  AxiosHeaders,
  type InternalAxiosRequestConfig,
} from "axios";
import { useAuthStore } from "@/stores/auth.store";
import { ApiErrorResponse } from "./api.types";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? "http://localhost:5000";

export function isApiError(
  error: unknown,
): error is AxiosError<ApiErrorResponse> {
  return axios.isAxiosError<ApiErrorResponse>(error);
}

const applyAuthHeader = (
  config: InternalAxiosRequestConfig,
  accessToken: string,
): void => {
  if (!config.headers) {
    config.headers = new AxiosHeaders();
  } else if (!(config.headers instanceof AxiosHeaders)) {
    config.headers = AxiosHeaders.from(config.headers);
  }

  config.headers.set("Authorization", `Bearer ${accessToken}`);
};

export const clientApi = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    Accept: "application/json",
  },
});

export const serverApi = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    Accept: "application/json",
  },
});

clientApi.interceptors.request.use((config) => {
  const accessToken = useAuthStore.getState().accessToken;

  if (accessToken) {
    applyAuthHeader(config, accessToken);
  }

  return config;
});

clientApi.interceptors.response.use(
  (response) => response,
  (error: unknown) => {
    if (isApiError(error)) {
      if (error.response?.status === 401) {
        useAuthStore.getState().clearSession();
      }
    }

    return Promise.reject(error);
  },
);
