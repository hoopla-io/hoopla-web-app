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
    (error: AxiosError) => {
      return Promise.reject(
        error.response ? extractorResponseInterceptor(error.response) : error
      );
    }
  );

  return axiosInstance;
};

export const httpClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
  timeout: 10000,
});

applyExtractorResponseInterceptor(httpClient);
