const mongoose = require("mongoose");

const ReviewSchema = new mongoose.Schema({
  rating: {
    type: String,
    required: true,
  },
  review: {
    type: String,
    required: true,
  },
  user_id: {
    type: mongoose.Types.ObjectId,
    ref: "Users",
  },
  provider_id: {
    type: mongoose.Types.ObjectId,
    ref: "Providers",
  },
  verified: {
    type: Boolean,
    required: true,
  },
});

const Reviews = new mongoose.model("Reviews", ReviewSchema);

module.exports = Reviews;
