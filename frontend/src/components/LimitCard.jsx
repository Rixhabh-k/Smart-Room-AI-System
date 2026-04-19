import React, { useContext } from "react";
import { SensorContext } from "../context/SensorContext";

const LimitCard = () => {

  const { latest } =
    useContext(SensorContext);

  return (
    <div className="card">
      <div className="card-data">

        <h1>Limit Temp.</h1>

        <h2>
          {latest.limit ?? "--"}°C
        </h2>

      </div>
    </div>
  );
};

export default LimitCard;