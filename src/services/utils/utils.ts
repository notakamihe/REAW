import { 
  AutomationLane, 
  AutomationLaneEnvelope, 
  AutomationMode, 
  Clip, 
  TimelinePosition, 
  TimelineSettings, 
  TimeSignature, 
  Track, 
  TrackType
} from "../types/types";
import { v4 } from "uuid";
import { clamp, hslToHex, inverseLerp, lerp, shadeColor } from "./general";

export const BASE_MAX_MEASURES = 1600; // Maximum number of measures at time signature 4/4
export const BASE_BEAT_WIDTH = 50;
export const BASE_HEIGHT = 80;

export const GRID_MIN_INTERVAL_WIDTH = 8.5;

export const timelineEditorWindowScrollThresholds = { 
  top: { slow: 53, medium: 44, fast: 36 }, 
  right: { slow: 35, medium: 28, fast: 20 } 
};

export function automatedValueAtPos(pos: TimelinePosition, lane: AutomationLane) {
  if (lane.nodes.length === 0)
    return null;
    
  const positions = [...lane.nodes.map(node => node.pos), pos].sort((a, b) => a.compareTo(b));
  const idx = positions.indexOf(pos);

  if (idx === 0) {
    return lane.nodes[0].value;
  } else if (idx === positions.length - 1) {
    return lane.nodes[lane.nodes.length - 1].value;
  } else {
    const prev = lane.nodes.find(node => node.pos === positions[idx - 1])!;
    const next = lane.nodes.find(node => node.pos === positions[idx + 1])!;

    const x = pos.toMargin();
    const x1 = prev.pos.toMargin();
    const y1 = lane.envelope === AutomationLaneEnvelope.Volume ? volumeToNormalized(prev.value) :
      inverseLerp(prev.value, lane.minValue, lane.maxValue);
    const x2 = next.pos.toMargin();
    const y2 = lane.envelope === AutomationLaneEnvelope.Volume ? volumeToNormalized(next.value) :
      inverseLerp(next.value, lane.minValue, lane.maxValue);

    if (x2 === x1)
      return next.value;

    const y = clamp(y1 + (x - x1) * ((y2 - y1) / (x2 - x1)), 0, 1);
    return lane.envelope === AutomationLaneEnvelope.Volume ? 
      normalizedToVolume(y) : lerp(y, lane.minValue, lane.maxValue);
  }
}

export function clipAtPos(to: TimelinePosition, clip: Clip) : Clip {
  const newClip = { ...clip };
  const { measures, beats, fraction, sign } = to.diff(clip.start);

  newClip.start = newClip.start.translate({ measures, beats, fraction, sign }, false);
  newClip.end = newClip.end.translate({ measures, beats, fraction, sign }, false);

  if (newClip.startLimit)
    newClip.startLimit = newClip.startLimit.translate({ measures, beats, fraction, sign }, false);

  if (newClip.endLimit)
    newClip.endLimit = newClip.endLimit.translate({ measures, beats, fraction, sign }, false);

  if (newClip.loopEnd)
    newClip.loopEnd = newClip.loopEnd.translate({ measures, beats, fraction, sign }, false);

  if (newClip.type === TrackType.Audio && newClip.audio) {
    newClip.audio = {
      ...newClip.audio,
      start: newClip.audio.start.translate({ measures, beats, fraction, sign }, false),
      end: newClip.audio.end.translate({ measures, beats, fraction, sign }, false)
    };
  }

  return newClip;
}

export function copyClip(clip: Clip): Clip {
  const newClip = {
    ...clip,
    id: v4(),
    start: clip.start.copy(),
    end: clip.end.copy(),
    loopEnd: clip.loopEnd ? clip.loopEnd.copy() : null,
    startLimit: clip.startLimit ? clip.startLimit.copy() : null,
    endLimit: clip.endLimit ? clip.endLimit.copy() : null
  }

  if (newClip.type === TrackType.Audio && newClip.audio) {
    newClip.audio = { 
      ...newClip.audio, 
      start: newClip.audio.start.copy(), 
      end: newClip.audio.end.copy()
    };
  }

  return newClip;
}

export function clipsOverlap(a: Clip, b: Clip): boolean {
  const aEnd = a.loopEnd || a.end;
  const bEnd = b.loopEnd || b.end;

  return (
    a.start.compareTo(bEnd) < 0 && aEnd.compareTo(b.start) > 0 ||
    a.start.equals(b.start) && aEnd.equals(bEnd)
  );
}

export function formatPanning(val: number, short = false) {
  if (short)
    return `${+Math.abs(val).toFixed(1)}% ${val === 0 ? "C" : (val < 0 ? "L" : "R")}`;
  return `${+Math.abs(val).toFixed(1)}% ${val === 0 ? "Center" : (val < 0 ? "Left" : "Right")}`;
}

export function formatVolume(val: number) {
  return `${val === -Infinity ? "-∞" : +val.toFixed(1)} dB`;
}

