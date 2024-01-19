const express = require("express");
const jwtDecode = require("jwt-decode");
const router = new express.Router();
const verify = require("../middleware/auth");
const mongoose = require("mongoose");

const Users = require("../models/user");
const Providers = require("../models/provider");
const Services = require("../models/services");

router.get(
    "/geolocation/:service/:longitude/:latitude/:distance/:pettype/:sort",
    verify,
    async (req, res) => {
        try {
            const { service, longitude, latitude, distance, pettype, sort } = req.params;
            const serviceLowerCase = service;
            console.log(req.params);

            const providers = await Providers.find({
                location: {
                    $nearSphere: {
                        $geometry: {
                            type: "Point",
                            coordinates: [
                                parseFloat(longitude),
                                parseFloat(latitude),
                            ],
                        },
                        $maxDistance: Number(distance) * 1000, // Convert to meters
                    },
                },
                servicesList: { $in: [serviceLowerCase] },
            });

            if (!providers || providers.length === 0) {
                return res.status(200).json([]);
            }

            const providerIds = providers.map(provider => provider._id);

            const services = await Services.find({
                providersId: { $in: providerIds },
                serviceType: serviceLowerCase,
                petType: { $in: [pettype] },
            });

            const combinedData = providers.map(provider => {
                const matchingService = services.find(service => service.providersId.equals(provider._id));
                return {
                    ...provider.toObject(),
                    ...(matchingService ? matchingService.toObject() : {}),
                };
            });

            if (sort === 'high') {
                combinedData.sort((a, b) => b.price - a.price);
            } else {
                combinedData.sort((a, b) => a.price - b.price);
            }

            res.status(200).json(combinedData);
        } catch (error) {
            console.error("Error fetching providers:", error);
            res.status(500).json({ message: 'Internal server error.' });
        }
    }
);


router.get("/citybased/:service/:pettype/:country/:state/:city/:sort", verify, async (req, res) => {
    try {
        const { country, state, city, pettype, service, sort } = req.params;
        console.log(req.params);
        const petTypeLowercase = pettype;
        const serviceLowerCase = service;

        const matchingServices = await Services.find({
            serviceType: serviceLowerCase,
            petType: { $in: [petTypeLowercase] },
        });

        console.log(matchingServices);

        if (matchingServices.length === 0) {
            return res.status(200).json([]);
        }

        const providerIds = matchingServices.map(service => service.providersId);

        const providers = await Providers.find({
            _id: { $in: providerIds },
            country: country,
            city: city,
            state: state,
        });

        const combinedData = matchingServices.map(service => {
            const provider = providers.find(provider => provider._id.equals(service.providersId));
            return {
                ...service.toObject(),
                ...provider.toObject()
            };
        });

        if (combinedData.length === 0) {
            return res.status(404).json({ message: 'No providers found.' });
        }

        combinedData.sort((a, b) => {
            const priceA = parseFloat(a.price);
            const priceB = parseFloat(b.price);

            if (sort === 'high') {
                return priceB - priceA;
            } else {
                return priceA - priceB;
            }
        });

        res.status(200).json(combinedData);
    } catch (error) {
        console.error("Error fetching providers:", error);
        res.status(500).json({ message: 'Internal server error.' });
    }
});


router.get("/provider/:id", verify, async (req, res) => {
    try {
        const { id } = req.params;

        const provider = await Providers.findById(id).populate('services');

        if (!provider) {
            return res.status(404).json({ message: 'Provider not found.' });
        }
        console.log(provider);
        res.status(200).json(provider);
    } catch (error) {
        console.error("Error fetching provider:", error);
        res.status(500).json({ message: 'Internal server error.' });
    }
});

module.exports = router;
