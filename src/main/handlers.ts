import channels from "./../renderer/utils/channels";
import { BrowserWindow, dialog, ipcMain } from "electron";
import { readFileSync } from "fs";
 
export default function buildHandlers(window: BrowserWindow) {
  ipcMain.handle(channels.HANDLE_INSERT_AUDIO_FILE, () => handleInsertAudioFile(window));
}

function handleInsertAudioFile(window: BrowserWindow) {
  const filePaths = dialog.showOpenDialogSync(window, {
    properties: ["openFile"], 
    filters: [
      {name: "Audio", extensions: ["wav", "mp3", "ogg", "flac", "aiff", "wma"]}
    ]
  });

  if (filePaths) {
    const files = filePaths.map(p => {
      const buffer = readFileSync(p);
      const split = p.replace(/^.*[\\\/]/, '').split(".");

      return {buffer, data: buffer.toString("base64"), name: split[0], extension: split[1]};
    });

    return files;
  } 

  return null;
}