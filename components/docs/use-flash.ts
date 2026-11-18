import { useState } from "react";

export function useFlash(ms = 1800) {
  const [on, setOn] = useState(false);
  return [
    on,
    () => {
      setOn(true);
      setTimeout(() => setOn(false), ms);
    },
  ] as const;
}
