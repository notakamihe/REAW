import { AutomationLane } from "./components/AutomationLaneTrack";

export const BEAT_WIDTH = 50;
export const MAX_MEASURES = 10000

export function addAlpha(color: string, opacity: number): string {
  const a = Math.round(Math.min(Math.max(opacity || 1, 0), 1) * 255);
  return normalizeHex(color) + a.toString(16).toUpperCase();
}

export function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

export function colorInterpolate(color1 : string, color2 : string, t : number) : string {
  t = Math.min(Math.max(t, 0), 1);
  
  const rgb1 = parseInt(normalizeHex(color1).substring(1), 16);
  const rgb2 = parseInt(normalizeHex(color2).substring(1), 16);

  let r1 = (rgb1 >> 16) & 0xff;
  let r2 = (rgb2 >> 16) & 0xff;
  let g1 = (rgb1 >> 8) & 0xff;
  let g2 = (rgb2 >> 8) & 0xff;
  let b1 = rgb1 & 0xff;
  let b2 = rgb2 & 0xff;

  const hex = (parseInt(String(((r2 - r1) * t + r1))) << 16 | parseInt(String(((g2 - g1) * t + g1))) << 8 | parseInt(String(((b2 - b1) * t) + b1))).toString(16)

  return `#${hex.padStart(6, "0")}`;
}

export function degreeToRad(degree: number) {
  return degree * Math.PI / 180;
}

export function getLaneColor(lanes : AutomationLane[], idx : number, color : string) : string {
  const t = lanes.length > 1 ? (1 / (lanes.length - 1) * idx) : 1
  return colorInterpolate(shadeColor(color, 25), shadeColor(color, -25), t)
}

export function getRandomTrackColor() {
  return hslToHex(Math.floor(Math.random() * 360), 80, 70)
}

export function hslToHex(h : number, s : number, l : number) {
  l /= 100;
  const a = s * Math.min(l, 1 - l) / 100;
  const f = (n : number) => {
    const k = (n + h / 30) % 12;
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color).toString(16).padStart(2, '0');
  };

  return `#${f(0)}${f(8)}${f(4)}`;
}

export function inverseLerp(value: number, min: number, max: number) {
    const t = (value - min) / (max - min);
    return clamp(t, 0, 1);
}

export function lerp(t: number, min: number, max: number) {
  return min + t * (max - min);
}

export function normalizeHex(hex: string) {
  hex = hex.replace('#', '');

  if (hex.length === 3 || hex.length === 4)
    return "#" + hex.split('').map(c => c + c).join('');

  return "#" + hex.padEnd(6, '0');
}

export function shadeColor(col : string, amt : number) {
  col = col.replace(/^#/, '')
  if (col.length === 3) col = col[0] + col[0] + col[1] + col[1] + col[2] + col[2]

  let [r, g, b] : any = col.match(/.{2}/g);
  ([r, g, b] = [parseInt(r, 16) + amt, parseInt(g, 16) + amt, parseInt(b, 16) + amt])

  r = Math.max(Math.min(255, r), 0).toString(16)
  g = Math.max(Math.min(255, g), 0).toString(16)
  b = Math.max(Math.min(255, b), 0).toString(16)

  const rr = (r.length < 2 ? '0' : '') + r
  const gg = (g.length < 2 ? '0' : '') + g
  const bb = (b.length < 2 ? '0' : '') + b

  return `#${rr}${gg}${bb}`
}