import React from "react";
import { CheckCircle2, AlertCircle, X } from "lucide-react";
import { useNotice } from "../context/NoticeContext.jsx";

export function InlineNotice({ notice }) {
  if (!notice) return null;
  return (
    <div className={`inline-notice ${notice.kind}`}>
      <span>{notice.kind === "success" ? <CheckCircle2 size={17} /> : <AlertCircle size={17} />}</span>
      {notice.text}
    </div>
  );
}

export function Toast() {
  const { notice, clear } = useNotice();
  if (!notice) return null;
  return (
    <div className={`toast ${notice.kind}`} key={notice.key}>
      <span>{notice.kind === "success" ? <CheckCircle2 /> : <AlertCircle />}</span>
      {notice.text}
      <button onClick={clear} aria-label="Dismiss"><X size={16} /></button>
    </div>
  );
}
