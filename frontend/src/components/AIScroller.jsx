import React, { useState, useEffect } from "react";
const API = import.meta.env.VITE_API_URL;

const AIScroller = () => {
  const [advice, setAdvice] = useState(
    "⚠ TEMPERATURE EXCEEDED LIMIT | 💧 HUMIDITY STABLE | ✅ SYSTEM RUNNING NORMALLY |"
  );

  useEffect(() => {
    const fetchAdvice = async () => {
      try {
       const res = await fetch(`${API}/api/latest-advice`);
        const data = await res.json();
        if (data.advice) {
          setAdvice(`🤖 AI Advice: ${data.advice} |`);
        }
      } catch (err) {
        console.error("Advice fetch failed:", err);
      }
    };

    fetchAdvice();                          // pehli baar turant
    const interval = setInterval(fetchAdvice, 10000); // har 10s

    return () => clearInterval(interval);  // cleanup
  }, []);

  return (
    <div className="scroll-container">
      <div className="scroll-track">
        <span>{advice}</span>
        <span>{advice}</span>
      </div>
    </div>
  );
};

export default AIScroller;