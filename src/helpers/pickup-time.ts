import { getLanguage } from "@/helpers/language";
import type { WorkingHour } from "@/helpers/utils";

const SHOP_TIME_ZONE = "Asia/Tashkent";
const MIN_LEAD_MINUTES = 15;
const SLOT_LEAD_MINUTES = 20;
const SLOT_STEP_MINUTES = 15;
const MAX_AHEAD_HOURS = 24;
const MINUTE = 60_000;

export interface PickupSlot {
  value: string;
  time: string;
  dayOffset: number;
}

interface ShopClock {
  dayNumber: number;
  weekDay: string;
  minutes: number;
}

const clockFormatter = new Intl.DateTimeFormat("en-US", {
  timeZone: SHOP_TIME_ZONE,
  year: "numeric",
  month: "numeric",
  day: "numeric",
  weekday: "long",
  hour: "numeric",
  minute: "numeric",
  hourCycle: "h23",
});

function shopClock(date: Date): ShopClock {
  const parts: Record<string, string> = {};
  for (const part of clockFormatter.formatToParts(date)) {
    parts[part.type] = part.value;
  }

  return {
    dayNumber: Math.floor(
      Date.UTC(Number(parts.year), Number(parts.month) - 1, Number(parts.day)) / 86_400_000
    ),
    weekDay: parts.weekday.toLowerCase(),
    minutes: (Number(parts.hour) % 24) * 60 + Number(parts.minute),
  };
}

function toMinutes(time: string): number {
  const [h, m] = (time ?? "").split(":").map(Number);
  if (Number.isNaN(h) || Number.isNaN(m)) return NaN;
  return h * 60 + m;
}

const WEEK_DAYS = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];

function previousWeekDay(weekDay: string): string {
  const index = WEEK_DAYS.indexOf(weekDay);
  return WEEK_DAYS[(index + 6) % 7];
}

function isOpenAt(clock: ShopClock, workingHours: WorkingHour[]): boolean {
  const today = workingHours.find((h) => h.weekDay.toLowerCase() === clock.weekDay);
  if (today) {
    const open = toMinutes(today.openAt);
    const close = toMinutes(today.closeAt);
    if (!Number.isNaN(open) && !Number.isNaN(close)) {
      if (close > open && clock.minutes >= open && clock.minutes < close) return true;
      if (close <= open && clock.minutes >= open) return true;
    }
  }

  const yesterday = workingHours.find(
    (h) => h.weekDay.toLowerCase() === previousWeekDay(clock.weekDay)
  );
  if (yesterday) {
    const open = toMinutes(yesterday.openAt);
    const close = toMinutes(yesterday.closeAt);
    if (!Number.isNaN(open) && !Number.isNaN(close) && close <= open) {
      return clock.minutes < close;
    }
  }

  return false;
}

export function pickupSlots(
  workingHours?: WorkingHour[] | null,
  now: number = Date.now()
): PickupSlot[] {
  const step = SLOT_STEP_MINUTES * MINUTE;
  const first = Math.ceil((now + SLOT_LEAD_MINUTES * MINUTE) / step) * step;
  const last = now + MAX_AHEAD_HOURS * 60 * MINUTE;
  const today = shopClock(new Date(now)).dayNumber;
  const hours = workingHours ?? [];

  const slots: PickupSlot[] = [];
  for (let at = first; at <= last; at += step) {
    const date = new Date(at);
    const clock = shopClock(date);
    if (hours.length > 0 && !isOpenAt(clock, hours)) continue;

    slots.push({
      value: date.toISOString(),
      time: formatPickupClock(date.toISOString()),
      dayOffset: clock.dayNumber - today,
    });
  }

  return slots;
}

export function isPickupTimeStillValid(value: string, now: number = Date.now()): boolean {
  const at = new Date(value).getTime();
  return !Number.isNaN(at) && at >= now + MIN_LEAD_MINUTES * MINUTE;
}

export function formatPickupClock(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  return new Intl.DateTimeFormat("en-GB", {
    timeZone: SHOP_TIME_ZONE,
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(date);
}

export function pickupDayOffset(value: string, now: number = Date.now()): number {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 0;
  return shopClock(date).dayNumber - shopClock(new Date(now)).dayNumber;
}

export function formatPickupDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  const locale = { en: "en-US", ru: "ru-RU", uz: "uz-UZ" }[getLanguage()];
  return new Intl.DateTimeFormat(locale, {
    timeZone: SHOP_TIME_ZONE,
    day: "numeric",
    month: "long",
  }).format(date);
}
