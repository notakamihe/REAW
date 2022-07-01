import { Add, ArrowDropDown, ArrowDropUp, Delete, MoreHoriz, PowerSettingsNew, Save, Tune } from "@mui/icons-material";
import { IconButton, DialogContent } from "@mui/material";
import React from "react";
import { WorkstationContext } from "renderer/context/WorkstationContext";
import { Effect, FX, FXChain, ID } from "renderer/types/types";
import channels from "renderer/utils/channels";
import { ipcRenderer } from "renderer/utils/utils";
import { v4 } from "uuid";
import { Dialog, SelectSpinBox } from "./ui";

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
  toggle? : React.CSSProperties
  toggleIcon? : React.CSSProperties
  top? : React.CSSProperties
  topCompact? : React.CSSProperties
}

interface IProps {
  chainControlsOnHover? : boolean
  compact? : boolean
  effectId : ID | null
  fx : FX
  onChangeEffect? : (effect : Effect | null) => void
  onChangeFXChain? : (fxChain : FXChain | null) => void
  onSetEffects? : (effects : Effect[]) => void
  style? : FXStyle
}

interface IState {
  fxChainMode : boolean
  fxChainNameDialogText : string
  hovering : boolean
  hoveringOverTop : boolean
  prevEffects : Effect[]
  saveAsNew : boolean
  showFxChainNameDialog : boolean
}

export default class FXComponent extends React.Component<IProps, IState> {
  static contextType = WorkstationContext
  context : React.ContextType<typeof WorkstationContext>

  constructor(props : IProps) {
    super(props);

    this.state = {
      fxChainMode: false,
      fxChainNameDialogText: "",
      hovering: false,
      hoveringOverTop: false,
      prevEffects: this.props.fx.effects,
      saveAsNew: true,
      showFxChainNameDialog: false
    }

    this.addEffect = this.addEffect.bind(this)
    this.onChainNameDialogSubmit = this.onChainNameDialogSubmit.bind(this);
    this.onChangeChainOption = this.onChangeChainOption.bind(this);
    this.onMore = this.onMore.bind(this)
    this.onRenameFxChain = this.onRenameFxChain.bind(this)
    this.onSave = this.onSave.bind(this)
    this.removeEffect = this.removeEffect.bind(this)
    this.removeFxChain = this.removeFxChain.bind(this)
    this.resetFxChain = this.resetFxChain.bind(this)
    this.toggleEnableEffect = this.toggleEnableEffect.bind(this)
  }

  componentDidMount() {
    const fxChain = this.context!.fxChains.find(c => c.id === this.props.fx.chainId)

    if (fxChain) {
      this.props.onSetEffects?.(fxChain.effects)
    }
  }

  componentDidUpdate(prevProps : IProps) {
    if (this.state.prevEffects !== this.props.fx.effects) {
      this.setState({prevEffects: this.props.fx.effects})

      if (!this.props.fx.effects.find(e => e.id === this.props.effectId)) {
        const effect = this.props.fx.effects.find(e => e.id === this.props.fx.effects[0]?.id)
        this.props.onChangeEffect?.(effect || null)
      }
    }

    if (prevProps.fx.chainId !== this.props.fx.chainId) {
      const fxChain = this.context!.fxChains.find(c => c.id === this.props.fx.chainId)
      this.props.onSetEffects?.(fxChain?.effects || [])
    }
  }

  addEffect = () => {
    const newEffect : Effect = {id: v4(), name: `Effect ${this.props.fx.effects.length + 1}`, enabled: true}
    
    this.props.onSetEffects?.(this.props.fx.effects.slice().concat(newEffect))
    this.props.onChangeEffect?.(newEffect)
  }

