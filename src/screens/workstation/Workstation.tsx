import { useContext, useMemo } from "react"
import Editor from "./Editor"
import { Header, Mixer } from "./components"
import { PaneResize } from "@/components"
import { WorkstationContext } from "@/contexts"
import { InputPane, PaneResizeData } from "@/components/PaneResize"

export default function Workstation() {
  const { mixerHeight, setAllowMenuAndShortcuts, setMixerHeight, showMixer } = useContext(WorkstationContext)!;

  const panes = useMemo(() => {
    const panes: InputPane[] = [
      {
        key: "0",
        handle: { style: { height: 2, bottom: -2 } },
        children: <Editor />
      }
    ];

    if (showMixer)
      panes.push({
        key: "1", 
        max: 450, 
        min: 229, 
        children: <Mixer />, 
        fixed: true, 
        size: mixerHeight 
      });

    return panes;
  }, [showMixer, mixerHeight])

  function handlePaneResizeStop(data: PaneResizeData) {
    if (data.activeNext)
      setMixerHeight(data.activeNext.size);
    setAllowMenuAndShortcuts(true);
  }

  return (
    <div 
      className="m-0 p-0"
      style={{ width: "100vw", height: "100vh", position: "relative", outline: "none" }}
      tabIndex={0}
    >
      <Header />
      <PaneResize
        direction="vertical"
        onPaneResize={() => setAllowMenuAndShortcuts(false)}
        onPaneResizeStop={handlePaneResizeStop}
        panes={panes}
        style={{ flex: 1, height: "calc(100vh - 69px)", display: "flex", flexDirection: "column" }}
      />
    </div>
  )
}