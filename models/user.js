const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
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

    city: {
        type: String,
    },

    petParent: {
        type: String,
    },
    image: {
        type: String,
        required: false,
    },
    location: {
        type: {
            type: String,
            enum: ["Point"], // Only "Point" type is allowed for geospatial data
            required: true,
        },
        coordinates: {
            type: [Number], // Longitude and latitude
            required: true,
        },
    },
});

const Users = new mongoose.model("Users", userSchema);

module.exports = Users;
