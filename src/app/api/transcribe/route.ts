import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

export async function POST(req: NextRequest) {
  const data = await req.formData();
  const apikey = data.get("apikey")?.toString();
  const file = data.get("file") as Blob;

  const openai = new OpenAI({ apiKey: apikey! });

  if (!file) {
    return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
  }

  // แปลง Web File (ที่ได้จาก formData) เป็น Node.js Readable stream
  const audiofile = new File([file], "audiofile", {
    type: "audio/wav",
  });

  // เรียกใช้ OpenAI Whisper API เพื่อทำ transcription
  const start = process.hrtime();
  const transcription = await openai.audio.transcriptions.create({
    file: audiofile,
    model: "whisper-1",
    language: "th", // กำหนดภาษาหากต้องการ,
  });
  const end = process.hrtime(start);
  const endMs = end[0] * 1000 + end[1] / 1e9;

  return NextResponse.json({
    output: transcription.text,
    processing_time: endMs,
    success: true,
  });
}
