import { useCallback, useState } from "react";
import type { Dispatch, SetStateAction } from "react";

const drafts = new Map<string, unknown>();
const STORAGE_PREFIX = "kiwittr.form-draft.";

function readStoredDraft<T>(key: string) {
  if (typeof window === "undefined") return undefined;

  try {
    const stored = window.sessionStorage.getItem(`${STORAGE_PREFIX}${key}`);
    return stored === null ? undefined : JSON.parse(stored) as T;
  } catch {
    return undefined;
  }
}

function storeDraft(key: string, value: unknown) {
  if (typeof window === "undefined") return;

  try {
    window.sessionStorage.setItem(
      `${STORAGE_PREFIX}${key}`,
      JSON.stringify(value)
    );
  } catch {
    // Keep the in-memory draft when browser storage is unavailable or full.
  }
}

export function hasFormDraft(key: string) {
  return drafts.has(key) || readStoredDraft(key) !== undefined;
}

export function clearFormDraft(prefix: string) {
  for (const key of drafts.keys()) {
    if (key === prefix || key.startsWith(`${prefix}.`)) drafts.delete(key);
  }

  if (typeof window === "undefined") return;

  const storagePrefix = `${STORAGE_PREFIX}${prefix}`;
  for (let index = window.sessionStorage.length - 1; index >= 0; index -= 1) {
    const key = window.sessionStorage.key(index);
    if (
      key &&
      (key === storagePrefix || key.startsWith(`${storagePrefix}.`))
    ) {
      window.sessionStorage.removeItem(key);
    }
  }
}

export default function useFormDraftState<T>(
  key: string,
  initialValue: T | (() => T)
): [T, Dispatch<SetStateAction<T>>] {
  const [value, setValue] = useState<T>(() => {
    if (drafts.has(key)) return drafts.get(key) as T;
    const stored = readStoredDraft<T>(key);
    if (stored !== undefined) {
      drafts.set(key, stored);
      return stored;
    }
    return initialValue instanceof Function ? initialValue() : initialValue;
  });

  const setDraftValue = useCallback<Dispatch<SetStateAction<T>>>((next) => {
    setValue((current) => {
      const updated = next instanceof Function ? next(current) : next;
      drafts.set(key, updated);
      storeDraft(key, updated);
      return updated;
    });
  }, [key]);

  return [value, setDraftValue];
}
