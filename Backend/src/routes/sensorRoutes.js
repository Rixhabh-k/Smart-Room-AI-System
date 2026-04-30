const express = require("express");
const router = express.Router();

const SensorData =
require("../models/SensorData");


// POST sensor data

router.post("/data", async (req, res) => {

  try {

    const {
      temperature,
      humidity,
      limit,
      airQuality   // ✅ ADD THIS
    } = req.body;

    console.log(
      "📡 ESP Data:",
      temperature,
      humidity,
      limit,
      airQuality   // ✅ LOG THIS
    );

    const newData = new SensorData({

      temperature,
      humidity,
      limit,
      airQuality   // ✅ SAVE THIS

    });

    await newData.save();

    res.json({
      message: "Data Saved"
    });

  }

  catch (error) {

    res.status(500).json({
      error: error.message
    });

  }

});


// ✅ FIXED latest route

router.get("/latest", async (req, res) => {

  try {

    const data =
      await SensorData
        .findOne()
        .sort({ timestamp: -1 });

    if (!data) {

      return res.json({
        temperature: 0,
        humidity: 0,
        limit: 0
      });

    }

    res.json(data);

  }

  catch (error) {

    res.status(500).json({
      error: error.message
    });

  }

});


// history route (optional)

router.get("/history", async (req, res) => {

  const data = await SensorData
    .find()
    .sort({ timestamp: -1 })
    .limit(50);

  res.json(data);

});

module.exports = router;