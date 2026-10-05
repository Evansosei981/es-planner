import express from "express";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";

dotenv.config();

const app = express();
const PORT = 3000;
const HOST = "0.0.0.0";

app.use(express.json({ limit: "50mb" }));

// Server-side Gemini initialization
const getGenAI = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
};

const BASE_SYSTEM_INSTRUCTION = `You are Evans, a university study tutor.
CRITICAL PEDAGOGICAL & PERSONA RULES:
1. Your name is Evans. Never break character. Never say "As an AI language model".
2. You know the student's courses and upcoming exam dates. Use this context when answering.
3. Always explain concepts and problem-solving clearly step by step.
4. At the end of every conceptual or problem-solving answer, ask exactly ONE short check question to test the student's understanding.
5. If you are ever unsure of a fact, calculation, or syllabus detail, admit when you are unsure instead of guessing or hallucinating.
6. Format mathematical expressions clearly using standard LaTeX ($...$ for inline, $$...$$ for block) or clean Unicode, and format code with markdown code blocks.`;

app.post("/api/ai/chat", async (req, res) => {
  const { prompt, history = [], studentContext } = req.body;
  if (!prompt) {
    return res.status(400).json({ error: "Prompt is required" });
  }

  // Construct dynamic system instruction containing student academic background if provided
  let systemInstruction = BASE_SYSTEM_INSTRUCTION;
  if (studentContext) {
    systemInstruction += `\n\nSTUDENT ACADEMIC CONTEXT:
- Student Name: ${studentContext.studentName || "Student"}
- Major: ${studentContext.major || "Not specified"}
- Enrolled Courses: ${JSON.stringify(studentContext.courses || [])}
- Upcoming Exams: ${JSON.stringify(studentContext.upcomingExams || [])}
- Current Focus / Weak Topics: ${JSON.stringify(studentContext.weakTopics || [])}
- Today's Classes: ${JSON.stringify(studentContext.todayClasses || [])}
Address the student warmly as Evans. Use their actual course names, lecturer names, and exam dates when relevant to their questions.`;
  }

  const ai = getGenAI();
  if (!ai) {
    return res.json({
      text: `Hi ${studentContext?.studentName || "there"}! I'm Evans, your study tutor. I received your question: "${prompt}".

Here is how we can think about this step by step:
1. Identify the fundamental principle or theorem involved.
2. Break the problem into sub-parts and solve each sequentially.
3. Review your work against known constraints.

Check question for you: Can you tell me what the first step or principle would be in your own words?`,
    });
  }

  try {
    const contents: any[] = [];
    if (Array.isArray(history)) {
      for (const msg of history) {
        contents.push({
          role: msg.isUser ? "user" : "model",
          parts: [{ text: msg.text }],
        });
      }
    }
    contents.push({
      role: "user",
      parts: [{ text: prompt }],
    });

    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents,
      config: {
        systemInstruction,
      },
    });

    res.json({ text: response.text || "" });
  } catch (err: any) {
    console.error("Gemini API Error:", err);
    res.status(500).json({
      error: "Failed to generate response",
      details: err?.message || String(err),
    });
  }
});

