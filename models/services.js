const mongoose = require("mongoose");

const ServicesSchema = new mongoose.Schema({
  serviceType: {
    type: String,
  },
  providersId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Providers",
  },
  price: {
    type: String,
  },
  note: {
    type: String,
  },
  petType: [
    {
      type: String,
    },
  ],
});

const Services = new mongoose.model("Services", ServicesSchema);

module.exports = Services;
