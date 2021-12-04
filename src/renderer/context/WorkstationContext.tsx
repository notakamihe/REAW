import React from "react"
import { GridSize, SnapSize, TimeSignature } from "renderer/types/types";
import TimelinePosition, { TimelinePositionOptions } from "renderer/types/TimelinePosition";
import { BEAT_WIDTH } from "renderer/utils";

export interface WorkflowContextType {
  verticalScale : number
  setVerticalScale: React.Dispatch<React.SetStateAction<number>>
  horizontalScale : number
  setHorizontalScale: React.Dispatch<React.SetStateAction<number>>
  gridSize : GridSize
  setGridSize: React.Dispatch<React.SetStateAction<GridSize>>,
  snapSize : SnapSize
  setSnapSize : React.Dispatch<React.SetStateAction<SnapSize>>,
  timelinePosOptions : TimelinePositionOptions,
  setTimelinePosOptions : React.Dispatch<React.SetStateAction<TimelinePositionOptions>>,
  timeSignature : TimeSignature
  setTimeSignature : React.Dispatch<React.SetStateAction<TimeSignature>>,
  autoSnap : boolean,
  setAutoSnap : React.Dispatch<React.SetStateAction<boolean>>,
  cursorPos : TimelinePosition,
  setCursorPos : React.Dispatch<React.SetStateAction<TimelinePosition>>,
  tempo : number,
  setTempo : React.Dispatch<React.SetStateAction<number>>,
  isPlaying : boolean,
  setIsPlaying : React.Dispatch<React.SetStateAction<boolean>>,
  isLooping : boolean,
  setIsLooping : React.Dispatch<React.SetStateAction<boolean>>,
  isRecording : boolean,
  setIsRecording : React.Dispatch<React.SetStateAction<boolean>>,
  metronome : boolean,
  setMetronome : React.Dispatch<React.SetStateAction<boolean>>
};

export const WorkstationContext = React.createContext<WorkflowContextType | undefined>(undefined);

export const WorkstationProvider: React.FC = ({ children }) => {
  const [verticalScale, setVerticalScale] = React.useState(1);
  const [horizontalScale, setHorizontalScale] = React.useState(1);
  const [gridSize, setGridSize] = React.useState(GridSize.ThirtySecondBeat);
  const [snapSize, setSnapSize] = React.useState(SnapSize.None);
  const [timeSignature, setTimeSignature] = React.useState({beats: 4, noteValue: 4});
  const [autoSnap, setAutoSnap] = React.useState(false);
  const [cursorPos, setCursorPos] = React.useState(TimelinePosition.fromPos(TimelinePosition.start))
  const [tempo, setTempo] = React.useState(120);
  const [isPlaying, setIsPlaying] = React.useState(false);
  const [isLooping, setIsLooping] = React.useState(false);
  const [isRecording, setIsRecording] = React.useState(false);
  const [metronome, setMetronome] = React.useState(false);

  const [timelinePosOptions, setTimelinePosOptions] = React.useState({
    snapSize, 
    beatWidth: BEAT_WIDTH, 
    horizontalScale,
    timeSignature,
    tempo
  });

  React.useEffect(() => {
    setTimelinePosOptions({
      snapSize, 
      beatWidth: BEAT_WIDTH, 
      horizontalScale,
      timeSignature,
      tempo
    });
  }, [horizontalScale, snapSize, timeSignature, tempo])

  React.useEffect(() => {
    if (autoSnap) {
      if (horizontalScale < 0.075) {
        setSnapSize(SnapSize.Measure)
      } else if (horizontalScale < 0.1153) {
        setSnapSize(SnapSize.HalfMeasure)
      } else if (horizontalScale < 0.1738) {
        setSnapSize(SnapSize.Beat)
      } else if (horizontalScale < 0.3848) {
        setSnapSize(SnapSize.HalfBeat)
      } else if (horizontalScale < 0.6791) {
        setSnapSize(SnapSize.QuarterBeat)
      } else if (horizontalScale < 1.8069) {
        setSnapSize(SnapSize.EighthBeat)
      } else if (horizontalScale < 3.6147) {
        setSnapSize(SnapSize.SixteenthBeat)
      } else if (horizontalScale < 7.2323) {
        setSnapSize(SnapSize.ThirtySecondBeat)
      } else if (horizontalScale < 14.4647) {
        setSnapSize(SnapSize.SixtyFourthBeat)
      } else {
        setSnapSize(SnapSize.HundredTwentyEighthBeat)
      }
    }
  }, [horizontalScale, autoSnap])

  return (
    <WorkstationContext.Provider 
      value={{ 
        verticalScale, 
        setVerticalScale, 
        horizontalScale, 
        setHorizontalScale,
        gridSize,
        setGridSize,
        snapSize,
        setSnapSize,
        timelinePosOptions,
        setTimelinePosOptions,
        timeSignature,
        setTimeSignature,
        autoSnap,
        setAutoSnap,
        cursorPos,
        setCursorPos,
        tempo,
        setTempo,
        isPlaying,
        setIsPlaying,
        isLooping,
        setIsLooping,
        isRecording,
        setIsRecording,
        metronome,
        setMetronome
      }}
    >
      {children}
    </WorkstationContext.Provider>
  );
};