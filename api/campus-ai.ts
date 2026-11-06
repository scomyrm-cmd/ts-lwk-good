import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenAI } from '@google/genai';
import {
  buildMultilingualSystemPrompt,
  generateLocalSchoolResponseMultilingual,
  detectLanguage,
} from '../src/server/aiMultilingual.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS & Security Headers
  const origin = req.headers.origin as string;
  const allowedOrigins = [
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    process.env.APP_URL,
  ].filter(Boolean) as string[];

  if (origin && (allowedOrigins.includes(origin) || origin.endsWith('.run.app') || origin.endsWith('.vercel.app'))) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
  }

  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  // Handle GET health check
  if (req.method === 'GET') {
    const hasKey = Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.length > 5);
    return res.status(200).json({
      status: 'ok',
      platform: 'vercel',
      configured: hasKey,
      model: process.env.GEMINI_MODEL || 'gemini-3.8-flash',
      languages: ['en', 'fr', 'ar', 'darija'],
    });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. Use POST.' });
  }

  try {
    const { prompt, schoolContext, history, language } = req.body || {};

    if (!prompt || typeof prompt !== 'string') {
      return res.status(400).json({ error: 'Missing or invalid prompt parameter.' });
    }

    const cleanPrompt = prompt.trim();
    const detectedLang = detectLanguage(cleanPrompt);
    const resolvedLang = detectedLang !== 'en' ? detectedLang : (language || 'en');

    const apiKey = process.env.GEMINI_API_KEY;
    const modelName = process.env.GEMINI_MODEL || 'gemini-3.8-flash';

    // If API key is not present, use the multilingual analytics engine
    if (!apiKey || apiKey === 'MY_GEMINI_API_KEY' || apiKey.trim() === '') {
      const fallbackText = generateLocalSchoolResponseMultilingual(
        cleanPrompt,
        schoolContext || {},
        resolvedLang
      );
      return res.status(200).json({
        text: fallbackText,
        source: 'local-analytics-multilingual',
        model: 'local-analytics-engine',
        detectedLanguage: detectedLang,
      });
    }

    // Call Google GenAI SDK
    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });

    const systemInstruction = buildMultilingualSystemPrompt(schoolContext, resolvedLang);

    // Build chat contents
    const contents: any[] = [];
    if (Array.isArray(history) && history.length > 0) {
      for (const h of history.slice(-8)) {
        contents.push({
          role: h.sender === 'user' ? 'user' : 'model',
          parts: [{ text: h.content }],
        });
      }
    }
    contents.push({
      role: 'user',
      parts: [{ text: cleanPrompt }],
    });

    const callPromise = ai.models.generateContent({
      model: modelName,
      contents,
      config: {
        systemInstruction,
      },
    });

    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('AI response timed out, using instant analytics')), 4000)
    );

    const response = (await Promise.race([callPromise, timeoutPromise])) as any;

    return res.status(200).json({
      text: response.text || 'No response generated.',
      source: 'gemini-api',
      model: modelName,
      detectedLanguage: detectedLang,
    });
  } catch (error: any) {
    console.error('Campus AI Vercel function error, falling back to multilingual analytics:', error.message);
    const { schoolContext, language, prompt } = req.body || {};
    const fallbackText = generateLocalSchoolResponseMultilingual(
      prompt || '',
      schoolContext || {},
      language || 'en'
    );

    return res.status(200).json({
      text: fallbackText,
      source: 'local-fallback',
      model: 'analytics-engine',
      detectedLanguage: detectLanguage(prompt || ''),
    });
  }
}
