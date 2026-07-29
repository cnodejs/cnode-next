import { useEffect, useRef, useState } from "react";
import { useNavigation } from "react-router";
import { cn } from "~/lib/utils";

export function NavProgress() {
  const navigation = useNavigation();
  const isNavigating = navigation.state !== "idle";
  const [visible, setVisible] = useState(false);
  const [complete, setComplete] = useState(false);
  const delayTimer = useRef<number | null>(null);
  const hideTimer = useRef<number | null>(null);

  useEffect(() => {
    if (isNavigating) {
      if (hideTimer.current !== null) {
        window.clearTimeout(hideTimer.current);
        hideTimer.current = null;
      }
      if (delayTimer.current === null) {
        delayTimer.current = window.setTimeout(() => {
          setComplete(false);
          setVisible(true);
          delayTimer.current = null;
        }, 150);
      }
    } else {
      if (delayTimer.current !== null) {
        window.clearTimeout(delayTimer.current);
        delayTimer.current = null;
      }
      if (visible) {
        setComplete(true);
        hideTimer.current = window.setTimeout(() => {
          setVisible(false);
          setComplete(false);
          hideTimer.current = null;
        }, 250);
      }
    }

    return () => {
      if (delayTimer.current !== null) {
        window.clearTimeout(delayTimer.current);
        delayTimer.current = null;
      }
      if (hideTimer.current !== null) {
        window.clearTimeout(hideTimer.current);
        hideTimer.current = null;
      }
    };
  }, [isNavigating, visible]);

  if (!visible) return null;

  return (
    <div
      aria-hidden="true"
      className={cn(
        "pointer-events-none fixed inset-x-0 top-0 z-50 h-0.5 transition-opacity duration-200",
        complete ? "opacity-0" : "opacity-100",
      )}
    >
      <div
        className={cn(
          "h-full w-full origin-left bg-primary transition-transform duration-300 ease-out",
          complete ? "scale-x-100" : "animate-pulse scale-x-75",
        )}
      />
    </div>
  );
}

export function useNavTransition() {
  const navigation = useNavigation();
  return navigation.state !== "idle";
}
