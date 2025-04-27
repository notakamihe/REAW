import { BrowserWindow, dialog, ipcMain } from "electron";
import { readFileSync } from "fs";
import { TrackType } from "../src/services/types/types";
import { TRACK_FILE_UPLOAD } from "../src/services/electron/channels";
 
export default function buildHandlers(window: BrowserWindow) {
  ipcMain.handle(TRACK_FILE_UPLOAD, (_, type: TrackType) => handleTrackInsertFiles(window, type));
}

function handleTrackInsertFiles(window: BrowserWindow, trackType: TrackType) {
  let name = "";
  let mimetypes: Record<string, string> = {};

  switch (trackType) {
    case TrackType.Audio:
      name = "Audio Files"
      mimetypes = {
        aac: "audio/aac",
        flac: "audio/flac",
        ogg: "audio/ogg",
        mp3: "audio/mpeg",
        m4a: "audio/x-m4a",
        wav: "audio/wav",
        mp4: "video/mp4"
      };
      break;
    case TrackType.Midi:
      name = "MIDI Files"
      mimetypes = { mid: "audio/midi", midi: "audio/midi" };
      break;
  }

  const filePaths = dialog.showOpenDialogSync(window, {
    properties: ["openFile", "multiSelections"], 
    filters: [{ name, extensions: Object.keys(mimetypes) }]
  });

  if (filePaths) {
    const files = filePaths.map(p => {
      const filename = p.replace(/^.*[\\\/]/, '');
      const idx = filename.lastIndexOf(".");
      const name = filename.substring(0, idx);
      const extension = filename.substring(idx + 1, p.length);
      
      const buffer = readFileSync(p);
      
      return {buffer, name, type: mimetypes[extension.toLowerCase()]};
    });

    return files;
  } 

  return [];
}