import React from "react";
import { useStateWCallback } from ".";
import {Track} from "./../components/TrackComponent"

export default function useTracks(initialState: Track[] | (() => Track[])) : 
[Track[], (tracks : Track[], callback? : () => void) => void, (track : Track, callback? : () => void) => void] {
  const [tracks, setTracks] = useStateWCallback<Track[]>(initialState);

  const setTrack = (track : Track, callback? : () => void) => {
    const newTracks = tracks.slice()
    newTracks[newTracks.findIndex(t => t.id === track.id)] = track
    setTracks(newTracks, callback)
  }

  return [tracks, setTracks, setTrack]
}