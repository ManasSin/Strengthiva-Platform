"use client";
import { useCallback, useEffect, useRef, useState } from "react";
export function useResource<T>(
  key: string,
  loader: (signal: AbortSignal) => Promise<T>
) {
  const loaderRef = useRef(loader);
  useEffect(() => {
    loaderRef.current = loader;
  });
  const [revision, setRevision] = useState(0);
  const [state, setState] = useState<{
    key: string;
    revision: number;
    data?: T;
    error?: Error;
    loading: boolean;
  }>({ key, revision, loading: true });
  useEffect(() => {
    const controller = new AbortController();
    loaderRef
      .current(controller.signal)
      .then((data) => {
        if (!controller.signal.aborted)
          setState({ key, revision, data, loading: false });
      })
      .catch((error) => {
        if (!controller.signal.aborted)
          setState({
            key,
            revision,
            error:
              error instanceof Error
                ? error
                : new Error("Unable to load records."),
            loading: false,
          });
      });
    return () => controller.abort();
  }, [key, revision]);
  const reload = useCallback(() => setRevision((value) => value + 1), []);
  return {
    ...(state.key === key && state.revision === revision
      ? state
      : { key, revision, loading: true }),
    reload,
  };
}
