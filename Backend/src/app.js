const express = require("express");
const cors = require("cors");
const path = require("path");

const app = express();


// Enable CORS

app.use(cors({
  origin: "*"
}));

// JSON parser

app.use(express.json());

// Import Routes

const sensorRoutes =
require("./routes/sensorRoutes");

const aiRoutes =
require("./routes/ai");

// Use Routes

app.use("/api", sensorRoutes);

app.use("/api", aiRoutes);

// Test Route




app.use(express.static(
  path.join(__dirname, "../frontend/dist")
));

app.get("*", (req, res) => {
  res.sendFile(
    path.join(__dirname, "../frontend/dist/index.html")
  );
});

module.exports = app;