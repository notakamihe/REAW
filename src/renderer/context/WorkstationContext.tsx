import React from "react"
import { GridSize, SnapSize, TimeSignature } from "renderer/types/types";
import { TimelinePositionOptions } from "renderer/types/TimelinePosition";
import { BAR_WIDTH } from "renderer/utils";

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
  setAutoSnap : React.Dispatch<React.SetStateAction<boolean>>
};

export const WorkstationContext = React.createContext<WorkflowContextType | undefined>(undefined);

export const WorkstationProvider: React.FC = ({ children }) => {
  const [verticalScale, setVerticalScale] = React.useState(1);
  const [horizontalScale, setHorizontalScale] = React.useState(1);
  const [gridSize, setGridSize] = React.useState(GridSize.ThirtySecondBar);
  const [snapSize, setSnapSize] = React.useState(SnapSize.ThirtySecondBar);
  const [timeSignature, setTimeSignature] = React.useState({beats: 4, noteValue: 4});
  const [autoSnap, setAutoSnap] = React.useState(true);

  const [timelinePosOptions, setTimelinePosOptions] = React.useState({
    snapSize, 
    barWidth: BAR_WIDTH, 
    horizontalScale,
    timeSignature
  });

  React.useEffect(() => {
    setTimelinePosOptions({
      snapSize, 
      barWidth: BAR_WIDTH, 
      horizontalScale,
      timeSignature
    });
  }, [horizontalScale, snapSize, timeSignature])

  React.useEffect(() => {
    if (autoSnap) {
      if (horizontalScale < 0.075) {
        setSnapSize(SnapSize.Measure)
      } else if (horizontalScale < 0.1153) {
        setSnapSize(SnapSize.HalfMeasure)
      } else if (horizontalScale < 0.1738) {
        setSnapSize(SnapSize.Bar)
      } else if (horizontalScale < 0.3848) {
        setSnapSize(SnapSize.HalfBar)
      } else if (horizontalScale < 0.6791) {
        setSnapSize(SnapSize.QuarterBar)
      } else if (horizontalScale < 1.8069) {
        setSnapSize(SnapSize.EighthBar)
      } else if (horizontalScale < 3.6147) {
        setSnapSize(SnapSize.SixteenthBar)
      } else if (horizontalScale < 7.2323) {
        setSnapSize(SnapSize.ThirtySecondBar)
      } else if (horizontalScale < 14.4647) {
        setSnapSize(SnapSize.SixtyFourthBar)
      } else {
        setSnapSize(SnapSize.HundredTwentyEighthBar)
      }
    }
  }, [horizontalScale])

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
        setAutoSnap
      }}
    >
      {children}
    </WorkstationContext.Provider>
  );
};