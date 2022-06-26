const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const carSchema = new Schema({
  plateNo: { type: String, required: true, unique: true },
  model: { type: String, required: true },
  isAvailable: { type: Boolean, required: true, default: true },
  type: { type: String, required: true },
  rentPerDay: { type: Number, required: true },
  location: { type: mongoose.Types.ObjectId, required: true, ref: "Location" },
});

module.exports = mongoose.model("Car", carSchema);
