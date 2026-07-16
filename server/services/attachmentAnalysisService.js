const fs = require("fs/promises");
const { GoogleGenAI } = require("@google/genai");

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

const EXTRACTION_PROMPT = `
You are the attachment understanding engine for PulseOpinion,
a public discussion platform.

Analyze the attached file carefully and produce useful text context
that can be reviewed and edited by the user before posting.

Rules:

1. If the document contains multiple questions, return ONLY the questions.
   - Put each question on a new line.
   - Do not number them yourself.
   - Do not add explanations.
   - Do not answer them.
   - Ignore headers, page numbers, and instructions.

2. If the file is a certificate:
   - Identify the certificate title.
   - Identify the issuing organization.
   - Identify the recipient if clearly visible.
   - Identify relevant skills, course, or credential information.
   - Summarize what the certificate represents.

3. If the file contains a product such as a phone, laptop, vehicle,
   appliance, or another object:
   - Identify the product only if reasonably clear.
   - Describe visible characteristics.
   - Mention relevant text visible in the image.
   - Do not invent exact model names or specifications.

4. If the file is a general document:
   - Extract the main topic.
   - Capture important facts and visible text.
   - Summarize the useful context.

5. If the file is a general image:
   - Describe what is visibly present.
   - Extract important readable text.
   - Explain the likely discussion context.

Important:
- Be factual.
- Never fabricate missing information.
- If something is uncertain, say so.
- Return plain text only.
- Do not use markdown headings.
- Keep the result concise but complete.
`;

function getResponseText(response) {
  return (
    response.candidates?.[0]?.content?.parts
      ?.map((part) => part.text || "")
      .join("")
      .trim() || ""
  );
}

function fallbackAnswer(question) {
  return `This question invites discussion around "${question}". A useful starting point is to examine the available evidence, consider the strongest arguments on different sides, and remain open to updating the conclusion as better information emerges.`;
}

async function analyzeAttachment(file) {
  if (!file?.path) {
    throw new Error("Attachment file is required.");
  }

  if (!process.env.GEMINI_API_KEY) {
    throw new Error(
      "GEMINI_API_KEY is not configured."
    );
  }

  const fileBuffer = await fs.readFile(file.path);
  const base64Data =
    fileBuffer.toString("base64");

  const response =
    await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [
        {
          role: "user",
          parts: [
            {
              text: EXTRACTION_PROMPT,
            },
            {
              inlineData: {
                mimeType: file.mimetype,
                data: base64Data,
              },
            },
          ],
        },
      ],
    });

  const extractedText =
    getResponseText(response);

  if (!extractedText) {
    throw new Error(
      "AI returned no extracted context."
    );
  }

  return extractedText;
}

async function generateQuestionAnswer({
  question,
  aiContext = null,
}) {
  const cleanQuestion =
    String(question || "").trim();

  if (!cleanQuestion) {
    throw new Error(
      "Question is required for PulseBot."
    );
  }

  if (!process.env.GEMINI_API_KEY) {
    return fallbackAnswer(cleanQuestion);
  }

  const prompt = `
You are PulseBot, the default AI participant on PulseOpinion.

Write a helpful starting response to the question below.

Rules:
- Keep it between 70 and 140 words.
- Be neutral, clear, and conversational.
- If the question is factual, answer directly while stating uncertainty when needed.
- If the question is subjective, present a balanced perspective instead of pretending there is one correct answer.
- Do not mention that you are an AI model.
- Do not use markdown headings.
- Do not use bullet points.
- Do not claim certainty without evidence.
- Use any provided context only when it is relevant.

Question:
${cleanQuestion}

Additional context:
${aiContext?.trim() || "No additional context was provided."}
`;

  try {
    const response =
      await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
      });

    return (
      getResponseText(response) ||
      fallbackAnswer(cleanQuestion)
    );
  } catch (error) {
    console.error(
      "PulseBot answer generation failed:",
      error
    );

    return fallbackAnswer(cleanQuestion);
  }
}

async function generateQuestionAnswers(
  questions
) {
  const cleanQuestions = Array.isArray(
    questions
  )
    ? questions
        .map((question) =>
          String(question || "").trim()
        )
        .filter(Boolean)
        .slice(0, 50)
    : [];

  if (cleanQuestions.length === 0) {
    return [];
  }

  if (!process.env.GEMINI_API_KEY) {
    return cleanQuestions.map(
      fallbackAnswer
    );
  }

  const prompt = `
You are PulseBot, the default AI participant on PulseOpinion.

For every question in the JSON array below, write one neutral,
helpful starting response.

Rules for every answer:
- 60 to 120 words.
- Clear and conversational.
- Factual questions should be answered directly with uncertainty stated when appropriate.
- Subjective questions should receive a balanced perspective.
- Do not use markdown.
- Do not add numbering.
- Return ONLY valid JSON in this exact form:
{"answers":["answer one","answer two"]}

The number and order of answers must exactly match the questions.

Questions:
${JSON.stringify(cleanQuestions)}
`;

  try {
    const response =
      await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
      });

    const raw = getResponseText(response)
      .replace(/^```json\s*/i, "")
      .replace(/^```\s*/i, "")
      .replace(/```$/i, "")
      .trim();

    const parsed = JSON.parse(raw);
    const answers = Array.isArray(
      parsed?.answers
    )
      ? parsed.answers
      : [];

    return cleanQuestions.map(
      (question, index) => {
        const answer =
          typeof answers[index] === "string"
            ? answers[index].trim()
            : "";

        return (
          answer ||
          fallbackAnswer(question)
        );
      }
    );
  } catch (error) {
    console.error(
      "PulseBot batch generation failed:",
      error
    );

    return cleanQuestions.map(
      fallbackAnswer
    );
  }
}

module.exports = {
  analyzeAttachment,
  generateQuestionAnswer,
  generateQuestionAnswers,
};