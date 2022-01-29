import React, { Dispatch, SetStateAction } from "react"

export default function useStateWPrev<T>(initialState: T | (() => T)) : [T, Dispatch<SetStateAction<T>>, T | null] {
  const [state, setState] = React.useState<T>(initialState)
  const prevState = React.useRef<T | null>(null)

  React.useEffect(() => {
    prevState.current = state
  })

  return [state, setState, prevState.current]
}