export function getBaseTrack(id = v4()) : Track {
  return {
    id, 
    name: `Track`, 
    type: TrackType.Audio,
    color: getRandomTrackColor(), 
    clips: [],
    fx: { effects: [], selectedEffectIndex: 0 },
    mute: false,
    solo: false,
    armed: false,
    automation: false,
    volume: 0,
    pan: 0,
    automationLanes: [
      {
        id: v4(), 
        label: "Volume", 
        envelope: AutomationLaneEnvelope.Volume,
        enabled: true, 
        minValue: -Infinity, 
        maxValue: 6, 
        nodes: [], 
        show: false, 
        expanded: true, 
      },
      {
        id: v4(), 
        label: "Pan", 
        envelope: AutomationLaneEnvelope.Pan,
        enabled: true,
        minValue: -100, 
        maxValue: 100, 
        nodes: [], 
        show: false, 
        expanded: true, 
      }
    ],
    automationMode: AutomationMode.Read
  }
}

export function getBaseMasterTrack() : Track {
  const baseTrack = getBaseTrack()

  return {
    ...baseTrack, 
    name: "Master", 
    type: TrackType.Master,
    color: "var(--border6)", 
    armed: true,
    automationLanes: [
      ...baseTrack.automationLanes,
      {
        id: v4(), 
        label: "Tempo", 
        envelope: AutomationLaneEnvelope.Tempo,
        enabled: true,
        minValue: 20, 
        maxValue: 320, 
        nodes: [], 
        show: false, 
        expanded: true
      }
    ]
  }
}

export function getLaneColor(lanes: AutomationLane[], idx: number, baseColor: string) : string {
  return shadeColor(baseColor, lanes.length === 1 ? 0.15 : -0.3 / (lanes.length - 1) * idx + 0.15);
}

export function getMaxMeasures(timeSignature: TimeSignature) {
  return Math.floor(BASE_MAX_MEASURES / (4 / timeSignature.noteValue) * (4 / timeSignature.beats));
}

export function getRandomTrackColor() {
  return hslToHex(Math.floor(Math.random() * 360), 80, 70)
}

export function getVolumeGradient(vertical: boolean) {
  return `linear-gradient(to ${vertical ? "top" : "right"}, #6bd485 0%, #6bd485 65%, 
    #9bff6b 65%, #9bff6b 75%, #fff06b 76%, #fff06b 91%, #ff6b6b 91%, #ff6b6b 100%)`;
}

export function isValidAudioTrackFileFormat(mimetype: string) {
  const validFormats = [
    "audio/aac",
    "audio/flac",
    "audio/ogg",
    "audio/mpeg",
    "audio/x-m4a",
    "audio/wav",
    "video/mp4"
  ];

  return validFormats.includes(mimetype);
}

export function isValidTrackFileFormat(mimetype: string) {
  return isValidAudioTrackFileFormat(mimetype) || mimetype === "audio/midi";
}

export function normalizedToVolume(t: number) {
  return 48.0236 * Math.log10(Math.max(t, 0) / 0.75);
}

export function preserveClipMargins(clip: Clip, settings: TimelineSettings) : Clip {
  const newClip = {
    ...clip,
    start: preservePosMargin(clip.start, settings),
    end: preservePosMargin(clip.end, settings),
    startLimit: clip.startLimit ? preservePosMargin(clip.startLimit, settings, false) : null,
    endLimit: clip.endLimit ? preservePosMargin(clip.endLimit, settings, false) : null,
    loopEnd: clip.loopEnd ? preservePosMargin(clip.loopEnd, settings) : null
  };
  
  if (newClip.type === TrackType.Audio && newClip.audio) {
    newClip.audio = {
      ...newClip.audio,
      start: preservePosMargin(newClip.audio.start, settings, false),
      end: preservePosMargin(newClip.audio.end, settings, false)
    }
  }

  const temp = TimelinePosition.timelineSettings;
  TimelinePosition.timelineSettings = settings;

  if (newClip.loopEnd && newClip.loopEnd.compareTo(newClip.end) <= 0)
    newClip.loopEnd = null;

  TimelinePosition.timelineSettings = temp;

  return newClip;
}

export function preserveTrackMargins(track: Track, settings: TimelineSettings) {
  return {
    ...track, 
    clips: track.clips.map(clip => preserveClipMargins(clip, settings)),
    automationLanes: track.automationLanes.map(lane => ({
      ...lane, 
      nodes: lane.nodes.map(node => ({...node, pos: preservePosMargin(node.pos, settings)}))
    }))
  };
}

export function preservePosMargin(pos: TimelinePosition, settings: TimelineSettings, restrict = true) {
  const margin = pos.toMargin();
  
  const temp = TimelinePosition.timelineSettings;
  TimelinePosition.timelineSettings = settings;
  let newPos = TimelinePosition.fromMargin(margin);

  if (restrict) {
    const maxMeasures = getMaxMeasures(settings.timeSignature);
    const maxPos = new TimelinePosition(maxMeasures + 1, 1, 0);

    if (newPos.compareTo(maxPos) > 0)
      newPos = maxPos.copy();
  }

  TimelinePosition.timelineSettings = temp;
  return newPos;
}

