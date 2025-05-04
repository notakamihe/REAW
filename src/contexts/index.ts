import { createContext, Dispatch, SetStateAction } from "react";
import { 
  AutomationLane, 
  AutomationNode, 
  Clip, 
  FXChainPreset, 
  Preferences, 
  Region, 
  SnapGridSizeOption, 
  TimelinePosition, 
  TimelineSettings, 
  TimelineSpan, 
  TimeSignature, 
  Track, 
  TrackType, 
  WorkstationAudioInputFile 
} from "@/services/types/types";

export enum ClipboardItemType {
  Clip, 
  Node
}

export type ClipboardItem = 
  { type: ClipboardItemType.Clip; item: Clip; } | 
  { type: ClipboardItemType.Node; item: { node: AutomationNode, lane: AutomationLane }; }

interface ClipboardContextType {
  clipboardItem : ClipboardItem | null;
  copy : (item : ClipboardItem) => void
  clear : () => void
}

export const ClipboardContext = createContext<ClipboardContextType | undefined>(undefined);

interface PreferencesContextType {
  darkMode: boolean;
  preferences: Preferences;
  savePreferences: () => void;
  savedPreferences: Preferences;
  setShowPreferences: (show: boolean) => void;
  showPreferences: boolean;
  updatePreferences: (preferences: Preferences) => void;
}

export const PreferencesContext = createContext<PreferencesContextType | undefined>(undefined);

export interface ScrollToItem { 
  type: "cursor" | "track" | "clip" | "node"; 
  params?: { alignment?: "center" | "scrollIntoView" } & Record<string, unknown>; 
}

export interface WorkstationContextType extends WorkstationFile {
  addNode: (track: Track, lane: AutomationLane, node: AutomationNode) => void;
  addTrack: (type: TrackType) => void;
  adjustNumMeasures: (pos?: TimelinePosition) => void;
  allowMenuAndShortcuts: boolean;
  autoGridSize: TimelineSpan;
  consolidateClip: (clip: Clip) => void;
  createAudioClip: (file: WorkstationAudioInputFile, pos: TimelinePosition) => Promise<Clip | null>;
  createClipFromTrackRegion: () => void;
  deleteClip: (clip: Clip) => void;
  deleteNode: (node: AutomationNode) => void;
  deleteTrack: (track: Track) => void;
  duplicateClip: (clip: Clip) => void;
  duplicateTrack: (track: Track) => void;
  fxChainPresets: FXChainPreset[];
  getTrackCurrentValue: (track: Track, lane: AutomationLane | undefined) => { 
    isAutomated: boolean; 
    value: number | null 
  };
  insertClips: (clip: Clip[], track: Track) => void;
  maxPos: TimelinePosition;
  numMeasures: number;
  pasteClip: (pos: TimelinePosition, track?: Track) => void;
  pasteNode: (pos: TimelinePosition, lane?: AutomationLane) => void;
  scrollToItem: ScrollToItem | null;
  setAllowMenuAndShortcuts: Dispatch<SetStateAction<boolean>>;
  setFXChainPresets: Dispatch<SetStateAction<FXChainPreset[]>>;
  setIsLooping: Dispatch<SetStateAction<boolean>>;
  setIsPlaying: Dispatch<SetStateAction<boolean>>;
  setIsRecording: Dispatch<SetStateAction<boolean>>;
  setLane: (track: Track, lane: AutomationLane) => void;
  setMetronome: Dispatch<SetStateAction<boolean>>;
  setMixerHeight: Dispatch<SetStateAction<number>>;
  setNumMeasures: Dispatch<SetStateAction<number>>
  setPlayheadPos: Dispatch<SetStateAction<TimelinePosition>>;
  setScrollToItem: Dispatch<SetStateAction<ScrollToItem | null>>;
  setSelectedClipId: (clip: string | null) => void;
  setSelectedNodeId: (node: string | null) => void;
  setSelectedTrackId: Dispatch<SetStateAction<string | null>>;
  setShowMaster: Dispatch<SetStateAction<boolean>>;
  setShowMixer: Dispatch<SetStateAction<boolean>>;
  setShowTimeRuler: Dispatch<SetStateAction<boolean>>;
  setSnapGridSize: Dispatch<SetStateAction<TimelineSpan>>;
  setSnapGridSizeOption: Dispatch<SetStateAction<SnapGridSizeOption>>;
  setSongRegion: Dispatch<SetStateAction<Region | null>>;
  setStretchAudio: Dispatch<SetStateAction<boolean>>;
  setTimeSignature: (timeSignature: TimeSignature) => void;
  setTrack: (track: Track) => void;
  setTrackRegion: Dispatch<SetStateAction<{ region: Region, trackId: string } | null>>;
  setTracks: Dispatch<SetStateAction<Track[]>>;
  setVerticalScale: Dispatch<SetStateAction<number>>;
  skipToEnd: () => void;
  skipToStart: () => void;
  splitClip: (clip: Clip, pos: TimelinePosition) => void;
  toggleMuteClip: (clip: Clip) => void;
  updateTimelineSettings: (settings: TimelineSettings | ((prev: TimelineSettings) => TimelineSettings)) => void;
};

interface WorkstationFile {
  isLooping: boolean;
  isPlaying: boolean;
  isRecording: boolean;
  masterTrack: Track;
  metronome: boolean;
  mixerHeight: number;
  playheadPos: TimelinePosition;
  selectedClipId: string | null;
  selectedNodeId: string | null;
  selectedTrackId: string | null;
  showMaster: boolean;
  showMixer: boolean;
  showTimeRuler: boolean;
  snapGridSize: TimelineSpan;
  snapGridSizeOption: SnapGridSizeOption;
  songRegion: Region | null;
  stretchAudio: boolean;
  trackRegion: { region: Region, trackId: string } | null;
  timelineSettings: TimelineSettings;
  tracks: Track[];
  verticalScale: number;
}

export const WorkstationContext = createContext<WorkstationContextType | undefined>(undefined);