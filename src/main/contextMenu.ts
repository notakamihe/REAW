import { BrowserWindow, ipcMain, Menu, MenuItemConstructorOptions } from "electron";
import channels from "./../renderer/utils/channels"
import { Clip } from "./../renderer/components/ClipComponent";
import { AutomationLane } from "renderer/components/AutomationLaneTrack";
  
export default class ContextMenuBuilder {
  mainWindow : BrowserWindow;

  constructor(mainWindow : BrowserWindow) {
    this.mainWindow = mainWindow;
  }

  buildContextMenus() {
    ipcMain.on(channels.OPEN_ADD_AUTOMATION_CONTEXT_MENU, (e, lanes : AutomationLane[]) => {
      Menu.buildFromTemplate(this.buildAddAutomationContextMenu(lanes)).popup({
        window: this.mainWindow,
        callback: () => this.mainWindow.webContents.send(channels.CLOSE_ADD_AUTOMATION_CONTEXT_MENU)
      });
    })
      
    ipcMain.on(channels.OPEN_AUTOMATION_TRACK_CONTEXT_MENU, (e, lanes : AutomationLane[]) => {
      Menu.buildFromTemplate(this.buildAutomationTrackContextMenu(lanes)).popup({
        window: this.mainWindow,
        callback: () => this.mainWindow.webContents.send(channels.CLOSE_AUTOMATION_TRACK_CONTEXT_MENU)
      });
    })

    ipcMain.on(channels.OPEN_CLIP_CONTEXT_MENU, (e, clip : Clip) => {
      Menu.buildFromTemplate(this.buildClipContextMenu(clip)).popup({
        window: this.mainWindow,
        callback: () => this.mainWindow.webContents.send(channels.CLOSE_CLIP_CONTEXT_MENU)
      });
    })

    ipcMain.on(channels.OPEN_FX_CHAIN_CONTEXT_MENU, (e, isChainChanged : boolean) => {
      Menu.buildFromTemplate(this.buildFxChainContextMenu(isChainChanged)).popup({
        window: this.mainWindow,
        callback: () => this.mainWindow.webContents.send(channels.CLOSE_FX_CHAIN_CONTEXT_MENU)
      });
    })
   
    ipcMain.on(channels.OPEN_LANE_CONTEXT_MENU, () => {
      Menu.buildFromTemplate(this.buildLaneContextMenu()).popup({
        window: this.mainWindow,
        callback: () => this.mainWindow.webContents.send(channels.CLOSE_LANE_CONTEXT_MENU)
      });
    })

    ipcMain.on(channels.OPEN_NODE_CONTEXT_MENU, () => {
      Menu.buildFromTemplate(this.buildNodeContextMenu()).popup({
        window: this.mainWindow,
        callback: () => this.mainWindow.webContents.send(channels.CLOSE_NODE_CONTEXT_MENU)
      });
    })

    ipcMain.on(channels.OPEN_TRACK_CONTEXT_MENU, () => {
      Menu.buildFromTemplate(this.buildTrackContextMenu()).popup({
        window: this.mainWindow,
        callback: () => this.mainWindow.webContents.send(channels.CLOSE_TRACK_CONTEXT_MENU)
      });
    })

    ipcMain.on(channels.OPEN_TRACK_REGION_CONTEXT_MENU, () => {
      Menu.buildFromTemplate(this.buildTrackRegionContextMenu()).popup({
        window: this.mainWindow,
        callback: () => this.mainWindow.webContents.send(channels.CLOSE_TRACK_REGION_CONTEXT_MENU)
      });
    })
  }

  buildAddAutomationContextMenu(lanes : AutomationLane[]) : MenuItemConstructorOptions[] {
    const menu : MenuItemConstructorOptions[] = [
      ...lanes.map(l => {
        return {
          enabled: !l.show,
          label: l.label,
          click: () => {
            this.mainWindow.webContents.send(channels.ADD_AUTOMATION, l);
          }
        }
      }),
    ]

    return menu;
  }

  buildAutomationTrackContextMenu(lanes : AutomationLane[]) : MenuItemConstructorOptions[] {
    const menu : MenuItemConstructorOptions[] = [
      {
        label: "Switch to...",
        enabled: lanes.length > 0,
        submenu: lanes.length > 0 ? lanes.map(l => {
          return {
            label: l.label,
            click: () => {
              this.mainWindow.webContents.send(channels.SELECT_AUTOMATION, l);
            }
          }
        }) : undefined
      },
      {type: "separator"},
      {
        label: "Clear Automation",
        click: () => {
          this.mainWindow.webContents.send(channels.CLEAR_AUTOMATION);
        }
      },
      {
        label: "Remove Automation",
        click: () => {
          this.mainWindow.webContents.send(channels.REMOVE_AUTOMATION);
        }
      }
    ]

    return menu
  }

