const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const customerSchema = new Schema({
  userName: { type: String, required: true },
  fname: { type: String, required: true },
  lname: { type: String, required: true },
  aadhaar: { type: Number, required: true, unique: true, maxlength: 12 },
  contact: { type: Number, required: true, unique: true, maxlength: 10 },
  address: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true, minlength: 5 },
});

module.exports = mongoose.model("Customer", customerSchema);
