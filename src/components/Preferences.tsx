import { CSSProperties, useContext, useEffect, useState } from "react";
import { Settings } from "@mui/icons-material";
import { DialogActions, DialogContent, FormControlLabel, Radio as MuiRadio, RadioGroup, RadioProps as MuiRadioProps, Snackbar } from "@mui/material";
import { PreferencesContext } from "@/contexts";
import { Dialog } from "./widgets";
import styled from "styled-components";

const PreferencesRow = styled.div`
  display: flex;
  margin-top: 16px;

  & label {
    font-size: 14px;
    color: var(--border6);
    font-weight: bold;
  }

  & > div {
    flex: 1;
    justify-content: flex-end;
  }
`;

interface RadioProps {
  className?: string;
  label: string;
  radioProps?: MuiRadioProps;
  style?: CSSProperties;
  value: string;
}

const Radio = ({ className, label, radioProps, style, value }: RadioProps) => (
  <div className={className} style={style}>
    <FormControlLabel
      className="m-0"
      control={
        <MuiRadio 
          {...radioProps}
          className={`remove-spacing me-1 ${radioProps?.className}`}
          sx={{
            color: "var(--border6)",
            "& .MuiSvgIcon-root": { fontSize: 16 },
            "&.Mui-checked": { color: "var(--color1)" },
            ...radioProps?.sx
          }}
          value={value}
        />
      }
      label={label}
      slotProps={{ 
        typography: { fontSize: 14, color: "var(--border6)", fontFamily: "'Manrope', 'Roboto', sans-serif" }
      }}
    />
  </div>
)

const tabs = ["Appearance", "Audio", "General", "Media", "MIDI", "Project", "Recording", "VST & Plug-ins"];

export default function Preferences() {
  const { 
    preferences, 
    savePreferences, 
    savedPreferences,
    setShowPreferences, 
    showPreferences,
    updatePreferences
  } = useContext(PreferencesContext)!;

  const [saved, setSaved] = useState(false);
  const [tabIdx, setTabIdx] = useState(0);

  useEffect(() => cancel(), [])

  function apply() {
    savePreferences();
    setSaved(true);
  }

  function cancel() {
    updatePreferences(savedPreferences);
    setShowPreferences(false);
  }

  function changeColor(e: React.ChangeEvent<HTMLInputElement>) {
    updatePreferences({ ...preferences, color: e.target.value });
  }

  function changeTheme(e: React.ChangeEvent<HTMLInputElement>) {
    updatePreferences({ ...preferences, theme: e.target.value });
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    apply();
    setShowPreferences(false);
  }

  return (
    <>
      <Dialog
        onClose={(_, reason) => { if (reason !== "backdropClick") cancel(); }}
        open={showPreferences}
        style={{ width: 700, height: 660, maxWidth: "95%" }}
        title="Preferences"
      >
        <form onSubmit={handleSubmit} style={{flex: 1, display: "flex", flexDirection: "column"}}>
          <DialogContent className="p-0" style={{width: "100%", flex: 1}}>
            <div style={{width: "100%", height: "100%", display: "flex"}}>
              <ul className="p-0" style={{flex: 1, borderRight: "1px solid var(--border1)", height: "100%", listStyle: "none"}}>
                {tabs.map((tab, idx) => (
                  <li
                    className={"w-100 py-2 px-3 " + (tabIdx !== idx ? "hover-2" : "")}
                    key={idx} 
                    onClick={() => setTabIdx(idx)}
                    style={{
                      fontSize: 14,
                      cursor: "pointer",
                      transition: "0.25s ease-in-out background-color",
                      backgroundColor: tabIdx === idx ? "var(--color1)" : "",
                      color: tabIdx === idx ? "var(--bg8)" : "var(--fg1)",
                      fontWeight: tabIdx === idx ? "bold" : "",
                    }}
                  >
                    {tab}
                  </li>
                ))}
              </ul>
              <div className="p-3" style={{ flex: 4 }}>
                {tabIdx === 0 && (
                  <div>
                    <div className="pe-2">
                      <h3 
                        className="m-0 mb-3 pb-1"
                        style={{fontSize: 15, color: "var(--border6)", borderBottom: "1px solid var(--border6)"}}
                      >
                        Theming and Colors
                      </h3>
                      <div>
                        <PreferencesRow className="mt-0">
                          <label>Theme</label>
                          <RadioGroup name="theme" onChange={changeTheme} row value={preferences.theme}>
                            <Radio className="me-2" value="light" label="Light" />
                            <Radio className="me-2" value="dark" label="Dark" />
                            <Radio className="m-0" value="system" label="System" />
                          </RadioGroup>
                        </PreferencesRow>
                        <PreferencesRow>
                          <label>Color</label>
                          <RadioGroup name="color" onChange={changeColor} row value={preferences.color}>
                            <table style={{textAlign: "left", columnWidth: 90}}>
                              <tbody>
                                <tr>
                                  <td><Radio className="me-2" value="rose" label="Rose" /></td>
                                  <td><Radio className="me-2" value="violet" label="Violet" /></td>
                                  <td><Radio className="me-2" value="azure" label="Azure" /></td>
                                  <td><Radio className="m-0" value="aqua" label="Aqua" /></td>
                                </tr>
                                <tr>
                                  <td><Radio className="me-2" value="olive" label="Olive" /></td>
                                  <td><Radio className="me-2" value="citrus" label="Citrus" /></td>
                                  <td><Radio className="me-2" value="crimson" label="Crimson" /></td>
                                  <td><Radio className="m-0" value="mono" label="Mono" /></td>
                                </tr>
                              </tbody>
                            </table>
                          </RadioGroup>
                        </PreferencesRow>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </DialogContent>
          <DialogActions style={{borderTop: "1px solid var(--border1)"}}>
            <button className="p-1 px-2 btn-2 hover-1 m-0 me-2" onClick={cancel} type="button">
              Cancel
            </button>
            <button className="p-1 px-2 btn-2 hover-1 m-0 me-2" onClick={apply} type="button">
              Apply
            </button>
            <button className="m-0 btn-3" style={{padding: "5px 8px"}}>OK</button>
          </DialogActions>
        </form>
      </Dialog>
      <Snackbar 
        anchorOrigin={{horizontal: "center", vertical: "bottom"}}
        autoHideDuration={3000} 
        open={saved} 
        onClose={() => setSaved(false)}
        style={{ bottom: 28, boxShadow: "none" }}
      >
        <div style={{ backgroundColor: "var(--bg8)" }}>
          <div 
            className="d-flex justify-content-center align-items-center"
            style={{ border: "1px solid var(--color1)", padding: "8px 12px" }}
          >
            <Settings style={{color: "var(--color1)", marginRight: 6, fontSize: 16}} />
            <p className="m-0" style={{ fontSize: 15, color: "var(--color1)", fontWeight: "bold" }}>
              Changes saved
            </p>
          </div>
        </div>
      </Snackbar>
    </>
  )
}