import React, { useContext } from "react";
import { SensorContext } from "../context/SensorContext";

const HumidityCard = () => {

  const { latest } =
    useContext(SensorContext);

  return (
    <div className="card">
      <div className="card-data">

        <h1>Humidity</h1>

        <h2>
          {latest.humidity !== undefined
    ? Math.round(latest.humidity)
    : "--"}%
        </h2>

      </div>
    </div>
  );
};

export default HumidityCard;