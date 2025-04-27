import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  ipcRenderer: {
    invoke: async (channel: string, ...args: unknown[]) => {
      return ipcRenderer.invoke(channel, ...args);
    },
    on: (channel: string, func: (...args: unknown[]) => void) => {
      ipcRenderer.on(channel, (_event, ...args) => func(...args));
    },
    once: (channel: string, func: ((...args: unknown[]) => void)) => {
      ipcRenderer.once(channel, (_event, ...args) => func(...args));
    },
    removeAllListeners: (channel: string) => {
      ipcRenderer.removeAllListeners(channel);
    },
    send: (channel: string, ...args: unknown[]) => {
      ipcRenderer.send(channel, ...args);
    }
  }
});
