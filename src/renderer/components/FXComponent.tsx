import { Add, ArrowDropDown, ArrowDropUp, Close, Delete, Edit, History, MoreHoriz, PowerSettingsNew, Save, Tune } from "@mui/icons-material";
import { IconButton, Menu, MenuList, MenuItem, ListItemText, Dialog, DialogTitle, DialogContent } from "@mui/material";
import React from "react";
import { WorkstationContext } from "renderer/context/WorkstationContext";
import { ID } from "renderer/types/types";
import { v4 } from "uuid";
import { MenuIcon } from "./icons";
import { Effect, FX } from "./TrackComponent";
import { OSDialog, SelectSpinBox } from "./ui";

export interface FXChain {
  id : ID
  name : string
  effects : Effect[]
}

interface FXStyle {
  add? : React.CSSProperties
  addIcon? : React.CSSProperties
  bottom? : React.CSSProperties
  bottomCompact? : React.CSSProperties
  container? : React.CSSProperties
  effectActionsContainer? : React.CSSProperties
  effectContainer? : React.CSSProperties
  enableIcon? : React.CSSProperties
  fxChainContainer? : React.CSSProperties
  fxChainText? : React.CSSProperties
  moreIcon? : React.CSSProperties
  next? : React.CSSProperties
  nextIcon? : React.CSSProperties
  nextPrevButtons? : React.CSSProperties
  prev? : React.CSSProperties
  prevIcon? : React.CSSProperties
  removeIcon? : React.CSSProperties
  saveIcon? : React.CSSProperties
  text? : React.CSSProperties
  top? : React.CSSProperties
  topCompact? : React.CSSProperties
}

interface IProps {
  compact? : boolean
  effectId : ID | null
  fx : FX
  onAddEffect? : () => void
  onChangeEffect? : (effect : Effect) => void
  onChangeFXChain? : (fxChain : FXChain | null) => void
  onRemoveEffect? : (effect : Effect) => void
  onToggleEffectEnabled? : (effect : Effect) => void
  onSetEffects? : (effects : Effect[]) => void
  style? : FXStyle
}

interface IState {
  anchorEl : HTMLElement | null
  fxChainMode : boolean
  fxChainNameDialogText : string
  hovering : boolean
  showFxChainNameDialog : boolean
}

export default class FXComponent extends React.Component<IProps, IState> {
  static contextType = WorkstationContext
  context : React.ContextType<typeof WorkstationContext>

  constructor(props : IProps) {
    super(props);

    this.state = {
      anchorEl: null,
      fxChainMode: false,
      fxChainNameDialogText: "",
      hovering: false,
      showFxChainNameDialog: false
    }

    this.onChainNameDialogSubmit = this.onChainNameDialogSubmit.bind(this);
    this.onChangeChainOption = this.onChangeChainOption.bind(this);
    this.onDeleteFxChain = this.onDeleteFxChain.bind(this)
    this.onRenameFxChain = this.onRenameFxChain.bind(this)
    this.onResetEffects = this.onResetEffects.bind(this)
    this.onSave = this.onSave.bind(this)
  }

  componentDidMount() {
    const fxChain = this.context!.fxChains.find(c => c.id === this.props.fx.chainId)

    if (fxChain) {
      this.props.onSetEffects?.(fxChain.effects)
    }
  }

  componentDidUpdate(prevProps : IProps) {
    if (prevProps.fx.chainId !== this.props.fx.chainId) {
      const fxChain = this.context!.fxChains.find(c => c.id === this.props.fx.chainId)
      fxChain && this.props.onSetEffects?.(fxChain.effects)
    }
  }

