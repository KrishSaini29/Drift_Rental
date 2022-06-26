const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const locationSchema = new Schema({
  name: { type: String, required: true },
  street: { type: String, required: true },
  city: { type: String, required: true },
  state: { type: String, required: true },
  pincode: { type: Number, required: true, unique: true },
});

module.exports = mongoose.model("Location", locationSchema);
