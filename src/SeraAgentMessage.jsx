"use client";
import { useState, useEffect } from "react";
import ReactMarkdown from "react-markdown";

// ─── Tokens (kept minimal for plan card/fallback) ───────────────────
const C = {
  bg: "#090909",
  s0: "#0d0d0f",
  s1: "#111114",
  s2: "#161618",
  b0: "#141416",
  b1: "#1c1c1f",
  b2: "#252528",
  t0: "#f0f0f4",
  t1: "#9090a0",
  t2: "#505060",
  t3: "#2a2a34",
  mono: "'IBM Plex Mono', 'JetBrains Mono', monospace",
  sans: "'Geist', 'Inter', sans-serif",
};

// ─── Utilities ────────────────────────────────────────────────────
const fmtTime = (ts) => {
  if (!ts) return "";
  const d = new Date(ts * 1000);
  return [d.getHours(), d.getMinutes(), d.getSeconds()]
    .map(n => String(n).padStart(2, "0")).join(":");
};

const groupIntoPhases = (rows) => {
  if (!rows || rows.length === 0) return [];
  const phases = [];
  let currentPhase = null;

  rows.forEach(r => {
    const phaseName = r.phase || "planning";

    if (!currentPhase || currentPhase.name !== phaseName) {
      if (currentPhase) phases.push(currentPhase);
      currentPhase = { id: `ph_${phases.length}`, name: phaseName, logs: [], done: r.done, active: false };
    }
    currentPhase.logs.push(r);
    // If ANY log in this phase is NOT done, the whole phase is NOT done
    if (!r.done) currentPhase.done = false;
  });
  if (currentPhase) phases.push(currentPhase);

  // Mark the first non-done phase as active
  const activeIndex = phases.findIndex(p => !p.done);
  if (activeIndex !== -1) phases[activeIndex].active = true;

  // Mark all previous phases as done implicitly
  phases.forEach((p, i) => {
    if (activeIndex !== -1 && i < activeIndex) p.done = true;
    if (activeIndex === -1) p.done = true; // All done
  });

  return phases;
};

// ─── Primitives ───────────────────────────────────────────────────
const Spin = ({ size = 9 }) => (
  <span style={{
    display: "inline-block", width: size, height: size, flexShrink: 0,
    border: `1px solid ${C.b2}`, borderTopColor: C.t2,
    borderRadius: "50%", animation: "spin 0.7s linear infinite",
  }} />
);

const Cursor = () => (
  <span style={{
    display: "inline-block", width: 6, height: "0.8em",
    background: C.t2, marginLeft: 2, verticalAlign: "text-bottom",
    animation: "blink 1s step-end infinite",
  }} />
);

// ─── PhaseBlock & LogLine ─────────────────────────────────────────
function LogLine({ ev, isStreaming }) {
  const isTool = !!ev.tool;
  const isActive = !ev.done && isStreaming;
  const rawText = isTool ? ev.tool : ev.message;
  // Strip trailing dots so the animated dots don't double up
  const t = (rawText || "").replace(/\.+$/, "");
  const textLower = t.toLowerCase();

  const isWarn = textLower.includes('warn') || textLower.includes('error') || textLower.includes('lacks') || textLower.includes('imbalance');
  const isNote = textLower.includes('positioning') || textLower.includes('strategy') || ev.agent;
  const cls = isWarn ? 'warn' : isNote ? 'note' : '';

  const dots = isActive ? <span className="dots" style={{ display: 'inline-flex', marginLeft: 2 }}><span></span><span></span><span></span></span> : null;

  return (
    <div className="log-line">
      {isTool ? (
        <>
          <span className={`log-txt ${cls}`}>{t}{dots}</span>
          <span className="tag p">tool</span>
          {ev.agent && <span className="tag b">@{ev.agent}</span>}
        </>
      ) : (
        <span className={`log-txt ${cls}`}>{t}{dots}</span>
      )}
    </div>
  );
}

function PhaseBlock({ phase, isStreaming }) {
  // Auto-collapse completed phases to save space
  const [collapsed, setCollapsed] = useState(phase.done);

  const isRunning = phase.active && isStreaming;

  return (
    <div className={`phase-block ${collapsed ? 'collapsed' : ''}`}>
      <div className="phase-row" onClick={() => setCollapsed(!collapsed)}>
        <div className="ind">
          {!isRunning && (
            <div className="done-dot"></div>
          )}
        </div>
        <span className={`phase-name ${isRunning ? 'running' : ''}`}>
          {phase.name}
        </span>
        <span className="chevron-sm" style={{ transform: collapsed ? 'rotate(-90deg)' : 'rotate(0deg)' }}>⌄</span>
      </div>
      <div className="logs">
        {phase.logs.map((log, i) => (
          <LogLine key={i} ev={log} isStreaming={isStreaming} />
        ))}
      </div>
    </div>
  );
}

