const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const issueSchema = new Schema({
  cusName: { type: String, required: true },
  name: { type: String, required: true },
  aaddress: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  customer: { type: mongoose.Types.ObjectId, required: true, ref: "Customer" },
});

module.exports = mongoose.model("Issue", issueSchema);
