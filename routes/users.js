const express = require("express");
const router = new express.Router();
const bcrypt = require("bcrypt");
const bodyParser = require("body-parser");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const nodemailer = require("nodemailer");
const crypto = require("crypto");

const verify = require("../middleware/auth");

const Users = require("../models/user");
const Providers = require("../models/provider");
const Reviews = require("../models/review");

const saltRounds = 10;

mongoose.set("strictQuery", true);
mongoose.set("strictQuery", true);

function generateResetToken() {
  return new Promise((resolve, reject) => {
    crypto.randomBytes(32, (err, buffer) => {
      if (err) {
        reject(err);
      } else {
        const token = buffer.toString("hex");
        resolve(token);
      }
    });
  });
}

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
        country: body.country,
        state: body.state,
        petParent: body.petParent,
        location: {
          type: "Point",
          coordinates: [
            parseFloat(body.longitude),
            parseFloat(body.latitude),
          ],
        },
      });

      user.save().then((docs) => {
        res.status(200).send("Registred sucessfuly");
      });
    });
  }
});

router.post("/login", async (req, res) => {
  const body = req.body;

  Users.findOne({ email: body.email })
    .then((docs) => {
      if (!docs) {
        return res.status(400).json({
          message:
            "Account not Found. Please try creating an account",
        });
      }
      bcrypt.compare(
        body.password,
        docs.password,
        function (err, result) {
          if (result) {
            const token = jwt.sign(
              {
                id: docs._id.toString(),
                type: "user",
              },
              process.env.TOKEN_SECRET_KEY,
              { expiresIn: "5h" }
            );
            res.cookie("petlevert", token, {
              httpOnly: true,
              sameSite: "none",
              secure: true,
              type: "user",
              maxAge: 24 * 60 * 60 * 1000,
            });
            const updatedDoc = { ...docs._doc, type: "user" };
            res.status(200).send(updatedDoc);
          } else {
            res.status(400).send("Password or email Incorrect");
          }
        }
      );
    })
    .catch((err) => {
      res.send("User not registered");
    });
});

router.post("/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;

    const user = await Users.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const token = await generateResetToken();

    // generateResetToken()
    //   .then((token) => {
    //     console.log(...token);
    //   })
    //   .catch((error) => {
    //     console.error("Error generating token:", error);
    //   });

    // Save the token and its expiration date in the database
    user.resetPasswordToken = token;
    user.resetPasswordExpires = Date.now() + 3600000; // Token expires in 1 hour
    await user.save();

    // Send a password reset email with the token
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: "testingnode061229@gmail.com",
        pass: "qdgzonbtfthnkavy",
      },
    });
    const mailOptions = {
      from: "dhrupadsah@gmail.com",
      to: email,
      subject: "Password Reset",
      text: `You are receiving this because you (or someone else) have requested the reset of the password for your account.\n\n
          Please click on the following link, or paste this into your browser to complete the process:\n\n
          http://${req.headers.host}/reset-password/${token}/
          If you did not request this, please ignore this email and your password will remain unchanged.`,
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error(error);
        return res.status(500).json({ message: "Error sending email" });
      }
      res.status(200).json(token);
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

router.post("/reset-password/:token", async (req, res) => {
  try {
    const { token } = req.params;
    const { newPassword } = req.body;

    // Find the user by the reset token and check if it's still valid
    const user = await Users.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res
        .status(400)
        .json({ message: "Token is invalid or has expired" });
    }

    // Hash the new password and save it
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    res.status(200).json({ message: "Password reset successful" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
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

router.post("/updateinfo", verify, async (req, res) => {
  console.log("update account");

  const body = req.body;
  console.log(req._id, req.body);
  let user = null;
  try {
    user = await Users.findById(req._id).exec();
  } catch (err) {
    return res.status(500).json({ message: "Internal error occurred!" });
  }
  user.name = body.name;
  user.mobileNum = body.mobileNumber;
  user.email = body.email;
  user.city = body.city;
  user.petParent = body.petParent;
  const passwordCompare = await bcrypt.compare(
    body.currentPassword,
    user.password
  );
  if (!passwordCompare) {
    return res.status(409).json({
      message: "Wrong password entered : Cannot edit account details!",
    });
  }
  if (body.newPassword && body.newPassword.length > 0) {
    const hashedPassword = bcrypt.hashSync(body.newPassword, 10);
    user.password = hashedPassword;
  }
  try {
    await user.save();
  } catch (err) {
    return res.status(500).json({ message: "Internal error occurred!" });
  }
  const updatedDoc = { ...user._doc, type: "user" };
  return res.status(200).json(updatedDoc);
});

router.post("/updateimage", verify, async (req, res) => {
  console.log("update image");
  const { image } = req.body;
  let user = null;
  try {
    user = await Users.findById(req._id).exec();
  } catch (err) {
    return res.status(500).json({ message: "Internal error occurred!" });
  }
  user.image = image;
  try {
    await user.save();
  } catch (err) {
    return res.status(500).json({ message: "Internal error occurred!" });
  }
  return res.status(200).json({ message: "Image updated successfully!" });
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

router.get("/logout", (req, res) => {
  res.clearCookie("petlevert");
  req._id = null;
  return res.status(200).json({ message: "Logged out!!" });
});

module.exports = router;
