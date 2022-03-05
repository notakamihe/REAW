import { faTimes } from "@fortawesome/free-solid-svg-icons"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { Close } from "@mui/icons-material"
import { Dialog, DialogTitle, Divider, IconButton } from "@mui/material"

enum OS {Windows, Mac, Linux}


function OSDialogTitle(props : {os : OS, onClose : () => void, title : string}) : JSX.Element {
  if (props.os === OS.Windows) {
    return (
      <DialogTitle className="py-1 px-3 disable-highlighting">
        <p 
          className="m-0 overflow-hidden text-truncate"
          style={{fontSize: 14, transform: "translateY(1px)", color: "#000", whiteSpace: "nowrap", paddingRight: 16, fontFamily: "Segoe UI, Roboto, sans-serif"}}
        >
          {props.title}
        </p>
        <IconButton className="p-0 position-absolute" onClick={props.onClose}  style={{top: 6, right: 8}}>
          <Close style={{fontSize: 18, color: "#000"}} />
        </IconButton>
      </DialogTitle>
    )
  } else if (props.os === OS.Mac) {
    return (
      <DialogTitle className="py-0 disable-highlighting" style={{backgroundColor: "#0002"}}>
        <p 
          className="m-0 text-center overflow-hidden px-1 text-truncate"
          style={{fontSize: 13, fontWeight: "bold", transform: "translateY(1px)", color: "#000", whiteSpace: "nowrap"}}
        >
          {props.title}
        </p>
        <IconButton 
          className="p-0 rounded-circle position-absolute" 
          onClick={props.onClose}  
          style={{top: 4, left: 5, backgroundColor: "#ff605c", padding: 2}}
        >
          <Close style={{fontSize: 14, color: "#000a"}} />
        </IconButton>
      </DialogTitle>
    )
  } else {
    return (
      <DialogTitle className="py-1 px-2 disable-highlighting">
        <p 
          className="m-0 text-center overflow-hidden px-2 text-truncate"
          style={{fontSize: 13, fontWeight: "bold", transform: "translateY(1px)", color: "#000", whiteSpace: "nowrap"}}
        >
          {props.title}
        </p>
        <IconButton className="p-0 position-absolute" onClick={props.onClose} style={{top: 6, right: 10}}>
        <FontAwesomeIcon icon={faTimes} style={{fontSize: 16, color: "#000a"}} />
        </IconButton>
      </DialogTitle>
    )
  }
}


interface IProps {
  children : React.ReactNode
  onClickAway? : () => void;
  onClose : () => void
  open : boolean
  style? : React.CSSProperties
  title? : string
}

const OSDialog = (props : IProps) => {
  const getOS = () : OS => {
    if (navigator.platform.indexOf("Mac") !== -1) {
      return OS.Mac
    } else if (navigator.platform.indexOf("Linux") !== -1) {
      return OS.Linux
    } else {
      return OS.Windows
    } 
  }

  const os = getOS()

  return (
    <Dialog onClose={props.onClickAway} open={props.open} transitionDuration={0}>
      <div style={{backgroundColor: "#fff", ...props.style}}>
        <OSDialogTitle os={os} onClose={props.onClose} title={props.title || ""} />
        {os !== OS.Linux && <Divider />}
        {props.children}
      </div>
    </Dialog>
  )
}

export default OSDialog