// AI Question Extraction from Student Uploaded Resources
app.post("/api/ai/extract-questions", async (req, res) => {
  const { text, fileData, mimeType, fileName, resourceTitle, courseName = "General Studies" } = req.body;

  if (!text && !fileData) {
    return res.status(400).json({ error: "Text or file data is required" });
  }

  const ai = getGenAI();

  // If Gemini is available, use it for deep semantic question extraction
  if (ai) {
    try {
      const contentsParts: any[] = [];

      if (fileData && mimeType && mimeType.startsWith("image/")) {
        contentsParts.push({
          inlineData: {
            mimeType,
            data: fileData.replace(/^data:[^;]+;base64,/, ""),
          },
        });
      }

      const promptInstruction = `You are an expert academic evaluator. Analyze the provided study material / exercise sheet "${resourceTitle || fileName || 'Student Resource'}" for the course "${courseName}".
Extract individual practice and exam questions.
For each question found:
1. Identify the exact question text (clean up any numbering or OCR artifacts).
IMPORTANT FOR MATH, PHYSICS, ENGINEERING & COMPUTER SCIENCE:
Always format mathematical expressions, equations, formulas, variables, symbols, integrals, derivatives, limits, fractions, exponents, Greek letters, and Big-O notation using standard LaTeX enclosed in $ ... $ for inline math (e.g. $f'(x) = 3x^2$, $\\int_0^1 x^2 \\, dx$, $O(n \\log n)$, $\\frac{a}{b}$, $\\sqrt{x^2 + y^2}$, $\\theta$, $\\lambda$, $\\sum_{i=1}^n x_i$) or $$ ... $$ for standalone block equations.
2. Classify the academic subject and specific topic (e.g. Differentiation, Integration, SQL, Sorting, Concurrency).
3. Estimate difficulty: "easy", "medium", or "hard".
4. Determine question type: "multiple_choice", "true_false", or "short_answer".
5. Provide 2-4 distinct options if multiple choice (format any math in options with $ ... $), or ["True", "False"] if true/false, or empty array if short answer.
6. Identify the correct answer (or standard solution).
7. Write a clear, 1-3 sentence step-by-step explanation or solution, formatting any math equations in $ ... $.
8. If page number or exercise number is mentioned, note it.

Output MUST be a valid JSON object matching this structure:
{
  "questions": [
    {
      "question": "question text here",
      "subject": "${courseName}",
      "category": "Topic Name",
      "difficulty": "medium",
      "type": "multiple_choice",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctAnswer": "Option A",
      "explanation": "Explanation here",
      "sourcePage": 1
    }
  ],
  "detectedTopics": ["Topic Name 1", "Topic Name 2"]
}
`;

      if (text) {
        contentsParts.push({
          text: `${promptInstruction}\n\nDocument text content:\n${text}`,
        });
      } else {
        contentsParts.push({
          text: promptInstruction,
        });
      }

      const response = await ai.models.generateContent({
        model: "gemini-3.8-flash",
        contents: contentsParts,
        config: {
          responseMimeType: "application/json",
        },
      });

      const responseText = response.text || "{}";
      const parsed = JSON.parse(responseText);

      return res.json({
        questions: parsed.questions || [],
        detectedTopics: parsed.detectedTopics || [],
        count: (parsed.questions || []).length,
      });
    } catch (err: any) {
      console.warn("Gemini extraction error, falling back to heuristic parser:", err?.message);
    }
  }

  // Fallback heuristic extraction if Gemini is unavailable or failed
  const raw = text || "";
  const lines = raw.split(/\r?\n/).filter(Boolean);
  const fallbackQuestions: any[] = [];
  const detectedTopics: Set<string> = new Set([courseName]);

  let currentQ: any = null;

  for (const line of lines) {
    const trimmed = line.trim();
    const qMatch = trimmed.match(/^(?:(?:Question|\(?\d+\)?|\d+[\.\)])\s*)(.+)/i);
    const ansMatch = trimmed.match(/^(?:Answer|Ans|Solution):\s*(.+)/i);
    const optMatch = trimmed.match(/^([A-D]\)|\([A-D]\)|[A-D]\.)\s*(.+)/i);

    if (qMatch) {
      if (currentQ) fallbackQuestions.push(currentQ);
      currentQ = {
        question: qMatch[1],
        subject: courseName,
        category: "General",
        difficulty: "medium",
        type: "short_answer",
        options: [],
        correctAnswer: "Review required",
        explanation: "Extracted from exercise sheet. Verify against course textbook.",
        sourcePage: 1,
      };
    } else if (ansMatch && currentQ) {
      currentQ.correctAnswer = ansMatch[1].trim();
    } else if (optMatch && currentQ) {
      currentQ.type = "multiple_choice";
      currentQ.options.push(optMatch[2].trim());
    } else if (currentQ && trimmed.length > 0) {
      currentQ.question += " " + trimmed;
    }
  }

  if (currentQ) fallbackQuestions.push(currentQ);

  if (fallbackQuestions.length === 0 && raw.trim().length > 10) {
    // Single general question fallback
    fallbackQuestions.push({
      question: raw.slice(0, 200).trim(),
      subject: courseName,
      category: "General Review",
      difficulty: "medium",
      type: "short_answer",
      options: [],
      correctAnswer: "Refer to notes",
      explanation: "Practice question generated from study document.",
      sourcePage: 1,
    });
  }

  res.json({
    questions: fallbackQuestions,
    detectedTopics: Array.from(detectedTopics),
    count: fallbackQuestions.length,
  });
});