  buildClipContextMenu(clip : Clip) {
    const menu : MenuItemConstructorOptions[] = [
      {label: "Cut", role: "cut"},
      {label: "Copy", role: "copy"},
      {
        label: "Delete",
        accelerator: "Delete",
        registerAccelerator: false,
        click: () => {
          this.mainWindow.webContents.send(channels.DELETE_CLIP);
        }
      },
      {type: "separator"},
      {
        label: "Duplicate",
        accelerator: "CmdOrCtrl+D",
        registerAccelerator: false,
        click: () => {
          this.mainWindow.webContents.send(channels.DUPLICATE_CLIP);
        }
      },
      {
        label: "Split",
        accelerator: "CmdOrCtrl+Alt+S",
        registerAccelerator: false,
        click: () => {
          this.mainWindow.webContents.send(channels.SPLIT_CLIP);
        }
      },
      {
        label: "Set Song Region To Clip",
        click: () => {
          this.mainWindow.webContents.send(channels.SET_SONG_REGION_TO_CLIP);
        }
      },
      {type: "separator"},
      {
        label: clip.muted ? "Unmute" : "Mute",
        accelerator: "CmdOrCtrl+Shift+M",
        registerAccelerator: false,
        click: () => {
          this.mainWindow.webContents.send(channels.MUTE_CLIP);
        }
      }
    ]

    return menu;
  }

  buildFxChainContextMenu(isChainChanged : boolean) : MenuItemConstructorOptions[] {
    const menu : MenuItemConstructorOptions[] = [
      {
        label: "Save as New FX Chain",
        click: () => {
          this.mainWindow.webContents.send(channels.SAVE_FX_CHAIN_AS_NEW);
        }
      },
      {type: "separator"},
      {
        label: "Rename",
        click: () => {
          this.mainWindow.webContents.send(channels.RENAME_FX_CHAIN);
        }
      }, 
      {
        enabled: isChainChanged,
        label: "Reset",
        click: () => {
          this.mainWindow.webContents.send(channels.RESET_FX_CHAIN);
        }
      },
      {
        label: "Remove",
        click: () => {
          this.mainWindow.webContents.send(channels.REMOVE_FX_CHAIN);
        }
      }
    ]
  
    return menu;
  }

  buildLaneContextMenu() : MenuItemConstructorOptions[] {
    const menu : MenuItemConstructorOptions[] = [
      {
        label: "Paste At Cursor",
        click: () => {
          this.mainWindow.webContents.send(channels.PASTE_AT_CURSOR_ON_LANE);
        }
      },
      {
        label: "Paste",
        click: () => {
          this.mainWindow.webContents.send(channels.PASTE_ON_LANE);
        }
      }
    ]

    return menu;
  }

  buildNodeContextMenu() : MenuItemConstructorOptions[] {
    const menu : MenuItemConstructorOptions[] = [
      {label: "Cut", role: "cut"},
      {label: "Copy", role: "copy"},
      {
        label: "Delete",
        accelerator: "Delete",
        registerAccelerator: false,
        click: () => {
          this.mainWindow.webContents.send(channels.DELETE_NODE);
        }
      },
      {
        label: "Type Value",
        click: () => {
          this.mainWindow.webContents.send(channels.TYPE_NODE_VALUE);
        }
      }
    ]

    return menu;
  }

  buildTrackContextMenu() : MenuItemConstructorOptions[] {
    const menu : MenuItemConstructorOptions[] = [
      {
        label: "Duplicate",
        click: () => {
          this.mainWindow.webContents.send(channels.DUPLICATE_TRACK);
        }
      },
      {
        label: "Delete",
        click: () => {
          this.mainWindow.webContents.send(channels.DELETE_TRACK);
        }
      },
      {type: "separator"},
      {
        label: "Change Hue",
        click: () => {
          this.mainWindow.webContents.send(channels.CHANGE_TRACK_HUE);
        }
      }
    ]

    return menu;
  }

  buildTrackRegionContextMenu() : MenuItemConstructorOptions[] {
    const menu : MenuItemConstructorOptions[] = [
      {
        label: "Create Clip from Region",
        accelerator: "CmdOrCtrl+Alt+C",
        registerAccelerator: false,
        click: () => {
          this.mainWindow.webContents.send(channels.CREATE_CLIP_FROM_TRACK_REGION);
        }
      }
    ]

    return menu;
  }
}