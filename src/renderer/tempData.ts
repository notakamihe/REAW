import { Track } from "./components/TrackComponent";
import {v4 as uuidv4} from 'uuid';
import TimelinePosition from "./types/TimelinePosition";

const data : Track[] = [
  {
    id: uuidv4(), 
    name: "Track 1", 
    color: "#aaf", 
    clips: [
      {
        id: uuidv4(),
        start: new TimelinePosition(1, 3, 0),
        end: new TimelinePosition(3, 2, 900),
        startLimit: new TimelinePosition(1, 2, 0),
        endLimit: new TimelinePosition(4, 2, 0),
        loopEnd: new TimelinePosition(3, 2, 900),
        muted: false
      },
      {
        id: uuidv4(),
        start: new TimelinePosition(4, 1, 0),
        end: new TimelinePosition(4, 3, 750),
        startLimit: null,
        endLimit: null,
        loopEnd: new TimelinePosition(5, 2, 500),
        muted: false
      }
    ],
    fx: {
      effects: [
        {
          id: uuidv4(),
          name: "Effect 1",
          enabled: true
        },
        {
          id: uuidv4(),
          name: "Effect 2",
          enabled: true
        }
      ],
    },
    mute: false,
    solo: false,
    armed: false,
    automationEnabled: true,
    volume: 0,
    pan: 0,
    automationLanes: [
      {
        id: uuidv4(),
        label: "Volume",
        minValue: -80,
        maxValue: 6,
        show: false,
        expanded: true,
        isVolume: true,
        nodes: [
          {
            id: uuidv4(),
            pos: new TimelinePosition(1, 2, 0),
            value: -37
          },
          {
            id: uuidv4(),
            pos: new TimelinePosition(2, 2, 0),
            value: -80
          },
          {
            id: uuidv4(),
            pos: new TimelinePosition(3, 4, 500),
            value: 6
          },
          {
            id: uuidv4(),
            pos: new TimelinePosition(5, 1, 0),
            value: -57
          }
        ],
      },
      {
        id: uuidv4(),
        label: "Pan",
        minValue: -100,
        maxValue: 100,
        show: false,
        expanded: true,
        isPan: true,
        nodes: [
          {
            id: uuidv4(),
            pos: new TimelinePosition(1, 1, 0),
            value: 0
          },
          {
            id: uuidv4(),
            pos: new TimelinePosition(3, 1, 0),
            value: -37
          }
        ],
      }
    ]
  },
  // {
  //   id: uuidv4(), 
  //   name: "Track 1", 
  //   color: "#faf", 
  //   clips: [
  //     {
  //       id: uuidv4(),
  //       start: new TimelinePosition(1, 1, 0),
  //       end: new TimelinePosition(1, 3, 0),
  //       startLimit: new TimelinePosition(1, 1, 0),
  //       endLimit: new TimelinePosition(1, 3, 0),
  //       loopEnd: new TimelinePosition(1, 3, 0),
  //     }
  //   ],
  //   effects: [],
  //   mute: false,
  //   solo: false,
  //   automationEnabled: false,
  //   volume: 0,
  //   pan: 0,
  //   automationLanes: [
  //     {
  //       id: 1,
  //       label: "Volume",
  //       nodes: [],
  //       show: false
  //     },
  //     {
  //       id: 2,
  //       label: "Pan",
  //       nodes: [],
  //       show: false
  //     }
  //   ]
  // },
  // {
  //   id: uuidv4(), 
  //   name: "Track 1", 
  //   color: "#aff", 
  //   clips: [
  //     {
  //       id: uuidv4(),
  //       start: new TimelinePosition(1, 2, 950),
  //       end: new TimelinePosition(5, 1, 0),
  //       startLimit: new TimelinePosition(1, 2, 950),
  //       endLimit: new TimelinePosition(5, 1, 0),
  //       loopEnd: new TimelinePosition(5, 1, 0),
  //     }
  //   ],
  //   effects: [],
  //   mute: false,
  //   solo: false,
  //   automationEnabled: false,
  //   volume: 0,
  //   pan: 0,
  //   automationLanes: [
  //     {
  //       id: 1,
  //       label: "Volume",
  //       nodes: [],
  //       show: false
  //     },
  //     {
  //       id: 2,
  //       label: "Pan",
  //       nodes: [],
  //       show: false
  //     }
  //   ]
  // },
  // {
  //   id: uuidv4(), 
  //   name: "Track 1", 
  //   color: "#faa", 
  //   clips: [
  //     {
  //       id: uuidv4(),
  //       start: new TimelinePosition(2, 4, 250),
  //       end: new TimelinePosition(3, 1, 0),
  //       startLimit: new TimelinePosition(2, 4, 250),
  //       endLimit: new TimelinePosition(3, 1, 0),
  //       loopEnd: new TimelinePosition(3, 1, 0)
  //     },
  //     {
  //       id: uuidv4(),
  //       start: new TimelinePosition(4, 3, 0),
  //       end: new TimelinePosition(5, 4, 90),
  //       startLimit: new TimelinePosition(4, 3, 0),
  //       endLimit: new TimelinePosition(5, 4, 90),
  //       loopEnd: new TimelinePosition(5, 4, 90)
  //     }
  //   ],
  //   effects: [],
  //   mute: false,
  //   solo: false,
  //   automationEnabled: false,
  //   volume: 0,
  //   pan: 0,
  //   automationLanes: [
  //     {
  //       id: 1,
  //       label: "Volume",
  //       nodes: [],
  //       show: false
  //     },
  //     {
  //       id: 2,
  //       label: "Pan",
  //       nodes: [],
  //       show: false
  //     }
  //   ]
  // },
  // {
  //   id: uuidv4(), 
  //   name: "Track 1", 
  //   color: "#ffa", 
  //   clips: [
  //     {
  //       id: uuidv4(),
  //       start: new TimelinePosition(1, 1, 1),
  //       end: new TimelinePosition(2, 2, 2),
  //       startLimit: new TimelinePosition(1, 1, 1),
  //       endLimit: new TimelinePosition(2, 2, 2),
  //       loopEnd: new TimelinePosition(2, 2, 2)
  //     },
  //     {
  //       id: uuidv4(),
  //       start: new TimelinePosition(3, 3, 3),
  //       end: new TimelinePosition(4, 4, 4),
  //       startLimit: new TimelinePosition(3, 3, 3),
  //       endLimit: new TimelinePosition(4, 4, 4),
  //       loopEnd: new TimelinePosition(4, 4, 4)
  //     }
  //   ],
  //   effects: [],
  //   mute: true,
  //   solo: true,
  //   automationEnabled: false,
  //   volume: 0,
  //   pan: 0,
  //   automationLanes: [
  //     {
  //       id: 1,
  //       label: "Volume",
  //       nodes: [],
  //       show: false
  //     },
  //     {
  //       id: 2,
  //       label: "Pan",
  //       nodes: [],
  //       show: false
  //     }
  //   ]
  // },
  // {
  //   id: uuidv4(), 
  //   name: "Track 1", 
  //   color: "#afa", 
  //   clips: [
  //     {
  //       id: uuidv4(),
  //       start: new TimelinePosition(2, 1, 0),
  //       end: new TimelinePosition(3, 1, 0),
  //       startLimit: new TimelinePosition(2, 1, 0),
  //       endLimit: new TimelinePosition(3, 1, 0),
  //       loopEnd: new TimelinePosition(3, 1, 0)
  //     },
  //     {
  //       id: uuidv4(),
  //       start: new TimelinePosition(4, 1, 0),
  //       end: new TimelinePosition(5, 1, 500),
  //       startLimit: new TimelinePosition(4, 1, 0),
  //       endLimit: new TimelinePosition(5, 1, 500),
  //       loopEnd: new TimelinePosition(5, 1, 500)
  //     }
  //   ],
  //   effects: [],
  //   mute: false,
  //   solo: false,
  //   automationEnabled: false,
  //   volume: 0,
  //   pan: 0,
  //   automationLanes: [
  //     {
  //       id: 1,
  //       label: "Volume",
  //       nodes: [],
  //       show: false
  //     },
  //     {
  //       id: 2,
  //       label: "Pan",
  //       nodes: [],
  //       show: false
  //     }
  //   ]
  // },
  // {
  //   id: uuidv4(), 
  //   name: "Track 1", 
  //   color: "#69f", 
  //   clips: [
  //     {
  //       id: uuidv4(),
  //       start: new TimelinePosition(3, 3, 250),
  //       end: new TimelinePosition(5, 2, 500),
  //       startLimit: new TimelinePosition(3, 3, 250),
  //       endLimit: new TimelinePosition(5, 2, 500),
  //       loopEnd: new TimelinePosition(5, 2, 500)
  //     },
  //     {
  //       id: uuidv4(),
  //       start: new TimelinePosition(5, 2, 500),
  //       end: new TimelinePosition(6, 1, 0),
  //       startLimit: new TimelinePosition(5, 2, 500),
  //       endLimit: new TimelinePosition(6, 1, 0),
  //       loopEnd: new TimelinePosition(6, 1, 0)
  //     }
  //   ],
  //   effects: [],
  //   mute: false,
  //   solo: false,
  //   automationEnabled: false,
  //   volume: 0,
  //   pan: 0,
  //   automationLanes: [
  //     {
  //       id: 1,
  //       label: "Volume",
  //       nodes: [],
  //       show: false
  //     },
  //     {
  //       id: 2,
  //       label: "Pan",
  //       nodes: [],
  //       show: false
  //     }
  //   ]
  // },
]

export default data;