"use client";

import { useEffect, useRef, useState } from "react";

export default function AudioRecorder({ onWords }) {
  const recognitionRef = useRef(null);
  const mediaRecorderRef = useRef(null);

  const [recording, setRecording] = useState(false);
  const [transcript, setTranscript] = useState("");

  /* =========================
     تهيئة SpeechRecognition
  ========================= */
  useEffect(() => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert("المتصفح لا يدعم SpeechRecognition");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "ar-SA";
    recognition.continuous = true;
    recognition.interimResults = true;

    recognition.onresult = (event) => {
      const text = Array.from(event.results)
        .map(r => r[0].transcript)
        .join(" ")
        .trim();

      setTranscript(text);

      // استخراج الكلمات
      const words = text.split(" ");
      onWords?.(words);
    };

    recognitionRef.current = recognition;
  }, [onWords]);

  /* =========================
     بدء التسجيل
  ========================= */
  const startRecording = async () => {
    // Speech
    recognitionRef.current?.start();

    // Audio recording (اختياري)
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    mediaRecorderRef.current = new MediaRecorder(stream);
    mediaRecorderRef.current.start();

    setRecording(true);
  };

  /* =========================
     إيقاف التسجيل
  ========================= */
  const stopRecording = () => {
    recognitionRef.current?.stop();
    mediaRecorderRef.current?.stop();
    setRecording(false);
  };

  return (
    <div style={{ marginTop: 20 }}>
      <button onClick={recording ? stopRecording : startRecording}>
        {recording ? "⏹️ إيقاف" : "🎙️ بدء القراءة"}
      </button>

      <p style={{ marginTop: 10 }}>
        <strong>النص المستخرج:</strong><br />
        {transcript}
      </p>
    </div>
  );
}