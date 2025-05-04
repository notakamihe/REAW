import { Close } from "@mui/icons-material"
import { Dialog as MuiDialog, DialogTitle, IconButton } from "@mui/material"

interface IProps {
  children: React.ReactNode
  onClose: (event: object, reason: string) => void;
  open: boolean;
  style?: React.CSSProperties;
  title?: string;
}

export default function Dialog(props: IProps) {
  return (
    <MuiDialog 
      onClose={props.onClose} 
      onMouseDown={e => e.stopPropagation()}
      open={props.open} 
      slotProps={{
        paper: {
          style: {
            backgroundColor: "var(--bg6)", 
            border: "1px solid var(--border1)", 
            borderRadius: 0, 
            maxWidth: "none", 
            boxShadow: "none",
            ...props.style
          }
        }
      }}
      transitionDuration={0} 
    >
      <div style={{width: "100%", height: "100%", display: "flex", flexDirection: "column"}}>
        <DialogTitle style={{padding: "4px 8px", borderBottom: "1px solid var(--border1)"}}>
          <p 
            className="m-0 overflow-hidden text-truncate font-bold pe-3"
            style={{ fontSize: 16, color: "var(--fg1)", whiteSpace: "nowrap", lineHeight: 1.2 }}
          >
            {props.title}
          </p>
          <IconButton 
            className="p-0 position-absolute" 
            onClick={e => props.onClose(e, "closeButtonClick")} 
            style={{top: 5, right: 6}}
          >
            <Close style={{fontSize: 16, color: "var(--border6)"}} />
          </IconButton>
        </DialogTitle>
        {props.children}
      </div>
    </MuiDialog>
  )
}