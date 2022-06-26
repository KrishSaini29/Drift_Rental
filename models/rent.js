const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const rentSchema = new Schema({
  fromDate: { type: Date, required: true },
  returnDate: { type: Date, required: true },
  pickupLocation: { type: String, required: true },
  dropLocation: { type: String, required: true },
  customer: { type: mongoose.Types.ObjectId, required: true, ref: "Customer" },
  car: { type: mongoose.Types.ObjectId, required: true, ref: "Car" },
  location: { type: mongoose.Types.ObjectId, required: true, ref: "Location" },
});

module.exports = mongoose.model("Rent", rentSchema);
