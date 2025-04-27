import React from "react"

export function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

export function cmdOrCtrl(e: React.KeyboardEvent | KeyboardEvent) {
  const isMacOS = navigator.userAgent.includes('Mac');
  return (isMacOS && e.metaKey) || (!isMacOS && e.ctrlKey);
}

export function dBToGainFactor(dB: number) {
  return Math.pow(10, dB / 20);
}

export function formatDuration(
  duration: { hours: number; minutes: number; seconds: number; milliseconds: number },
  verbose: boolean = false
) {
  const h = duration.hours.toString().padStart(verbose ? 2 : 0, "0");
  const m = duration.minutes.toString().padStart(verbose || duration.hours !== 0 ? 2 : 0, "0");
  const s = duration.seconds.toString().padStart(2, "0");
  const ms = Math.trunc(duration.milliseconds).toString().padStart(3, "0"); 

  const includeHours = verbose || duration.hours !== 0;
  const includeMs = verbose || duration.milliseconds > 0;

  return `${includeHours ? h + ":" : ""}${m}:${s}${includeMs ? "." + ms : ""}`;
}

export function gainFactorToDB(factor: number) {
  return 20 * Math.log10(factor);
}

export function getCSSVarValue(varName: string) {
  return getComputedStyle(document.documentElement).getPropertyValue(varName);
}

export function getScrollParent(el: HTMLElement, dir?: "horizontal" | "vertical" | "all") {
  for (let parent = el.parentElement; parent !== null; parent = parent.parentElement) {
    const {overflowX, overflowY} = getComputedStyle(parent);
    const xOverflow = dir !== "vertical" && parent.scrollWidth > parent.clientWidth &&
      (overflowX === "auto" || overflowX === "scroll");
    const yOverflow = dir !== "horizontal" && parent.scrollHeight > parent.clientHeight &&
      (overflowY === "auto" || overflowY === "scroll");

    if (xOverflow || yOverflow) return parent;
  }

  return null;
}

export function hslToHex(h: number, s: number, l: number) {
  s /= 100;
  l /= 100;

  let c = (1 - Math.abs(2 * l - 1)) * s;
  let x = c * (1 - Math.abs((h / 60) % 2 - 1));
  let m = l - c / 2;
  let r = 0;
  let g = 0;
  let b = 0;

  if (0 <= h && h < 60) {
    r = c; g = x; b = 0;
  } else if (60 <= h && h < 120) {
    r = x; g = c; b = 0;
  } else if (120 <= h && h < 180) {
    r = 0; g = c; b = x;
  } else if (180 <= h && h < 240) {
    r = 0; g = x; b = c;
  } else if (240 <= h && h < 300) {
    r = x; g = 0; b = c;
  } else if (300 <= h && h < 360) {
    r = c; g = 0; b = x;
  }
  
  const rHex = Math.round((r + m) * 255).toString(16).padStart(2, "0");
  const gHex = Math.round((g + m) * 255).toString(16).padStart(2, "0");
  const bHex = Math.round((b + m) * 255).toString(16).padStart(2, "0");

  return "#" + rHex + gHex + bHex;
}

export function hueFromHex(hex: string) {
  hex = hex.replace("#", "");

  var r = parseInt(hex.substring(0, 2), 16) / 255;
  var g = parseInt(hex.substring(2, 4), 16) / 255;
  var b = parseInt(hex.substring(4, 6), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;

  if (max !== min) {
    var d = max - min;

    if (max === r)
      h = (g - b) / d + (g < b ? 6 : 0);
    else if (max === g)
      h = (b - r) / d + 2;
    else if (max === b)
      h = (r - g) / d + 4;
  }

  return (h / 6) * 360;
}

export function inverseLerp(value: number, min: number, max: number) {
  const t = (value - min) / (max - min);
  return clamp(t, 0, 1);
}

export function isMacOS() {
  return navigator.userAgent.includes("Mac");
}

export function lerp(t: number, min: number, max: number) {
  return min + clamp(t, 0, 1) * (max - min);
}

export function measureSeconds(s: number) {
  const hours = Math.floor(s / 3600);
  const minutes = Math.floor((s % 3600) / 60);
  const seconds = Math.floor(s % 60);
  return { hours, minutes, seconds, milliseconds: s % 1 * 1000 };
}

export function normalizeHex(hex: string) {
  hex = hex.replace('#', '');

  if (hex.length === 3 || hex.length === 4)
    return "#" + hex.split('').map(c => c + c).join('');

  return "#" + hex.padEnd(6, '0');
}

export function parseDuration(timeStr: string) {
  const arr = timeStr.split(':');
  let totalSeconds = 0, timeUnitInSeconds = 1;

  while (arr.length > 0) {
    const part = arr.pop()!;

    if (timeUnitInSeconds > 3600)
      return null;
    if ((!part && arr.length > 0) || isNaN(Number(part)))
      return null;
    
    totalSeconds += timeUnitInSeconds * Number(part);
    timeUnitInSeconds *= 60;
  }

  return measureSeconds(totalSeconds);
}

export function shadeColor(hex: string, amt: number) {
  hex = normalizeHex(hex).replace("#", "");
	amt = amt || 0;

	let newHex = "#", channel;

	for (let i = 0; i < 3; i++) {
		channel = parseInt(hex.substring(i * 2, i * 2 + 2), 16);
		channel = Math.round(Math.min(Math.max(0, channel + (channel * amt)), 255)).toString(16);
		newHex += channel;
	}

	return newHex;
}

export function truncate(num: number, places: number = 0) {
  if (num < 0)
    return (Math.ceil(num * 10 ** places) / 10 ** places).toString();
  else
    return (Math.trunc(num * 10 ** places) / 10 ** places).toString();
}