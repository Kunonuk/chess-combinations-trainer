import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import App from "../../src/App.tsx";
import { PROGRESS_KEY } from "../../src/services/progress.ts";
import { readSavedProgress } from "../support/savedProgress.ts";

vi.mock("../../src/data/catalogue.ts", async () => {
  const { practiceOnlyCatalogue } = await import("../fixtures/catalogue.ts");
  return practiceOnlyCatalogue();
});

beforeEach(() => localStorage.clear());

describe("trainer study flow", () => {
  it("persists hint history across retry and requires explicit reset confirmation", async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole("button", { name: "Hint" }));
    await user.click(screen.getByRole("button", { name: "Retry exercise" }));
    expect(
      readSavedProgress().collections["lichess-practice"]?.["1"],
    ).toMatchObject({
      hints: 1,
      retries: 1,
    });
    await user.click(
      screen.getByRole("button", { name: "Reset study progress" }),
    );
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Keep progress" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(
      readSavedProgress().collections["lichess-practice"]?.["1"]?.hints,
    ).toBe(1);
  });

  it("restores the last exercise and completion totals when reopened", () => {
    localStorage.setItem(
      PROGRESS_KEY,
      JSON.stringify({
        version: 1,
        collections: {
          "lichess-practice": {
            "1": { attempts: 2, completed: true, firstTry: true },
          },
        },
        location: { collection: "lichess-practice", puzzle: 2 },
      }),
    );
    render(<App />);
    expect(screen.getByLabelText("Exercise", { exact: true })).toHaveValue("2");
    expect(screen.getByTestId("square-e8")).toHaveAttribute(
      "aria-label",
      "e8 Black rook",
    );
    expect(
      screen.getByRole("progressbar", { name: "Collection progress" }),
    ).toHaveAttribute("value", "1");
  });

  it.each([
    { collection: "removed-collection", puzzle: 1 },
    { collection: "lichess-practice", puzzle: 999 },
  ])(
    "falls back to an available exercise for a stale saved location: %j",
    (location) => {
      localStorage.setItem(
        PROGRESS_KEY,
        JSON.stringify({ version: 1, collections: {}, location }),
      );
      render(<App />);
      expect(screen.getByLabelText("Collection", { exact: true })).toHaveValue(
        "lichess-practice",
      );
      expect(screen.getByLabelText("Exercise", { exact: true })).toHaveValue(
        "1",
      );
      expect(screen.getByTestId("square-a2")).toHaveAttribute(
        "aria-label",
        "a2 White bishop",
      );
    },
  );

  it("confirmed reset clears active hints and solution playback as well as saved progress", async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole("button", { name: "Hint" }));
    await user.click(screen.getByRole("button", { name: "Show solution" }));
    await user.click(screen.getByRole("button", { name: /Play next move/ }));
    expect(screen.getByTestId("square-e6")).toHaveAttribute(
      "aria-label",
      "e6 White bishop",
    );
    await user.click(
      screen.getByRole("button", { name: "Reset study progress" }),
    );
    await user.click(
      within(screen.getByRole("dialog")).getByRole("button", {
        name: "Reset progress",
      }),
    );
    expect(screen.getByTestId("square-a2")).toHaveAttribute(
      "aria-label",
      "a2 White bishop",
    );
    expect(screen.queryByText(/Hint 1:/)).not.toBeInTheDocument();
    expect(screen.queryByText("Study the solution")).not.toBeInTheDocument();
    expect(
      screen.getByText("In progress", { exact: true }),
    ).toBeInTheDocument();
    expect(readSavedProgress().collections).toEqual({});
  });
});
