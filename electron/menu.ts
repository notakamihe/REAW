import { app, Menu, BrowserWindow, MenuItemConstructorOptions } from 'electron';
import { ADD_TRACK, OPEN_PREFERENCES, TOGGLE_MASTER_TRACK, TOGGLE_MIXER } from "../src/services/electron/channels";
import { TrackType } from "../src/services/types/types";

export default class MenuBuilder {
  mainWindow: BrowserWindow;

  constructor(mainWindow: BrowserWindow) {
    this.mainWindow = mainWindow;
  }

  buildMenu(): Menu {
    let template;

    if (process.platform === "darwin")
      template = this.buildDarwinTemplate();
    else
      template = this.buildDefaultTemplate();

    const menu = Menu.buildFromTemplate(template);
    Menu.setApplicationMenu(menu);

    return menu;
  }

  private buildBaseTemplate() {
    const subMenuFile : MenuItemConstructorOptions = {
      label: "File",
      submenu: [
        {
          label: "New",
          accelerator: "CmdOrCtrl+N",
        },
        {
          label: "Open",
          accelerator: "CmdOrCtrl+O"
        },
        { type: "separator" },
        {
          label: "Save",
          accelerator: "CmdOrCtrl+S",
        },
        {
          label: "Save as...",
          accelerator: "CmdOrCtrl+Shift+S",
        },
        { type: "separator" },
        {
          label: "Export",
          accelerator: "CmdOrCtrl+E",
        },
        { type: "separator" },
        { label: 'Close', role: "close" }
      ]
    }

    const subMenuEdit: MenuItemConstructorOptions = {
      label: 'Edit',
      submenu: [
        { label: 'Undo', accelerator: 'CmdOrCtrl+Z', role: "undo" },
        { label: 'Redo', accelerator: 'Shift+CmdOrCtrl+Z', role: "redo" },
        { type: 'separator' },
        { label: 'Cut', accelerator: 'CmdOrCtrl+X', role: "cut" },
        { label: 'Copy', accelerator: 'CmdOrCtrl+C', role: "copy" },
        { label: 'Paste', accelerator: 'CmdOrCtrl+V', role: "paste" },
        { type: "separator" },
        { label: "Select All", role: "selectAll", accelerator: "CmdOrCtrl+A" },
        { type: "separator" },
        { 
          label: "Preferences",
          accelerator: "CmdOrCtrl+,",
          click: () => {
            this.mainWindow.webContents.send(OPEN_PREFERENCES);
          }
        }
      ],
    };

    const subMenuTrack : MenuItemConstructorOptions = {
      label: "Track",
      submenu: [
        {
          label: "Toggle Master Track",
          accelerator: "CmdOrCtrl+Alt+M",
          click: () => {
            this.mainWindow.webContents.send(TOGGLE_MASTER_TRACK);
          }
        },
        { type: "separator" },
        {
          label: "Insert Audio Track",
          click: () => {
            this.mainWindow.webContents.send(ADD_TRACK, TrackType.Audio);
          }
        },
        {
          label: "Insert MIDI Track",
          click: () => {
            this.mainWindow.webContents.send(ADD_TRACK, TrackType.Midi);
          }
        },
        {
          label: "Insert Step Sequencer Track",
          click: () => {
            this.mainWindow.webContents.send(ADD_TRACK, TrackType.Sequencer);
          }
        },
      ]
    }

    const subMenuView : MenuItemConstructorOptions = {
      label: "View",
      submenu: [
        {
          label: "Toggle Mixer",
          accelerator: "CmdOrCtrl+M",
          click: () => {
            this.mainWindow.webContents.send(TOGGLE_MIXER)
          }
        },
        {type: "separator"},
      ]
    }

    const subMenuHelp : MenuItemConstructorOptions = {
      label: "Help",
      submenu: []
    }

    return {
      file: subMenuFile,
      edit: subMenuEdit,
      track: subMenuTrack,
      view: subMenuView,
      help: subMenuHelp
    };
  }

