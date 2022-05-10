import { Settings } from "@mui/icons-material";
import { DialogActions, DialogContent, Divider, FormControlLabel, Radio as MuiRadio, RadioGroup, RadioProps, FormControlLabelProps, Snackbar, Alert } from "@mui/material";
import React from "react";
import { PreferencesContext } from "renderer/context/PreferencesContext";
import styled from "styled-components";
import { Dialog } from "./ui";

const TabLI = styled.li`
  padding: 8px 16px;
  width: 100%;
  font-size: 14px;
  cursor: pointer;
  background-color: ${(props : {$active : boolean}) => props.$active ? "var(--color1)!important" : "#0000"};
  color: ${(props : {$active : boolean}) => props.$active ? "#fff" : "var(--fg1)"};
  transition: 0.25s ease-in-out background-color;
  font-weight: ${(props : {$active : boolean}) => props.$active ? "400" : "100"};

  &:hover {
    background-color: var(--bg7);
  }
`

const Radio = (props : {radioProps?: RadioProps, control?: React.ReactElement} & 
  Pick<FormControlLabelProps, Exclude<keyof FormControlLabelProps, "control">>) => {
  const {radioProps, control, sx, ...labelProps} = props;
  const {className, sx: radioSx, ...rest} = props.radioProps || {};

  return (
    <FormControlLabel
      control={
        <MuiRadio 
          className={`remove-spacing mx-2 ${className}`} 
          sx={{"& .MuiSvgIcon-root": {fontSize: 16}, color: "var(--border7)", "&.Mui-checked": {color: "var(--color1)"}, ...radioSx}}
          {...rest}
        />
      }
      sx={{".MuiTypography-root": {fontSize: 14, color: "var(--border7)", fontFamily: "'Red Hat', 'Roboto', sans-serif"}, ...sx}}
      {...labelProps}
    />
  )
}

const Subheading = ({children, ...rest} : {children : string} & React.HTMLProps<HTMLDivElement>) => {
  return (
    <div className="text-center d-flex align-items-center" {...rest}>
      <Divider style={{flex: 1, borderColor: "var(--border1)", opacity: 1}} />
      <h3 className="mx-3" style={{fontSize: 15, color: "var(--fg1)", fontWeight: "bold", margin: 0}}>{children}</h3>
      <Divider style={{flex: 1, borderColor: "var(--border1)", opacity: 1}} />
    </div>
  ) 
}


interface IProps {

}

interface IState {
  oldColor: string;
  oldTheme: string;
  saved: boolean;
  tabIdx: number;
}

export default class PreferencesComponent extends React.Component<IProps, IState> {
  static contextType = PreferencesContext;
  context : React.ContextType<typeof PreferencesContext>;

  constructor(props : IProps) {
    super(props)

    this.state = {
      oldColor: "",
      oldTheme: "",
      saved: false,
      tabIdx: 0
    }

    this.apply = this.apply.bind(this)
    this.cancel = this.cancel.bind(this)
    this.onSubmit = this.onSubmit.bind(this)
  }

  componentDidMount() {
    this.setState({oldColor: this.context!.preferences.color, oldTheme: this.context!.preferences.theme})
  }

  apply() {
    this.setState({oldColor: this.context!.preferences.color, oldTheme: this.context!.preferences.theme, saved: true})
  }

  cancel() {
    this.context!.setPreferences({...this.context!.preferences, color: this.state.oldColor, theme: this.state.oldTheme})
    this.context!.setShowPreferences(false);
  }

  onSubmit(e : React.FormEvent<HTMLFormElement>) {
    e.preventDefault()

    this.apply();
    this.context!.setShowPreferences(false);
  }

