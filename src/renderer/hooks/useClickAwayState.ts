import React from 'react';

function useClickAwayState<T>(initialState: T | null | (() => T | null)) : 
[T | null, (newSelected: T | null) => void, (obj : T | null) => void, (cca : boolean) => void] {
  const [selected, setSelected] = React.useState<T | null>(initialState);
  const [cancelClickAway, setCancelClickAway] = React.useState<boolean>(false);

  const onClickAway = (obj : T | null) => {
    if (!cancelClickAway) {
      if (obj === selected) {
        setSelected(null);
        return
      }
  
      let o = new Object(obj);
      let s = new Object(selected);
  
      if (o.hasOwnProperty("id") && s.hasOwnProperty("id")) {
        if ((o as any)["id"] === (s as any)["id"]) {
          setSelected(null);
          return
        }
      }
    }
  }

  return [selected, setSelected, onClickAway, setCancelClickAway];
}

export default useClickAwayState;