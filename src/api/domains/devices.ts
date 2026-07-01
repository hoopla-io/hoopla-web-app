import { httpClient } from "@/api/http-client";

/**
 * An active user session as returned by GET /user/devices (most-recently-active
 * first). `id` is the session id passed to DELETE /user/devices/{id} to revoke.
 * Everything except the ids is nullable — only set if captured at login.
 */
export interface Device {
  id: number;
  deviceName: string | null;
  platform: string | null;
  appVersion: string | null;
  ip: string | null;
  /** Unix seconds, bumped on each session refresh. */
  lastActiveAt: number;
  /** Unix seconds — the login time. */
  createdAt: number;
}

export const DevicesApi = {
  getList: async () => {
    const response: any = await httpClient.get("/user/devices");
    return (response.data ?? []) as Device[];
  },

  revoke: async (id: number) => {
    const response: any = await httpClient.delete(`/user/devices/${id}`);
    return response.data;
  },
};
