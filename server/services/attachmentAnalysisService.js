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

1. If the file is a question paper, worksheet, exam sheet, or assignment:
   - Extract all visible questions.
   - Preserve numbering and sub-parts.
   - Do not answer the questions.
   - Do not invent unreadable text.

2. If the file is a certificate:
   - Identify the certificate title.
   - Identify the issuing organization.
   - Identify the recipient if clearly visible.
   - Identify relevant skills, course, or credential information.
   - Summarize what the certificate represents.

3. If the file contains a product such as a phone, laptop, vehicle,
   appliance, or other object:
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

  const base64Data = fileBuffer.toString("base64");

  const response = await ai.models.generateContent({
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

  const extractedText = response.text?.trim();

  if (!extractedText) {
    throw new Error(
      "AI returned no extracted context."
    );
  }

  return extractedText;
}

module.exports = {
  analyzeAttachment,
};