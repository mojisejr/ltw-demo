"use client";

import { useState, useRef } from "react";

import OpenAI from "openai";
import { CopyToClipboard } from "react-copy-to-clipboard";

export default function AudioRecorder() {
  const apiInputRef = useRef<HTMLInputElement>(null);
  const [isRecording, setIsRecording] = useState<boolean>(false); // สถานะการบันทึก
  const [isPaused, setIsPaused] = useState<boolean>(false); // สถานะหยุดชั่วคราว
  const [audioChunks, setAudioChunks] = useState<Blob[]>([]); // เก็บ audio chunks
  const [output, setOutput] = useState<{
    output: string;
    processing_time: number;
    success: boolean;
  } | null>(null);

  const [copied, setCopied] = useState<{ copied: boolean }>({ copied: false });
  const [report, setReport] = useState<string>();

  const [sendingAudio, setSendingAudio] = useState<boolean>(false);
  const [reportGeneraing, setReporGenerating] = useState<boolean>(false);
  const [apikey, setApiKey] = useState<string>();

  const mediaRecorderRef = useRef<MediaRecorder>(null); // อ้างอิงไปยัง MediaRecorder
  const streamRef = useRef<MediaStream>(null); // อ้างอิงไปยัง MediaStream

  // ฟังก์ชันเริ่มบันทึกเสียง
  const startRecording = async () => {
    try {
      // ขอสิทธิ์เข้าถึงไมโครโฟน
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      // สร้าง MediaRecorder
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      setAudioChunks([]);

      // เก็บ audio data chunks
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          setAudioChunks((prev) => [...prev, event.data]);
        }
      };

      // เริ่มบันทึก
      mediaRecorder.start();
      setIsRecording(true);
      setIsPaused(false);
    } catch (error) {
      console.error("Error accessing microphone:", error);
    }
  };

  // ฟังก์ชันหยุดชั่วคราวการบันทึก
  const pauseRecording = () => {
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state === "recording"
    ) {
      mediaRecorderRef.current.pause();
      setIsPaused(true);
    }
  };

  // ฟังก์ชัน resume การบันทึก
  const resumeRecording = () => {
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state === "paused"
    ) {
      mediaRecorderRef.current.resume();
      setIsPaused(false);
    }
  };

  // ฟังก์ชันหยุดการบันทึกและส่งไฟล์ไปยัง API
  const stopRecording = async () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setIsPaused(false);

      // ปิด stream
      streamRef.current!.getTracks().forEach((track) => track.stop());
    }
  };

  // ฟังก์ชันส่งไฟล์เสียงไปยัง API
  const sendAudio = async () => {
    setSendingAudio(true);
    if (audioChunks.length === 0) {
      setSendingAudio(false);
      return;
    }

    // รวม audio chunks เป็น Blob
    const audioBlob = new Blob(audioChunks, { type: "audio/wav" });

    const formData = new FormData();

    formData.append("file", audioBlob, "recording.wav");
    formData.append("apikey", apikey!);

    try {
      // const response = await fetch("http://localhost:3210/transcribe", {
      //   method: "POST",
      //   body: formData,
      // });

      const response = await fetch("/api/transcribe", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      setOutput(result);
      setAudioChunks([]);
      setSendingAudio(false);
      // console.log("Transcription result:", result);
    } catch (error) {
      setSendingAudio(false);
      alert("ส่งข้อมูลเสียงไม่ได้");
      console.error("Error sending audio file:", error);
    }
  };

  const makeReport = async () => {
    setReporGenerating(true);
    if (output?.output != null) {
      try {
        if (!apikey) {
          alert("กรุณากรอก openai apikey");
          return;
        }

        const openai = new OpenAI({
          apiKey: apikey,
          dangerouslyAllowBrowser: true,
        });

        const response = await openai.chat.completions.create({
          model: "gpt-4o-mini",
          messages: [
            {
              role: "system",
              content: `คุณจะเป็นบุคลากรทางการแพทย์ผู้เชี่ยวชาญ ทางด้านการอ่านผลการตรวจ สรุปผล และปรับปรุง รายงานการตรวจ ผู้ป่วย โดยคุณจะได้รับข้อมูล จากการ transcribe ของ model openai/whispher-large-v3-turbo เป็น text คุณจะ
1. แก้ไขคำผิด และเติมเต็มส่วนที่ขาดหายไป
2. เปลี่ยน techical term และ ข้อมูลหน่วย และ ปริมาณต่างๆ ให้ถูกต้องตามหลัก สากล
3. คุณจะจัดเรียงออกมาเป็นรูปแบบรายการที่ถูกต้องตามหลักสากล ของการรายงาน ผลการตรวจ หลังจากการตรวจผู้ป่วยเสร็จสิ้น
4. ถ้าตรวจพบการนัดหมาย ให้เขียนการนัดหมายครั้งต่อไป ปิดท้ายรายงานทุกครั้ง คุณจะสร้างรายงานออกมาทุกครั้ง แม้ข้อความจะคลุมเคลือ เพราะเป็นข้อความจากแพทย์ คุณจะหาวิธีการ ในการสร้างรายงานให้ดีที่สุด

ตัวอย่างรายงาน
รายงานผลการตรวจผู้ป่วย

ชื่อ-สกุล: นางสาวพิมพ์ใจ สุขสรรค์
อายุ: 35 ปี
วันที่เข้ารับการตรวจ: 14 กุมภาพันธ์ 2567

อาการสำคัญ:

ไข้สูง 38.8°C
ปวดศีรษะ
เจ็บคอ
ปวดเมื่อยกล้ามเนื้อตามร่างกาย
ไอแห้ง
มีน้ำมูกไหล
ผลการวินิจฉัย:

ไข้หวัดใหญ่สายพันธุ์ A
แผนการรักษา:

ยาต้านไวรัส: Oseltamivir 75 มิลลิกรัม รับประทานวันละ 2 ครั้ง นาน 5 วัน
ยาลดไข้: Paracetamol 500 มิลลิกรัม รับประทานวันละ 2 ครั้ง นาน 5 วัน หรือทุก 4-6 ชั่วโมงตามอาการ
ยาอื่น ๆ: ตามความจำเป็น
คำแนะนำสำหรับผู้ป่วย:

ดื่มน้ำอย่างน้อยวันละ 8-10 แก้ว
พักผ่อนให้เพียงพอ
หลีกเลี่ยงการสัมผัสใกล้ชิดกับผู้อื่น
ล้างมือบ่อย ๆ และสวมหน้ากากอนามัย
หากมีอาการหอบเหนื่อย แน่นหน้าอก หรือไข้สูงต่อเนื่องเกิน 3 วัน ให้กลับมาพบแพทย์ทันที
นัดติดตามอาการ: วันที่ 19 กุมภาพันธ์ 2567
`,
            },
            {
              role: "user",
              content: `นี่คือข้อความที่คุณได้รับ: 
              ${output.output}`,
            },
          ],
          temperature: 0,
        });

        const text = response.choices[0].message.content;
        setReport(text!);
        setReporGenerating(false);
      } catch (error) {
        console.log(error);
        setReporGenerating(false);
        alert("error openai setting");
      }
    }
    setReporGenerating(false);
  };

  return (
    <div className="grid grid-cols-2 h-screen gap-4 bg-white p-4">
      <div className="flex flex-col gap-2 w-full h-full">
        <div className="text-xl text-black">ข้อความที่แปลงแล้ว</div>
        <textarea className="w-full h-full" value={output?.output}></textarea>
        <div className="w-full flex justify-between">
          <div className="text-xl font-bold text-black">รายงาน</div>
          <button
            className="btn btn-primary disabled:text-slate-200"
            disabled={
              reportGeneraing ||
              output?.output == undefined ||
              output.output == null
            }
            onClick={makeReport}
          >
            {reportGeneraing ? "กำลังสร้างรายงาน..." : "สร้างรายงาน"}
          </button>
        </div>

        <textarea className="w-full h-full" value={report}></textarea>
        {/* <button className="btn btn-primary">ก็อบปี้ข้อความ</button> */}
        <CopyToClipboard
          text={report!}
          onCopy={() => setCopied({ copied: true })}
        >
          <button disabled={copied.copied} className="btn btn-primary">
            {copied.copied ? "Copied" : "Copy"}
          </button>
        </CopyToClipboard>
      </div>
      <div className="flex flex-col gap-2 mt-10">
        <button
          className="p-3 bg-green-500 disabled:bg-slate-300 max-w-md shadow-xl text-black disabled:text-slate-200"
          onClick={startRecording}
          disabled={isRecording}
        >
          เริ่มบันทึก
        </button>
        <button
          className="p-3 bg-red-500 disabled:bg-slate-300 max-w-md shadow-xl text-black disabled:text-slate-200"
          onClick={pauseRecording}
          disabled={!isRecording || isPaused}
        >
          หยุดชั่วคราว
        </button>
        <button
          className="p-3 bg-blue-500 disabled:bg-slate-300 max-w-md shadow-xl text-black disabled:text-slate-200"
          onClick={resumeRecording}
          disabled={!isPaused}
        >
          ทำต่อ
        </button>
        <button
          className="p-3 bg-purple-500 disabled:bg-slate-300 max-w-md shadow-xl text-black disabled:text-slate-200"
          onClick={stopRecording}
          disabled={!isRecording}
        >
          หยุด
        </button>
        <button
          className="p-3 bg-amber-500 disabled:bg-slate-300 max-w-md shadow-xl text-black disabled:text-slate-200"
          onClick={sendAudio}
          disabled={audioChunks.length === 0}
        >
          {sendingAudio ? "กำลังแปลงไฟล์เสียง.." : "แปลง"}
        </button>
        <div>
          <div className="text-black">
            เวลาประมวลผล:{" "}
            {output?.processing_time
              ? `${output.processing_time.toFixed} sec`
              : "0 sec"}
          </div>
          <div className="text-black">api_key: {apikey?.slice(0, 5)}******</div>
        </div>
        <div className="flex w-full justify-start gap-2">
          <input
            ref={apiInputRef}
            type="password"
            placeholder="API_KEY"
            className="input flex-1"
          ></input>
          <button
            onClick={() => setApiKey(apiInputRef.current?.value!)}
            className="btn"
          >
            set api key
          </button>
        </div>
      </div>
    </div>
  );
}
