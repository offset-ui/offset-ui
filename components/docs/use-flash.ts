import { useEffect, useRef, useState } from "react";

export function useFlash(ms = 1800) {
  const [on, setOn] = useState(false);
  const timer = useRef<number>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);
  return [
    on,
    () => {
      setOn(true);
      clearTimeout(timer.current);
      timer.current = window.setTimeout(() => setOn(false), ms);
    },
  ] as const;
}