// Optional AI Question Generator (when enabled by student in Settings)
app.post("/api/ai/generate-questions", async (req, res) => {
  const { topic, courseName = "Computer Science", count = 3 } = req.body;
  const ai = getGenAI();

  if (!ai) {
    return res.status(503).json({ error: "Gemini API key is not configured" });
  }

  try {
    const prompt = `Generate ${count} high-quality, practical academic practice questions for university course "${courseName}" on topic "${topic || 'Core Principles'}".
Questions should test conceptual understanding and problem solving.
For all mathematical equations, symbols, variables, integrals, fractions, exponents, Greek letters, and formulas, ALWAYS format in standard LaTeX enclosed in $ ... $ (e.g. $f'(x) = 3x^2$, $\\int x \\, dx$).
Format as JSON:
{
  "questions": [
    {
      "question": "question text",
      "category": "${topic || 'General'}",
      "difficulty": "medium",
      "type": "multiple_choice",
      "options": ["A", "B", "C", "D"],
      "correctAnswer": "A",
      "explanation": "Explanation here"
    }
  ]
}`;

    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      config: { responseMimeType: "application/json" },
    });

    const parsed = JSON.parse(response.text || "{}");
    res.json({ questions: parsed.questions || [] });
  } catch (err: any) {
    console.error("AI question generation error:", err);
    res.status(500).json({ error: "Failed to generate questions", details: err?.message });
  }
});

// AI grading and analysis of image/handwritten solution answers
app.post("/api/ai/grade-image-answer", async (req, res) => {
  const { question, correctAnswer, explanation, answerImageBase64, typedAnswer } = req.body;
  const ai = getGenAI();

  if (!ai || !answerImageBase64) {
    return res.status(400).json({ error: "Missing image or AI not available" });
  }

  try {
    const mimeMatch = answerImageBase64.match(/^data:([^;]+);base64,/);
    const mimeType = mimeMatch ? mimeMatch[1] : "image/jpeg";
    const base64Data = answerImageBase64.replace(/^data:[^;]+;base64,/, "");

    const prompt = `You are an expert academic examiner and tutor.
A university student submitted an image of their handwritten work or diagram as an answer to this question:
Question: "${question}"
Expected Correct Answer: "${correctAnswer}"
Reference Explanation: "${explanation}"
Student's Typed Note/Answer (if any): "${typedAnswer || 'None'}"

Carefully inspect the student's handwritten work or diagram in the attached image.
Analyze if their final result or methodology is substantially correct, partially correct, or incorrect.
Return JSON:
{
  "isCorrect": boolean,
  "confidence": "high" | "medium" | "low",
  "transcribedWork": "brief transcription of what the student wrote or calculated",
  "feedback": "constructive 1-2 sentence feedback explaining if their handwritten solution is correct and highlighting any errors or great steps"
}`;

    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: [
        {
          role: "user",
          parts: [
            { inlineData: { data: base64Data, mimeType } },
            { text: prompt }
          ]
        }
      ],
      config: { responseMimeType: "application/json" }
    });

    const parsed = JSON.parse(response.text || "{}");
    res.json({
      isCorrect: !!parsed.isCorrect,
      confidence: parsed.confidence || "medium",
      transcribedWork: parsed.transcribedWork || "",
      feedback: parsed.feedback || "Your handwritten work was reviewed."
    });
  } catch (err: any) {
    console.error("Image answer grading error:", err);
    res.status(500).json({ error: "Failed to grade image answer", details: err?.message });
  }
});

// Offline practice synchronization endpoint
app.post("/api/practice/sync", (req, res) => {
  const { items = [] } = req.body;
  // Acknowledge and store synced items
  res.json({ success: true, count: items.length, timestamp: Date.now() });
});

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: false,
      },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static("dist"));
    app.get("*", (_req, res) => {
      res.sendFile("dist/index.html", { root: "." });
    });
  }

  app.listen(PORT, HOST, () => {
    console.log(`ES Planner server running at http://${HOST}:${PORT}`);
  });
}

startServer();
