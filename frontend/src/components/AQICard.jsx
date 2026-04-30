import React, { useContext } from "react";
import { SensorContext } from "../context/SensorContext";

const AQICard = () => {

  const { latest } =
    useContext(SensorContext);

  return (
    <div className="card">
      <div className="card-data">

        <h1>AQI</h1>

        <h2>
          {latest.airQuality &&
           latest.airQuality !== "--"
            ? Math.round(latest.airQuality)
            : "--"}
        </h2>

      </div>
    </div>
  );
};

export default AQICard;