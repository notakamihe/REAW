import TimelinePosition, { TimelinePositionOptions } from "renderer/types/TimelinePosition";
import { AudioClip, AutomationLane, AutomationNode, Clip, Track, TrackType } from "renderer/types/types";
import { v4 } from "uuid";
import { getRandomTrackColor } from "./general";

export const BASE_MAX_MEASURES = 2000;
export const BASE_BEAT_WIDTH = 50;

export const ipcRenderer = (window as any).electron.ipcRenderer

export function clipAtPos(to : TimelinePosition, clip : Clip, options : TimelinePositionOptions) : Clip {
  const {measures, beats, fraction} = TimelinePosition.toInterval(to, clip.start, options);
  let newClip;

  if (to.compare(clip.start) >= 0) {
    newClip = {
      ...clip,
      start: TimelinePosition.fromPos(to),
      end: clip.end.add(measures, beats, fraction, false, options),
      startLimit: clip.startLimit?.add(measures, beats, fraction, false, options) || null,
      endLimit: clip.endLimit?.add(measures, beats, fraction, false, options) || null,
      loopEnd: clip.loopEnd?.add(measures, beats, fraction, false, options) || null
    }
  } else {
    newClip = {
      ...clip,
      start: TimelinePosition.fromPos(to),
      end: clip.end.subtract(measures, beats, fraction, false, options),
      startLimit: clip.startLimit?.subtract(measures, beats, fraction, false, options) || null,
      endLimit: clip.endLimit?.subtract(measures, beats, fraction, false, options) || null,
      loopEnd: clip.loopEnd?.subtract(measures, beats, fraction, false, options) || null
    }
  }

  if ((clip as AudioClip).audio) {
    let clipAsAudio = newClip as AudioClip;

    if (to.compare(clip.start) >= 0) {
      newClip = {
        ...newClip,
        audio: {
          ...clipAsAudio.audio,
          start: clipAsAudio.audio.start.add(measures, beats, fraction, false, options),
          end: clipAsAudio.audio.end.add(measures, beats, fraction, false, options)
        }
      } as Clip;
    } else {
      newClip = {
        ...newClip,
        audio: {
          ...clipAsAudio.audio,
          start: clipAsAudio.audio.start.subtract(measures, beats, fraction, false, options),
          end: clipAsAudio.audio.end.subtract(measures, beats, fraction, false, options)
        }
      } as Clip;
    }
  }

  return newClip;
}

export function clipsOverlap(clip1: Clip, clip2: Clip): boolean {
  const end1 = clip1.loopEnd || clip1.end;
  const end2 = clip2.loopEnd || clip2.end;

  return (
    clip1.start.compare(clip2.start) > 0 && clip1.start.compare(end2) < 0 || 
    end1.compare(clip2.start) > 0 && end1.compare(end2) < 0
  ) || (
    clip2.start.compare(clip1.start) > 0 && clip2.start.compare(end1) < 0 || 
    end2.compare(clip1.start) > 0 && end2.compare(end1) < 0
  );
}

export function copyClip(clip: Clip) : Clip {
  const newClip = {
    ...clip,
    start: TimelinePosition.fromPos(clip.start),
    end: TimelinePosition.fromPos(clip.end),
    startLimit: clip.startLimit ? TimelinePosition.fromPos(clip.startLimit) : null,
    endLimit: clip.endLimit ? TimelinePosition.fromPos(clip.endLimit) : null,
    loopEnd: clip.loopEnd ? TimelinePosition.fromPos(clip.loopEnd) : null
  }

  if ((clip as AudioClip).audio) {
    const audioClip = newClip as AudioClip;

    audioClip.audio.start = TimelinePosition.fromPos(audioClip.audio.start);
    audioClip.audio.end = TimelinePosition.fromPos(audioClip.audio.end);
  }

  return newClip;
}

export function getBaseTrack() : Track {
  return {
    id: v4(), 
    name: `Track`, 
    type: TrackType.Audio,
    color: getRandomTrackColor(), 
    clips: [],
    fx: {effects: []},
    mute: false,
    solo: false,
    armed: false,
    automationEnabled: false,
    volume: 0,
    pan: 0,
    automationLanes: [
      {id: v4(), label: "Volume", minValue: -80, maxValue: 6, nodes: [], show: false, expanded: true, isVolume: true},
      {id: v4(), label: "Pan", minValue: -100, maxValue: 100, nodes: [], show: false, expanded: true, isPan: true}
    ]
  }
}

