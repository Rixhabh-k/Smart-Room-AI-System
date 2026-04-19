const mongoose = require("mongoose");

const sensorSchema = new mongoose.Schema({

  temperature: {
    type: Number,
    required: true
  },

  humidity: {
    type: Number,
    required: true
  },

  limit: {
    type: Number,
    required: true
  },

  aiMessage: {
    type: String,
    default: ""
  },

  timestamp: {
    type: Date,
    default: Date.now
  }

});

module.exports = mongoose.model(
  "SensorData",
  sensorSchema
);