  onChainNameDialogSubmit(e : React.FormEvent<HTMLFormElement>) {
    e.preventDefault()

    if (this.state.fxChainNameDialogText.trim()) {
      const fxChain = this.context!.fxChains.find(c => c.id === this.props.fx.chainId)
  
      if (fxChain) {
        const fxChains = this.context!.fxChains.map(c => c.id === fxChain.id ? {...c, name: this.state.fxChainNameDialogText} : c)
  
        localStorage.setItem("fx-chains", JSON.stringify(fxChains))
        this.context!.setFxChains(fxChains)
  
        this.setState({showFxChainNameDialog: false, fxChainNameDialogText: ""})
      } else {
        const newFxChain = {id: v4(), name: this.state.fxChainNameDialogText, effects: this.props.fx.effects.slice()}
        const fxChains : FXChain[] = [...this.context!.fxChains, newFxChain]
  
        localStorage.setItem("fx-chains", JSON.stringify(fxChains))
        this.context!.setFxChains(fxChains)
  
        this.setState({showFxChainNameDialog: false, fxChainNameDialogText: ""})
        this.props.onChangeFXChain?.(newFxChain)
      }
    }
  }

  onChangeChainOption(value : string | number) {
    if (this.props.fx.chainId !== value) {
      this.props.onChangeFXChain?.(this.context!.fxChains.find(c => c.id === value) || null)
    }
  }

  onDeleteFxChain() {
    const fxChain = this.context!.fxChains.find(c => c.id === this.props.fx.chainId)
    const fxChains = this.context!.fxChains.filter(c => c.id !== fxChain?.id)

    localStorage.setItem("fx-chains", JSON.stringify(fxChains))
    this.context!.setFxChains(fxChains)
    this.setState({anchorEl: null})
    
    for (let track of this.context!.tracks) {
      if (track.fx.chainId === fxChain?.id) {
        this.context!.setTrack({...track, fx: {...track.fx, chainId: null}})
      }
    }
  }

  onNext(idx : number) {
    if (idx > -1 && idx < this.props.fx.effects.length - 1) {
      this.props.onChangeEffect?.(this.props.fx.effects[idx + 1])
    }
  }

  onPrev(idx : number) {
    if (idx > 0) {
      this.props.onChangeEffect?.(this.props.fx.effects[idx - 1])
    }
  }
  
  onRenameFxChain() {
    const fxChain = this.context!.fxChains.find(c => c.id === this.props.fx.chainId)

    if (fxChain) {
      this.setState({showFxChainNameDialog: true, fxChainNameDialogText: fxChain.name})
    }

    this.setState({anchorEl: null})
  }

  onResetEffects() {
    const fxChain = this.context!.fxChains.find(c => c.id === this.props.fx.chainId)

    if (fxChain) {
      this.props.onSetEffects?.(fxChain.effects)
    }

    this.setState({anchorEl: null})
  }

  onSave() {
    const fxChain = this.context!.fxChains.find(c => c.id === this.props.fx.chainId)

    if (fxChain) {
      const fxChains : FXChain[] = this.context!.fxChains.slice()
      const idx = fxChains.findIndex(c => c.id === this.props.fx.chainId)

      if (idx > -1) {
        fxChains[idx].effects = this.props.fx.effects.slice()
        localStorage.setItem("fx-chains", JSON.stringify(fxChains))
        this.context!.setFxChains(fxChains)
      }
    } else {
      this.setState({showFxChainNameDialog: true, fxChainNameDialogText: ""})
    }
  }

