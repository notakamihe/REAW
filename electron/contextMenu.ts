import { BrowserWindow, ipcMain, Menu, MenuItemConstructorOptions, shell } from "electron"
import { AutomationLane, AutomationMode, Clip, ContextMenuType, Track, TrackType } from "./../src/services/types/types";
import { CLOSE_CONTEXT_MENU, OPEN_CONTEXT_MENU, SELECT_CONTEXT_MENU_ITEM } from "./../src/services/electron/channels" 

export default class ContextMenuBuilder {
  mainWindow: BrowserWindow;

  constructor(mainWindow : BrowserWindow) {
    this.mainWindow = mainWindow;
  }

  buildContextMenus() {
    ipcMain.on(OPEN_CONTEXT_MENU, (_, contextMenuType: ContextMenuType, params: Record<string, any>) => {
      let menu: MenuItemConstructorOptions[] = [];

      switch (contextMenuType) {
        case ContextMenuType.AddAutomationLane:
          menu = this.buildAddAutomationContextMenu(params.lanes);
          break;
        case ContextMenuType.Automation:
          menu = this.buildAutomationContextMenu(!!params.showPasteOptions, params.disablePaste);
          break;
        case ContextMenuType.AutomationMode:
          menu = this.buildAutomationModesContextMenu(params.mode);
          break;
        case ContextMenuType.Clip:
          menu = this.buildClipContextMenu(params.clip);
          break;
        case ContextMenuType.FXChainPreset:
          menu = this.buildFXChainPresetMenu(params.presetModified);
          break;
        case ContextMenuType.Lane:
          menu = this.buildLaneContextMenu(params.track, params.disablePaste);
          break;
        case ContextMenuType.Node:
          menu = this.buildNodeContextMenu();
          break;
        case ContextMenuType.Region:
          menu = this.buildRegionContextMenu(!!params.trackRegion);
          break;
        case ContextMenuType.Text:
          menu = this.buildDefaultContextMenu(params.selectedText);
          break;
        case ContextMenuType.Track:
          menu = this.buildTrackContextMenu();
          break;
      }

      if (menu.length) {
        Menu.buildFromTemplate(menu).popup({ 
          window: this.mainWindow, 
          callback: () => this.mainWindow.webContents.send(CLOSE_CONTEXT_MENU) 
        });
      }
    })
  }

  buildAddAutomationContextMenu(lanes: AutomationLane[]) : MenuItemConstructorOptions[] {
    const menu : MenuItemConstructorOptions[] = [
      ...lanes.map(lane => {
        return {
          enabled: !lane.show,
          label: lane.label,
          click: () => this.mainWindow.webContents.send(SELECT_CONTEXT_MENU_ITEM, { lane })
        }
      }),
    ]

    return menu;
  }

  buildAutomationContextMenu(showPasteOptions?: boolean, disablePaste?: boolean) : MenuItemConstructorOptions[] {
    const menu : MenuItemConstructorOptions[] = [
      {
        label: "Hide Automation",
        click: () => {
          this.mainWindow.webContents.send(SELECT_CONTEXT_MENU_ITEM, { action: 0 });
        }
      },
      {
        label: "Clear Automation",
        click: () => {
          this.mainWindow.webContents.send(SELECT_CONTEXT_MENU_ITEM, { action: 1 });
        }
      },
      {
        label: "Remove Automation",
        click: () => {
          this.mainWindow.webContents.send(SELECT_CONTEXT_MENU_ITEM, { action: 2 });
        }
      }
    ]

    if (showPasteOptions) {
      menu.push(
        { type: "separator" }, 
        {
          label: "Paste At Playhead",
          accelerator: "CmdOrCtrl+V",
          click: () => {
            this.mainWindow.webContents.send(SELECT_CONTEXT_MENU_ITEM, { action: 3 });
          },
          enabled: !disablePaste
        },
        {
          label: "Paste",
          click: () => {
            this.mainWindow.webContents.send(SELECT_CONTEXT_MENU_ITEM, { action: 4 });
          },
          enabled: !disablePaste
        }
      )
    }

    return menu;
  }

  buildAutomationModesContextMenu(mode: AutomationMode) {
    const menu: MenuItemConstructorOptions[] = Object.values(AutomationMode).map(value => ({
      type: "radio",
      label: value,
      checked: mode === value,
      click: () => this.mainWindow.webContents.send(SELECT_CONTEXT_MENU_ITEM, { mode: value })
    }))

    return menu;
  }

