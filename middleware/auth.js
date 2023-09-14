const jwt = require("jsonwebtoken");
require("dotenv").config();
module.exports = (req, res, next) => {
    console.log("verifyJwt");
    let token = req.cookies.petlevert;
    // jwt verify function, validates the user's token
    jwt.verify(token, String(process.env.TOKEN_SECRET_KEY), (err, decoded) => {
        if (err) return res.status(401).json({ message: "please login again" }); //invalid token
        req._id = decoded.id;
        req._type = decoded.type;
        next();
    });
};
