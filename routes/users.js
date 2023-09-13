const express = require("express");
const router = new express.Router();
const bcrypt = require("bcrypt");
const bodyParser = require("body-parser");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");

const verify = require("../middleware/auth");

const Users = require("../models/user");
const Providers = require("../models/provider");
const Reviews = require("../models/review");

const saltRounds = 10;

mongoose.set("strictQuery", true);
mongoose.set("strictQuery", true);

router.get("/check", verify, async (req, res) => {
    console.log(req._id);
    let user = null;
    user = await Users.findById(req._id).exec();

    if (!user) {
        return res.status(404).json({
            message: "User Not Found",
        });
    }
    return res.status(200).json(user);
});

router.post("/register", async (req, res) => {
    const body = req.body;

    const email = body.email;

    const userAlready = await Users.findOne({ email: email });

    if (userAlready) {
        res.status(403).send("User already exists");
    } else {
        bcrypt.hash(body.password, saltRounds, function (err, hash) {
            const user = new Users({
                name: body.name,
                mobileNum: body.mobileNum,
                email: body.email,
                password: hash,
                gender: body.gender,
                city: body.city,
                petParent: body.petParent,
                location: {
                    type: 'Point',
                    coordinates: [parseFloat(body.longitude), parseFloat(body.latitude)],
                  },
            });

            user.save().then((docs) => {
                const token = jwt.sign(
                    {
                        email: docs.email,
                        userId: docs._id.toString(),
                    },
                    process.env.TOKEN_SECRET_KEY,
                    { expiresIn: "5h" }
                );

                res.status(200).send("Registred sucessfuly");
            });
        });
    }
});

router.post("/login", async (req, res) => {
    const body = req.body;

    Users.findOne({ email: body.email })
        .then((docs) => {
            bcrypt.compare(
                body.password,
                docs.password,
                function (err, result) {
                    if (result) {
                        const token = jwt.sign(
                            {
                                id: docs._id.toString(),
                            },
                            process.env.TOKEN_SECRET_KEY,
                            { expiresIn: "5h" }
                        );
                        res.cookie("petlevert", token, {
                            httpOnly: true,
                            sameSite: "none",
                            secure: true,
                            maxAge: 24 * 60 * 60 * 1000,
                        });
                        res.status(200).send(docs);
                    } else {
                        res.send("Password or mobileNum Incorrect");
                    }
                }
            );
        })
        .catch((err) => {
            res.send("User not registered");
        });
});

router.post("/review", verify, (req, res) => {
  const body = req.body;
  const user_id = req._id;
  const provider_id = body.provider_id;
  const rating = body.rating;
  const review = body.review;
  Reviews.findOne({ user_id: user_id, provider_id: provider_id })
    .then((doc) => {
      if (!doc) {
        const Review = new Reviews({
          rating: rating,
          review: review,
          user_id: user_id,
          provider_id: provider_id,
          verify: false,
        });
        return Review.save();
      }
      doc.rating = rating;
      doc.review = review;
      return doc.save();
    })
    .then((modified) => {
      console.log(modified);
      res.status(202).send("review saved sucessfully");
    })
    .catch((err) => {
      res.status(500).send("error saving rating");
    });
});

router.get("/info", verify, async (req, res) => {
    const id = req._id;
    console.log(id + "from info");
    let user_info = null;

    user_info = await Users.findById(id).exec();

    if (!user_info) {
        return res.status(400).send("User not found");
    }
    res.status(200).json(user_info);
});

router.get("/all", verify, (req, res) => {
    Users.find({}).then((docs) => {
        res.status(200).json(docs);
    });
});

module.exports = router;