  renderChainComponent() {
    const fxChain = this.context!.fxChains.find(c => c.id === this.props.fx.chainId)
    const disableSaveAndReset = fxChain && JSON.stringify(fxChain.effects) === JSON.stringify(this.props.fx.effects) ||
      this.props.fx.effects.length === 0
    const style = this.props.style

    return (
      <React.Fragment>
        <div 
          className="d-flex align-items-center overflow-hidden" 
          style={{
            width: "100%", 
            height: 20, 
            backgroundColor: "#fff9", 
            borderRadius: this.props.compact ? "0 3px 3px 0" : "3px 3px 0 0",
            marginBottom: this.props.compact ? 0 : 2,
            ...style?.top,
            ...(this.props.compact ? style?.topCompact : {})
          }}
        >
          <SelectSpinBox
            onChange={this.onChangeChainOption}
            showButtons={false}
            style={{
              select: {fontWeight: "bold", fontSize: 14, ...style?.fxChainText}, 
              container: {marginLeft: 4, flex: 1, ...style?.fxChainContainer, overflow: "hidden"},
            }}
            value={fxChain?.id || "none"}
          >
            <option value="none">None</option>
            <React.Fragment>
              {this.context!.fxChains.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </React.Fragment>
          </SelectSpinBox>
          <div className="d-flex align-items-center" style={{marginLeft: 4}}>
            <IconButton className="p-0" disabled={disableSaveAndReset} onClick={this.onSave} style={{marginRight: 4}} title="Save">
              <Save style={{fontSize: 16, ...style?.saveIcon}}/>
            </IconButton>
            <IconButton className="p-0" disabled={!fxChain} onClick={e => this.setState({anchorEl: e.currentTarget})}>
              <MoreHoriz style={{fontSize: 16, ...style?.moreIcon}}/>
            </IconButton>
          </div>
        </div>
        <Menu anchorEl={this.state.anchorEl} open={Boolean(this.state.anchorEl)} onClose={() => this.setState({anchorEl: null})}>
          <MenuList className="p-0" dense style={{outline: "none"}}>
            <MenuItem disabled={disableSaveAndReset} onClick={this.onResetEffects}>
              <MenuIcon icon={<History />} />
              <ListItemText>Reset</ListItemText>
            </MenuItem>
            <MenuItem onClick={this.onRenameFxChain}>
              <MenuIcon icon={<Edit />} />
              <ListItemText>Rename</ListItemText>
            </MenuItem>
            <MenuItem onClick={this.onDeleteFxChain}>
              <MenuIcon icon={<Delete />} />
              <ListItemText>Delete</ListItemText>
            </MenuItem>
          </MenuList>
        </Menu>
      </React.Fragment>
    )
  }
  
  render() {
    const fxChain = this.context!.fxChains.find(c => c.id === this.props.fx.chainId)
    const effect = this.props.fx.effects.find(e => e.id === this.props.effectId)
    const idx = effect ? this.props.fx.effects.indexOf(effect) : -1
    const style = this.props.style

    return (
      <React.Fragment>
        <div className="d-flex" style={{width:"100%", flexDirection:this.props.compact ? "row" : "column", ...style?.container}}>
          {
            this.props.compact ?
            <IconButton 
              className="p-0" 
              onClick={() => this.setState({fxChainMode: !this.state.fxChainMode})}
              style={{
                backgroundColor: this.state.fxChainMode ? "#fff" : "#fff9", 
                height: 20, 
                marginRight: 2, 
                borderRadius: "3px 0 0 3px", 
                padding: "0 2px",
                transition: "all ease-in-out 0.2s"
              }}
              title="Toggle FX chain mode"
            >
              <Tune style={{fontSize: 16}} />
            </IconButton> :
            this.renderChainComponent()
          }
          {
            this.props.compact && this.state.fxChainMode ?
            this.renderChainComponent() :
            <div 
              className="d-flex" 
              style={{
                width: "100%", 
                height: 20, 
                backgroundColor: "#fff9", 
                borderRadius: this.props.compact ? "0 3px 3px 0" : "0 0 3px 3px",
                ...style?.bottom,
                ...(this.props.compact ? style?.bottomCompact : {})
              }}
            >
              <div className="center-by-flex-v" style={{height: "100%", paddingLeft: 4}}>
                <IconButton 
                  className="p-0" 
                  onClick={this.props.onAddEffect} 
                  title="Add an effect"
                  style={{backgroundColor: "#333", borderRadius: "50%", ...style?.add}}
                >
                  <Add style={{fontSize: 14, color: "#fff", ...style?.addIcon}} />
                </IconButton>
              </div>
              <div 
                className="d-flex" 
                onMouseOver={() => this.setState({hovering: true})}
                onMouseLeave={() => this.setState({hovering: false})}
                style={{flex: 1, paddingLeft: 6, height: "100%", overflow: "hidden", cursor: "pointer", ...style?.effectContainer}}
              >
                {
                  effect &&
                  <React.Fragment>
                    <p 
                      className="m-0" 
                      style={{
                        fontSize: 14, 
                        flex: 1, 
                        whiteSpace: "nowrap", 
                        overflow: "hidden", 
                        opacity: effect?.enabled ? 1 : 0.5,
                        ...style?.text
                      }}
                      title={`${effect?.name} ${effect && !effect.enabled ? "(disabled)" : ""}`}
                    >
                      {effect?.name}
                    </p>
                    {
                      this.state.hovering && 
                      <div 
                        className="d-flex px-1" 
                        style={{backgroundColor: "#0002", borderRadius: 10, margin: "2px 0", flexShrink: 0, ...style?.effectActionsContainer}}
                      >
                        <IconButton 
                          className="p-0" 
                          onClick={() => effect && this.props.onToggleEffectEnabled?.(effect)}
                          title={effect?.enabled ? "Disable" : "Enable"}
                        >
                          <PowerSettingsNew 
                            className="p-0" 
                            style={{fontSize: 16, opacity: effect?.enabled ? 1 : 0.5, ...style?.enableIcon}}
                          />
                        </IconButton>
                        <IconButton 
                          className="p-0" 
                          onClick={() => effect && this.props.onRemoveEffect?.(effect)}
                          title="Remove effect"
                        >
                          <Delete className="p-0" style={{fontSize: 16, ...style?.removeIcon}}/>
                        </IconButton>
                      </div>
                    }
                  </React.Fragment>
                }
              </div>
              {
                this.props.fx.effects.length > 0 &&
                <div style={{width: 16, ...style?.nextPrevButtons}}>
                  <div 
                    className="center-by-flex overflow-hidden"
                    onClick={() => this.onPrev(idx)}
                    style={{
                      width: "100%", 
                      height: "50%", 
                      cursor: "pointer", 
                      pointerEvents: idx > 0 ? "auto" : "none",
                      opacity: idx > 0 ? 1 : 0.5,
                      ...style?.prev
                    }}
                  >
                    <ArrowDropUp style={style?.prevIcon} />
                  </div>
                  <div 
                    className="center-by-flex overflow-hidden"
                    onClick={() => this.onNext(idx)}
                    style={{
                      width: "100%", 
                      height: "50%",
                      cursor: "pointer",
                      pointerEvents: idx < this.props.fx.effects.length - 1 ? "auto" : "none",
                      opacity: idx < this.props.fx.effects.length - 1 ? 1 : 0.5,
                      ...style?.next
                    }}
                  >
                    <ArrowDropDown style={style?.nextIcon} />
                  </div>
                </div>
              }
            </div>
          }
        </div>
        <OSDialog
          onClickAway={() => this.setState({showFxChainNameDialog: false})}
          onClose={() => this.setState({showFxChainNameDialog: false})}
          open={this.state.showFxChainNameDialog}
          style={{width: 350}}
          title={fxChain ? "Rename FX chain" : "Save FX chain"}
        >
           <DialogContent className="px-3">
              <form className="d-flex" onSubmit={this.onChainNameDialogSubmit} style={{width: "100%"}}>
                <input
                  autoFocus
                  className="rounded px-2 py-1 no-outline"
                  onChange={e => this.setState({fxChainNameDialogText: e.target.value})}
                  style={{backgroundColor: "#0002", border: "none", fontSize: 14, flex: 1}}
                  value={this.state.fxChainNameDialogText}
                />
                <input
                  className="rounded no-borders px-2 py-1"
                  style={{backgroundColor: "var(--color-primary)", color: "#fff", fontSize: 14, marginLeft: 4}}
                  type="submit"
                  value="Save"
                />
              </form>
            </DialogContent>
        </OSDialog>
      </React.Fragment>
    )
  }
}