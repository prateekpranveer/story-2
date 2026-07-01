import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Method not allowed",
    });
  }

  try {
    const {
      context = "",
      mode = "continue",
    } = req.body;

    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      generationConfig: {
        temperature: 0.8,
        topP: 0.95,
        topK: 40,
        maxOutputTokens: 250,
      },
    });

    let prompt = "";

    if (mode === "start" || context.trim().length === 0) {
      prompt = `
complete the current line
`;
    } else {
      prompt = `
complete the current paragraph

${context}
`;
    }

    const result = await model.generateContent(prompt);

    const suggestion =
      result.response.text().trim();

    return res.status(200).json({
      suggestion,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      error: "Failed to generate suggestion.",
      details: error.message,
    });
  }
}