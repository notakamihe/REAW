import { Clip } from "renderer/components/ClipComponent";
import { Track } from "renderer/components/TrackComponent";
import TimelinePosition, { TimelinePositionOptions } from "renderer/types/TimelinePosition";
import { v4 as uuidv4 } from "uuid";
import { getRandomTrackColor } from "./helpers";

export function fromClip(clip: Clip) : Clip {
  return {
    id: clip.id,
    start: TimelinePosition.fromPos(clip.start),
    end: TimelinePosition.fromPos(clip.end),
    startLimit: clip.startLimit ? TimelinePosition.fromPos(clip.startLimit) : null,
    endLimit: clip.endLimit ? TimelinePosition.fromPos(clip.endLimit) : null,
    loopEnd: clip.loopEnd ? TimelinePosition.fromPos(clip.loopEnd) : null,
  }
}

export function getBaseTrack(tracks: Track[]) {
  return {
    id: uuidv4(), 
    name: `Track ${tracks.length + 1}`, 
    color: getRandomTrackColor(), 
    clips: [],
    effects: [],
    mute: false,
    solo: false,
    automationEnabled: false,
    volume: 0,
    pan: 0,
    automationLanes: [
      {
        id: uuidv4(),
        label: "Volume",
        minValue: -80,
        maxValue: 6,
        nodes: [],
        show: false,
        expanded: true
      },
      {
        id: uuidv4(),
        label: "Pan",
        minValue: -100,
        maxValue: 100,
        nodes: [],
        show: false,
        expanded: true
      }
    ]
  }
}

export function getPosFromAnchorEl(anchorEl: HTMLElement, options: TimelinePositionOptions) {
  return marginToPos(anchorEl.offsetLeft, options);
}

export function marginToPos(margin : number, options: TimelinePositionOptions) : TimelinePosition {
  const {measures, beats, fraction} = TimelinePosition.fromWidth(margin, options)
  return new TimelinePosition(measures + 1, beats + 1, fraction)
}

export function moveClipToPos(to : TimelinePosition, clip : Clip, options : TimelinePositionOptions) : Clip {
  to = TimelinePosition.fromPos(to)
  const start = TimelinePosition.fromPos(clip.start)
  const end = TimelinePosition.fromPos(clip.end)
  const startLimit = clip.startLimit ? TimelinePosition.fromPos(clip.startLimit) : null
  const endLimit = clip.endLimit ? TimelinePosition.fromPos(clip.endLimit) : null
  const loopEnd = clip.loopEnd ? TimelinePosition.fromPos(clip.loopEnd) : null

  let width = TimelinePosition.toWidth(start, end, options)
  let loopWidth = loopEnd ? TimelinePosition.toWidth(end, loopEnd, options) : 0
  let startLimitWidth = startLimit ? TimelinePosition.toWidth(startLimit, start, options) : 0
  let endLimitWidth = endLimit ? TimelinePosition.toWidth(end, endLimit, options) : 0

  const widthToMBF = TimelinePosition.fromWidth(width, options)
  const loopWidthToMBF = TimelinePosition.fromWidth(loopWidth, options)
  const startLimitWidthToMBF = TimelinePosition.fromWidth(startLimitWidth, options)
  const endLimitWidthToMBF = TimelinePosition.fromWidth(endLimitWidth, options)

  to.snap(options)
  end.setPos(to.add(widthToMBF.measures, widthToMBF.beats, widthToMBF.fraction, false, options, false))
  loopEnd?.setPos(end.add(loopWidthToMBF.measures, loopWidthToMBF.beats, loopWidthToMBF.fraction, false, options, false))
  startLimit?.setPos(to.subtract(startLimitWidthToMBF.measures, startLimitWidthToMBF.beats, startLimitWidthToMBF.fraction, false, options, false))
  endLimit?.setPos(end.add(endLimitWidthToMBF.measures, endLimitWidthToMBF.beats, endLimitWidthToMBF.fraction, false, options, false))

  return {...clip, start: to, end, startLimit, endLimit, loopEnd}
}

export function preserveClipMargins(clip : Clip, prevOptions : TimelinePositionOptions, options : TimelinePositionOptions) {
  const newClip = fromClip(clip)

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
  return new TimelinePosition(measures + 1, beats + 1, fraction)
}