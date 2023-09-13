const express = require("express");
const jwtDecode = require("jwt-decode");
const router = new express.Router();
const verify = require("../middleware/auth");
const mongoose = require("mongoose");

const Users = require("../models/user");
const Providers = require("../models/provider");
const Services = require("../models/services");

router.get(
    "/location/:service/:longitude/:latitude",
    verify,
    async (req, res) => {
        const { service, longitude, latitude } = req.params;
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
                    $maxDistance: 5000, // 5 kilometers in meters
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

router.get("/city/:city/:service", verify, async (req, res) => {
    // let user = null;
    // user = await Users.findOneById(req._id);

    const { city, service } = req.params;

    let providers = null;

    providers = await Providers.find({
        city: city,
        services: { $in: [service] },
    });

    if (providers) {
        res.status(200).json(providers);
    } else {
        res.status(400).send("No providers found");
    }
});

module.exports = router;
