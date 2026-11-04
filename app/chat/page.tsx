"use client";
import { useEffect, useRef, useState } from "react";
import { api, ApiError } from "@/lib/api";
import { Loading } from "@/components/ui";

type Msg = { role: "me" | "bot"; text: string; error?: boolean };

export default function ChatPage() {
  const [connected, setConnected] = useState<boolean | null>(null);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const convId = useRef<string | undefined>(undefined);
  const bottom = useRef<HTMLDivElement>(null);

  useEffect(() => {
    api<{ connected: boolean }>("/chat/status").then((r) => setConnected(r.connected)).catch(() => setConnected(false));
  }, []);
  useEffect(() => { bottom.current?.scrollIntoView({ behavior: "smooth", block: "end" }); }, [msgs, busy]);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    const q = text.trim();
    if (!q || busy) return;
    setText(""); setBusy(true);
    setMsgs((m) => [...m, { role: "me", text: q }]);
    try {
      const r = await api<{ answer: string; conversationId?: string }>("/chat", { method: "POST", body: { message: q, conversationId: convId.current } });
      if (r.conversationId) convId.current = r.conversationId;
      setMsgs((m) => [...m, { role: "bot", text: r.answer }]);
    } catch (x) {
      setMsgs((m) => [...m, { role: "bot", text: x instanceof ApiError ? x.message : "답을 받지 못했어요.", error: true }]);
    }
    setBusy(false);
  }

  if (connected === null) return <Loading />;

  return (
    <>
      <h1>규정 챗봇</h1>
      {!connected && <div className="alert alert-caution">규정 챗봇이 아직 연결되지 않았어요. 규정 문서를 확인하거나 총무팀에 문의해 주세요.</div>}
      <div className="chat" style={{ paddingBottom: 150 }}>
        {msgs.length === 0 && <div className="empty">예: 차량은 며칠까지 빌릴 수 있어요?</div>}
        {msgs.map((m, i) => <div key={i} className={`bubble ${m.role} ${m.error ? "err" : ""}`}>{m.text}</div>)}
        {busy && <div className="bubble bot"><span className="spinner" /></div>}
        <div className="help">
          ※ 챗봇 답은 참고용이에요.<br />
          규정 문서가 우선이고 최종 판단은 총무팀이 해요.<br />
          이름·연락처 같은 개인정보는 적지 마세요.
        </div>
        <div ref={bottom} />
      </div>
      <form className="chat-input" onSubmit={send}>
        <input className="input" value={text} onChange={(e) => setText(e.target.value)} placeholder="규정이 궁금하면 물어보세요" />
        <button className={`btn btn-sm ${busy ? "is-loading" : ""}`} style={{ height: 48 }} disabled={!text.trim() || busy}>보내기</button>
      </form>
    </>
  );
}
