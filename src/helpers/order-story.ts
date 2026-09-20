import i18n from "@/i18n";
import type { OrderDetail } from "@/api/domains/orders";
import cupUrl from "@/assets/images/story-cup.webp";

const W = 1080;
const H = 1920;
const MARGIN = 96;
const CAPTION_BOTTOM = 1608;
const DRINK_LINE_H = 106;
const CUP_TOP = 410;
const CUP_W = 700;
const CUP_H = 949;
const BRAND_HUE = { h: 336, s: 72 };
const SANS = 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif';

function loadImage(url?: string | null, remote = true): Promise<HTMLImageElement | null> {
  if (!url) return Promise.resolve(null);
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = remote ? `${url}${url.includes("?") ? "&" : "?"}story=1` : url;
  });
}

function drawCover(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  x: number,
  y: number,
  w: number,
  h: number
) {
  const scale = Math.max(w / img.naturalWidth, h / img.naturalHeight);
  const sw = w / scale;
  const sh = h / scale;
  ctx.drawImage(
    img,
    (img.naturalWidth - sw) / 2,
    (img.naturalHeight - sh) / 2,
    sw,
    sh,
    x,
    y,
    w,
    h
  );
}

function ellipsize(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string {
  if (ctx.measureText(text).width <= maxWidth) return text;
  let cut = text;
  while (cut.length > 1 && ctx.measureText(`${cut}…`).width > maxWidth) {
    cut = cut.slice(0, -1);
  }
  return `${cut.trimEnd()}…`;
}

function wrapLines(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  maxLines: number
): string[] {
  const words = text.trim().split(/\s+/);
  const lines: string[] = [];
  let line = "";
  for (let i = 0; i < words.length; i++) {
    const next = line ? `${line} ${words[i]}` : words[i];
    if (!line || ctx.measureText(next).width <= maxWidth) {
      line = next;
      continue;
    }
    if (lines.length === maxLines - 1) {
      line = `${line} ${words.slice(i).join(" ")}`;
      break;
    }
    lines.push(line);
    line = words[i];
  }
  lines.push(ellipsize(ctx, line, maxWidth));
  return lines;
}

interface Hue {
  h: number;
  s: number;
}

function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return [0, 0, l];
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  const h = max === r ? (g - b) / d + (g < b ? 6 : 0) : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return [h * 60, s, l];
}

function logoHue(logo: HTMLImageElement | null): Hue {
  if (!logo) return BRAND_HUE;
  try {
    const sample = document.createElement("canvas");
    sample.width = sample.height = 32;
    const sctx = sample.getContext("2d");
    if (!sctx) return BRAND_HUE;
    sctx.drawImage(logo, 0, 0, 32, 32);
    const px = sctx.getImageData(0, 0, 32, 32).data;
    let x = 0;
    let y = 0;
    let weight = 0;
    let saturation = 0;
    for (let i = 0; i < px.length; i += 4) {
      if (px[i + 3] < 128) continue;
      const [h, s, l] = rgbToHsl(px[i], px[i + 1], px[i + 2]);
      if (s < 0.25 || l < 0.12 || l > 0.9) continue;
      const k = s * (1 - Math.abs(2 * l - 1));
      x += Math.cos((h * Math.PI) / 180) * k;
      y += Math.sin((h * Math.PI) / 180) * k;
      weight += k;
      saturation += s * k;
    }
    if (weight < 12) return BRAND_HUE;
    return {
      h: Math.round(((Math.atan2(y, x) * 180) / Math.PI + 360) % 360),
      s: Math.round(Math.max(38, Math.min(70, (saturation / weight) * 85))),
    };
  } catch {
    return BRAND_HUE;
  }
}

function drawSpaced(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  spacing: number,
  centered = false
) {
  const chars = [...text];
  if (centered) {
    const width = chars.reduce((sum, ch) => sum + ctx.measureText(ch).width + spacing, -spacing);
    x -= width / 2;
  }
  for (const ch of chars) {
    ctx.fillText(ch, x, y);
    x += ctx.measureText(ch).width + spacing;
  }
}

