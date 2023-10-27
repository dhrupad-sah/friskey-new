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
        res.status(403).send({ message: "user already exits!" });
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

router.post("/details", verify, (req, res) => {
    const provider_id = req._id;
    const body = req.body;
    try {
        Providers.findOne({ _id: provider_id })
            .then((data) => {
                const service = new Services({
                    serviceType: body.serviceType,
                    providersId: data._id,
                    price: body.currency + " " +  body.price,
                    note: body.note,
                    petType: [body.petType],
                });
                return service.save().then((doc) => {
                    data.services.push(doc._id);
                    data.servicesList.push(doc.serviceType);

                    data.save();
                });
            })
            .then((result) => {
                res.status(200).send(result);
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
            bcrypt.compare(
                body.password,
                docs.password,
                function (err, result) {
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
                }
            );
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

router.get("/all", verify, (req, res) => {
    Providers.find({}).then((docs) => {
        res.status(200).json(docs);
    });
});

module.exports = router;
