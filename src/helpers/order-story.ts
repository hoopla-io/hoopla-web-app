import i18n from "@/i18n";
import type { OrderDetail } from "@/api/domains/orders";
import cupUrl from "@/assets/images/story-cup.webp";

const W = 1080;
const H = 1920;
const MARGIN = 96;
const CAPTION_BOTTOM = 1658;
const LOGO_SIZE = 112;
const DRINK_LINE_H = 106;
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

interface CupBox {
  k: number;
  y: number;
  w: number;
  h: number;
}

function drawSpaced(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  spacing: number
) {
  for (const ch of text) {
    ctx.fillText(ch, x, y);
    x += ctx.measureText(ch).width + spacing;
  }
}

function drawBackground(ctx: CanvasRenderingContext2D, cup: CupBox) {
  const ringY = cup.y + cup.h * 0.495;
  ctx.fillStyle = "#8d0b41";
  ctx.fillRect(0, 0, W, H);

  const halo = ctx.createRadialGradient(W / 2, 800, 0, W / 2, 800, 750);
  halo.addColorStop(0, "rgba(255,120,170,0.34)");
  halo.addColorStop(0.62, "rgba(255,120,170,0)");
  ctx.fillStyle = halo;
  ctx.fillRect(0, 0, W, H);

  ctx.strokeStyle = "rgba(255,255,255,0.12)";
  ctx.lineWidth = 26;
  ctx.beginPath();
  ctx.arc(W / 2, ringY, 387 * cup.k, 0, Math.PI * 2);
  ctx.stroke();
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.arc(W / 2, ringY, 462 * cup.k, 0, Math.PI * 2);
  ctx.stroke();

  ctx.save();
  ctx.translate(W / 2 + 40 * cup.k, cup.y + cup.h + 5);
  ctx.scale(cup.k, 0.18 * cup.k);
  const floor = ctx.createRadialGradient(0, 0, 0, 0, 0, 340);
  floor.addColorStop(0, "rgba(40,0,18,0.6)");
  floor.addColorStop(1, "rgba(40,0,18,0)");
  ctx.fillStyle = floor;
  ctx.beginPath();
  ctx.arc(0, 0, 340, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

export async function renderOrderStory(order: OrderDetail): Promise<Blob> {
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("canvas 2d context unavailable");

  const [cup, shopLogo] = await Promise.all([
    loadImage(cupUrl, false),
    loadImage(order.shopIconUrl),
    document.fonts?.load('700 76px "Eugusto"').catch(() => undefined),
  ]);
  if (!cup) throw new Error("story cup failed to load");

  ctx.font = `800 104px ${SANS}`;
  const drinkLines = wrapLines(ctx, order.items[0]?.name ?? order.shopName, W - MARGIN * 2, 2);
  const k = drinkLines.length > 1 ? 0.86 : 1;
  const cupBox: CupBox = { k, y: k < 1 ? 350 : 340, w: 700 * k, h: 949 * k };

  drawBackground(ctx, cupBox);

  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";
  ctx.fillStyle = "#ffffff";
  ctx.font = '700 76px "Eugusto", serif';
  ctx.fillText("hoopla", W / 2, 324);

  ctx.save();
  ctx.shadowColor = "rgba(34,21,16,0.28)";
  ctx.shadowBlur = 60;
  ctx.shadowOffsetY = 50;
  ctx.drawImage(cup, (W - cupBox.w) / 2, cupBox.y, cupBox.w, cupBox.h);
  ctx.restore();

  const logoY = CAPTION_BOTTOM - LOGO_SIZE;
  const logoR = LOGO_SIZE / 2;
  ctx.save();
  ctx.beginPath();
  ctx.arc(MARGIN + logoR, logoY + logoR, logoR, 0, Math.PI * 2);
  ctx.clip();
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(MARGIN, logoY, LOGO_SIZE, LOGO_SIZE);
  if (shopLogo) {
    drawCover(ctx, shopLogo, MARGIN, logoY, LOGO_SIZE, LOGO_SIZE);
  } else {
    ctx.fillStyle = "#8d0b41";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = `800 56px ${SANS}`;
    ctx.fillText(order.shopName.trim().charAt(0).toUpperCase(), MARGIN + logoR, logoY + logoR + 3);
  }
  ctx.restore();
  ctx.strokeStyle = "rgba(255,255,255,0.35)";
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.arc(MARGIN + logoR, logoY + logoR, logoR + 2.5, 0, Math.PI * 2);
  ctx.stroke();

  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  let textX = MARGIN + LOGO_SIZE + 26;
  const textY = logoY + logoR + 2;
  if (order.items.length > 1) {
    const more = `${i18n.t("orderStory.moreItems", { count: order.items.length - 1 })} · `;
    ctx.fillStyle = "rgba(255,255,255,0.7)";
    ctx.font = `500 40px ${SANS}`;
    ctx.fillText(more, textX, textY);
    textX += ctx.measureText(more).width;
  }
  ctx.fillStyle = "#ffffff";
  ctx.font = `600 40px ${SANS}`;
  ctx.fillText(ellipsize(ctx, order.shopName, W - MARGIN - textX), textX, textY);

  ctx.textBaseline = "alphabetic";
  ctx.font = `800 104px ${SANS}`;
  const drinkBottom = logoY - 34;
  const drinkTop = drinkBottom - drinkLines.length * DRINK_LINE_H;
  drinkLines.forEach((line, i) => {
    ctx.fillText(line, MARGIN - 4, drinkTop + (i + 1) * DRINK_LINE_H - 24);
  });

  ctx.fillStyle = "rgba(255,255,255,0.7)";
  ctx.font = `600 30px ${SANS}`;
  drawSpaced(ctx, i18n.t("orderStory.kicker").toUpperCase(), MARGIN, drinkTop - 30, 6);

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
