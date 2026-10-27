import { useState } from "react";
import { bundledPacks } from "../data/catalogue.ts";
import {
  emptyProgress,
  recordProgress,
  type ProgressEvent,
} from "../services/progress.ts";
import {
  IMPORT_KEY,
  MAX_PACK_BYTES,
  loadStudyState,
  validateBookPack,
} from "../services/studyStorage.ts";
import type { PuzzlePack } from "../types/puzzle.ts";
import { useStudyProgress, type SaveNotice } from "./useStudyProgress.ts";

export function useStudyLibrary() {
  const [initial] = useState(loadStudyState);
  const [notice, setNotice] = useState(initial.error);
  const { progress, updateProgress } = useStudyProgress(
    initial.progress,
    setNotice,
  );
  const [imported, setImported] = useState(initial.imported);
  const [studyRevision, setStudyRevision] = useState(0);
  const packs = imported
    ? [
        imported,
        ...bundledPacks.filter(
          (pack) => pack.collection.id !== imported.collection.id,
        ),
      ]
    : bundledPacks;
  const firstPack =
    packs.find(
      (pack) => pack.collection.kind === "book" && pack.puzzles.length,
    ) ?? packs.find((pack) => pack.puzzles.length);
  const location = progress.location ?? {
    collection: firstPack?.collection.id ?? "",
    puzzle: firstPack?.puzzles[0]?.id ?? 1,
  };
  const pack =
    packs.find(
      (pack) =>
        pack.collection.id === location.collection && pack.puzzles.length,
    ) ?? firstPack;
  const puzzle =
    pack?.puzzles.find((puzzle) => puzzle.id === location.puzzle) ??
    pack?.puzzles[0];

  function navigate(
    nextPack: PuzzlePack,
    id: number,
    saveNotice: SaveNotice = "report",
  ): void {
    updateProgress(
      (previous) => ({
        ...previous,
        location: { collection: nextPack.collection.id, puzzle: id },
      }),
      saveNotice,
    );
  }

  function record(event: ProgressEvent): void {
    if (!pack || !puzzle) return;
    updateProgress((previous) =>
      recordProgress(previous, pack.collection.id, puzzle.id, event),
    );
  }

  function resetProgress(): void {
    updateProgress((previous) => ({
      ...emptyProgress(),
      location: previous.location,
    }));
    setStudyRevision((revision) => revision + 1);
  }

  async function importPack(file: File): Promise<void> {
    if (file.size > MAX_PACK_BYTES) {
      setNotice("Choose a JSON pack smaller than 5 MB.");
      return;
    }
    try {
      const raw = await file.text();
      const next = validateBookPack(JSON.parse(raw));
      const first = next.puzzles[0];
      if (!first) throw new Error("The pack has no available exercises.");
      setImported(next);
      setStudyRevision((revision) => revision + 1);
      navigate(next, first.id, "preserve");
      try {
        window.localStorage.setItem(IMPORT_KEY, raw);
        setNotice(
          `Imported ${next.puzzles.length} verified book exercises. The pack stays in this browser.`,
        );
      } catch {
        setNotice(
          "Pack imported for this session. Browser storage could not retain it.",
        );
      }
    } catch (error) {
      setNotice(
        `Pack was not imported: ${error instanceof Error ? error.message : "Invalid JSON"}`,
      );
    }
  }

  return {
    packs,
    pack,
    puzzle,
    progress,
    notice,
    setNotice,
    studyRevision,
    navigate,
    record,
    importPack,
    resetProgress,
  };
}
