import { bookInfo, bundledPacks } from "../data/catalogue.ts";
import { emptyProgress, loadProgress, type Progress } from "./progress.ts";
import { validatePack } from "./puzzleValidation.ts";
import type { PuzzlePack } from "../types/puzzle.ts";

export const IMPORT_KEY = "combinations.private-pack.v1";
export const MAX_PACK_BYTES = 5 * 1024 * 1024;

export function validateBookPack(value: unknown): PuzzlePack {
  const pack = validatePack(value);
  if (
    pack.collection.id !== bookInfo.id ||
    pack.collection.kind !== "book" ||
    pack.collection.sourceHash !== bookInfo.sourceHash ||
    pack.collection.total !== bookInfo.total
  )
    throw new Error(
      "This is not a verified pack for this edition of the book.",
    );
  if (!pack.puzzles.length)
    throw new Error("The pack has no available exercises.");
  return pack;
}

export function loadStudyState(): {
  progress: Progress;
  imported: PuzzlePack | null;
  error: string | null;
} {
  try {
    const loaded = loadProgress(window.localStorage);
    const raw = window.localStorage.getItem(IMPORT_KEY);
    let imported: PuzzlePack | null = null;
    if (raw && raw.length <= MAX_PACK_BYTES) {
      try {
        const cached = validateBookPack(JSON.parse(raw));
        const bundled = bundledPacks.find(
          (pack) => pack.collection.id === cached.collection.id,
        );
        if (!bundled || cached.puzzles.length >= bundled.puzzles.length)
          imported = cached;
      } catch {
        // Invalid stored packs never enter the catalogue.
      }
    }
    return { ...loaded, imported };
  } catch {
    return {
      progress: emptyProgress(),
      imported: null,
      error:
        "Browser storage is unavailable. Progress will last for this session.",
    };
  }
}
