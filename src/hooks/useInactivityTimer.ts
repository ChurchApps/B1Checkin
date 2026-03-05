import { useState, useEffect, useRef, useCallback } from "react";

export function useInactivityTimer(timeoutSeconds: number, enabled: boolean) {
  const [isIdle, setIsIdle] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const resetTimer = useCallback(() => {
    if (!enabled) return;
    setIsIdle(false);

    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      setIsIdle(true);
    }, timeoutSeconds * 1000);
  }, [timeoutSeconds, enabled]);

  const dismiss = useCallback(() => {
    setIsIdle(false);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      setIsIdle(true);
    }, timeoutSeconds * 1000);
  }, [timeoutSeconds]);

  useEffect(() => {
    if (enabled) resetTimer();
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [enabled, resetTimer]);

  return { isIdle, resetTimer, dismiss };
}
