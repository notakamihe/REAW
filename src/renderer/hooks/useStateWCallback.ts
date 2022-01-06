import { SetStateAction, useCallback, useEffect, useRef, useState } from 'react';

type Callback<T> = (value?: T) => void;

function useStateCallback<T>(initialState: T | (() => T)): [T, (value: T, callback?: Callback<T>) => void] {
  const [state, _setState] = useState(initialState);

  const callbackRef = useRef<Callback<T>>();
  const isFirstCallbackCall = useRef<boolean>(true);

  const setState = useCallback((setStateAction: SetStateAction<T>, callback?: Callback<T>): void => {
    callbackRef.current = callback;
    _setState(setStateAction);
  }, []);

  useEffect(() => {
    if (isFirstCallbackCall.current) {
      isFirstCallbackCall.current = false;
      return;
    }
    callbackRef.current?.(state);
  }, [state]);

  return [state, setState];
}

export default useStateCallback;