  private buildDarwinTemplate(): MenuItemConstructorOptions[] {
    const base = this.buildBaseTemplate();

    const subMenuAbout: MenuItemConstructorOptions = {
      label: 'REAW',
      submenu: [
        { label: "About REAW", role: 'about' },
        { type: 'separator' },
        { 
          label: "Preferences",
          accelerator: "CmdOrCtrl+,",
          registerAccelerator: false,
          click: () => {
            this.mainWindow.webContents.send(OPEN_PREFERENCES);
          }
        },
        { type: 'separator' },
        { label: 'Services', role: 'services', submenu: [], registerAccelerator: false },
        { type: 'separator' },
        { label: "Hide REAW", role: 'hide' },
        { role: 'hideOthers' },
        { role: 'unhide' },
        { type: 'separator' },
        { label: "Quit REAW", role: 'quit' }
      ],
    };

    if (!app.isPackaged) {
      (base.view.submenu as MenuItemConstructorOptions[]).push(
        {
          label: 'Reload',
          accelerator: 'Command+R',
          click: () => {
            this.mainWindow.webContents.reload();
          },
        },
        {
          label: 'Toggle Full Screen',
          accelerator: 'Ctrl+Command+F',
          click: () => {
            this.mainWindow.setFullScreen(!this.mainWindow.isFullScreen());
          },
        },
        {
          label: 'Toggle Developer Tools',
          accelerator: 'Alt+Command+I',
          click: () => {
            this.mainWindow.webContents.toggleDevTools();
          },
        },
        {type: "separator"},
        {
          label: "Actual Size",
          accelerator: "CmdOrCtrl+0",
          click: () => {
            this.mainWindow.webContents.setZoomLevel(0);
          }
        },
        {
          label: "Zoom In",
          accelerator: "CmdOrCtrl+=",
          click: () => {
            this.mainWindow.webContents.setZoomLevel(this.mainWindow.webContents.getZoomLevel() + 0.1);
          }
        },
        {
          label: "Zoom Out",
          accelerator: "CmdOrCtrl+-",
          click: () => {
            this.mainWindow.webContents.setZoomLevel(this.mainWindow.webContents.getZoomLevel() - 0.1);
          }
        }
      );
    }

    const subMenuWindow: MenuItemConstructorOptions = {
      label: 'Window',
      submenu: [
        { label: 'Minimize', role: 'minimize'},
        { label: 'Zoom', role: 'zoom' },
        { type: 'separator' },
        { label: 'Bring All to Front', role: "front" },
      ],
    };

    return [subMenuAbout, base.file, base.edit, base.track, base.view, subMenuWindow, base.help];
  }

  private buildDefaultTemplate() : MenuItemConstructorOptions[] {
    const base = this.buildBaseTemplate();

    if (!app.isPackaged) {
      (base.view.submenu as MenuItemConstructorOptions[]).push(
        {
          label: '&Reload',
          accelerator: 'Ctrl+R',
          click: () => {
            this.mainWindow.webContents.reload();
          },
        },
        {
          label: 'Toggle &Full Screen',
          accelerator: 'F11',
          click: () => {
            this.mainWindow.setFullScreen(!this.mainWindow.isFullScreen());
          },
        },
        {
          label: 'Toggle &Developer Tools',
          accelerator: 'Alt+Ctrl+I',
          click: () => {
            this.mainWindow.webContents.toggleDevTools();
          },
        },
        {type: "separator"},
        {
          label: "Actual Size",
          accelerator: "Ctrl+0",
          click: () => {
            this.mainWindow.webContents.setZoomLevel(0);
          }
        },
        {
          label: "Zoom In",
          accelerator: "Ctrl+=",
          click: () => {
            this.mainWindow.webContents.setZoomLevel(this.mainWindow.webContents.getZoomLevel() + 0.1);
          }
        },
        {
          label: "Zoom Out",
          accelerator: "Ctrl+-",
          click: () => {
            this.mainWindow.webContents.setZoomLevel(this.mainWindow.webContents.getZoomLevel() - 0.1);
          }
        },
      );
    }

    (base.view.submenu as MenuItemConstructorOptions[]).push(
      {
        label: 'Toggle &Full Screen',
        accelerator: 'F11',
        click: () => {
          this.mainWindow.setFullScreen(!this.mainWindow.isFullScreen());
        },
      }
    );

    const subMenuWindow : MenuItemConstructorOptions = {
      label: '&Window',
      submenu: []
    }

    return [base.file, base.edit, base.track, base.view, subMenuWindow, base.help];
  }
}
