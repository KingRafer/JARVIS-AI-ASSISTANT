import { NextResponse } from "next/server";

export const runtime = "nodejs";

type ChatMessage = { role: "user" | "assistant"; content: string };

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { messages?: ChatMessage[] };
    const messages = Array.isArray(body.messages) ? body.messages.slice(-12) : [];
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return NextResponse.json({
        reply: "Koneksi AI belum diaktifkan. Tambahkan GEMINI_API_KEY di Vercel → Project Settings → Environment Variables, lalu redeploy. Antarmuka, input suara, dan fitur lokal tetap bisa digunakan."
      });
    }

    const contents = messages.map((message) => ({
      role: message.role === "assistant" ? "model" : "user",
      parts: [{ text: String(message.content).slice(0, 6000) }],
    }));

    const response = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": apiKey,
        },
        body: JSON.stringify({
          systemInstruction: {
            parts: [{
              text: "Kamu adalah JARVIS, asisten AI pribadi yang cerdas, tenang, ramah, dan praktis. Jawab dalam bahasa yang digunakan pengguna. Berikan langkah yang jelas dan jangan mengaku dapat mengendalikan perangkat kecuali melalui integrasi yang benar-benar tersedia."
            }]
          },
          contents: contents.length ? contents : [{ role: "user", parts: [{ text: "Halo JARVIS" }] }],
          generationConfig: { temperature: 0.7, maxOutputTokens: 1200 },
        }),
      }
    );

    const data = await response.json();
    if (!response.ok) {
      return NextResponse.json({ reply: "Layanan AI sedang bermasalah. Periksa API key, kuota, dan konfigurasi Gemini di Vercel." }, { status: 200 });
    }

    const reply = data?.candidates?.[0]?.content?.parts
      ?.map((part: { text?: string }) => part.text ?? "")
      .join("")
      .trim();

    return NextResponse.json({ reply: reply || "Aku belum mendapat jawaban. Coba kirim pesan sekali lagi." });
  } catch {
    return NextResponse.json({ reply: "Terjadi kesalahan saat memproses pesan. Coba lagi." }, { status: 200 });
  }
}