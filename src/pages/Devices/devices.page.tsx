import { FC, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Smartphone, Monitor, Loader2, Trash2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import toast from "react-hot-toast";

import { useDevices, useRevokeDevice, type Device } from "@/api/hooks/devices.hook";
import { Page } from "@/components/Page";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const DESKTOP_PLATFORMS = ["web", "desktop", "macos", "windows", "linux"];

const platformIcon = (platform: string | null) => {
  return DESKTOP_PLATFORMS.includes((platform ?? "").toLowerCase())
    ? Monitor
    : Smartphone;
};

/** Best display name for a session; falls back to platform, then "Unknown device". */
const deviceTitle = (device: Device): string => {
  const name = device.deviceName?.trim();
  if (name) return name;
  const platform = device.platform?.trim();
  if (platform) return platform.charAt(0).toUpperCase() + platform.slice(1);
  return "Unknown device";
};

/** Joins the non-null "platform • v2.3.1 • 91.90.216.179" line, skipping blanks. */
const deviceSubtitle = (device: Device): string => {
  const parts: string[] = [];
  if (device.platform) parts.push(device.platform);
  if (device.appVersion) parts.push(`v${device.appVersion}`);
  if (device.ip) parts.push(device.ip);
  return parts.join(" • ");
};

const lastActiveLabel = (unixSeconds: number): string => {
  const date = new Date(unixSeconds * 1000);
  if (Number.isNaN(date.getTime())) return "";
  return formatDistanceToNow(date, { addSuffix: true });
};

export const DevicesPage: FC = () => {
  const navigate = useNavigate();
  const { devices, isLoading, isError } = useDevices();
  const revoke = useRevokeDevice();
  const [target, setTarget] = useState<Device | null>(null);

  const handleRevoke = () => {
    if (!target) return;
    revoke.mutate(target.id, {
      onSuccess: () => {
        toast.success("Device logged out");
        setTarget(null);
      },
      onError: () => toast.error("Couldn't log out this device"),
    });
  };

  return (
    <Page>
      <div className="max-w-lg mx-auto px-4 pt-2 pb-28">
        {/* Header */}
        <div className="flex items-center gap-2 mb-1">
          <button
            onClick={() => navigate(-1)}
            className="p-2 -ml-2 rounded-full hover:bg-gray-100 transition-colors"
            aria-label="Go back"
          >
            <ArrowLeft size={20} className="text-gray-700" />
          </button>
          <h1 className="text-xl font-semibold text-gray-900">Devices</h1>
        </div>
        <p className="text-sm text-gray-500 mb-4 px-1">
          These devices are currently signed in to your account.
        </p>

        {/* Loading */}
        {isLoading && (
          <div className="flex justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
          </div>
        )}

        {/* Error */}
        {!isLoading && isError && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-50">
              <Smartphone size={28} className="text-red-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">
              Couldn't load your devices
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              Check your connection and try again
            </p>
          </div>
        )}

        {/* Empty */}
        {!isLoading && !isError && devices.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
              <Smartphone size={28} className="text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">
              No active sessions
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              You're not signed in on any other devices
            </p>
          </div>
        )}

        {/* List */}
        {!isLoading && !isError && devices.length > 0 && (
          <div className="divide-y divide-gray-100 overflow-hidden rounded-2xl bg-white shadow-sm">
            {devices.map((device) => {
              const Icon = platformIcon(device.platform);
              const subtitle = deviceSubtitle(device);
              const active = lastActiveLabel(device.lastActiveAt);
              return (
                <div key={device.id} className="flex items-center gap-3 p-4">
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-[var(--color-primary)]/10">
                    <Icon size={18} className="text-[var(--color-primary)]" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-gray-900">
                      {deviceTitle(device)}
                    </p>
                    {subtitle && (
                      <p className="truncate text-xs text-gray-500">{subtitle}</p>
                    )}
                    {active && (
                      <p className="mt-0.5 text-xs text-gray-400">
                        Active {active}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => setTarget(device)}
                    className="flex-shrink-0 rounded-full p-2 text-red-500 transition-colors hover:bg-red-50"
                    aria-label={`Log out ${deviceTitle(device)}`}
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <AlertDialog open={!!target} onOpenChange={(open) => !open && setTarget(null)}>
        <AlertDialogContent className="max-w-sm rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Log out this device?</AlertDialogTitle>
            <AlertDialogDescription>
              {target ? `"${deviceTitle(target)}" ` : "This device "}
              will be signed out and will need to log in again.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="rounded-xl bg-red-500 text-white hover:bg-red-600"
              // Keep the dialog open until the request resolves so the pending
              // state shows; handleRevoke closes it on success.
              onClick={(e) => {
                e.preventDefault();
                handleRevoke();
              }}
              disabled={revoke.isPending}
            >
              {revoke.isPending ? "Logging out..." : "Log out"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Page>
  );
};
