"use client";

import { FormEvent, useEffect, useRef, useState } from "react";

type Message = { role: "user" | "assistant"; content: string };
type SpeechRecognitionLike = {
  lang: string;
  interimResults: boolean;
  onresult: ((event: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
};

declare global {
  interface Window {
    SpeechRecognition?: new () => SpeechRecognitionLike;
    webkitSpeechRecognition?: new () => SpeechRecognitionLike;
  }
}

const suggestions = [
  { icon: "✳", title: "Bantu saya belajar", detail: "Jelaskan topik yang sulit dengan sederhana." },
  { icon: "⌘", title: "Susun rencana", detail: "Ubah ide menjadi langkah yang teratur." },
  { icon: "⌁", title: "Tulis sesuatu", detail: "Buat draf, ringkasan, atau brainstorming." },
];

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [listening, setListening] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [clock, setClock] = useState("");
  const [notice, setNotice] = useState("");
  const endRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);

  useEffect(() => {
    const update = () => setClock(new Intl.DateTimeFormat("id-ID", { hour: "2-digit", minute: "2-digit", hour12: false }).format(new Date()));
    update();
    const timer = window.setInterval(update, 30000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, busy]);

  function speak(text: string) {
    if (!voiceEnabled || !("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "id-ID";
    utterance.rate = 1;
    window.speechSynthesis.speak(utterance);
  }

  async function sendMessage(text: string) {
    const trimmed = text.trim();
    if (!trimmed || busy) return;
    const next = [...messages, { role: "user" as const, content: trimmed }];
    setMessages(next);
    setInput("");
    setBusy(true);
    setNotice("");
    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next }),
      });
      const data = await response.json();
      const answer = data.reply || "Maaf, belum ada jawaban.";
      setMessages([...next, { role: "assistant", content: answer }]);
      speak(answer);
    } catch {
      setNotice("Tidak dapat terhubung. Periksa koneksi internet lalu coba lagi.");
    } finally {
      setBusy(false);
    }
  }

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void sendMessage(input);
  }

  function toggleMic() {
    if (listening) {
      recognitionRef.current?.stop();
      setListening(false);
      return;
    }
    const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!Recognition) {
      setNotice("Browser ini belum mendukung input suara. Coba Chrome atau Edge versi terbaru.");
      return;
    }
    const recognition = new Recognition();
    recognition.lang = "id-ID";
    recognition.interimResults = false;
    recognition.onresult = (event) => {
      const transcript = event.results[0]?.[0]?.transcript ?? "";
      setInput((current) => current ? current + " " + transcript : transcript);
    };
    recognition.onerror = () => {
      setNotice("Mikrofon tidak dapat digunakan. Periksa izin mikrofon browser.");
      setListening(false);
    };
    recognition.onend = () => setListening(false);
    recognitionRef.current = recognition;
    try {
      recognition.start();
      setListening(true);
      setNotice("");
    } catch {
      setNotice("Input suara belum bisa dimulai. Coba kembali.");
    }
  }

  return (
    <main className="shell">
      <aside className="sidebar">
        <a className="brand" href="/" aria-label="JARVIS home">
          <span className="brand-mark"><span /></span>
          <span>JARVIS<small>PERSONAL INTELLIGENCE</small></span>
        </a>
        <button className="new-chat" onClick={() => { setMessages([]); setNotice(""); }}>＋ <span>New conversation</span></button>
        <div className="side-label">WORKSPACE</div>
        <div className="side-item active"><span>◈</span> Assistant <kbd>⌘ 1</kbd></div>
        <div className="side-item muted"><span>◷</span> Recent activity</div>
        <div className="side-item muted"><span>▤</span> Saved notes</div>
        <div className="sidebar-bottom">
          <div className="status-line"><span className="status-dot" /> SYSTEM ONLINE</div>
          <div className="profile">
            <div className="avatar">J</div>
            <div><strong>Personal workspace</strong><small>Local session</small></div>
            <span className="more">···</span>
          </div>
        </div>
      </aside>

      <section className="main-panel">
        <header className="topbar">
          <div className="breadcrumb"><span>Workspace</span><b>/</b> Assistant</div>
          <div className="top-actions"><span className="clock">{clock || "--:--"} WIB</span><span className="top-divider" /><span className="connection"><i /> Secure session</span></div>
        </header>

        <div className="content">
          <div className="eyebrow"><span className="eyebrow-line" /> YOUR PERSONAL AI <span className="eyebrow-line" /></div>
          <div className="hero-orb"><div className="orb-ring ring-one" /><div className="orb-ring ring-two" /><div className="orb-core"><span>J</span></div><i className="orb-point point-one" /><i className="orb-point point-two" /></div>
          <h1>{messages.length ? "I’m listening." : "Good to have you here."}</h1>
          <p className="subtitle">{messages.length ? "Let’s make progress on what matters." : "A little clarity can change everything. What’s on your mind?"}</p>

          {messages.length === 0 ? (
            <div className="suggestions">
              {suggestions.map((item) => (
                <button className="suggestion" key={item.title} onClick={() => void sendMessage(item.title + ". " + item.detail)}>
                  <span className="suggestion-icon">{item.icon}</span><span className="suggestion-copy"><strong>{item.title}</strong><small>{item.detail}</small></span><span className="suggestion-arrow">↗</span>
                </button>
              ))}
            </div>
          ) : (
            <div className="conversation">
              {messages.map((message, index) => (
                <div className={`message ${message.role}`} key={index}>
                  <div className="message-label">{message.role === "user" ? "YOU" : "JARVIS"}</div>
                  <div className="message-body">{message.content}</div>
                </div>
              ))}
              {busy && <div className="message assistant"><div className="message-label">JARVIS</div><div className="typing"><i /><i /><i /></div></div>}
              <div ref={endRef} />
            </div>
          )}

          {notice && <div className="notice">{notice}</div>}
          <form className="composer" onSubmit={onSubmit}>
            <div className="composer-top"><span>MESSAGE JARVIS</span><span>↵ ENTER TO SEND</span></div>
            <textarea value={input} onChange={(event) => setInput(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); void sendMessage(input); } }} placeholder="Ask me anything..." rows={2} aria-label="Message JARVIS" />
            <div className="composer-bottom">
              <div className="composer-tools">
                <button type="button" className={listening ? "tool-button listening" : "tool-button"} onClick={toggleMic} aria-label="Voice input">⌁ <span>{listening ? "Listening..." : "Voice input"}</span></button>
                <button type="button" className={voiceEnabled ? "tool-button enabled" : "tool-button"} onClick={() => setVoiceEnabled(!voiceEnabled)} aria-label="Toggle voice response">◖ <span>Voice {voiceEnabled ? "on" : "off"}</span></button>
              </div>
              <button type="submit" className="send-button" disabled={!input.trim() || busy}>Send <span>↗</span></button>
            </div>
          </form>
          <div className="footnote"><span>✧</span> JARVIS can make mistakes. Verify important information.</div>
        </div>
        <footer className="bottom-bar"><span>JARVIS AI <b>·</b> BUILD 1.0.0</span><span>DESIGNED FOR FOCUS <b>·</b> MADE TO THINK</span></footer>
      </section>
    </main>
  );
}