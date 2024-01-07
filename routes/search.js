const express = require("express");
const jwtDecode = require("jwt-decode");
const router = new express.Router();
const verify = require("../middleware/auth");
const mongoose = require("mongoose");

const Users = require("../models/user");
const Providers = require("../models/provider");
const Services = require("../models/services");

router.get(
    "/:service/:longitude/:latitude/:distance",
    verify,
    async (req, res) => {
        const { service, longitude, latitude, distance } = req.params;
        console.log(req.params);
        Providers.find({
            location: {
                $nearSphere: {
                    $geometry: {
                        type: "Point",
                        coordinates: [
                            parseFloat(longitude),
                            parseFloat(latitude),
                        ],
                    },
                    $maxDistance: (Number(distance)*1000), // 5 kilometers in meters
                },
            },
            servicesList: { $in: [service] },
        }).then((locations) => {
            if (!locations) {
                console.error("Error finding locations:", err);
                res.status(500).send("Error finding locations");
            } else {
                res.status(200).json(locations);
            }
        });
    }
);

module.exports = router;
