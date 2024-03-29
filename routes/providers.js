const express = require("express");
const router = new express.Router();
const bcrypt = require("bcrypt");
const bodyParser = require("body-parser");
const jwt = require("jsonwebtoken");
const verify = require("../middleware/auth");
const { default: jwtDecode } = require("jwt-decode");
const nodemailer = require("nodemailer");
const Users = require("../models/user");
const Providers = require("../models/provider");
const Services = require("../models/services");

let config = {
  service: "gmail",
  auth: {
    user: "hellopetlevert@gmail.com",
    pass: "qdgzonbtfthnkavy",
  },
};
let transporter = nodemailer.createTransport(config);
const saltRounds = 10;

router.post("/register", async (req, res) => {
  const body = req.body;

  const email = body.email;

  const userAlready = await Providers.findOne({ email: email });

  if (userAlready) {
    res.status(403).send({ message: "Provider already exits!" });
  } else {
    bcrypt.hash(body.password, saltRounds, function (err, hash) {
      const provider = new Providers({
        name: body.name,
        mobileNum: body.mobileNum,
        email: body.email,
        password: hash,
        gender: body.gender,
        country: body.country,
        state: body.state,
        city: body.city,
        petParent: body.petParent,
        pincode: body.pincode,
        location: {
          type: "Point",
          coordinates: [body.longitude, body.latitude],
        },
      });
      provider.save().then((docs) => {
        res.status(200).send("registered Sucessfully");
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

router.post("/details", verify, async (req, res) => {
  const provider_id = req._id;
  const body = req.body;
  try {
    const provider = await Providers.findOne({ _id: provider_id });
    const existingService = await Services.findOne({
      providersId: provider._id,
      serviceType: body.serviceType,
      petType: body.petType,
    });

    if (existingService) {
      return res.status(400).json({ message: 'Service with the same type and pet type already exists for this provider' });
    }

    const service = new Services({
      serviceType: body.serviceType,
      providersId: provider._id,
      price: body.price,
      priceTicker: body.currency,
      note: body.note,
      petType: body.petType,
    });

    const newService = await service.save();

    provider.services.push(newService._id);
    provider.servicesList.push(newService.serviceType);

    const updatedProvider = await provider.save();

    return res.status(200).send(newService);
  } catch (err) {
    res.status(400).send(err);
  }
});

router.post("/updateService", async (req, res) => {
  const { id, serviceType, petType, price, priceTicker } = req.body;

  try {
    const updatedService = await Services.findByIdAndUpdate(
      id,
      {
        serviceType,
        petType,
        price,
        priceTicker
      },
      { new: true }
    );
    console.log(updatedService);
    if (!updatedService) {
      return res.status(404).json({ error: "Service not found" });
    }

    console.log(updatedService);
    res.send(updatedService);
  } catch (error) {
    console.error(error);

    if (error.name === 'CastError') {
      return res.status(400).json({ error: "Invalid ID format" });
    }

    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.delete('/service/:id', async (req, res) => {
  const { id } = req.params;

  try {

    const result = await Services.deleteOne({ id });
    if (result.deletedCount === 1) {
      res.status(200).json({ message: `Service with ID ${id} has been deleted.` });
    } else {
      res.status(404).json({ message: `Service with ID ${id} not found.` });
    }
  } catch (error) {
    console.error('Error deleting service:', error.message);
    res.status(500).json({ error: 'Internal Server Error' });
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
              id: docs._id.toString(),
              type: "provider",
            },
            process.env.TOKEN_SECRET_KEY,
            { expiresIn: "5h" }
          );

          res.cookie("petlevert", token, {
            httpOnly: true,
            sameSite: "none",
            secure: true,
            type: "provider",
            maxAge: 24 * 60 * 60 * 1000,
          });
          const updatedDoc = { ...docs._doc, type: "provider" };
          res.status(200).send(updatedDoc);
        } else {
          res.send("Password or mobileNum Incorrect");
        }
      });
    })
    .catch((err) => {
      res.status(400).send("Provider not registered");
    });
});
router.post("/updateinfo", verify, async (req, res) => {
  console.log("update account");

  const body = req.body;
  console.log(req._id, req.body);
  let user = null;
  try {
    user = await Providers.findById(req._id).exec();
  } catch (err) {
    return res.status(500).json({ message: "Internal error occurred!" });
  }
  user.name = body.name;
  user.mobileNum = body.mobileNumber;
  user.email = body.email;
  user.city = body.city;
  user.state = body.state;
  user.country = body.country;
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
  const updatedDoc = { ...user._doc, type: "provider" };
  return res.status(200).json(updatedDoc);
});

router.post("/updateimage", verify, async (req, res) => {
  console.log("update image");
  const { image } = req.body;
  let user = null;
  try {
    user = await Providers.findById(req._id).exec();
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

router.get("/serviceDashboard", verify, async (req, res) => {
  const services = await Services.find({ providersId: req._id });

  if (services) {
    res.status(200).send(services);
  }
  else {
    res.status(404).send("No SERVICES found!!")
  }
})
router.post("/contact", verify, (req, res) => {
  console.log(req.body);
  let message = {
    from: 'hellopetlevert@gmail.com',
    to: 'saipranithswargam@gmail.com',
    subject: 'Regarding Pet Service Requirement',
    html: '<p>Hello Testing</p>',
  };
  transporter.sendMail(message, (error, info) => {
    if (error) {
      console.error(error);
      return res.status(500).json({ message: 'Internal Server Error', error: error.message });
    }
    console.log('Email sent: ' + info.response);
    res.status(200).json({ message: 'Email sent successfully', info: info.response });
  });
});
module.exports = router;
