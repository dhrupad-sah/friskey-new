const express = require("express");
const jwtDecode = require("jwt-decode");
const router = new express.Router();
const verify = require("../middleware/auth");
const mongoose = require("mongoose");

const Users = require("../models/user");
const Providers = require("../models/provider");


module.exports = router;
