"use client";
import { useEffect, useState, type ReactNode } from "react";
import { STATUS_CHIP } from "@/lib/format";

/** 불러오는 동안 카드 모양의 회색 자리표시자(스켈레톤)를 보여 줘요. */
export function Loading() {
  return (
    <div className="stack" role="status" aria-label="불러오는 중">
      <div className="skeleton card" style={{ height: 96 }} />
      <div className="skeleton card" style={{ height: 96 }} />
      <div className="skeleton card" style={{ height: 96 }} />
    </div>
  );
}

export function StatusChip({ status, overdue }: { status: string; overdue?: boolean }) {
  if (overdue) return <span className="chip chip-negative">미반납</span>;
  return <span className={`chip ${STATUS_CHIP[status] || ""}`}>{status}</span>;
}

export function Modal({ title, children, onClose }: { title: string; children: ReactNode; onClose?: () => void }) {
  return (
    <div className="dim" role="dialog" aria-modal="true" onClick={(e) => { if (e.target === e.currentTarget) onClose?.(); }}>
      <div className="dialog"><h3>{title}</h3>{children}</div>
    </div>
  );
}

export function Confirm({ title, message, okText, cancelText = "닫기", danger, busy, onOk, onCancel }: {
  title: string; message: ReactNode; okText: string; cancelText?: string; danger?: boolean; busy?: boolean; onOk: () => void; onCancel: () => void;
}) {
  return (
    <Modal title={title} onClose={onCancel}>
      <div className="body3">{message}</div>
      <div className="actions">
        <button className="btn btn-tertiary" onClick={onCancel} disabled={busy}>{cancelText}</button>
        <button className={`btn ${danger ? "btn-danger" : ""} ${busy ? "is-loading" : ""}`} onClick={onOk}>{busy ? "처리 중" : okText}</button>
      </div>
    </Modal>
  );
}

function Toast({ text, onDone }: { text: string; onDone: () => void }) {
  useEffect(() => { const t = setTimeout(onDone, 2600); return () => clearTimeout(t); }, [text, onDone]);
  return <div className="toast" role="status">{text}</div>;
}
export function useToast() {
  const [text, setText] = useState("");
  return { toast: text ? <Toast text={text} onDone={() => setText("")} /> : null, show: setText };
}

export function Field({ label, error, help, children, name }: { label: string; error?: string; help?: string; children: ReactNode; name?: string }) {
  return (
    <div className={`field ${error ? "has-error" : ""}`} data-field={name}>
      <label>{label}</label>
      {children}
      {error ? <div className="field-error">{error}</div> : help ? <div className="help">{help}</div> : null}
    </div>
  );
}

/** 틀린 첫 칸(.field-error 또는 data-field)으로 화면을 옮겨요 */
export function scrollToError(name?: string) {
  setTimeout(() => {
    const el = (name && document.querySelector(`[data-field="${name}"]`)) || document.querySelector(".field-error") || document.querySelector(".alert-negative");
    el?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, 30);
}

export function BackButton({ onClick, label = "뒤로" }: { onClick: () => void; label?: string }) {
  return (
    <button className="back" onClick={onClick}>
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 5l-7 7 7 7" /></svg>
      {label}
    </button>
  );
}
