const mongoose = require("mongoose");

const providerSchema = new mongoose.Schema({
  name: {
    type: String,
  },

  mobileNum: {
    type: String,
  },

  email: {
    type: String,
  },

  password: {
    type: String,
  },

  gender: {
    type: String,
  },

  city: {
    type: String,
  },

  petParent: {
    type: String,
  },

  pincode: {
    type: String,
  },

  location: {
    type: {
      type: String,
      enum: ["Point"],
      default: "Point",
    },
    coordinates: {
      type: [Number],
      required: true,
    },
  },

  services: [{ type: mongoose.Schema.Types.ObjectId, ref: "Services" }],

  servicesList : [String],

  image: {
    type: String,
    required: false,
  },

  reviews: [
    {
      type: mongoose.Types.ObjectId, ref: "Reviews",
      required: false
    }
  ],

  hostType: [{
    type: String,
    required: false
  }]

});

providerSchema.index({ location: "2dsphere" });

const Providers = new mongoose.model("Providers", providerSchema);

module.exports = Providers;
