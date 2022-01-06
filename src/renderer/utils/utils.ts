import { Clip } from "renderer/components/ClipComponent";
import { Track } from "renderer/components/TrackComponent";
import TimelinePosition, { TimelinePositionOptions } from "renderer/types/TimelinePosition";
import { v4 as uuidv4 } from "uuid";
import { getRandomTrackColor } from "./helpers";

export function fromClip(clip: Clip) : Clip {
  return {
    id: uuidv4(),
    start: TimelinePosition.fromPos(clip.start),
    end: TimelinePosition.fromPos(clip.end),
    startLimit: clip.startLimit ? TimelinePosition.fromPos(clip.startLimit) : null,
    endLimit: clip.endLimit ? TimelinePosition.fromPos(clip.endLimit) : null,
    loopEnd: TimelinePosition.fromPos(clip.loopEnd),
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
  const {measures, beats, fraction} = TimelinePosition.fromWidth(anchorEl.offsetLeft, options)
  return new TimelinePosition(measures + 1, beats + 1, fraction)
}

export function moveClipToPos(to : TimelinePosition, clip : Clip, options : TimelinePositionOptions) : Clip {
  to = TimelinePosition.fromPos(to)
  const start = TimelinePosition.fromPos(clip.start)
  const end = TimelinePosition.fromPos(clip.end)
  const startLimit = clip.startLimit ? TimelinePosition.fromPos(clip.startLimit) : null
  const endLimit = clip.endLimit ? TimelinePosition.fromPos(clip.endLimit) : null
  const loopEnd = TimelinePosition.fromPos(clip.loopEnd)

  let width = TimelinePosition.toWidth(start, end, options)
  let loopWidth = TimelinePosition.toWidth(end, loopEnd, options)
  let startLimitWidth = startLimit ? TimelinePosition.toWidth(startLimit, start, options) : 0
  let endLimitWidth = endLimit ? TimelinePosition.toWidth(end, endLimit, options) : 0

  const widthToMBF = TimelinePosition.fromWidth(width, options)
  const loopWidthToMBF = TimelinePosition.fromWidth(loopWidth, options)
  const startLimitWidthToMBF = TimelinePosition.fromWidth(startLimitWidth, options)
  const endLimitWidthToMBF = TimelinePosition.fromWidth(endLimitWidth, options)

  to.snap(options)
  end.setPos(to.add(widthToMBF.measures, widthToMBF.beats, widthToMBF.fraction, false, options, false))
  loopEnd.setPos(end.add(loopWidthToMBF.measures, loopWidthToMBF.beats, loopWidthToMBF.fraction, false, options, false))
  startLimit?.setPos(to.subtract(startLimitWidthToMBF.measures, startLimitWidthToMBF.beats, startLimitWidthToMBF.fraction, false, options, false))
  endLimit?.setPos(end.add(endLimitWidthToMBF.measures, endLimitWidthToMBF.beats, endLimitWidthToMBF.fraction, false, options, false))

  return {...clip, start: to, end, startLimit, endLimit, loopEnd}
}