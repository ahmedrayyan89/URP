import { useEffect, useRef } from "react";

export default function ActivityLog({ logs }) {
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  return (
    <div className="log">
      {logs.map((line, index) => (
        <div key={index} className="log-line">
          <span className="log-time">{line.time}</span>
          <span className={`log-msg ${line.type}`}>{line.msg}</span>
        </div>
      ))}
      <div ref={bottomRef} />
    </div>
  );
}