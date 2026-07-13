const { GoogleGenAI } = require("@google/genai");

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

const ALLOWED_DISCUSSION_TYPES = new Set([
  "factual_claim",
  "prediction",
  "opinion",
  "advice",
  "comparison",
  "other",
]);

function buildVerificationPrompt({
  question,
  aiContext,
  comments,
}) {
  const normalizedComments = Array.isArray(comments)
    ? comments
    : [];

  const commentText =
    normalizedComments.length > 0
      ? normalizedComments
          .map((comment, index) => {
            const text =
              typeof comment?.text === "string"
                ? comment.text.trim()
                : "";

            return `${index + 1}. ${text}`;
          })
          .filter((line) => !line.endsWith(". "))
          .join("\n")
      : "No comments available.";

  return `
You are the discussion verification and relevance engine for PulseOpinion,
a public discussion platform.

Analyze the complete discussion using only the supplied material.

QUESTION:
${question}

AI-EXTRACTED ATTACHMENT CONTEXT:
${aiContext || "No attachment context available."}

COMMENTS:
${commentText || "No comments available."}

Your goal is NOT to calculate a literal percentage of truth.

Your goal is to estimate how strongly the complete discussion is:
- relevant to the question being asked
- supported by the supplied context
- meaningfully addressed by the comments
- useful to a future user looking for information about this topic
- coherent as an overall discussion


The final confidenceScore must represent the overall quality,
support, relevance, and usefulness of the discussion.

First classify the question as exactly one of:
- factual_claim
- prediction
- opinion
- advice
- comparison
- other

Then assess these dimensions internally:

1. QUESTION-CONTEXT ALIGNMENT
How directly does the AI-extracted attachment context relate
to the actual question?

2. COMMENT RELEVANCE
How directly do the comments address the question?
Comments that are off-topic must reduce confidence.

3. DISCUSSION SUPPORT
Do the supplied context and comments provide meaningful support,
reasoning, evidence, examples, or useful perspectives?

4. DISCUSSION CONSISTENCY
Do the comments and context form a coherent discussion?
If they conflict, determine whether the disagreement is useful
and reasoned or merely unsupported noise.

5. FUTURE SEARCH USEFULNESS
Would a future user looking for information about this topic
find this discussion relevant and useful?

Important comment rules:
- Comments must materially influence the score.
- Do not treat every comment as reliable evidence.
- Relevant, reasoned comments should strengthen the assessment.
- Off-topic comments should weaken the assessment.
- Unsupported assertions should contribute little.
- Spam, noise, or unrelated comments should reduce discussion quality.
- Multiple comments repeating the same unsupported claim do not
  automatically increase confidence.
- Reasoned disagreement can improve usefulness when it adds
  relevant perspectives.
- No comments means there is less discussion evidence available;
  do not pretend a rich community discussion exists.

Important context rules:
- AI-extracted attachment context may contain extraction mistakes.
- A source describing itself positively is not independent proof
  of broader outcomes.
- Distinguish direct support from inference.
- Do not fabricate evidence.
- Do not claim external fact-checking.
- Do not use likes or dislikes.
- Do not use outside knowledge that is absent from the supplied material.

Score calibration:
- 0-20:
  Mostly irrelevant, unsupported, incoherent, or unusable.

- 21-40:
  Weak relevance or support with major gaps.

- 41-60:
  Moderately relevant and somewhat useful, but important gaps remain.

- 61-75:
  Clearly relevant and reasonably supported, with visible limitations.

- 76-89:
  Strongly aligned, well-supported, and useful as a discussion.

- 90-100:
  Exceptional alignment, substantial high-quality support,
  highly relevant comments, and minimal meaningful gaps.

Critical calibration rules:
- Scores above 90 must be rare.
- A relevant attachment alone is not enough for an exceptional score.
- A question with no meaningful comments should normally not receive
  an exceptional discussion score.
- Many comments do not guarantee a high score.
- Comment quality and relevance matter more than comment quantity.
- The score is not a probability that the question is true.

Return ONLY valid JSON in exactly this structure:

{
  "discussionType": "advice",
  "confidenceScore": 0,
  "verdict": "Short assessment",
  "explanation": "Concise explanation covering context alignment, comment relevance, discussion support, and future usefulness."
}

Requirements:
- discussionType must be one allowed value.
- confidenceScore must be an integer from 0 to 100.
- verdict must be at most 100 characters.
- explanation must be concise and specific.
- no markdown
- no code fences
- no text outside the JSON object
`;
}


function parseVerificationResponse(rawText) {
  if (typeof rawText !== "string") {
    throw new Error(
      "AI returned an invalid verification response."
    );
  }

  const cleanedText = rawText
    .trim()
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/i, "");

  let parsed;

  try {
    parsed = JSON.parse(cleanedText);
  } catch (error) {
    throw new Error(
      "AI returned invalid verification JSON."
    );
  }

  const discussionType =
    typeof parsed.discussionType === "string"
      ? parsed.discussionType.trim()
      : "";

  const confidenceScore = Number(
    parsed.confidenceScore
  );

  let verdict =
    typeof parsed.verdict === "string"
      ? parsed.verdict.trim()
      : "";

  const explanation =
    typeof parsed.explanation === "string"
      ? parsed.explanation.trim()
      : "";

  if (
    !ALLOWED_DISCUSSION_TYPES.has(
      discussionType
    )
  ) {
    throw new Error(
      "AI returned an invalid discussion type."
    );
  }

  if (
    !Number.isInteger(confidenceScore) ||
    confidenceScore < 0 ||
    confidenceScore > 100
  ) {
    throw new Error(
      "AI returned an invalid confidence score."
    );
  }

  if (!verdict) {
    throw new Error(
      "AI returned no verification verdict."
    );
  }

  if (verdict.length > 100) {
    verdict = verdict
      .slice(0, 97)
      .trimEnd()
      .replace(/[,:;\-–—]+$/, "")
      .trimEnd();

    verdict = `${verdict}...`;
  }

  if (!explanation) {
    throw new Error(
      "AI returned no verification explanation."
    );
  }

  return {
    discussionType,
    confidenceScore,
    verdict,
    explanation,
  };
}

async function analyzeDiscussion({
  question,
  aiContext = null,
  comments = [],
}) {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error(
      "GEMINI_API_KEY is not configured."
    );
  }

  if (
    typeof question !== "string" ||
    !question.trim()
  ) {
    throw new Error(
      "Question text is required for verification."
    );
  }

  const prompt = buildVerificationPrompt({
    question: question.trim(),

    aiContext:
      typeof aiContext === "string"
        ? aiContext.trim() || null
        : null,

    comments: Array.isArray(comments)
      ? comments
      : [],
  });

  const response =
    await ai.models.generateContent({
      model: "gemini-2.5-flash",

      contents: [
        {
          role: "user",

          parts: [
            {
              text: prompt,
            },
          ],
        },
      ],
    });

  const rawText = response.text?.trim();

  if (!rawText) {
    throw new Error(
      "AI returned no verification assessment."
    );
  }

  return parseVerificationResponse(rawText);
}

module.exports = {
  analyzeDiscussion,
};