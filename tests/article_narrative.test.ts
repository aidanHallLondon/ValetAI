import { describe, it, expect } from "vitest";
import { extractArticleNarrative, stripHeadlineRepetition } from "../src/ui/utils/articleNarrative";

describe("Article Narrative Extraction & Deduplication", () => {
  it("eliminates headline repetition when title and summary duplicate content (Formula 1 case)", () => {
    const item = {
      raw_text:
        "Formula 1 to finish season in Middle East\n\nThe 2026 Formula 1 season will conclude with the Qatar and Abu Dhabi grands prix as planned, with Italy's Imola circuit stood down as back-up for the races.",
      analysis: {
        title:
          "Formula 1 to finish season in Middle East The 2026 Formula 1 season will conclude with the Qatar and Abu Dhabi grands prix as planned, with Italy's Imola circuit stood down as back-up for the races.",
        summary:
          "Formula 1 to finish season in Middle East The 2026 Formula 1 season will conclude with the Qatar and Abu Dhabi grands prix as planned, with Italy's Imola circuit stood down as back-up for the races.",
      },
      source_name: "BBC News",
      id: 342,
    };

    const narrative = extractArticleNarrative(item);

    expect(narrative.headline).toBe("Formula 1 to finish season in Middle East");
    expect(narrative.opening).toBe(
      "The 2026 Formula 1 season will conclude with the Qatar and Abu Dhabi grands prix as planned, with Italy's Imola circuit stood down as back-up for the races."
    );
    // Ensure headline is not repeated anywhere in opening
    expect(narrative.opening.startsWith("Formula 1 to finish season in Middle East")).toBe(false);
  });

  it("handles clean non-repeating title and summary without modification", () => {
    const item = {
      raw_text:
        "Autonomous Compiler Agents Accelerate LLVM Optimization\n\nA breakthrough framework integrates local neural reasoning directly into LLVM compiler pipelines.",
      analysis: {
        title: "Autonomous Compiler Agents Accelerate LLVM Optimization",
        summary:
          "A breakthrough framework integrates local neural reasoning directly into LLVM compiler pipelines.",
      },
      source_name: "ArXiv Systems",
      id: 101,
    };

    const narrative = extractArticleNarrative(item);

    expect(narrative.headline).toBe(
      "Autonomous Compiler Agents Accelerate LLVM Optimization"
    );
    expect(narrative.opening).toBe(
      "A breakthrough framework integrates local neural reasoning directly into LLVM compiler pipelines."
    );
  });

  it("strips headline when summary starts with the headline followed by narrative", () => {
    const summary =
      "Krakow shooting suspect has died in hospital, police say Six people were killed in the shooting, and three bodies were found.";
    const headline = "Krakow shooting suspect has died in hospital, police say";

    const cleaned = stripHeadlineRepetition(summary, headline);
    expect(cleaned).toBe(
      "Six people were killed in the shooting, and three bodies were found."
    );
  });

  it("omits opening when text is a single sentence without further content", () => {
    const item = {
      raw_text: "Market opens higher as tech stocks rally.",
      analysis: {
        title: "Market opens higher as tech stocks rally.",
        summary: "Market opens higher as tech stocks rally.",
      },
      source_name: "Reuters",
      id: 55,
    };

    const narrative = extractArticleNarrative(item);

    expect(narrative.headline).toBe("Market opens higher as tech stocks rally.");
    expect(narrative.opening).toBe("");
  });
});

