const express = require("express");
const jwtDecode = require("jwt-decode");
const router = new express.Router();
const verify = require("../middleware/auth");
const mongoose = require("mongoose");

const Users = require("../models/user");
const Providers = require("../models/provider");
const Services = require("../models/services")

router.get("/location", verify, async(req,res)=>
{
  const body = req.body;
  const userId = req._id;

  let user = null;
  user = await Users.findOneById(userId);

  const { coordinates } = user.location;
  const [longitude, latitude] = coordinates;
  
  Providers
      .find({
        location: {
          $nearSphere: {
            $geometry: {
              type: 'Point',
              coordinates: [parseFloat(longitude), parseFloat(latitude)],
            },
            $maxDistance: 5000, // 5 kilometers in meters
          },
        },
      })
      .toArray((err, locations) => {
        if (err) {
          console.error('Error finding locations:', err);
          res.status(500).send('Error finding locations');
        } else {
          res.status(200).json(locations);
        }
      });
})

module.exports = router;
