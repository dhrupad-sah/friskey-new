require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const mongoose = require("mongoose");
const cookieParser = require("cookie-parser");
const userRouter = require("./routes/users");
const providerRouter = require("./routes/providers");
const searchRouter = require("./routes/search");

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

app.get("/test", (req, res) => {
    res.send([]);
});

app.use("/users", userRouter);
app.use("/providers", providerRouter);
app.use("/search", searchRouter);

app.listen(5050 || process.env.PORT, () => {
    console.log("Server running on PORT 5050");
});
