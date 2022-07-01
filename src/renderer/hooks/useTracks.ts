import React, { SetStateAction } from "react";
import {Track} from "./../types/types"

export default function useTracks(initialState: Track[] | (() => Track[])) : 
  [Track[], React.Dispatch<SetStateAction<Track[]>>, (track : Track) => void] 
{
  const [tracks, setTracks] = React.useState(initialState);

  const setTrack = (track : Track) => {
    const newTracks = tracks.slice()
    newTracks[newTracks.findIndex(t => t.id === track.id)] = track
    setTracks(newTracks)
  }

  return [tracks, setTracks, setTrack]
}