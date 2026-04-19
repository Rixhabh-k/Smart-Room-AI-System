import React, {
  createContext,
  useEffect,
  useState,
  useRef
} from "react";

import axios from "axios";

export const SensorContext = createContext();

export const SensorProvider = ({ children }) => {

  const [latest, setLatest] = useState({
    temperature: "--",
    humidity: "--",
    limit: "--"
  });

  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [advice, setAdvice] = useState("Waiting for AI advice...");

  const lastTempRef = useRef(null);
  const lastAICallRef = useRef(0);

  // ✅ AI Call
  const fetchAIAdvice = async (temperature, humidity) => {
    try {
      const res = await axios.post(
        "http://192.168.1.3:3000/api/ai-advice",
        { temperature, humidity }
      );
      setAdvice(res.data.advice);
    } catch (error) {
      console.log("AI Error:", error);
    }
  };

  // ✅ Sensor Fetch
  const fetchLatest = async () => {
    try {
      const res = await axios.get("http://192.168.1.3:3000/api/latest");
      const data = res.data;

      setLatest(data);

      setHistory(prev => {
        const newEntry = {
          temperature: data.temperature,
          humidity: data.humidity,
          timestamp: Date.now()
        };
        const updated = [...prev, newEntry];
        if (updated.length > 50) updated.shift();
        return updated;
      });

      setLoading(false);

      // ✅ AI Call Logic
      const now = Date.now();
      const tempChanged = lastTempRef.current !== null &&
        Math.abs(data.temperature - lastTempRef.current) >= 2;
      const fiveMinPassed = now - lastAICallRef.current >= 5 * 60 * 1000;

      if (tempChanged || fiveMinPassed) {
        fetchAIAdvice(data.temperature, data.humidity);
        lastAICallRef.current = now;
      }

      lastTempRef.current = data.temperature;

    } catch (error) {
      console.log("API Fetch Error:", error);
    }
  };

  useEffect(() => {
    fetchLatest();
    const interval = setInterval(fetchLatest, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <SensorContext.Provider value={{
      latest,
      history,
      loading,
      advice  // ✅ AI advice bhi share karo
    }}>
      {children}
    </SensorContext.Provider>
  );
};