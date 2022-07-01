import { contextBridge, ipcRenderer, IpcRendererEvent } from 'electron';

contextBridge.exposeInMainWorld('electron', {
  ipcRenderer: {
    invoke: async (channel: string, ...args: unknown[]) => {
      return ipcRenderer.invoke(channel, ...args);
    },
    on(channel: string, func: (...args: unknown[]) => void) {
      const subscription = (_event: IpcRendererEvent, ...args: unknown[]) => func(...args);
      ipcRenderer.on(channel, subscription);
      
      return () => ipcRenderer.removeListener(channel, subscription);
    },
    once(channel: string, func: (...args: unknown[]) => void) {
      ipcRenderer.once(channel, (_event, ...args) => func(...args));
    },
    send(channel: string, args: unknown[]) {
      ipcRenderer.send(channel, args);
    },
    removeAllListeners(channel?: string) {
      if (channel) {
        ipcRenderer.removeAllListeners(channel);
      } else {
        ipcRenderer.eventNames().forEach(n => {
          ipcRenderer.removeAllListeners(String(n));
        })
      }
    }
  },
});