// ─── RuntimeLog ───────────────────────────────────────────────────
function RuntimeLog({ events, milestones, isStreaming }) {
  const useRich = events && events.length > 0;
  const rows = useRich
    ? events
    : milestones.map(m => ({ message: m.text, done: m.status === "done", phase: "execution" }));

  if (rows.length === 0) return null;

  const phases = groupIntoPhases(rows);

  return (
    <div className="agent-out" style={{ marginBottom: 12 }}>
      {phases.map(ph => (
        <PhaseBlock key={ph.id} phase={ph} isStreaming={isStreaming} />
      ))}
    </div>
  );
}

// ─── FinalOut (Replaces old ResponseText and Summary) ─────────────
function FinalOut({ text, summary, planData, isStreaming, finalDurStr }) {
  if (isStreaming) {
    // While streaming, just show the plain text nicely
    return text ? (
      <div style={{ fontFamily: C.sans, fontSize: 13, color: "inherit", opacity: 0.8, lineHeight: 1.5, margin: "6px 0 10px 0" }}>
        {text} <Cursor />
      </div>
    ) : null;
  }

  // Final structured layout
  const title = planData?.title;
  const sub = planData?.subtitle || summary;

  const hasPlan = !!planData?.products?.length;

  return (
    <div className="final-out">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div className="final-label">{hasPlan ? "store ready" : text}</div>
      </div>
      {title && <div className="final-title">{title}</div>}
      {sub && <div className="final-sub">{sub}</div>}
      {hasPlan && (
        <div className="final-tags">
          <span className="ftag ok">✓ launched</span>
          <span className="ftag">commerce</span>
          <span className="ftag">{planData.products.length} products</span>
        </div>
      )}
    </div>
  );
}

// ─── Actions ──────────────────────────────────────────────────────
function Actions({ actions, onAction }) {
  if (!actions?.length) return null;
  return (
    <div className="actions" style={{ display: "flex" }}>
      {actions.map(a => {
        const cls = a.variant === "approve" ? "act ok" : a.variant === "reject" ? "act no" : "act";
        const icon = a.variant === "approve" ? "✓ " : a.variant === "reject" ? "&times; " : "↩ ";
        return (
          <button
            key={a.key}
            onClick={() => onAction?.(a.key, a.variant)}
            className={cls}
          >
            {icon}{a.label.replace("Approve", "Approve").replace("Reject", "Reject")}
          </button>
        );
      })}
    </div>
  );
}

// ─── Thinking ─────────────────────────────────────────────────────
const Thinking = ({ startTs, text = "thinking" }) => {
  const [nowMs, setNowMs] = useState(Date.now);

  useEffect(() => {
    if (!startTs) return;
    const timer = setInterval(() => setNowMs(Date.now()), 100);
    return () => clearInterval(timer);
  }, [startTs]);

  const sec = startTs ? Math.max(1, Math.round((nowMs - startTs) / 1000)) : 0;

  return (
    <div className="phase-row" style={{ cursor: "default", opacity: 1, color: "#c8b89a" }}>
      <span className="phase-name running">
        {text}
        <span className="dots" style={{ display: 'inline-flex', marginLeft: 6 }}><span></span><span></span><span></span></span>
      </span>
      {startTs && sec > 0 && <span className="phase-dur" style={{ marginLeft: 6 }}>{sec}s</span>}
    </div>
  );
};

