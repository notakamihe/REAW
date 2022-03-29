import {Menu, BrowserWindow, MenuItemConstructorOptions} from 'electron';
import channels from "./../renderer/utils/channels";

interface DarwinMenuItemConstructorOptions extends MenuItemConstructorOptions {
  selector?: string;
  submenu?: DarwinMenuItemConstructorOptions[] | Menu;
}

export default class MenuBuilder {
  mainWindow: BrowserWindow;

  constructor(mainWindow: BrowserWindow) {
    this.mainWindow = mainWindow;
  }

  buildMenu(): Menu {
    const template =
      process.platform === 'darwin'
        ? this.buildDarwinTemplate()
        : this.buildDefaultTemplate();

    const menu = Menu.buildFromTemplate(template);
    Menu.setApplicationMenu(menu);

    return menu;
  }

  buildBaseTemplate() {
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
        {
          label: "Save",
          accelerator: "CmdOrCtrl+S",
        },
        {
          label: "Save as...",
          accelerator: "CmdOrCtrl+Shift+S",
        },
        {type: "separator"},
        {
          label: "Export",
          accelerator: "CmdOrCtrl+E",
        }
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
        { 
          label: "Preferences",
          accelerator: "CmdOrCtrl+,",
          click: () => {
            this.mainWindow.webContents.send(channels.OPEN_PREFERENCES);
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
            this.mainWindow.webContents.send(channels.TOGGLE_MASTER_TRACK);
          }
        }
      ]
    }

    const subMenuView : MenuItemConstructorOptions = {
      label: "View",
      submenu: [
        {
          label: "Toggle Mixer",
          accelerator: "CmdOrCtrl+M",
          click: () => {
            this.mainWindow.webContents.send(channels.TOGGLE_MIXER)
          }
        },
        {type: "separator"},
      ]
    }

    const subMenuHelp : MenuItemConstructorOptions = {
      label: "Help",
      submenu: []
    }

    return {file: subMenuFile, edit: subMenuEdit, track: subMenuTrack, view: subMenuView, help: subMenuHelp};
  }

  buildDarwinTemplate(): MenuItemConstructorOptions[] {
    const baseTemplate = this.buildBaseTemplate();

    const subMenuAbout: DarwinMenuItemConstructorOptions = {
      label: 'REAW',
      submenu: [
        { label: "About REAW", role: 'about' },
        { type: 'separator' },
        { 
          label: "Preferences",
          accelerator: "CmdOrCtrl+,",
          registerAccelerator: false,
          click: () => {
            this.mainWindow.webContents.send(channels.OPEN_PREFERENCES);
          }
        },
        { type: 'separator' },
        { role: 'services' },
        { type: 'separator' },
        { label: "Hide REAW", role: 'hide' },
        { role: 'hideOthers' },
        { role: 'unhide' },
        { type: 'separator' },
        { label: "Quit REAW", role: 'quit' }
      ],
    };

    const subMenuViewDev: MenuItemConstructorOptions[] = [
      {type: "separator"},
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
      },
      {type: "separator"},
      {
        label: "Toggle Full Screen",
        accelerator: "Ctrl+Command+F",
        click: () => {
          this.mainWindow.setFullScreen(!this.mainWindow.isFullScreen());
        }
      }
    ];

    const subMenuViewProd : MenuItemConstructorOptions[] = [
      {type: "separator"},
      {
        label: 'Toggle Full Screen',
        accelerator: 'Ctrl+Command+F',
        click: () => {
          this.mainWindow.setFullScreen(!this.mainWindow.isFullScreen());
        },
      }
    ]

    const subMenuWindow: DarwinMenuItemConstructorOptions = {
      label: 'Window',
      submenu: [
        { label: 'Minimize', role: 'minimize'},
        { label: 'Zoom', role: 'zoom' },
        { type: 'separator' },
        { label: 'Bring All to Front', selector: 'arrangeInFront:' },
      ],
    };

    const subMenuView = baseTemplate.view

    if (process.env.NODE_ENV === 'development' || process.env.DEBUG_PROD === 'true')
      (subMenuView.submenu as MenuItemConstructorOptions[])!.push(...subMenuViewDev);
    else
      (subMenuView.submenu as MenuItemConstructorOptions[])!.push(...subMenuViewProd);

    return [subMenuAbout, baseTemplate.file, baseTemplate.edit, baseTemplate.track, subMenuView, subMenuWindow, baseTemplate.help];
  }

  buildDefaultTemplate() : MenuItemConstructorOptions[] {
    const baseTemplate = this.buildBaseTemplate();

    const subMenuFile : MenuItemConstructorOptions = {
      label: '&File',
      submenu: [
        ...baseTemplate.file.submenu! as MenuItemConstructorOptions[],
        { type: 'separator' },
        { label: '&Close', accelerator: 'Alt+F4', role: 'close' }
      ]
    }

    const subMenuViewDev : MenuItemConstructorOptions[] = [
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
          this.mainWindow.setFullScreen(
            !this.mainWindow.isFullScreen()
          );
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
      {type: "separator"},
      {
        label: "Toggle Full Screen",
        accelerator: "F11",
        click: () => {
          this.mainWindow.setFullScreen(!this.mainWindow.isFullScreen())
        }
      }
    ]

    const subMenuViewProd : MenuItemConstructorOptions[] = [
      {
        label: 'Toggle &Full Screen',
        accelerator: 'F11',
        click: () => {
          this.mainWindow.setFullScreen(!this.mainWindow.isFullScreen());
        },
      }
    ]

    const subMenuView = baseTemplate.view

    if (process.env.NODE_ENV === 'development' || process.env.DEBUG_PROD === 'true')
      (subMenuView.submenu as MenuItemConstructorOptions[])!.push(...subMenuViewDev);
    else
      (subMenuView.submenu as MenuItemConstructorOptions[])!.push(...subMenuViewProd);

    const subMenuWindow : MenuItemConstructorOptions = {
      label: '&Window',
      submenu: []
    }

    return [subMenuFile, baseTemplate.edit, baseTemplate.track, subMenuView, subMenuWindow, baseTemplate.help];
  }
}
