import { useCallback, useRef, useState } from "react";
import { toast } from "sonner";

interface UseAsyncActionOptions<TResult> {
  successMessage?: string | ((result: TResult) => string);
  errorMessage?: string | ((error: unknown) => string);
  onSuccess?: (result: TResult) => void;
  onError?: (error: unknown) => void;
}

export function useAsyncAction<TArgs extends unknown[], TResult>(
  fn: (...args: TArgs) => Promise<TResult>,
  opts: UseAsyncActionOptions<TResult> = {},
) {
  const [pending, setPending] = useState(false);
  const pendingRef = useRef(false);
  const fnRef = useRef(fn);
  const optsRef = useRef(opts);
  fnRef.current = fn;
  optsRef.current = opts;

  const run = useCallback((...args: TArgs) => {
    if (pendingRef.current) return;
    pendingRef.current = true;
    setPending(true);

    fnRef
      .current(...args)
      .then((result: TResult) => {
        const { successMessage, onSuccess } = optsRef.current;
        if (successMessage) {
          toast.success(typeof successMessage === "function" ? successMessage(result) : successMessage);
        }
        onSuccess?.(result);
      })
      .catch((error: unknown) => {
        const { errorMessage, onError } = optsRef.current;
        const message =
          typeof errorMessage === "function"
            ? errorMessage(error)
            : (errorMessage ?? (error instanceof Error ? error.message : "操作失败"));
        toast.error(message);
        onError?.(error);
      })
      .finally(() => {
        pendingRef.current = false;
        setPending(false);
      });
  }, []);

  return { run, pending };
}
