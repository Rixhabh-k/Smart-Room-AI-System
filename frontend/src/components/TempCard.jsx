import React, { useContext } from "react";
import { SensorContext } from "../context/SensorContext";

const TempCard = () => {
  const { latest } = useContext(SensorContext);

  return (
    <div className="card">
      <div className="card-data">
        <h1>Temperature</h1>

        <h2>
          {latest.temperature !== undefined
            ? Math.round(latest.temperature)
            : "--"}
          °C
        </h2>
      </div>
    </div>
  );
};

export default TempCard;
