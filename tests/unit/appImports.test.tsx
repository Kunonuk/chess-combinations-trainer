import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import App from "../../src/App.tsx";
import { PROGRESS_KEY } from "../../src/services/progress.ts";
import { bookPackFixture } from "../fixtures/bookPack.ts";
import { fixturePuzzle } from "../fixtures/puzzles.ts";
import { moveInStudy, uploadStudyJSON } from "../support/app.ts";

vi.mock("../../src/data/catalogue.ts", async () => {
  const { practiceOnlyCatalogue } = await import("../fixtures/catalogue.ts");
  return practiceOnlyCatalogue();
});

const IMPORT_KEY = "combinations.private-pack.v1";
beforeEach(() => localStorage.clear());

describe("private pack imports", () => {
  it("imports verified synthetic positions while preserving original numbering and gaps", async () => {
    const user = userEvent.setup();
    render(<App />);
    await uploadStudyJSON(user, JSON.stringify(bookPackFixture()));
    await screen.findByText(/Imported 2 verified book exercises/);
    expect(screen.getByLabelText("Collection", { exact: true })).toHaveValue(
      "ivashchenko-1a",
    );
    expect(screen.getByTestId("square-d8")).toHaveAttribute(
      "aria-label",
      "d8 Black queen",
    );
    const exercise = screen.getByLabelText("Exercise", { exact: true });
    expect(
      within(exercise).getByRole("option", { name: "#2 · unavailable" }),
    ).toBeDisabled();
    await user.click(screen.getByRole("button", { name: "Next exercise" }));
    expect(exercise).toHaveValue("3");
    expect(screen.getByTestId("square-f7")).toHaveAttribute(
      "aria-label",
      "f7 White pawn",
    );
    expect(
      screen.getByRole("button", { name: "Next exercise" }),
    ).toBeDisabled();
  });

  it.each(["identity", "hash", "total", "empty"] as const)(
    "rejects an invalid edition pack: %s",
    async (field) => {
      const user = userEvent.setup();
      const pack = bookPackFixture();
      if (field === "identity") pack.collection.id = "lichess-practice";
      if (field === "hash") pack.collection.sourceHash = "0".repeat(64);
      if (field === "total") pack.collection.total = 718;
      if (field === "empty") pack.puzzles = [];
      render(<App />);
      await uploadStudyJSON(user, JSON.stringify(pack));
      await screen.findByText(/Pack was not imported:/);
      expect(screen.getByLabelText("Collection", { exact: true })).toHaveValue(
        "lichess-practice",
      );
      expect(localStorage.getItem(IMPORT_KEY)).toBeNull();
    },
  );

  it("rejects malformed JSON without replacing the current collection", async () => {
    const user = userEvent.setup();
    render(<App />);
    await uploadStudyJSON(user, "{");
    await screen.findByText(/Pack was not imported:/);
    expect(screen.getByTestId("square-a2")).toHaveAttribute(
      "aria-label",
      "a2 White bishop",
    );
    expect(localStorage.getItem(IMPORT_KEY)).toBeNull();
  });

  it.each(["identity", "hash"] as const)(
    "applies the edition gate to cached imports: %s",
    (field) => {
      const pack = bookPackFixture();
      if (field === "identity") pack.collection.id = "lichess-practice";
      else pack.collection.sourceHash = "0".repeat(64);
      localStorage.setItem(IMPORT_KEY, JSON.stringify(pack));
      render(<App />);
      expect(screen.getByText("Separate Lichess practice")).toBeInTheDocument();
      expect(
        screen.queryByText("Private book collection"),
      ).not.toBeInTheDocument();
      expect(screen.getByTestId("square-a2")).toHaveAttribute(
        "aria-label",
        "a2 White bishop",
      );
    },
  );

  it("restores a cached verified pack at its last available exercise", () => {
    localStorage.setItem(IMPORT_KEY, JSON.stringify(bookPackFixture()));
    localStorage.setItem(
      PROGRESS_KEY,
      JSON.stringify({
        version: 1,
        collections: {},
        location: { collection: "ivashchenko-1a", puzzle: 3 },
      }),
    );
    render(<App />);
    expect(screen.getByLabelText("Collection", { exact: true })).toHaveValue(
      "ivashchenko-1a",
    );
    expect(screen.getByLabelText("Exercise", { exact: true })).toHaveValue("3");
    expect(screen.getByTestId("square-f7")).toHaveAttribute(
      "aria-label",
      "f7 White pawn",
    );
  });

  it("keeps completion separate when the same exercise number appears in two collections", async () => {
    const user = userEvent.setup();
    render(<App />);
    await uploadStudyJSON(user, JSON.stringify(bookPackFixture()));
    await screen.findByText(/Imported 2 verified book exercises/);
    await moveInStudy(user, "d8", "h4");
    expect(
      screen.getByRole("progressbar", { name: "Collection progress" }),
    ).toHaveAttribute("value", "1");
    await user.selectOptions(
      screen.getByLabelText("Collection", { exact: true }),
      "lichess-practice",
    );
    expect(
      screen.getByRole("progressbar", { name: "Collection progress" }),
    ).toHaveAttribute("value", "0");
    await user.click(screen.getByRole("button", { name: "Hint" }));
    await user.selectOptions(
      screen.getByLabelText("Collection", { exact: true }),
      "ivashchenko-1a",
    );
    expect(
      screen.getByRole("progressbar", { name: "Collection progress" }),
    ).toHaveAttribute("value", "1");
    expect(
      screen.getByText("✓ Solved first try", { exact: true }),
    ).toBeInTheDocument();
  });

  it("re-importing a corrected exercise restarts its active board and assistance", async () => {
    const user = userEvent.setup();
    render(<App />);
    await uploadStudyJSON(user, JSON.stringify(bookPackFixture()));
    await screen.findByText(/Imported 2 verified book exercises/);
    await user.click(screen.getByRole("button", { name: "Hint" }));
    const replacement = bookPackFixture();
    replacement.puzzles = [
      {
        ...fixturePuzzle(replacement, 1),
        id: 1,
        source: { ...fixturePuzzle(replacement, 1).source, exercise: 1 },
      },
    ];
    await uploadStudyJSON(user, JSON.stringify(replacement));
    await waitFor(() =>
      expect(screen.getByTestId("square-f7")).toHaveAttribute(
        "aria-label",
        "f7 White pawn",
      ),
    );
    expect(screen.queryByText(/Hint 1:/)).not.toBeInTheDocument();
  });
});
