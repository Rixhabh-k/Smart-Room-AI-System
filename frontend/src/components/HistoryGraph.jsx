import React, { useContext } from "react";
import room from "../assets/room.png";
import "../index.css";

import { Link } from "react-router-dom";

import { SensorContext }
from "../context/SensorContext";

import {
  Line
} from "react-chartjs-2";

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Legend,
  Tooltip
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Legend,
  Tooltip
);

const HistoryGraph = () => {

  const { history, loading } =
    useContext(SensorContext);

  console.log("History:", history);

  const options = {

  responsive: true,

  plugins: {

    legend: {
      labels: {
        color: "white"
      }
    }

  },

  scales: {

    x: {

      ticks: {

        color: "white",

        font: {
          size: 11   // 🔥 CHANGE THIS (default ~12–14)
        }

      },

      grid: {
        color: "rgba(255,255,255,0.1)"
      }

    },

    y: {

      ticks: {

        color: "white",

        font: {
          size: 12
        }

      },

      grid: {
        color: "rgba(255,255,255,0.1)"
      },

      maxTicksLimit: 8

    }

  }

};

  // 🔵 Loading State

  if (loading) {

    return (
      <div
        id="main"
        style={{
          backgroundImage: `url(${room})`,
        }}
      >

        <div className="overlay">

          <Link to="/" className="history">
            Back
          </Link>

          <div className="main-container">

            <div className="graph-area">

              Loading History...

            </div>

          </div>

        </div>

      </div>
    );

  }

  // 🔴 No Data State

  if (!history || history.length === 0) {

    return (
      <div
        id="main"
        style={{
          backgroundImage: `url(${room})`,
        }}
      >

        <div className="overlay">

          <Link to="/" className="history">
            Back
          </Link>

          <div className="main-container">

            <div className="graph-area">

              No History Data Yet

            </div>

          </div>

        </div>

      </div>
    );

  }

  // 🟢 Reverse History (Old → New)

  const reversedHistory =
    [...history].reverse();

  // 🕒 Labels (Time)

  const labels =
    reversedHistory.map(item =>
      new Date(item.timestamp)
        .toLocaleTimeString()
    );

  // 📊 Chart Data

  const data = {

    labels,

    datasets: [

      {
        label: "Temperature (°C)",

        data:
          reversedHistory.map(item =>
            Math.round(item.temperature)
          ),

        borderColor: "#ff6b3d",

        tension: 0.3
      },

      {
        label: "Humidity (%)",

        data:
          reversedHistory.map(item =>
            Math.round(item.humidity)
          ),

        borderColor: "#4dabf7",

        tension: 0.3
      }

    ]

  };

  return (

    <div
      id="main"
      style={{
        backgroundImage: `url(${room})`,
      }}
    >

      <div className="overlay">

        <Link to="/" className="history">
          Back
        </Link>

        <div className="main-container">

          <div className="graph-area">

            <Line data={data} options={options} />

          </div>

        </div>

      </div>

    </div>

  );

};

export default HistoryGraph;