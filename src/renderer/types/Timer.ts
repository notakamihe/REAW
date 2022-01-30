interface TimerOptions {
  immediate? : boolean;
  errorCallback? : () => void;
}

export default class Timer {
  callback : () => void;
  timeInterval : number;
  options : TimerOptions | undefined;

  expected : number = 0;
  timeout : any = null

  constructor(callback : () => void, timeInterval : number, options? : TimerOptions) {
    this.callback = callback;
    this.timeInterval = timeInterval;
    this.options = options;

    this.start();
  }
    
  start = () => {
    this.expected = Date.now() + this.timeInterval;
    this.timeout = null;
    
    if (this.options?.immediate) {
      this.callback();
    } 
    
    this.timeout = setTimeout(this.round, this.timeInterval);
  }

  stop = () => {
    clearTimeout(this.timeout);
  }

  round = () => {
    let drift = Date.now() - this.expected;

    if (drift > this.timeInterval) {
      if (this.options?.errorCallback) {
        this.options.errorCallback();
      }
    }

    this.callback();

    this.expected += this.timeInterval;
    this.timeout = setTimeout(this.round, this.timeInterval - drift);
  }
}