  buildClipContextMenu(clip: Clip) {
    const menu : MenuItemConstructorOptions[] = [
      {label: "Cut", role: "cut", accelerator: "CmdOrCtrl+X"},
      {label: "Copy", role: "copy", accelerator: "CmdOrCtrl+C"},
      {
        label: "Delete",
        accelerator: "Delete",
        registerAccelerator: false,
        click: () => {
          this.mainWindow.webContents.send(SELECT_CONTEXT_MENU_ITEM, { action: 0 });
        }
      },
      {type: "separator"},
      {
        label: "Rename",
        accelerator: "F2",
        registerAccelerator: false,
        click: () => {
          this.mainWindow.webContents.send(SELECT_CONTEXT_MENU_ITEM, { action: 1 });
        }
      },
      {
        label: "Set Song Region To Clip",
        click: () => {
          this.mainWindow.webContents.send(SELECT_CONTEXT_MENU_ITEM, { action: 2 });
        }
      },
      {type: "separator"},
      {
        label: "Duplicate",
        accelerator: "CmdOrCtrl+D",
        registerAccelerator: false,
        click: () => {
          this.mainWindow.webContents.send(SELECT_CONTEXT_MENU_ITEM, { action: 3 });
        }
      },
      {
        label: "Split",
        accelerator: "CmdOrCtrl+Alt+S",
        registerAccelerator: false,
        click: () => {
          this.mainWindow.webContents.send(SELECT_CONTEXT_MENU_ITEM, { action: 4 });
        }
      },
      {
        label: "Consolidate",
        accelerator: "CmdOrCtrl+Shift+C",
        registerAccelerator: false,
        click: () => {
          this.mainWindow.webContents.send(SELECT_CONTEXT_MENU_ITEM, { action: 5 });
        }
      },
      {type: "separator"},
      {
        label: clip.muted ? "Unmute" : "Mute",
        accelerator: "CmdOrCtrl+Shift+M",
        registerAccelerator: false,
        click: () => {
          this.mainWindow.webContents.send(SELECT_CONTEXT_MENU_ITEM, { action: 6 });
        }
      }
    ]

    if (clip.type === TrackType.Audio && clip.audio) {
      menu.push(
        {type: "separator", visible: Boolean(clip.audio)},
        {
          label: "Effects",
          submenu: [
            {
              label: "Reverse",
              click: () => {
                this.mainWindow.webContents.send(SELECT_CONTEXT_MENU_ITEM, { action: 7 });
              }
            }
          ]
        }
      )
    }

    return menu;
  }

  buildDefaultContextMenu(selectedText: string) {
    const trimmed = selectedText.trim();
    let menu: MenuItemConstructorOptions[] = []

    if (process.platform === "darwin" && trimmed.length > 0) {
      menu.push(
        {
          label: `Look Up "${trimmed}"`,
          click: () => {
            this.mainWindow.webContents.showDefinitionForSelection();
          }
        },
        {
          label: "Search With Google",
          click: () => {
            shell.openExternal(`https://google.com/search?q=${encodeURIComponent(trimmed)}`);
          }
        },
        {type: "separator"}
      );
    }

    menu.push(
      {label: "Undo", role: "undo", accelerator: "CmdOrCtrl+Z"},
      {label: "Redo", role: "redo", accelerator: "Shift+CmdOrCtrl+Z"},
      {type: "separator"},
      {
        label: "Cut",
        accelerator: "CmdOrCtrl+X",
        enabled: selectedText.length > 0,
        click: () => this.mainWindow.webContents.cut()
      },
      {
        label: "Copy",
        accelerator: "CmdOrCtrl+C",
        enabled: selectedText.length > 0,
        click: () => this.mainWindow.webContents.copy()
      },
      {label: "Paste", role: "paste", accelerator: "CmdOrCtrl+V"},
      {type: "separator"},
      {label: "Select All", role: "selectAll", accelerator: "CmdOrCtrl+A"},
      {type: "separator"}
    )

    if (process.platform === "darwin") {
      menu.push(
        {label: "Share", role: "shareMenu", sharingItem: {texts: [selectedText]}},
        {type: "separator"},
        {
          label: "Substitutions",
          submenu: [
            {label: "Show Substitutions", role: "showSubstitutions"},
            {type: "separator"},
            {label: "Smart Quotes", role: "toggleSmartQuotes"},
            {label: "Smart Dashes", role: "toggleSmartDashes"},
            {label: "Text Replacement", role: "toggleTextReplacement"},
          ]
        }
      )
    }

    if (trimmed.length > 0 && /[a-zA-Z]/.test(trimmed)) {
      menu.push(
        {
          label: "Transformations",
          submenu: [
            {
              label: "Make Upper Case",
              click: () => {
                this.mainWindow.webContents.replace(trimmed.toUpperCase());
              }
            },
            {
              label: "Make Lower Case",
              click: () => {
                this.mainWindow.webContents.replace(trimmed.toLowerCase());
              }
            },
            {
              label: "Capitalize",
              click: () => {
                this.mainWindow.webContents.replace(trimmed.toLowerCase()
                  .replace(/\b./g, l => l.toUpperCase()));
              }
            }
          ]
        },
      )
    }

    if (process.platform === "darwin") {
      menu.push(
        {
          label: "Speech",
          submenu: [
            {label: "Start Speaking", role: "startSpeaking"},
            {label: "Stop Speaking", role: "stopSpeaking"},
          ]
        }
      )
    }

    return menu;
  }

