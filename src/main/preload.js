const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electron', {
  ipcRenderer: {
    myPing() {
      ipcRenderer.send('ipc-example', 'ping');
    },
    on(channel, func) {
      ipcRenderer.on(channel, (event, ...args) => {
        func(...args)
      });
    },
    once(channel, func) {
      const validChannels = ['ipc-example'];
      if (validChannels.includes(channel)) {
        // Deliberately strip event as it includes `sender`
        ipcRenderer.once(channel, (event, ...args) => func(...args));
      }
    },
    send(channel, ...args) {
      ipcRenderer.send(channel, ...args);
    },
    removeAllListeners(channel) {
      if (channel) ipcRenderer.removeAllListeners(channel)
      else ipcRenderer.removeAllListeners()
    }
  },
});
