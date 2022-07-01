import TimelinePosition, { TimelinePositionOptions } from "renderer/types/TimelinePosition";
import { AudioClip, AutomationLane, AutomationNode, Clip, Track, TrackType } from "renderer/types/types";
import { v4 as uuidv4 } from "uuid";
import { getRandomTrackColor } from "./general";

export const BASE_MAX_MEASURES = 2000;
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
    id: uuidv4(), 
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
      {id: uuidv4(), label: "Volume", minValue: -80, maxValue: 6, nodes: [], show: false, expanded: true, isVolume: true},
      {id: uuidv4(), label: "Pan", minValue: -100, maxValue: 100, nodes: [], show: false, expanded: true, isPan: true}
    ]
  }
}

export function getBaseMasterTrack() : Track {
  const baseTrack = getBaseTrack()

  return {
    ...baseTrack, 
    name: "Master", 
    isMaster: true, 
    color: "#666", 
    armed: true,
    automationLanes: [
      ...baseTrack.automationLanes,
      {id: uuidv4(), label: "Tempo", minValue: 10, maxValue: 1000, nodes: [], show: false, expanded: true, isTempo: true}
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