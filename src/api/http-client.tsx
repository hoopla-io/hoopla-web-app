import axios from "axios";
import type { AxiosError, AxiosInstance, AxiosResponse } from "axios";

export const extractorResponseInterceptor = (response: AxiosResponse) => {
  return Object.assign(response, response.data);
};

export const applyExtractorResponseInterceptor = (
  axiosInstance: AxiosInstance
) => {
  axiosInstance.interceptors.response.use(
    (response: AxiosResponse) => {
      return extractorResponseInterceptor(response);
    },
    async (error: AxiosError) => {
      if (error.response?.status === 412) {
        const refreshToken = localStorage.getItem("refresh_token");

        if (refreshToken) {
          try {
            const { data } = await axiosInstance.patch(
              `/user/refresh-token?refreshToken=${refreshToken}`
            );
            localStorage.setItem("access_token", data.accessToken);
            localStorage.setItem("refresh_token", data.refreshToken);
            if (error.config) {
              error.config.headers.Authorization = `Bearer ${data.accessToken}`;
              return axios(error.config);
            } else {
              throw new Error("Error config is undefined");
            }
          } catch (refreshError) {
            localStorage.removeItem("access_token");
            localStorage.removeItem("refresh_token");
            return Promise.reject(refreshError);
          }
        } else {
          console.log("no refresh token", window.location.pathname);
          window.location.href = `/login?redirect=${window.location.pathname}`;
          return Promise.reject(error);
        }
      }

      if (error.response?.status === 401) {
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
        window.location.href = `/login?redirect=${window.location.pathname}`;
      }

      return Promise.reject(
        error.response ? extractorResponseInterceptor(error.response) : error
      );
    }
  );

  return axiosInstance;
};

export const applyAuthorizationInterceptor = (axiosInstance: AxiosInstance) => {
  axiosInstance.interceptors.request.use(
    (config) => {
      const token = localStorage.getItem("access_token");
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    (error) => Promise.reject(error)
  );

  return axiosInstance;
};

export const httpClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
  timeout: 10000,
});

applyExtractorResponseInterceptor(httpClient);
applyAuthorizationInterceptor(httpClient);
