/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize Gemini Client
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // API endpoint for AI Diagnosis / Care Advice
  app.post("/api/gemini/advisor", async (req, res) => {
    try {
      const { areaName, status, latestNote, memberName, grade } = req.body;
      
      if (!areaName) {
        return res.status(400).json({ error: "areaName is required" });
      }

      const prompt = `
あなたは星槎もみじ中学校生物同好会の「AI顧問・専門アドバイザー」です。
中学生向けに優しく、専門的かつ分かりやすい言葉で、飼育・栽培エリアのアドバイスや状態診断をしてください。

対象エリア・生物: ${areaName}
担当部員: ${memberName || "未割り当て"} (${grade ? grade + "年生" : "学年不明"})
現在のステータス: ${status === "excellent" ? "良好" : status === "observing" ? "要観察" : "要メンテナンス"}
最新の点検メモ: "${latestNote || "メモなし"}"

以下の3つのセクションを含むアドバイスを日本語で作成してください：
1. 【状態診断】: 現在の点検メモやステータスから推測される生物の状態について、生物学的な観点も含めて評価。
2. 【お世話の極意】: 中学生が今日からすぐに実行できる、このエリアに特化した具体的で実践的なお世話のアドバイス（水温、日当たり、給餌、水替えなど）。
3. 【豆知識・探究のヒント】: この生物や環境に関連する面白い科学的豆知識や、自由研究・部活動での観察 of the hint.

文章は親しみやすく、かつ知的好奇心を刺激するトーンにしてください。マークダウン（箇条書き、太字など）を適度に使って、読みやすく整形してください。
`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
      });

      res.json({ advice: response.text });
    } catch (error: any) {
      console.error("Error calling Gemini API:", error);
      res.status(500).json({ error: error.message || "Failed to generate AI advice" });
    }
  });

  // API endpoint for Biology Quiz
  app.post("/api/gemini/quiz", async (req, res) => {
    try {
      const { category } = req.body; // e.g., 'aquatic', 'plants', 'insects', 'general'
      
      let themeDescription = "生物全般（植物、動物、昆虫、微生物、生態系など）";
      if (category === "aquatic") {
        themeDescription = "淡水魚、メダカ、水生昆虫、水草、藻類など、水の中의生物や水槽環境";
      } else if (category === "plants") {
        themeDescription = "陸上植物、花、プランター栽培、光合成、土壌、雑草など";
      } else if (category === "insects") {
        themeDescription = "昆虫、カブトムシ、クワガタ、アリ、チョウ、変態、生態など";
      }

      const prompt = `
星槎もみじ中学校の生物同好会の生徒向けに、楽しくて勉強になる「生物クイズ」を1問作成してください。
難易度は中学生向け（簡単すぎず、難しすぎず、考えれば分かるか、新しい知識が得られるもの）。

テーマ: ${themeDescription}

出力は必ず以下のJSONスキーマに従ってください。
`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              question: {
                type: Type.STRING,
                description: "クイズの文章。中学生が興味を持つ興味深い内容。4択クイズの問い。"
              },
              options: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "4つの選択肢。20文字から50文字程度。正しいもの1つと、間違っているがもっともらしいもの3つ。"
              },
              correctIndex: {
                type: Type.INTEGER,
                description: "正解のインデックス（0から3の整数）"
              },
              explanation: {
                type: Type.STRING,
                description: "正解の理由と、中学生の学びになる詳細な生物学的解説（200文字〜400文字程度）"
              }
            },
            required: ["question", "options", "correctIndex", "explanation"]
          }
        }
      });

      const quizData = JSON.parse(response.text || "{}");
      res.json(quizData);
    } catch (error: any) {
      console.error("Error generating quiz:", error);
      res.status(500).json({ error: error.message || "Failed to generate biology quiz" });
    }
  });

  // Vite middleware setup
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
