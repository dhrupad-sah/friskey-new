require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const mongoose = require("mongoose");
const cookieParser = require("cookie-parser");
const userRouter = require("./routes/users");
const providerRouter = require("./routes/providers");
const searchRouter = require("./routes/search");
const verify = require("./middleware/auth");
const Providers = require("./models/provider");
const Users = require("./models/user");
mongoose
    .connect(process.env.MONGO_URL)
    .then(() => console.log("DB connection successfull"))
    .catch((err) => {
        console.log(err);
    });

const app = express();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json());

app.use(
    cors({
        origin: [
            "http://localhost:3000",
            "https://golden-zabaione-725504.netlify.app",
            "*",
        ],
        methods: ["POST", "GET", "HEAD", "PUT", "DELETE"],
        credentials: true,
    })
);

app.use(cookieParser());

app.get("/", (req, res) => {
    res.status(200).send("API working");
});
app.get("/check", verify, async (req, res) => {
    const id = req._id;
    console.log(req._type);
    if (req._type === "provider") {
        var provider = null;
        provider = await Providers.findById(req._id).exec();
        if (!provider) {
            return res.status(404).json({
                message: "User Not Found",
            });
        }
        provider.type = 'provider';
        return res.status(200).json(provider);
    }
    if (req._type === "user") {
        let user = null;
        user = await Users.findById(req._id).exec();
        if (!user) {
            return res.status(404).json({
                message: "User Not Found",
            });
        }
        user.type = 'user';
        return res.status(200).json(user);
    }
});
app.use("/users", userRouter);
app.use("/providers", providerRouter);
app.use("/search", searchRouter);

app.listen(5050 || process.env.PORT, () => {
    console.log("Server running on PORT 5050");
});