  render() {
    const { preferences, setPreferences, showPreferences } = this.context!;

    return (
      <React.Fragment>
        <Dialog
          onClose={() => this.cancel()}
          open={showPreferences}
          style={{width: 700, height: 700}}
          title="Preferences"
        >
          <form onSubmit={this.onSubmit} style={{flex: 1, display: "flex", flexDirection: "column"}}>
            <DialogContent className="p-0" style={{width: "100%", flex: 1}}>
              <div style={{width: "100%", height: "100%", display: "flex"}}>
                <ul className="p-0" style={{flex: 1, borderRight: "1px solid var(--border1)", height: "100%", listStyle: "none"}}>
                  <TabLI $active={this.state.tabIdx === 0} onClick={() => this.setState({tabIdx: 0})}>Appearance</TabLI>
                  <TabLI $active={this.state.tabIdx === 1} onClick={() => this.setState({tabIdx: 1})}>Audio</TabLI>
                  <TabLI $active={this.state.tabIdx === 2} onClick={() => this.setState({tabIdx: 2})}>General</TabLI>
                  <TabLI $active={this.state.tabIdx === 3} onClick={() => this.setState({tabIdx: 3})}>Media</TabLI>
                  <TabLI $active={this.state.tabIdx === 4} onClick={() => this.setState({tabIdx: 4})}>MIDI</TabLI>
                  <TabLI $active={this.state.tabIdx === 5} onClick={() => this.setState({tabIdx: 5})}>Project</TabLI>
                  <TabLI $active={this.state.tabIdx === 6} onClick={() => this.setState({tabIdx: 6})}>Recording</TabLI>
                  <TabLI $active={this.state.tabIdx === 7} onClick={() => this.setState({tabIdx: 7})}>VST &amp; Plug-ins</TabLI>
                </ul>
                <fieldset className="p-3" style={{flex: 4}}>
                  {
                    this.state.tabIdx === 0 &&
                    <div>
                      <div>
                        <Subheading>Theming and Colors</Subheading>
                        <div>
                          <div className="preferences-input-row">
                            <label style={{fontSize: 14, color: "var(--border7)", fontWeight: "bold"}}>Theme</label>
                            <RadioGroup
                              className="align-items-center d-flex"
                              name="theme"
                              onChange={(e : React.ChangeEvent<HTMLInputElement>) => setPreferences({...preferences, theme: e.target.value})}
                              row
                              value={preferences.theme}
                            >
                              <Radio value="light" label="Light" />
                              <Radio value="dark" label="Dark" />
                              <Radio value="system" label="System" />
                            </RadioGroup>
                          </div>
                          <div className="preferences-input-row">
                            <label style={{fontSize: 14, color: "var(--border7)", fontWeight: "bold"}}>Color</label>
                            <RadioGroup
                              className="align-items-center d-flex"
                              name="color"
                              onChange={(e : React.ChangeEvent<HTMLInputElement>) => setPreferences({...preferences, color: e.target.value})}
                              row
                              value={preferences.color}
                            >
                              <table style={{textAlign: "right", columnWidth: 90}}>
                                <tbody>
                                  <tr>
                                    <td><Radio value="bubblegum" label="Bubblegum" /> </td>
                                    <td><Radio value="azure" label="Azure" /></td>
                                    <td><Radio value="crimson" label="Crimson" /></td>
                                    <td><Radio value="violet" label="Violet" /></td>
                                  </tr>
                                  <tr>
                                    <td></td>
                                    <td><Radio value="olive" label="Olive" /></td>
                                    <td><Radio value="citrus" label="Citrus" /></td>
                                    <td><Radio value="mono" label="Mono" /></td>
                                  </tr>
                                </tbody>
                              </table>
                            </RadioGroup>
                          </div>
                        </div>
                      </div>
                    </div>
                  }
                </fieldset>
              </div>
            </DialogContent>
            <DialogActions style={{borderTop: "1px solid var(--border1)"}}>
              <div style={{borderRadius: 4}}>
                <button className="p-1 px-2 br-inherit-l btn2" onClick={this.cancel} style={{marginRight: 6}} type="button">
                  Cancel
                </button>
                <button className="p-1 px-2 btn2" onClick={this.apply} style={{marginRight: 6}} type="button">
                  Apply
                </button>
                <button 
                  className="br-inherit-r"
                  style={{fontSize: 13, backgroundColor: "var(--color1)", color: "#fff", padding: "5px 8px"}}
                >
                  OK
                </button>
              </div>
            </DialogActions>
          </form>
        </Dialog>
        <Snackbar 
          anchorOrigin={{horizontal: "center", vertical: "bottom"}}
          autoHideDuration={3000} 
          open={this.state.saved} 
          onClose={() => this.setState({saved: false})}
        >
          <Alert icon={<Settings style={{color: "#fff"}} />} sx={{width: '100%', backgroundColor: "var(--color1)", color: "#fff"}}>
            Changes saved
          </Alert>
        </Snackbar>
      </React.Fragment>
    )
  }
}