import toast from "react-hot-toast";

// Runtime "test mode" — enabled by a hidden gesture (tap the logo 5×, see
// useSecretActivator + Header). When on:
//   • every API request carries `X-Hoopla-Test: true` (reveals test partners/
//     shops/orders) — see http-client.tsx.
//   • vConsole (on-device debug console) is loaded.
//
// The state lives in localStorage so it survives reloads. The build-time
// VITE_HOOPLA_TEST_MODE env still works as an override for local/CI builds.

const KEY = "hoopla_test_mode";

function runtimeOn(): boolean {
  try {
    return localStorage.getItem(KEY) === "1";
  } catch {
    return false;
  }
}

/** True when test mode is on — via the runtime toggle OR the env override. */
export function isTestModeEnabled(): boolean {
  return runtimeOn() || import.meta.env.VITE_HOOPLA_TEST_MODE === "true";
}

let vconsole: unknown = null;
async function loadVConsole(): Promise<void> {
  if (vconsole) return;
  // Dynamic import so vConsole is code-split out of the main bundle — normal
  // users never download it.
  const { default: VConsole } = await import("vconsole");
  vconsole = new VConsole();
}

/** Restore vConsole on boot if test mode was left on. Call once at startup. */
export function initTestMode(): void {
  if (runtimeOn()) void loadVConsole();
}

/** Hidden activator: flip test mode on/off. */
export async function toggleTestMode(): Promise<void> {
  if (runtimeOn()) {
    try {
      localStorage.removeItem(KEY);
    } catch {
      /* storage unavailable */
    }
    toast("Test mode off — reloading");
    // vConsole can't be cleanly torn down, so reload to remove it.
    setTimeout(() => window.location.reload(), 400);
    return;
  }
  try {
    localStorage.setItem(KEY, "1");
  } catch {
    /* storage unavailable */
  }
  await loadVConsole();
  toast.success("Test mode on");
}
