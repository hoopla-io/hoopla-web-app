import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

import { on } from "@telegram-apps/sdk";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatBalance(amount: number): string {
  return amount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
}

interface WorkingHours {
  weekDay: string;
  openAt: string;
  closeAt: string;
}

export function useFormatHours() {
  const formatWorkingHours = (hours: WorkingHours[]) => {
    const today = new Date()
      .toLocaleString("en-US", { weekday: "long" })
      .toLowerCase();
    const todayHours = hours.find((h) => h.weekDay === today);
    return todayHours
      ? `${todayHours.openAt} - ${todayHours.closeAt}`
      : "Closed";
  };

  return { formatWorkingHours };
}

import { useEffect, useState } from "react";

export function useKeyboardOpen() {
  const [keyboardOpen, setKeyboardOpen] = useState(false);

  useEffect(() => {
    const removeListener = on("viewport_changed", (payload) => {
      console.log("Viewport changed:", payload);
      setKeyboardOpen(payload.is_state_stable);
    });

    return () => {
      removeListener();
    };
  }, []);

  return keyboardOpen;
}
