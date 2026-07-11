import { useCallback, useState } from "react";
import type { Dispatch, SetStateAction } from "react";

const drafts = new Map<string, unknown>();

export function hasFormDraft(key: string) {
  return drafts.has(key);
}

export function clearFormDraft(prefix: string) {
  for (const key of drafts.keys()) {
    if (key === prefix || key.startsWith(`${prefix}.`)) drafts.delete(key);
  }
}

export default function useFormDraftState<T>(
  key: string,
  initialValue: T | (() => T)
): [T, Dispatch<SetStateAction<T>>] {
  const [value, setValue] = useState<T>(() => {
    if (drafts.has(key)) return drafts.get(key) as T;
    return initialValue instanceof Function ? initialValue() : initialValue;
  });

  const setDraftValue = useCallback<Dispatch<SetStateAction<T>>>((next) => {
    setValue((current) => {
      const updated = next instanceof Function ? next(current) : next;
      drafts.set(key, updated);
      return updated;
    });
  }, [key]);

  return [value, setDraftValue];
}