  buildFXChainPresetMenu(presetModified: boolean) : MenuItemConstructorOptions[] {
    const menu : MenuItemConstructorOptions[] = [
      {
        label: "Save As New FX Chain Preset",
        click: () => {
          this.mainWindow.webContents.send(SELECT_CONTEXT_MENU_ITEM, { action: 0 });
        }
      },
      {type: "separator"},
      {
        label: "Rename",
        click: () => {
          this.mainWindow.webContents.send(SELECT_CONTEXT_MENU_ITEM, { action: 1 });
        }
      },
      {
        enabled: presetModified,
        label: "Reset",
        click: () => {
          this.mainWindow.webContents.send(SELECT_CONTEXT_MENU_ITEM, { action: 2 });
        }
      },
      {
        label: "Delete",
        click: () => {
          this.mainWindow.webContents.send(SELECT_CONTEXT_MENU_ITEM, { action: 3 });
        }
      }
    ]
 
    return menu;
  }

  buildLaneContextMenu(track: Track, disablePaste?: boolean) : MenuItemConstructorOptions[] {
    const menu : MenuItemConstructorOptions[] = [];

    if (track) {
      if (track.type === TrackType.Audio || track.type === TrackType.Midi) {
        menu.push(
          {
            label: `Insert ${track.type === TrackType.Audio ? "Audio" : "MIDI"} File(s)...`,
            click: () => {
              this.mainWindow.webContents.send(SELECT_CONTEXT_MENU_ITEM, { action: 0 });
            }
          },
          {type: "separator"}
        )
      }
    }

    menu.push(
      {
        label: "Paste At Playhead",
        accelerator: "CmdOrCtrl+V",
        click: () => {
          this.mainWindow.webContents.send(SELECT_CONTEXT_MENU_ITEM, { action: 1 });
        },
        enabled: !disablePaste
      },
      {
        label: "Paste",
        click: () => {
          this.mainWindow.webContents.send(SELECT_CONTEXT_MENU_ITEM, { action: 2 });
        },
        enabled: !disablePaste
      }
    )

    return menu;
  }

  buildNodeContextMenu() : MenuItemConstructorOptions[] {
    const menu : MenuItemConstructorOptions[] = [
      {label: "Cut", role: "cut", accelerator: "CmdOrCtrl+X"},
      {label: "Copy", role: "copy", accelerator: "CmdOrCtrl+C"},
      {
        label: "Delete",
        accelerator: "Delete",
        registerAccelerator: false,
        click: () => {
          this.mainWindow.webContents.send(SELECT_CONTEXT_MENU_ITEM, { action: 0 });
        }
      },
      {
        label: "Type Value",
        click: () => {
          this.mainWindow.webContents.send(SELECT_CONTEXT_MENU_ITEM, { action: 1 });
        }
      }
    ]

    return menu;
  }

  buildRegionContextMenu(trackRegion: boolean) : MenuItemConstructorOptions[] {
    const menu: MenuItemConstructorOptions[] = [];

    if (trackRegion) {
      menu.push(
        {
          label: "Create Clip from Region",
          accelerator: "CmdOrCtrl+Alt+C",
          registerAccelerator: false,
          click: () => {
            this.mainWindow.webContents.send(SELECT_CONTEXT_MENU_ITEM, { action: 0 });
          }
        },
        {type: "separator"},
      );
    }

    menu.push({
      label: "Delete Region",
      click: () => {
        this.mainWindow.webContents.send(SELECT_CONTEXT_MENU_ITEM, { action: 1 });
      }
    });

    return menu;
  }

  buildTrackContextMenu() : MenuItemConstructorOptions[] {
    const menu : MenuItemConstructorOptions[] = [
      {
        label: "Duplicate",
        accelerator: "CmdOrCtrl+D",
        click: () => {
          this.mainWindow.webContents.send(SELECT_CONTEXT_MENU_ITEM, { action: 0 });
        }
      },
      {
        label: "Delete",
        accelerator: "Delete",
        click: () => {
          this.mainWindow.webContents.send(SELECT_CONTEXT_MENU_ITEM, { action: 1 });
        }
      },
      {type: "separator"},
      {
        label: "Change Hue",
        click: () => {
          this.mainWindow.webContents.send(SELECT_CONTEXT_MENU_ITEM, { action: 2 });
        }
      }
    ]

    return menu;
  }
}