  onChainNameDialogSubmit(e : React.FormEvent<HTMLFormElement>) {
    e.preventDefault()

    if (this.state.fxChainNameDialogText.trim()) {
      const fxChain = this.context!.fxChains.find(c => c.id === this.props.fx.chainId)
  
      if (!this.state.saveAsNew && fxChain) {
        const fxChains = this.context!.fxChains.map(c => c.id === fxChain.id ? {...c, name: this.state.fxChainNameDialogText.trim()} : c)
  
        localStorage.setItem("fx-chains", JSON.stringify(fxChains))
        this.context!.setFxChains(fxChains)
  
        this.setState({showFxChainNameDialog: false, fxChainNameDialogText: ""})
      } else {
        const newFxChain = {id: v4(), name: this.state.fxChainNameDialogText.trim(), effects: this.props.fx.effects.slice()}
        const fxChains : FXChain[] = [...this.context!.fxChains, newFxChain]

        this.setState({showFxChainNameDialog: false, fxChainNameDialogText: ""})
  
        localStorage.setItem("fx-chains", JSON.stringify(fxChains))
        this.context!.setFxChains(fxChains)

        this.props.onChangeFXChain?.(newFxChain)
      }
    }
  }

  onChangeChainOption(value : string | number) {
    if (this.props.fx.chainId !== value) {
      const fxChain = this.context!.fxChains.find(c => c.id === value)

      this.props.onChangeFXChain?.(fxChain || null)

      if (fxChain)
        this.props.onChangeEffect?.(fxChain.effects[0] || null)
    }
  }

  onMore() {
    const fxChain = this.context!.fxChains.find(c => c.id === this.props.fx.chainId)
    const isChainChanged = JSON.stringify(fxChain?.effects) !== JSON.stringify(this.props.fx.effects)

    ipcRenderer.send(channels.OPEN_FX_CHAIN_CONTEXT_MENU, isChainChanged)

    ipcRenderer.on(channels.SAVE_FX_CHAIN_AS_NEW, () => {
      this.setState({showFxChainNameDialog: true, fxChainNameDialogText: "", saveAsNew: true})
    })

    ipcRenderer.on(channels.RENAME_FX_CHAIN, () => {
      this.onRenameFxChain()
    })

    ipcRenderer.on(channels.RESET_FX_CHAIN, () => {
      this.resetFxChain()
    })

    ipcRenderer.on(channels.REMOVE_FX_CHAIN, () => {
      this.removeFxChain()
    })

    ipcRenderer.on(channels.CLOSE_FX_CHAIN_CONTEXT_MENU, () => {
      ipcRenderer.removeAllListeners(channels.SAVE_FX_CHAIN_AS_NEW)
      ipcRenderer.removeAllListeners(channels.RENAME_FX_CHAIN)
      ipcRenderer.removeAllListeners(channels.RESET_FX_CHAIN)
      ipcRenderer.removeAllListeners(channels.REMOVE_FX_CHAIN)
      ipcRenderer.removeAllListeners(channels.CLOSE_FX_CHAIN_CONTEXT_MENU)
    })
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
      this.setState({showFxChainNameDialog: true, fxChainNameDialogText: fxChain.name, saveAsNew: false})
    }
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

        const tracks = this.context!.tracks.slice()

        for (const track of tracks) {
          if (track.fx.chainId === this.props.fx.chainId) {
            track.fx.effects = this.props.fx.effects.slice()
          }
        }