export function getBaseMasterTrack() : Track {
  const baseTrack = getBaseTrack()

  return {
    ...baseTrack, 
    name: "Master", 
    type: TrackType.Master,
    isMaster: true, 
    color: "#666", 
    armed: true,
    automationLanes: [
      ...baseTrack.automationLanes,
      {id: v4(), label: "Tempo", minValue: 10, maxValue: 1000, nodes: [], show: false, expanded: true, isTempo: true}
    ]
  }
}

export function getPosFromAnchorEl(anchorEl: HTMLElement, options: TimelinePositionOptions) {
  return marginToPos(anchorEl.offsetLeft, options);
}

export function getTrackPanTitle(track : Track) : string {
  const panLane = track.automationLanes.find(lane => lane.isPan)

  if (panLane && panLane.nodes.length > 1)
    return "Pan: Automated"
  else 
    return `Pan: ${Math.abs(track.pan).toFixed(2)}% ${track.pan > 0 ? "R" : track.pan === 0 ? "Center" : "L"}`
}

export function getTrackVolumeTitle(track : Track) : string {
  const volumeLane = track.automationLanes.find(lane => lane.isVolume)

  if (volumeLane && volumeLane.nodes.length > 1)
    return "Volume: Automated"
  else
    return `Volume: ${track.volume <= -80 ? '-Infinity dB' : track.volume.toFixed(2) + ' dB'}`
}

export function laneContainsNode(lane : AutomationLane, node : AutomationNode | null) {
  return lane.nodes.findIndex(n => n.id === node?.id) !== -1
}

export function marginToPos(margin : number, options: TimelinePositionOptions) : TimelinePosition {
  const {measures, beats, fraction} = TimelinePosition.fromWidth(margin, options)
  return new TimelinePosition(measures + 1, beats + 1, fraction)
}

export function preserveClipMargins(clip : Clip, prevOptions : TimelinePositionOptions, options : TimelinePositionOptions) : Clip {
  const newClip = copyClip(clip)

  newClip.start = preservePosMargin(newClip.start, prevOptions, options)
  newClip.end = preservePosMargin(newClip.end, prevOptions, options)

  if (newClip.startLimit)
    newClip.startLimit = preservePosMargin(newClip.startLimit, prevOptions, options)

  if (newClip.endLimit)
    newClip.endLimit = preservePosMargin(newClip.endLimit, prevOptions, options)
  
  if (newClip.loopEnd)
    newClip.loopEnd = preservePosMargin(newClip.loopEnd, prevOptions, options)

  return newClip
}

export function preservePosMargin(pos : TimelinePosition, prevOptions : TimelinePositionOptions, options : TimelinePositionOptions) {
  const margin = pos.toMargin(prevOptions)
  const {measures, beats, fraction} = TimelinePosition.fromWidth(margin, options)
  let newPos = new TimelinePosition(measures + 1, beats + 1, fraction)

  const maxMeasures = BASE_MAX_MEASURES / (4 / options.timeSignature.noteValue) * (4 / options.timeSignature.beats)
  const maxPos = new TimelinePosition(maxMeasures + 1, 1, 0)

  if (newPos.compare(maxPos) > 0)
    newPos = maxPos

  return newPos 
}

export function sliceAnyOverlappingClips(clip: Clip, clips: Clip[], options: TimelinePositionOptions): Clip[] {
  let newClips = clips.slice();
  
  for (let i = 0; i < clips.length; i++) {
    if (clips[i].id !== clip.id && clipsOverlap(clips[i], clip)) {
      const endSlices = sliceClip(clips[i], clip.loopEnd || clip.end, options); 
      const startSlices = sliceClip(endSlices[0], clip.start, options); 

      endSlices.splice(0, 1);
      startSlices.length = startSlices.length > 1 ? 1 : 0;

      newClips = newClips.filter(c => c.id !== clips[i].id).concat([...endSlices, ...startSlices]);
    }
  }

  return newClips;
}

