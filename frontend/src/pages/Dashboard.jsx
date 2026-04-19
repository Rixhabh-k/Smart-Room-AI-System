import React from "react";
import room from "../assets/room.png";
import "../index.css";

import TempCard from "../components/TempCard";
import HumidityCard from "../components/HumidityCard";
import LimitCard from "../components/LimitCard";
import AIScroller from "../components/AIScroller";

import { Link } from "react-router-dom";

const Dashboard = () => {
  return (
    <div
      id="main"
      style={{
        backgroundImage: `url(${room})`,
      }}
    >
      <div className="overlay">

        <Link to="/history" className="history">
          History
        </Link>

        <div className="main-container">

          <div className="card-container">

            <div className="upper">
              <TempCard />
              <HumidityCard />
              <LimitCard />
            </div>

            <div className="lower">
              <AIScroller />
            </div>

          </div>

        </div>

      </div>
    </div>
  );
};

export default Dashboard;