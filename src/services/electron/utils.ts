import { CLOSE_CONTEXT_MENU, OPEN_CONTEXT_MENU, SELECT_CONTEXT_MENU_ITEM } from "./channels";
import { ContextMenuType } from "../types/types";

export const electronAPI = (window as any).electronAPI;

export function openContextMenu(
  contextMenuType: ContextMenuType,
  params: Record<string, any>,
  onItemSelect: (params: Record<string, any>) => void
) {
  electronAPI.ipcRenderer.removeAllListeners(CLOSE_CONTEXT_MENU);
  electronAPI.ipcRenderer.removeAllListeners(SELECT_CONTEXT_MENU_ITEM);
  
  electronAPI.ipcRenderer.send(OPEN_CONTEXT_MENU, contextMenuType, params);

  electronAPI.ipcRenderer.once(SELECT_CONTEXT_MENU_ITEM, (params: Record<string, any>) => {
    onItemSelect(params);
    electronAPI.ipcRenderer.removeAllListeners(CLOSE_CONTEXT_MENU);
  });

  electronAPI.ipcRenderer.once(CLOSE_CONTEXT_MENU, () => {
    electronAPI.ipcRenderer.removeAllListeners(SELECT_CONTEXT_MENU_ITEM);
  });
}