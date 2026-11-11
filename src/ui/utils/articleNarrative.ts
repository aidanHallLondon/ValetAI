/**
 * Article Narrative Extraction & Deduplication Utility.
 *
 * Decomposes incoming raw content and agent analysis into a continuous,
 * non-repeating editorial piece composed of a punchy headline opening
 * and continuation summary copy.
 */

export interface ArticleNarrative {
  /** Clean headline opening */
  headline: string;
  /** Continuous opening summary copy without repeating headline words */
  opening: string;
}

/**
 * Normalizes text for comparison by collapsing whitespace and stripping punctuation.
 */
function normalizeForComparison(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Strips the headline or its leading words from the start of the summary text.
 */
export function stripHeadlineRepetition(summary: string, headline: string): string {
  if (!summary || !headline) return (summary || "").trim();

  let trimmedSummary = summary.trim();
  const trimmedHeadline = headline.trim();

  // 1. Exact or case-insensitive prefix match
  if (trimmedSummary.toLowerCase().startsWith(trimmedHeadline.toLowerCase())) {
    trimmedSummary = trimmedSummary.slice(trimmedHeadline.length).trim();
    return cleanLeadingPunctuation(trimmedSummary);
  }

  // 2. Normalized word-by-word prefix match
  const headlineWords = normalizeForComparison(trimmedHeadline).split(" ").filter(Boolean);
  const summaryWords = normalizeForComparison(trimmedSummary).split(" ").filter(Boolean);

  if (headlineWords.length >= 3 && summaryWords.length >= headlineWords.length) {
    let matchCount = 0;
    while (
      matchCount < headlineWords.length &&
      summaryWords[matchCount] === headlineWords[matchCount]
    ) {
      matchCount++;
    }

    // If 80%+ of the headline words match the start of the summary
    if (matchCount >= 3 && matchCount / headlineWords.length >= 0.8) {
      // Find the character index in original summary where the matched words end
      const matchedWordTokens = trimmedSummary.split(/\s+/);
      const remainingWords = matchedWordTokens.slice(matchCount);
      trimmedSummary = remainingWords.join(" ").trim();
      return cleanLeadingPunctuation(trimmedSummary);
    }
  }

  // 3. Fallback: Check if summary begins with the first sentence of the headline
  const firstSentenceHeadline = trimmedHeadline.split(/[.?!]/)[0]?.trim();
  if (
    firstSentenceHeadline &&
    firstSentenceHeadline.length > 15 &&
    trimmedSummary.toLowerCase().startsWith(firstSentenceHeadline.toLowerCase())
  ) {
    trimmedSummary = trimmedSummary.slice(firstSentenceHeadline.length).trim();
    return cleanLeadingPunctuation(trimmedSummary);
  }

  return trimmedSummary;
}

/**
 * Cleans leading punctuation characters that might remain after prefix stripping.
 */
function cleanLeadingPunctuation(text: string): string {
  const cleaned = text.replace(/^[\s.:\-—,;"'’”]+/, "").trim();
  if (!cleaned) return "";
  // Ensure the continuation starts with an uppercase letter
  return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
}

/**
 * Extracts a continuous, non-repeating headline and opening summary from an article item.
 *
 * Guarantees that:
 * 1. The headline is concise and distinct.
 * 2. The opening summary continues the narrative seamlessly without repeating headline words.
 * 3. Identical titles and summaries are safely split or deduplicated.
 */
export function extractArticleNarrative(item: {
  raw_text?: string | null;
  analysis?: {
    title?: string | null;
    summary?: string | null;
  } | null;
  source_name?: string | null;
  id?: number | null;
}): ArticleNarrative {
  const rawLines = (item.raw_text || "")
    .replace(/\r\n/g, "\n")
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  const rawFirstLine = rawLines[0] || "";
  const rawRemaining = rawLines.slice(1).join(" ").trim();

  const rawTitle = (item.analysis?.title || "").trim();
  const rawSummary = (item.analysis?.summary || "").trim();

  let headline = "";

  // Strategy A: If rawFirstLine is clean and short-to-medium (<= 150 chars)
  // and rawTitle either starts with it or is identical to summary, rawFirstLine is the true headline.
  if (
    rawFirstLine &&
    rawFirstLine.length <= 150 &&
    (!rawTitle ||
      rawTitle.toLowerCase().startsWith(rawFirstLine.toLowerCase()) ||
      rawTitle === rawSummary)
  ) {
    headline = rawFirstLine;
  } else if (rawTitle) {
    // If rawTitle is identical to rawSummary or looks like a run-on sentence (> 140 chars with period)
    if (rawTitle === rawSummary && rawFirstLine && rawFirstLine.length <= 160) {
      headline = rawFirstLine;
    } else if (rawTitle.length > 140) {
      // Split on first complete sentence if overly long
      const sentenceMatch = rawTitle.match(/^(.+?[.?!])\s+(.+)$/);
      if (sentenceMatch && sentenceMatch[1].length <= 140) {
        headline = sentenceMatch[1].trim();
      } else if (rawFirstLine && rawFirstLine.length <= 150) {
        headline = rawFirstLine;
      } else {
        headline = rawTitle;
      }
    } else {
      headline = rawTitle;
    }
  } else if (rawFirstLine) {
    headline = rawFirstLine;
  } else {
    headline = item.source_name || `Intelligence Brief #${item.id || ""}`;
  }

  // Strategy B: Determine opening summary
  let openingCandidate = "";

  if (rawSummary && rawSummary !== rawTitle) {
    openingCandidate = rawSummary;
  } else if (rawRemaining) {
    openingCandidate = rawRemaining;
  } else if (rawSummary && rawSummary === rawTitle) {
    // If rawTitle and rawSummary were identical blobs, strip headline to get opening
    openingCandidate = rawSummary;
  }

  // Strip headline repetitions from the opening candidate
  let cleanOpening = stripHeadlineRepetition(openingCandidate, headline);

  // If cleanOpening is empty or repeats the headline, attempt to fall back to rawRemaining
  if (
    (!cleanOpening || normalizeForComparison(cleanOpening) === normalizeForComparison(headline)) &&
    rawRemaining &&
    rawRemaining !== rawFirstLine
  ) {
    cleanOpening = stripHeadlineRepetition(rawRemaining, headline);
  }

  // If still identical to headline, omit the opening to prevent repetition
  if (normalizeForComparison(cleanOpening) === normalizeForComparison(headline)) {
    cleanOpening = "";
  }

  return {
    headline: headline.trim(),
    opening: cleanOpening.trim(),
  };
}