// ─── MAIN EXPORT ──────────────────────────────────────────────────
export function SeraAgentMessage({ message, onAction }) {
  const [logsOpen, setLogsOpen] = useState(false);
  const {
    state = "complete",
    isStreaming = false,
    milestones = [],
    events = [],
    runtime = null,
    cognition = [],
    summary = null,
    tools = [],
    content = "",
    actions = [],
    planData = null,
    chat = null,
  } = message;

  const activeEvents = runtime || events || cognition || [];
  const hasRuntime = activeEvents.length > 0 || milestones.length > 0;

  let currentText = "thinking";
  if (isStreaming && activeEvents.length > 0) {
    const active = activeEvents.find(e => !e.done) || activeEvents[activeEvents.length - 1];
    if (active && active.phase) {
      const phaseStr = active.phase.replace(/_/g, ' ').toLowerCase();
      if (phaseStr.includes('analy')) currentText = "analyzing";
      else if (phaseStr.includes('gen') || phaseStr.includes('asset')) currentText = "generating assets";
      else if (phaseStr.includes('fetch') || phaseStr.includes('query')) currentText = "fetching data";
      else if (phaseStr.includes('design')) currentText = "designing layout";
      else currentText = phaseStr;
    }
  }

  // Global Execution Timer Logic
  const startTs = activeEvents.length > 0 ? (activeEvents[0].localTs || (activeEvents[0].timestamp ? activeEvents[0].timestamp * 1000 : null)) : null;
  const endTs = activeEvents.length > 0 ? (activeEvents[activeEvents.length - 1].localTs || (activeEvents[activeEvents.length - 1].timestamp ? activeEvents[activeEvents.length - 1].timestamp * 1000 : null)) : null;
  let finalDurStr = "";
  if (!isStreaming && startTs && endTs) {
    const sec = Math.max(1, Math.round((endTs - startTs) / 1000));
    finalDurStr = sec + "s";
  }

  const INTRO_RE = /^(I\s+am\s+(Gemini|a\s+large|an?\s+AI|SERA)|As\s+(an?\s+)?(AI|Gemini)|Certainly[,!]|Sure[,!]\s+I|Absolutely[,!])/i;
  const displayText = content
    ? content
      .split("\n")
      .filter(line => !INTRO_RE.test(line.trim()))
      .join("\n")
      .trim()
    : "";

  const logsComponent = hasRuntime && (
    <RuntimeLog
      events={activeEvents}
      milestones={milestones}
      isStreaming={isStreaming}
    />
  );

  const isSimpleChat = !hasRuntime && !planData && !chat;

  const headerLabel = planData ? displayText : (hasRuntime ? "Agent process completed" : "");

  const finalOutComponent = isSimpleChat ? (
    isStreaming ? (
      <div className="sera-chat markdown-body" style={{ fontFamily: C.sans, fontSize: 13, lineHeight: 1.5, marginTop: 8, opacity: 0.7 }}>
        <ReactMarkdown>{displayText}</ReactMarkdown> <Cursor />
      </div>
    ) : (
      <div className="sera-chat markdown-body" style={{ fontFamily: C.sans, fontSize: 13, lineHeight: 1.65, marginTop: 4 }}>
        <ReactMarkdown>{displayText}</ReactMarkdown>
      </div>
    )
  ) : (
    <FinalOut text={headerLabel} summary={summary} planData={planData} isStreaming={isStreaming} finalDurStr={finalDurStr} />
  );

  return (
    <div style={{ padding: "2px 0" }}>
      {isStreaming ? (
        <>
          {!displayText && !hasRuntime && <Thinking startTs={startTs} text={currentText} />}
          {logsComponent}
          {displayText && (
            <div className="sera-chat markdown-body" style={{ fontFamily: C.sans, fontSize: 13, lineHeight: 1.5, marginTop: 8, opacity: 0.7 }}>
              <ReactMarkdown>{displayText}</ReactMarkdown> <Cursor />
            </div>
          )}
        </>
      ) : isSimpleChat ? (
        finalOutComponent
      ) : (
        <>
          <div className="sera-card" style={{ borderRadius: 8, overflow: 'hidden', marginBottom: 8 }}>
            <div
              onClick={() => setLogsOpen(!logsOpen)}
              className="sera-header"
              style={{ padding: "12px 14px", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center", transition: "background 0.2s" }}
            >
              <div style={{ flex: 1 }}>{finalOutComponent}</div>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                {finalDurStr && <div className="phase-dur">{finalDurStr}</div>}
                <span className="chevron-sm" style={{ padding: 4, transform: logsOpen ? 'rotate(-90deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}>⌄</span>
              </div>
            </div>
            {logsOpen && (
              <div className="sera-logs" style={{ padding: "10px 14px" }}>
                {logsComponent}
              </div>
            )}
          </div>
          
          {!planData && displayText && (
            <div className="sera-chat markdown-body" style={{ fontFamily: C.sans, fontSize: 13, lineHeight: 1.65, marginTop: 4, whiteSpace: "normal" }}>
              <ReactMarkdown>{displayText}</ReactMarkdown>
            </div>
          )}
        </>
      )}

      {chat && (
        <div className="sera-chat markdown-body" style={{ fontFamily: C.sans, fontSize: 13, lineHeight: 1.65, marginTop: 12, whiteSpace: "normal" }}>
          <ReactMarkdown>{chat}</ReactMarkdown>
        </div>
      )}
    </div>
  );
}

export default SeraAgentMessage;
