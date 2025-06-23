const express = require("express");
const { authProxy, contentProxy } = require("../middlewares/proxies");

const router = express.Router();

router.use("/auth", authProxy);
router.use("/content", contentProxy);

module.exports = router;
