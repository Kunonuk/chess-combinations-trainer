import practiceData from "./practice.json";
import bookData from "./book.json";
import { validatePack } from "../services/puzzleValidation.ts";
import type { PuzzlePack } from "../types/puzzle.ts";
export const practicePack = validatePack(practiceData);
export const bookPack = validatePack(bookData);
export const bookInfo = {
  id: "ivashchenko-1a",
  title: "The Manual of Chess Combinations · 1a",
  total: 719,
  sourceHash:
    "742323aafa1d76b854b4f323d71826f2ead8a65cd72964f8bc65fbd846420f86",
};
// The complete reviewed edition is bundled. Optional local packs remain outside Git.
const localPacks = import.meta.glob("./private/*.json", {
  eager: true,
  import: "default",
});
export const bundledPacks: PuzzlePack[] = [
  bookPack,
  ...Object.values(localPacks)
    .map(validatePack)
    .filter((pack) => pack.collection.id !== bookPack.collection.id),
  practicePack,
];