function drawBackground(ctx: CanvasRenderingContext2D, hue: Hue, k: number) {
  const bg = ctx.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0, `hsl(${hue.h}, ${hue.s}%, 24%)`);
  bg.addColorStop(0.6, `hsl(${hue.h}, ${hue.s}%, 15%)`);
  bg.addColorStop(1, `hsl(${hue.h}, ${hue.s}%, 9%)`);
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  const halo = ctx.createRadialGradient(W / 2, 860, 0, W / 2, 860, 750);
  halo.addColorStop(0, `hsla(${hue.h}, ${hue.s}%, 46%, 0.55)`);
  halo.addColorStop(0.62, `hsla(${hue.h}, ${hue.s}%, 46%, 0)`);
  ctx.fillStyle = halo;
  ctx.fillRect(0, 0, W, H);

  const ringY = CUP_TOP + 470 * k;
  ctx.strokeStyle = "rgba(255,255,255,0.10)";
  ctx.lineWidth = 26 * k;
  ctx.beginPath();
  ctx.arc(W / 2, ringY, 387 * k, 0, Math.PI * 2);
  ctx.stroke();
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.arc(W / 2, ringY, 462 * k, 0, Math.PI * 2);
  ctx.stroke();

  ctx.save();
  ctx.translate(W / 2 + 40 * k, CUP_TOP + 954 * k);
  ctx.scale(k, 0.18 * k);
  const floor = ctx.createRadialGradient(0, 0, 0, 0, 0, 340);
  floor.addColorStop(0, "rgba(0,0,0,0.6)");
  floor.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = floor;
  ctx.beginPath();
  ctx.arc(0, 0, 340, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawFlatCup(
  ctx: CanvasRenderingContext2D,
  cup: HTMLImageElement,
  logo: HTMLImageElement | null,
  initial: string,
  k: number
) {
  const x = (W - CUP_W * k) / 2;
  ctx.save();
  ctx.shadowColor = "rgba(0,0,0,0.35)";
  ctx.shadowBlur = 60;
  ctx.shadowOffsetY = 50;
  ctx.drawImage(cup, x, CUP_TOP, CUP_W * k, CUP_H * k);
  ctx.restore();

  const r = 107;
  ctx.save();
  ctx.translate(x + 388 * k, CUP_TOP + 622 * k);
  ctx.rotate((-12 * Math.PI) / 180);
  ctx.scale(0.9 * k, k);
  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  ctx.arc(0, 0, r + 9, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.clip();
  if (logo) {
    drawCover(ctx, logo, -r, -r, r * 2, r * 2);
  } else {
    ctx.fillStyle = "#8d0b41";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = `800 120px ${SANS}`;
    ctx.fillText(initial, 0, 6);
  }
  const shade = ctx.createLinearGradient(-r, 0, r, 0);
  shade.addColorStop(0, "rgba(255,255,255,0.22)");
  shade.addColorStop(0.38, "rgba(255,255,255,0)");
  shade.addColorStop(1, "rgba(40,15,0,0.26)");
  ctx.fillStyle = shade;
  ctx.fillRect(-r, -r, r * 2, r * 2);
  ctx.restore();
}

function greetingKey(purchasedAt: string): string {
  const hour = new Date(purchasedAt).getHours();
  if (hour >= 5 && hour < 11) return "orderStory.morning";
  if (hour >= 11 && hour < 17) return "orderStory.day";
  return "orderStory.evening";
}

export async function renderOrderStory(order: OrderDetail): Promise<Blob> {
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("canvas 2d context unavailable");

  const [partnerLogo] = await Promise.all([
    loadImage(order.partnerLogoUrl),
    document.fonts?.load('700 76px "Eugusto"').catch(() => undefined),
  ]);
  const initial = order.shopName.trim().charAt(0).toUpperCase();

  ctx.font = `800 104px ${SANS}`;
  const drinkLines = wrapLines(ctx, order.items[0]?.name ?? order.shopName, W - MARGIN * 2, 2);
  const k = drinkLines.length > 1 ? 0.86 : 1;

  drawBackground(ctx, logoHue(partnerLogo), k);

  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";
  ctx.fillStyle = "#ffffff";
  ctx.font = '700 76px "Eugusto", serif';
  ctx.fillText("hoopla", W / 2, 330);
  ctx.fillStyle = "rgba(255,255,255,0.72)";
  ctx.font = `600 30px ${SANS}`;
  ctx.textAlign = "left";
  drawSpaced(ctx, "@hoopla.uz", W / 2, 384, 2, true);

  let cup3d: HTMLCanvasElement | null = null;
  try {
    const { renderStoryCup } = await import("@/helpers/story-cup-3d");
    cup3d = renderStoryCup(partnerLogo, initial);
  } catch {
    cup3d = null;
  }
  if (cup3d) {
    ctx.save();
    ctx.shadowColor = "rgba(0,0,0,0.35)";
    ctx.shadowBlur = 60;
    ctx.shadowOffsetY = 50;
    ctx.drawImage(cup3d, (W - CUP_W * k) / 2, CUP_TOP, CUP_W * k, CUP_H * k);
    ctx.restore();
  } else {
    const flat = await loadImage(cupUrl, false);
    if (!flat) throw new Error("story cup failed to load");
    drawFlatCup(ctx, flat, partnerLogo, initial, k);
  }

  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
  const whereY = CAPTION_BOTTOM - 12;
  const more =
    order.items.length > 1
      ? ` · ${i18n.t("orderStory.moreItems", { count: order.items.length - 1 })}`
      : "";
  ctx.font = `500 42px ${SANS}`;
  const moreWidth = ctx.measureText(more).width;
  ctx.font = `700 42px ${SANS}`;
  const shop = ellipsize(ctx, order.shopName, W - MARGIN * 2 - moreWidth);
  ctx.fillStyle = "#ffffff";
  ctx.fillText(shop, MARGIN, whereY);
  if (more) {
    const shopWidth = ctx.measureText(shop).width;
    ctx.fillStyle = "rgba(255,255,255,0.74)";
    ctx.font = `500 42px ${SANS}`;
    ctx.fillText(more, MARGIN + shopWidth, whereY);
  }

  ctx.fillStyle = "#ffffff";
  ctx.font = `800 104px ${SANS}`;
  const drinkBottom = CAPTION_BOTTOM - 46 - 30;
  const drinkTop = drinkBottom - drinkLines.length * DRINK_LINE_H;
  drinkLines.forEach((line, i) => {
    ctx.fillText(line, MARGIN - 4, drinkTop + (i + 1) * DRINK_LINE_H - 24);
  });

  ctx.fillStyle = "rgba(255,255,255,0.74)";
  ctx.font = `600 34px ${SANS}`;
  drawSpaced(ctx, i18n.t(greetingKey(order.purchasedAt)).toUpperCase(), MARGIN, drinkTop - 28, 6);

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("story export failed"))),
      "image/png"
    );
  });
}

export function orderStoryFile(blob: Blob, orderId: number): File {
  return new File([blob], `hoopla-order-${orderId}.png`, { type: "image/png" });
}

export function canShareFile(file: File): boolean {
  return (
    typeof navigator !== "undefined" &&
    !!navigator.share &&
    !!navigator.canShare?.({ files: [file] })
  );
}
