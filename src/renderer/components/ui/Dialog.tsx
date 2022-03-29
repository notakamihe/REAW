import { Close } from "@mui/icons-material"
import { Dialog as MuiDialog, DialogTitle, Divider, IconButton } from "@mui/material"

interface IProps {
  children : React.ReactNode
  onClickAway? : () => void;
  onClose : () => void
  open : boolean
  style? : React.CSSProperties
  title? : string
}

const Dialog = (props : IProps) => {
  return (
    <MuiDialog 
      onClose={props.onClickAway} 
      open={props.open} 
      PaperProps={{style: {backgroundColor: "var(--bg9)", border: "1px solid var(--border1)", borderRadius: 4, maxWidth: "none", ...props.style}}}
      transitionDuration={0} 
    >
      <div style={{width: "100%", height: "100%", display: "flex", flexDirection: "column"}}>
        <DialogTitle className="py-1 px-3 disable-highlighting" style={{borderRadius: "inherit"}}>
          <p 
            className="m-0 overflow-hidden text-truncate"
            style={{fontSize: 16, color: "var(--border7)", whiteSpace: "nowrap", paddingRight: 16, fontWeight: "bold", transform: "translateY(2px)"}}
          >
            {props.title}
          </p>
          <IconButton className="p-0 position-absolute btn1 h-btn1" onClick={props.onClose} style={{top: 6, right: 6}}>
            <Close style={{fontSize: 16, color: "var(--border7)"}} />
          </IconButton>
        </DialogTitle>
        <Divider style={{borderColor: "var(--border1)", opacity: 1}} />
        {props.children}
      </div>
    </MuiDialog>
  )
}

export default Dialog