        this.context!.setTracks(tracks)
      }
    } else {
      this.setState({showFxChainNameDialog: true, fxChainNameDialogText: "", saveAsNew: true})
    }
  }

  removeEffect() {
    const idx = this.props.fx.effects.findIndex(e => e.id === this.props.effectId)
    const newEffects = this.props.fx.effects.filter(e => e.id !== this.props.effectId)

    if (idx > -1) {
      this.props.onSetEffects?.(newEffects)

      if (newEffects.length === 0) {
        this.props.onChangeEffect?.(null)
      } else {
        this.props.onChangeEffect?.(newEffects[idx > 0 ? idx - 1 : 0])
      }
    }
  }

  removeFxChain() {
    const fxChain = this.context!.fxChains.find(c => c.id === this.props.fx.chainId)
    const fxChains = this.context!.fxChains.filter(c => c.id !== fxChain?.id)

    localStorage.setItem("fx-chains", JSON.stringify(fxChains))
    this.context!.setFxChains(fxChains)
    
    for (let track of this.context!.tracks) {
      if (track.fx.chainId === fxChain?.id) {
        this.context!.setTrack({...track, fx: {...track.fx, chainId: null}})
      }
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
          onMouseOver={() => this.setState({hoveringOverTop: true})}
          onMouseLeave={() => this.setState({hoveringOverTop: false})}
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
            title={`${fxChain?.name || "None"} (${this.props.fx.effects.length} effects)`}
            value={fxChain?.id || "none"}
          >
            <option value="none">None</option>
            <React.Fragment>
              {this.context!.fxChains.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </React.Fragment>
          </SelectSpinBox>
          {
            (!this.props.chainControlsOnHover || this.state.hoveringOverTop) &&
            <div className="d-flex align-items-center" style={{marginLeft: 4}}>
              <IconButton className="p-0" disabled={disableSaveAndReset} onClick={this.onSave} style={{marginRight: 2}} title="Save">
                <Save style={{fontSize: 16, ...style?.saveIcon}}/>
              </IconButton>
              <IconButton className="p-0" disabled={!fxChain} onClick={this.onMore}>
                <MoreHoriz style={{fontSize: 16, ...style?.moreIcon}}/>
              </IconButton>
            </div>
          }
        </div>
      </React.Fragment>
    )
  }

  resetFxChain() {
    const fxChain = this.context!.fxChains.find(c => c.id === this.props.fx.chainId)

    if (fxChain) {
      this.props.onSetEffects?.(fxChain.effects)
      this.props.onChangeEffect?.(fxChain.effects[0] || null)
    }
  }

  toggleEnableEffect() {
    const newEffects = this.props.fx.effects.slice().map(e => {return {...e}})
    const idx = newEffects.findIndex(e => e.id === this.props.effectId)

    if (idx > -1) {
      newEffects[idx].enabled = !newEffects[idx].enabled
      this.props.onSetEffects?.(newEffects)
    }
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
                transition: "all ease-in-out 0.2s",
                ...style?.toggle
              }}
              title="Toggle FX chain mode"
            >
              <Tune style={{fontSize: 16, ...style?.toggleIcon}} />
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
              <div className="center-by-flex-v" style={{height: "100%"}}>
                <IconButton 
                  className="p-0" 
                  onClick={this.addEffect} 
                  title="Add an effect"
                  style={{borderRadius: "50%", marginLeft: 2, ...style?.add}}
                >
                  <Add style={{fontSize: 14, color: "#0009", ...style?.addIcon}} />
                </IconButton>
              </div>
              <div 
                className="d-flex align-items-center" 
                onMouseOver={() => this.setState({hovering: true})}
                onMouseLeave={() => this.setState({hovering: false})}
                style={{flex: 1, paddingLeft: 2, height: "100%", overflow: "hidden", cursor: "pointer", ...style?.effectContainer}}
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
                        className="d-flex" 
                        style={{backgroundColor: "#0002", borderRadius: 10, margin: "2px 0", padding: "0 4px", flexShrink: 0, ...style?.effectActionsContainer}}
                      >
                        <IconButton className="p-0" onClick={this.toggleEnableEffect} title={effect?.enabled ? "Disable" : "Enable"}>
                          <PowerSettingsNew 
                            className="p-0" 
                            style={{fontSize: 16, opacity: effect?.enabled ? 1 : 0.5, ...style?.enableIcon}}
                          />
                        </IconButton>
                        <IconButton className="p-0" onClick={this.removeEffect} title="Remove effect" >
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
        <Dialog
          onClickAway={() => this.setState({showFxChainNameDialog: false})}
          onClose={() => this.setState({showFxChainNameDialog: false})}
          open={this.state.showFxChainNameDialog}
          style={{width: 350}}
          title={!this.state.saveAsNew && fxChain ? "Rename FX chain" : "Save FX chain"}
        >
          <DialogContent className="px-3">
            <form onSubmit={this.onChainNameDialogSubmit} style={{width: "100%"}}>
              <div className="rounded col-12 d-flex">
                <input
                  autoFocus
                  className="px-2 py-1 no-outline br-inherit-l muted-placeholder"
                  onChange={e => this.setState({fxChainNameDialogText: e.target.value})}
                  placeholder="Name"
                  style={{border: "1px solid var(--border7)", fontSize: 14, flex: 1, color: "var(--border7)", backgroundColor: "#0000"}}
                  value={this.state.fxChainNameDialogText}
                />
                <input
                  className="no-borders px-2 py-1 br-inherit-r"
                  style={{backgroundColor: "var(--color1)", color: "#fff", fontSize: 14, marginLeft: 4}}
                  type="submit"
                  value="Save"
                />
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </React.Fragment>
    )
  }
}