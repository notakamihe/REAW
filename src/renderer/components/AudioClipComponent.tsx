import React from "react";
import { WorkstationContext } from "renderer/context/WorkstationContext";
import TimelinePosition from "renderer/types/TimelinePosition";
import { AudioClip, AutomationLane, Clip, Track } from "renderer/types/types";
import { marginToPos} from "renderer/utils/utils";
import { DNRData, ResizeDirection } from "./DNR";
import channels from "renderer/utils/channels";
import Waveform, { WaveformContainer } from "./Waveform";
import {ClipComponent} from ".";
import { LanesContextType } from "renderer/context/LanesContext";
import { reverseAudio } from "renderer/utils/audio";

interface IProps {
  clip : AudioClip;
  isSelected : boolean;
  lanesCtx: LanesContextType;
  onClickAway : (clip : Clip) => void;
  onChangeLane : (clip : Clip, newTrack: Track) => void;
  onSelect : (clip : Clip) => void;
  setClip : (clip : Clip) => void;
  track : Track;
}

interface IState {
  buffer: AudioBuffer | null;
  loading: boolean;
  prevHorizontalScale: number;
  srcOffset: number;
}

class AudioClipComponent extends React.Component<IProps, IState> {
  static contextType = WorkstationContext;
  context!: React.ContextType<typeof WorkstationContext>;

  audioRef: React.RefObject<HTMLAudioElement>;

  audioContext: AudioContext = new AudioContext();

  constructor(props : IProps) {
    super(props);

    this.audioRef = React.createRef();

    this.state = {
      buffer: null,
      loading: false,
      prevHorizontalScale: 0,
      srcOffset: 0
    }

    this.consolidate = this.consolidate.bind(this);
    this.onResize = this.onResize.bind(this);
  }

  componentDidMount() {
    this.setState({
      srcOffset: -TimelinePosition.toWidth(
        this.props.clip.audio.start, this.props.clip.start, this.context!.timelinePosOptions)
    });

    this.loadBuffer();
  }

  componentDidUpdate(prevProps: IProps) {
    if (this.state.prevHorizontalScale !== this.context!.timelinePosOptions.horizontalScale) {
      this.setState({
        prevHorizontalScale: this.context!.timelinePosOptions.horizontalScale,
        srcOffset: -TimelinePosition.toWidth(this.props.clip.audio.start, 
          this.props.clip.start, this.context!.timelinePosOptions)
      });
    }

    if (prevProps.clip.audio.start !== this.props.clip.audio.start) {
        this.setState({srcOffset: -TimelinePosition.toWidth(this.props.clip.audio.start, 
          this.props.clip.start, this.context!.timelinePosOptions)});
    }

    if (prevProps.clip.audio.buffer !== this.props.clip.audio.buffer) {
      this.loadBuffer();
    }
  }

  consolidate() {
    if (this.state.buffer) {
      this.context!.consolidateAudioClip(this.props.clip, this.audioContext, this.state.buffer);
    }
  }

  async loadBuffer() {
    this.setState({loading: true})

    const ab = new ArrayBuffer(this.props.clip.audio.buffer.length);
    const view = new Uint8Array(ab);
    
    for (let i = 0; i < this.props.clip.audio.buffer.length; ++i)
        view[i] = this.props.clip.audio.buffer[i];
    
    this.setState({buffer: await this.audioContext.decodeAudioData(ab)}, () => {
      this.setState({loading: false});
    });
  }

  onResize (e : MouseEvent, dir : ResizeDirection, ref : HTMLElement, data : DNRData) {
    if (dir === ResizeDirection.Left) {
      this.setState({
        srcOffset: -TimelinePosition.toWidth(
          this.props.clip.audio.start, 
          marginToPos(data.coords.startX || 0, this.context!.timelinePosOptions), 
          this.context!.timelinePosOptions
        )
      });
    }
  }

  
  render() {
    const {timelinePosOptions, verticalScale} = this.context!
    const audioWidth = TimelinePosition.toWidth(this.props.clip.audio.start, 
      this.props.clip.audio.end, timelinePosOptions);

    return (
      <>
        <WaveformContainer>
          <ClipComponent
            automationSprite={(l: AutomationLane) => (
              <Waveform 
                buffer={this.state.buffer}
                height={l.expanded ? 100 * verticalScale: 25}
                loading={this.state.loading}
                offset={this.state.srcOffset}
                width={audioWidth}
              />
            )}
            clip={this.props.clip}
            isSelected={this.props.isSelected}
            lanesCtx={this.props.lanesCtx}
            listeners={[
              {
                channel: channels.REVERSE_AUDIO,
                handler: () => {
                  if (this.state.buffer) {
                    const reversedBuffer = reverseAudio(this.audioContext, this.state.buffer);
                    const clip: AudioClip = {
                      ...this.props.clip,
                      audio: {
                        ...this.props.clip.audio, 
                        buffer: reversedBuffer, 
                        src: {
                          ...this.props.clip.audio.src,
                          data: reversedBuffer.toString("base64")
                        }
                      }
                    };
            
                    this.props.setClip(clip);
                  }
                }
              }
            ]}
            loopSprite={
              <Waveform 
                buffer={this.state.buffer}
                height={100 * verticalScale - 16}
                loading={this.state.loading}
                offset={this.state.srcOffset}
                width={audioWidth}
              />
            }
            onConsolidate={this.consolidate}
            onClickAway={this.props.onClickAway}
            onChangeLane={this.props.onChangeLane}
            onResize={this.onResize}
            onSelect={this.props.onSelect}
            setClip={this.props.setClip}
            sprite={
              <Waveform 
                buffer={this.state.buffer}
                host
                height={100 * verticalScale - 16}
                loading={this.state.loading}
                offset={this.state.srcOffset}
                width={audioWidth}
              />
            }
            track={this.props.track}
          />
        </WaveformContainer>
        <audio 
          ref={this.audioRef} 
          src={`data:audio/${this.props.clip.audio.src.extension};base64,${this.props.clip.audio.src.data}`} 
        />
      </>
    )
  }
}

export default React.memo(AudioClipComponent);