export function sliceClip(clip: Clip, pos: TimelinePosition, options: TimelinePositionOptions): Clip[] {
  const width = TimelinePosition.toWidth(clip.start, clip.end, options)
  const clips: Clip[] = [clip];

  if (pos.compare(clip.start) > 0) {
    let start : TimelinePosition, end : TimelinePosition, startLimit = null, endLimit = null, loopEnd = null
    let loopWidth = TimelinePosition.toWidth(clip.end, clip.loopEnd, options)
    let newClip : Clip | null = null
    let addExtraClip = false

    if (pos.compare(clip.end) < 0) {
      start = TimelinePosition.fromPos(pos)
      end = TimelinePosition.fromPos(clip.end)
      startLimit = clip.startLimit ? TimelinePosition.fromPos(clip.startLimit) : null,
      endLimit = clip.endLimit ? TimelinePosition.fromPos(clip.endLimit) : null, 
      loopEnd = null

      newClip = {...clip, end: TimelinePosition.fromPos(pos), loopEnd: null}
      clips[0] = newClip;

      const secondClip = {id: v4(), start, end, startLimit, endLimit, loopEnd, muted: clip.muted, name: clip.name};

      if ((newClip as AudioClip).audio) {
        const audioClip = newClip as AudioClip;

        (secondClip as AudioClip).audio = {
          ...audioClip.audio,
          start: audioClip.audio.start,
          end: audioClip.audio.end,
        }
      }

      clips.push(secondClip);
      addExtraClip = Boolean(clip.loopEnd)
    } else if (clip.loopEnd && pos.compare(clip.loopEnd) < 0) {
      start = TimelinePosition.fromPos(pos)
      loopEnd = null

      const width = TimelinePosition.toWidth(clip.start, clip.end, options)
      const endToPosWidth = TimelinePosition.toWidth(clip.end, start, options)
      const repetition = Math.ceil(endToPosWidth / width)

      const repStartMargin = (repetition - 1) * width
      const repEndMargin = (repetition === Math.ceil(loopWidth / width) && loopWidth % width !== 0) ?
        loopWidth : repetition * width

      const repEndSpan = TimelinePosition.fromWidth(repEndMargin, options)
      end = clip.end.add(repEndSpan.measures, repEndSpan.beats, repEndSpan.fraction, false, options)

      const repStartSpan = TimelinePosition.fromWidth(repStartMargin, options)
      const repStart = clip.end.add(repStartSpan.measures, repStartSpan.beats, repStartSpan.fraction, false, options)

      if (clip.startLimit) {
        const startSpan = TimelinePosition.toInterval(clip.startLimit, clip.start, options)
        startLimit = repStart.subtract(startSpan.measures, startSpan.beats, startSpan.fraction, false, options)
      }

      if (clip.endLimit) {
        const interval = TimelinePosition.toInterval(clip.start, repStart, options)
        endLimit = clip.endLimit.add(interval.measures, interval.beats, interval.fraction, false, options)
      }

      newClip = {...clip, loopEnd: start}
      clips[0] = newClip;

      if (endToPosWidth % width !== 0) {
        const secondClip = {id: v4(), start, end, startLimit, endLimit, loopEnd, muted: clip.muted, name: clip.name};

        if ((newClip as AudioClip).audio) {
          const audioClip = newClip as AudioClip;
          const interval = TimelinePosition.toInterval(clip.start, repStart, options);

          (secondClip as AudioClip).audio = {
            ...audioClip.audio,
            start: audioClip.audio.start.add(interval.measures, interval.beats, interval.fraction, false, options),
            end: audioClip.audio.end.add(interval.measures, interval.beats, interval.fraction, false, options)
          }
        }

        clips.push(secondClip);
      }

      addExtraClip = repetition < Math.ceil(loopWidth / width)
      loopWidth = TimelinePosition.toWidth(end, clip.loopEnd, options)
    }

    if (addExtraClip) {
      const {measures, beats, fraction} = TimelinePosition.fromWidth(Math.min(width, loopWidth), options)
      
      start = TimelinePosition.fromPos(end!)
      end = start.add(measures, beats, fraction, false, options)
      loopEnd = loopWidth > width ? clip.loopEnd : null

      if (clip.startLimit) {
        const startSpan = TimelinePosition.toInterval(clip.startLimit, clip.start, options)
        startLimit = start.subtract(startSpan.measures, startSpan.beats, startSpan.fraction, false, options)
      }
      
      if (clip.endLimit) {
        const interval = TimelinePosition.toInterval(clip.start, start, options)
        endLimit = clip.endLimit.add(interval.measures, interval.beats, interval.fraction, false, options)
      }

      newClip = {...clip, id: v4(), start, end, startLimit, endLimit, loopEnd, muted: clip.muted}

      if ((newClip as AudioClip).audio) {
        const audioClip = newClip as AudioClip;
        const interval = TimelinePosition.toInterval(clip.start, start, options);

        (newClip as AudioClip).audio = {
          ...audioClip.audio,
          start: audioClip.audio.start.add(interval.measures, interval.beats, interval.fraction, false, options),
          end: audioClip.audio.end.add(interval.measures, interval.beats, interval.fraction, false, options)
        }
      }

      clips.push(newClip);
    }
  }

  return clips;
}