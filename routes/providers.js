const express = require("express");
const router = new express.Router();
const bcrypt = require("bcrypt");
const bodyParser = require("body-parser");
const jwt = require("jsonwebtoken");
const verify = require("../middleware/auth");
const { default: jwtDecode } = require("jwt-decode");

const Users = require("../models/user");
const Providers = require("../models/provider");
const Services = require("../models/services");

const saltRounds = 10;

router.post("/register", async (req, res) => {
  const body = req.body;

  const email = body.email;

  const userAlready = await Providers.findOne({ email: email });

  if (userAlready) {
    res.status(403).send("Provider already exists");
  } else {
    bcrypt.hash(body.password, saltRounds, function (err, hash) {
      const provider = new Providers({
        name: body.name,
        mobileNum: body.mobileNum,
        email: body.email,
        password: hash,
        gender: body.gender,
        city: body.city,
        petParent: body.petParent,
        pincode: body.pincode,
        location: {
          type: 'Point',
          coordinates: [body.longitude, body.latitude],
        },
      });


      provider.save().then((docs) => {
        const token = jwt.sign(
          {
            email: docs.email,
            userId: docs._id.toString(),
          },
          process.env.TOKEN_SECRET_KEY,
          { expiresIn: "5h" }
        );

        res.status(200).send({
          token: token,
          userId: docs._id.toString(),
          expiresIn: "18000",
        });
      });
    });
  }
});

router.get("/info", async (req, res) => {
  const id = req.params;

  let providers_info = null;

  providers_info = await Providers.findById(id).exec();

  if (!user_info) {
    res.status(400).send("Provider not found");
  }
  res.status(200).json(providers_info);
});

router.post("/details", verify, (req, res) => {
  const provider_id = req._id;
  const body = req.body;
  try {
    Providers.findOne({ _id: provider_id })
      .then((data) => {
        const service = new Services({
          serviceType: body.service,
          providersId: data._id,
          price: body.price,
          note: body.note,
          petType: [body.type],
        });
         service.save().then((doc)=>
         {
          data.services.push(doc._id);
          data.servicesList.push(doc.serviceType);

          return data.save();
         })
      })
      .then((result) => {
        res.status(200).send("Added in Database");
      })
      .catch((err) => {
        res.status(400).send(err);
      });
  } catch (err) {
    res.status(400).send(err);
  }
});

router.post("/login", async (req, res) => {
  const body = req.body;

  Providers.findOne({ email: body.email })
    .then((docs) => {
      bcrypt.compare(body.password, docs.password, function (err, result) {
        if (result) {
          const token = jwt.sign(
            {
              email: docs.email,
              providerId: docs._id.toString(),
            },
            process.env.TOKEN_SECRET_KEY,
            { expiresIn: "5h" }
          );

          res.status(200).send({
            token: token,
            userId: docs._id.toString(),
            expiresIn: "18000",
          });
        } else {
          res.send("Password or mobileNum Incorrect");
        }
      });
    })
    .catch((err) => {
      res.status(400).send("Provider not registered");
    });
});

router.get("/all", verify, (req, res) => {
  Providers.find({}).then((docs) => {
    res.status(200).json(docs);
  });
});

module.exports = router;
