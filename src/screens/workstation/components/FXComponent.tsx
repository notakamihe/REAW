import React, { CSSProperties, useCallback, useContext, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { Tune, Add, PowerSettingsNew, Delete, ArrowDropUp, ArrowDropDown, Check, Close, MoreHoriz, Save } from "@mui/icons-material";
import { IconButton } from "@mui/material";
import { ContextMenuType, Effect, FXChainPreset, Track } from "@/services/types/types";
import { v4 } from "uuid";
import { WorkstationContext } from "@/contexts";
import { SelectSpinBox } from "@/components/widgets";
import { openContextMenu } from "@/services/electron/utils";

interface FXElements<T> {
  add?: { button?: T, icon?: T };
  bottom?: T;
  container?: T;
  effect?: { actionsContainer?: T; container?: T; text?: T; };
  enableIcon?: T;
  icon?: T,
  next?: { button?: T, icon?: T };
  preset?: { container?: T; text?: T; optionsList?: T; };
  presetButtons?: T;
  presetNameFormButtons?: T;
  prev? : { button?: T, icon?: T };
  removeIcon?: T;
  spinButtons?: T;
  text?: T;
  toggle?: { button?: T, icon?: T };
  top?: T;
}

interface IProps {
  classes?: FXElements<string>;
  compact?: boolean;
  track: Track;
  style: FXElements<CSSProperties>;
}

export default function FXComponent({ classes, compact, track, ...rest }: IProps) {
  const { fxChainPresets, masterTrack, setFXChainPresets, setTrack, setTracks, tracks } = useContext(WorkstationContext)!;

  const [containerWidth, setContainerWidth] = useState(0)
  const [namePreset, setNamePreset] = useState(false);
  const [presetNameText, setPresetNameText] = useState("");
  const [saveAsNew, setSaveAsNew] = useState(false);
  const [showPreset, setShowPreset] = useState(false);

  const presetNameInputRef = useRef<HTMLInputElement>(null);
  const ref = useRef<HTMLDivElement>(null);

  const effectIndex = track.fx.selectedEffectIndex;
  const effect = track.fx.effects[effectIndex];
  const preset = fxChainPresets.find(preset => preset.id === track.fx.preset);

  const presetModified = useMemo(() => {
    if (preset) {
      if (preset.effects.length !== track.fx.effects.length) return true;

      for (let i = 0; i < preset.effects.length; i++) {
        if (
          preset.effects[i].enabled !== track.fx.effects[i].enabled ||
          preset.effects[i].id !== track.fx.effects[i].id ||
          preset.effects[i].name !== track.fx.effects[i].name
        ) return true;
      }
    }

    return false;
  }, [preset, track])

  useEffect(() => setContainerWidth(ref.current?.offsetWidth || 0))

  useEffect(() => {
    if (track.fx.effects.length > 0 && effectIndex >= track.fx.effects.length)
      setTrack({ ...track, fx: { ...track.fx, selectedEffectIndex: track.fx.effects.length - 1 } });
  }, [track.fx.effects])

  useLayoutEffect(() => {
    presetNameInputRef.current?.setSelectionRange(0, presetNameInputRef.current?.value.length);
    presetNameInputRef.current?.focus();
  }, [namePreset])

  const hideNamePresetMode = useCallback(() => setNamePreset(false), []);

  function addEffect() {
    const effects = [
      ...track.fx.effects,
      { id: v4(), name: `Effect ${(track.fx.effects.length + 1)}`, enabled: true }
    ];

    setTrack({ ...track, fx: { ...track.fx, effects, selectedEffectIndex: effects.length - 1 } });
  }
  
  function deleteEffect() {
    const effects = track.fx.effects.filter((_, idx) => idx !== effectIndex);
    setTrack({ ...track, fx: { ...track.fx, effects } });
  }

  function handleBlur(e: React.FocusEvent<HTMLFormElement>) {
    if (!e.currentTarget.contains(e.relatedTarget))
      hideNamePresetMode();
  }

  function more() {
    if (preset) {
      openContextMenu(ContextMenuType.FXChainPreset, { presetModified }, params => {
        switch (params.action) {
          case 0:
            setPresetNameText("");
            setSaveAsNew(true);
            setNamePreset(true);
            break;
          case 1:
            setPresetNameText(preset.name);
            setSaveAsNew(false);
            setNamePreset(true);
            break;
          case 2:
            const selectedEffectIndex = Math.min(effectIndex, preset.effects.length - 1);
            setTrack({ ...track, fx: { ...track.fx, effects: preset.effects, selectedEffectIndex } });
            break;
          case 3:
            const newTracks = tracks.slice();
  
            for (let i = 0; i < newTracks.length; i++)
              if (newTracks[i].fx.preset === preset?.id)
                newTracks[i] = { ...newTracks[i], fx: { ...newTracks[i].fx, preset: null } };
  
            if (masterTrack.fx.preset === preset?.id)
              setTrack({ ...masterTrack, fx: { ...masterTrack.fx, preset: null } });
            
            setFXChainPresets(fxChainPresets.filter(p => p.id !== preset.id));
            setTracks(newTracks);
            break;
        }
      });
    }
  }

  function onChangePreset(value: string | number) {
    const newPreset = fxChainPresets.find(preset => preset.id === value.toString());
    
    if (preset?.id !== newPreset?.id) {
      const presetId = newPreset ? newPreset.id : null;
      const effects = newPreset ? newPreset.effects : [];
      setTrack({ ...track, fx: { preset: presetId, effects, selectedEffectIndex: 0 } });
    }
  }

  function save() {
    if (preset) {
      setPreset({ ...preset, effects: track.fx.effects.slice() });
    } else {
      setPresetNameText("");
      setSaveAsNew(true);
      setNamePreset(true);
    }
  }

  function savePresetName(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const newName = presetNameText.trim();
    
    if (newName) {
      if (saveAsNew) {
        const newPreset = { id: v4(), name: newName, effects: track.fx.effects.slice() };
        setFXChainPresets([...fxChainPresets, newPreset]);
        setTrack({ ...track, fx: { ...track.fx, preset: newPreset.id } });
      } else if (preset) {
        setPreset({ ...preset, name: newName });
      }

      hideNamePresetMode();
    }
  }

  function setPreset(newPreset: FXChainPreset) {
    const newFXChainPresets = fxChainPresets.slice();
    const idx = fxChainPresets.indexOf(preset!);

    if (idx > -1) {
      newFXChainPresets[idx] = newPreset;
      setFXChainPresets(newFXChainPresets);
    }
  }

  function spin(direction: string) {
    if (direction === "prev" && effectIndex > 0)
      setTrack({ ...track, fx: { ...track.fx, selectedEffectIndex: effectIndex - 1 } });
    else if (direction === "next" && effectIndex < track.fx.effects.length - 1)
      setTrack({ ...track, fx: { ...track.fx, selectedEffectIndex: effectIndex + 1 } });
  }

  function toggleEffectEnabled() {
    const effects = track.fx.effects.slice();
    effects[effectIndex] = { ...effects[effectIndex], enabled: !effects[effectIndex].enabled };
    setTrack({ ...track, fx: { ...track.fx, effects } });
  }

  const lastEffect = effectIndex >= track.fx.effects.length - 1;
  const disableSave = preset && !presetModified || track.fx.effects.length === 0;

  const style = {
    container: {
      flexDirection: compact ? "row" : "column",
      border: "1px solid #0009", 
      backgroundColor: "#fff6", 
      overflow: "hidden",
      ...rest.style?.container 
    },
    toggle: {
      button: { transition: "all ease-in-out 0.2s", padding: 0, marginLeft: 3, ...rest.style?.toggle?.button },
      icon: { fontSize: 14, opacity: showPreset ? 1 : 0.4, ...rest.style?.icon, ...rest.style?.toggle?.icon }
    },
    top: {
      height: 19,
      borderWidth: !compact ? "0 0 1px 0" : 0,
      borderStyle: "solid",
      flex: compact ? 1 : "initial",
      ...rest.style?.top
    },
    selectSpinBox: {
      select: { 
        fontSize: 13, 
        opacity: preset ? 1 : 0.5, 
        whiteSpace: "nowrap",
        ...rest.style?.text, 
        ...rest.style?.preset?.text 
      },
      container: { flex: 1, padding: "0 4px", height: "100%", ...rest.style?.preset?.container },
      optionsList: { 
        width: containerWidth, 
        transform: `translate(-${compact ? 18 : 1}px, 0)`, 
        maxHeight: 200, 
        ...rest.style?.preset?.optionsList 
      },
      option: { fontSize: 13 }
    },
    bottom: { height: 19, ...rest.style?.bottom },
    addIcon: { fontSize: 14, ...rest.style?.icon, ...rest.style?.add?.icon },
    effect: {
      text: {
        flex: 1,
        whiteSpace: "nowrap",
        fontSize: 13,
        color: "#000",
        opacity: effect?.enabled ? 1 : 0.5,
        ...rest.style?.text,
        ...rest.style?.effect?.text
      },
      actionsContainer: {
        border: `1px solid #0000008a`,
        borderRadius: 10,
        margin: "2px 0",
        padding: "0 2px",
        flexShrink: 0,
        ...rest.style?.effect?.actionsContainer
      }
    },
    enableIcon: (effect: Effect) => ({ 
      fontSize: 13, 
      opacity: effect.enabled ? 100 : 50, 
      padding: 0,
      ...rest.style?.icon, 
      ...rest.style?.enableIcon 
    }),
    removeIcon: { fontSize: 13, ...rest.style?.icon, ...rest.style?.removeIcon},
    spinButton: (disabled: boolean) => ({ 
      cursor: disabled ? "default" : "pointer", 
      height: "50%",
      opacity: disabled ? 0.5 : 1
    })
  } as const;

  return (
    <div className={"d-flex col-12 stop-reorder " + classes?.container} ref={ref} style={style.container}>
      {compact && (
        <IconButton
          className={classes?.toggle?.button}
          onClick={() => setShowPreset(!showPreset)}
          style={style.toggle.button}
          title="Toggle show preset"
        >
          <Tune className={classes?.toggle?.icon} style={style.toggle.icon} />
        </IconButton>
      )}
      {(!compact || showPreset) && (
        <div className={"d-flex align-items-center overflow-hidden " + classes?.top} style={style.top}>
          {namePreset ? (
            <form className="d-flex align-items-center h-100" onBlur={handleBlur} onSubmit={savePresetName}>
              <input
                className="w-100 no-borders bg-transparent no-outline font-bold py-0"
                onChange={e => setPresetNameText(e.target.value)}
                ref={presetNameInputRef}
                style={{ fontSize: 13, lineHeight: 1, ...rest.style?.text, marginLeft: 2 }}
                value={presetNameText}
              />
              <div 
                className={"d-flex h-100 " + classes?.presetNameFormButtons} 
                style={rest.style.presetNameFormButtons}
              >
                <IconButton className="p-0" onClick={() => setNamePreset(false)}>
                  <Close style={{ fontSize: 13, ...rest.style?.icon }} />
                </IconButton>
                <IconButton className="p-0" style={{marginRight: 2}} type="submit">
                  <Check style={{ fontSize: 13, ...rest.style?.icon }} />
                </IconButton>
              </div>
            </form>
          ) : (
            <>
              <SelectSpinBox
                classes={{ 
                  select: "font-bold w-100 " + classes?.preset?.text, 
                  container: "overflow-hidden focus-2 " + classes?.preset?.container,
                  optionsList: classes?.preset?.optionsList
                }}
                hideButtons
                onChange={onChangePreset}
                options={[
                  { label: "None", value: "none" },
                  ...fxChainPresets.map(preset => ({ label: preset.name, value: preset.id }))
                ]}
                optionsPopover={{ marginThreshold: 0 }}
                style={style.selectSpinBox}
                title={preset ? `${preset.name}${presetModified ? " (edited)" : ""}` : ""}
                value={preset?.id || "none"}
              />
              <div 
                className={"d-flex align-items-center " + classes?.presetButtons} 
                style={{ marginRight: 1, ...rest.style.presetButtons }}
              >
                <IconButton className={`p-0 ${disableSave ? "disabled" : ""}`} onClick={save} title="Save">
                  <Save style={{ fontSize: 13, ...rest.style?.icon }} />
                </IconButton>
                <IconButton className={`p-0 ${!preset ? "disabled" : ""}`} onMouseDown={more}>
                  <MoreHoriz style={{ fontSize: 13, ...rest.style?.icon }} />
                </IconButton>
              </div>
            </>
          )}
        </div>
      )}
      {(!compact || !showPreset) && (
        <div className={"d-flex w-100 overflow-hidden " + classes?.bottom} style={style.bottom}>
          <div className="center-flex-v" style={{height: "100%"}}>
            <IconButton
              className={"p-0 " + classes?.add}
              onClick={addEffect}
              title="Add an effect"
              style={{ marginLeft: 2, ...rest.style?.add?.button }}
            >
              <Add className={classes?.add?.icon} style={style.addIcon} />
            </IconButton>
          </div>
          <div
            className={`d-flex align-items-center h-100 overflow-hidden show-on-hover ${classes?.effect?.container}`}
            style={{ flex: 1, paddingLeft: 2, cursor: "pointer", ...rest.style?.effect?.container }}
            tabIndex={0}
          >
            {effect && (
              <React.Fragment>
                <p
                  className={"m-0 lh-1 overflow-hidden " + classes?.effect?.text}
                  style={style.effect.text}
                  title={
                    `${effect.name} (${effectIndex + 1} of ${track.fx.effects.length}` +
                    `${!effect.enabled ? ", disabled" : ""})`
                  }
                >
                  {effect.name}
                </p>
                <div 
                  className={"d-flex removed " + classes?.effect?.actionsContainer} 
                  onMouseDown={e => e.preventDefault()}
                  style={style.effect.actionsContainer}
                >
                  <IconButton
                    className="p-0"
                    onClick={toggleEffectEnabled}
                    title={(effect.enabled ? "Disable" : "Enable") + " effect"}
                  >
                    <PowerSettingsNew className={classes?.enableIcon} style={style.enableIcon(effect)} />
                  </IconButton>
                  <IconButton className="p-0" onClick={deleteEffect} title="Remove effect">
                    <Delete className={"p-0 " + classes?.removeIcon} style={style.removeIcon} />
                  </IconButton>
                </div>
              </React.Fragment>
            )}
          </div>
          {track.fx.effects.length > 0 && (
            <div className={classes?.spinButtons} style={{width: 16, ...rest.style?.spinButtons }}>
              <button
                className={`col-12 overflow-hidden center-flex focus-3 ${classes?.prev?.button}`}
                onClick={() => spin("prev")}
                style={{ ...style.spinButton(effectIndex === 0), ...rest.style?.prev?.button }}
                tabIndex={effectIndex === 0 ? -1 : 0}
              >
                <ArrowDropUp 
                  className={classes?.prev?.icon}
                  style={{ fontSize: 24, ...rest.style?.icon, ...rest.style?.prev?.icon }} 
                />
              </button>
              <button
                className={`col-12 overflow-hidden center-flex focus-3 ${classes?.next?.button}`}
                onClick={() => spin("next")}
                style={{ ...style.spinButton(lastEffect), ...rest.style?.next?.button }}
                tabIndex={effectIndex >= track.fx.effects.length - 1 ? -1 : 0}
              >
                <ArrowDropDown 
                  className={classes?.next?.icon}
                  style={{ fontSize: 24, ...rest.style?.icon, ...rest.style?.next?.icon }} 
                />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}