export function removeClipOverlap(a: Clip, b: Clip) {
  const endSlices = sliceClip(a, b.loopEnd || b.end);
  const startSlices = sliceClip(endSlices[0], b.start);

  endSlices.splice(0, 1);
  startSlices.length = startSlices.length > 1 ? 1 : 0;

  return [...endSlices, ...startSlices];
}

export function removeAllClipOverlap(clips: Clip[], priority?: Clip) {
  let newClips: Clip[] = [];

  for (let i = 0; i < clips.length; i++) {
    let slices = [clips[i]];

    if (clips[i].id !== priority?.id) {
      if (priority && clipsOverlap(clips[i], priority))
        slices = removeClipOverlap(clips[i], priority);

      for (let j = i + 1; j < clips.length; j++) {
        for (let k = 0; k < slices.length; k++) {
          if (clipsOverlap(slices[k], clips[j])) {
            const remaining = removeClipOverlap(slices[k], clips[j]);
            slices.splice(k, 1, ...remaining);
          }
        }
      }
    }

    newClips.push(...slices);
  }

  return newClips;
}

export function scrollToAndAlign(
  el: HTMLElement, 
  positions: { top?: number; left?: number }, 
  alignmentOffset: { top?: number; left?: number }
) {
  el.scrollTo({
    top: (positions.top ?? el.scrollTop) - (alignmentOffset.top ?? 0) * el.clientHeight,
    left: (positions.left ?? el.scrollLeft) - (alignmentOffset.left ?? 0) * el.clientWidth
  });
}

export function sliceClip(clip: Clip, pos: TimelinePosition): Clip[] {
  if (pos.compareTo(clip.start) > 0 && pos.compareTo(clip.loopEnd || clip.end) < 0) {
    const clips: Clip[] = [];
    let newClip = { ...clip };

    if (pos.compareTo(clip.end) > 0) {
      newClip.loopEnd = pos.copy();
    } else {
      newClip.end = pos.copy();
      newClip.loopEnd = null;
    }

    clips.push(newClip);

    const width = clip.end.diffInMargin(clip.start);
    const loopWidth = clip.loopEnd ? clip.loopEnd.diffInMargin(clip.end) : 0;

    if (pos.compareTo(clip.end) < 0) {
      newClip = copyClip(clip);
      newClip.start = pos.copy();
      newClip.loopEnd = null;
      clips.push(newClip);

      if (clip.loopEnd && clip.loopEnd.compareTo(clip.end) > 0) {
        newClip = copyClip(clipAtPos(clip.end, clip));
        
        if (loopWidth > width) {
          newClip.loopEnd = clip.loopEnd.copy();
        } else {
          newClip.end = clip.loopEnd.copy();
          newClip.loopEnd = null;
        }

        clips.push(newClip);
      }
    } else if (clip.loopEnd && clip.loopEnd.compareTo(clip.end) > 0) {
      const posDistancePastEnd = pos.diffInMargin(clip.end);
      const numRepetitions = Math.ceil(Math.round((loopWidth / width) * 1e9) / 1e9);
      let repetition = Math.floor(posDistancePastEnd / width);
      
      if (Math.abs(posDistancePastEnd % width) > 1e-9) {
        let { measures, beats, fraction } = TimelinePosition.measureMargin(width * repetition);

        newClip = copyClip(clipAtPos(clip.end.add(measures, beats, fraction, false), clip));
        newClip.start = pos.copy();
        newClip.loopEnd = null;
        clips.push(newClip);

        repetition++;
      }

      if (repetition < numRepetitions) {
        let { measures, beats, fraction } = TimelinePosition.measureMargin(width * repetition);
        newClip = copyClip(clipAtPos(clip.end.add(measures, beats, fraction, false), clip));
        
        if (clip.loopEnd.diffInMargin(newClip.start) > width) {
          newClip.loopEnd = clip.loopEnd.copy();
        } else {
          newClip.end = clip.loopEnd.copy();
          newClip.loopEnd = null;
        }

        clips.push(newClip);
      }
    }
  
    return clips;
  } else {
    return [clip];
  }
}

export function volumeToNormalized(value: number) {
  return Math.pow(10, value / 48.0236) * 0.75;
}

export function waitForScrollWheelStop(windowEl: HTMLElement, callback: () => void) {
  let timeout: ReturnType<typeof setTimeout>;

  function execScroll() {
    windowEl.removeEventListener("scroll", updateTimeout);
    windowEl.removeEventListener("wheel", updateTimeout);
    callback();
  }

  function updateTimeout() {
    clearTimeout(timeout);
    timeout = setTimeout(execScroll, 200);
  }

  windowEl.addEventListener("scroll", updateTimeout);
  windowEl.addEventListener("wheel", updateTimeout, { passive: false });
  timeout = setTimeout(execScroll, 200);
}