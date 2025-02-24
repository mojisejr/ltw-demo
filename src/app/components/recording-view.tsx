"use client";
import { useEffect, useRef, useState } from "react";

declare global {
  interface Window {
    webkitSpeechRecognition: any;
  }
}

export default function RecordingView() {
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [recordingComplete, setRecordingComplete] = useState<boolean>(false);
  const [transcribe, setTranscribe] = useState<string>("");
  const [sentences, setSentences] = useState<string>("");

  const recognitionRef = useRef<any>(null);

  const startRecording = () => {
    setIsRecording(true);
    recognitionRef.current = new window.webkitSpeechRecognition();
    recognitionRef.current.continuous = true;
    recognitionRef.current.interimResults = true;
    recognitionRef.current.lang = "th-Th";
    recognitionRef.current.onresult = (event: any) => {
      console.log(event);
      const { transcript } = event.results[event.results.length - 1][0];
      console.log("transcribe: ", transcript);
      setTranscribe(transcript);
    };

    recognitionRef.current.start();
  };

  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
        setRecordingComplete(true);
      }
    };
  }, []);

  const stopRecording = () => {
    if (recognitionRef.current) {
      setIsRecording(false);
    }
  };

  const handleToggleRecording = () => {
    setIsRecording(!isRecording);
    if (!isRecording) {
      startRecording();
    } else {
      stopRecording();
      setSentences((prev) => prev.concat(transcribe));
    }
  };

  return (
    <div className="flex items-center justify-center h-screen w-full">
      <div className="w-full">
        {(isRecording || transcribe) && (
          <div className="w-1/4 m-auto rounded-md border p-4 bg-white">
            <div className="flex-1 flex w-full justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium leading-none">
                  {recordingComplete ? "Recorded" : "Recording.."}
                </p>
                <p className="text-sm">
                  {recordingComplete
                    ? "Thanks for talking"
                    : "Start speaking..."}
                </p>
              </div>
              {isRecording && (
                <div className="rounded-full w-4 h-4 bg-red-400 animate-pulse"></div>
              )}
            </div>
            {transcribe && (
              <div className="border rounded-md p-2 mt-4">
                <p className="mb-0">{transcribe}</p>
              </div>
            )}

            {sentences && (
              <div className="border rounded-md p-2 mt-4">
                <p className="mb-0">{sentences}</p>
              </div>
            )}
          </div>
        )}

        <div className="flex items-center w-full">
          {isRecording ? (
            <button
              className="mt-10 m-auto flex items-center justify-center bg-red-400 hover:bg-red-500 rounded-full w-20 h-20"
              onClick={handleToggleRecording}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="w-12 h-12"
                viewBox="0 0 1025 1024"
              >
                <path
                  fill="currentColor"
                  d="M896.428 1024h-128q-53 0-90.5-37.5t-37.5-90.5V128q0-53 37.5-90.5t90.5-37.5h128q53 0 90.5 37.5t37.5 90.5v768q0 53-37.5 90.5t-90.5 37.5zm-640 0h-128q-53 0-90.5-37.5T.428 896V128q0-53 37.5-90.5t90.5-37.5h128q53 0 90.5 37.5t37.5 90.5v768q0 53-37.5 90.5t-90.5 37.5z"
                />
              </svg>
            </button>
          ) : (
            <button
              className="mt-10 m-auto flex items-center justify-center bg-blue-400 hover:bg-blu-500 rounded-full w-20 h-20"
              onClick={handleToggleRecording}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="w-12 h-12"
                viewBox="0 0 16 16"
              >
                <path
                  fill="currentColor"
                  d="M8 10c-1.7 0-3-1.3-3-3V3c0-1.6 1.3-3 3-3c1.6 0 3 1.3 3 3v4c0 1.6-1.4 3-3 3z"
                />
                <path
                  fill="currentColor"
                  d="M12 5v2.5c0 1.9-1.8 3.5-3.8 3.5h-.4C5.8 11 4 9.4 4 7.5V5c-.6 0-1 .4-1 1v1.5c0 2.2 1.8 4.1 4 4.4V14c-3 0-2.5 2-2.5 2h7s.5-2-2.5-2v-2.1c2.2-.4 4-2.2 4-4.4V6c0-.6-.4-1-1-1z"
                />
              </svg>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
