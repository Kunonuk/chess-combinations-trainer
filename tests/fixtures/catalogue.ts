import { vi } from "vitest";

type CatalogueModule = typeof import("../../src/data/catalogue.ts");

export async function practiceOnlyCatalogue(): Promise<CatalogueModule> {
  const actual = await vi.importActual<CatalogueModule>(
    "../../src/data/catalogue.ts",
  );
  return { ...actual, bundledPacks: [actual.practicePack] };
}
