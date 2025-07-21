const jwt = require("jsonwebtoken");
const config = require("../config");
const logger = require("../utils/logger");
module.exports = (req, res, next) => {
    try {
        const token = req.header("Authorization")?.replace("Bearer ", "");
        if (!token) {
            logger.warn("Authorization denied: No token provided.");
            return res
                .status(401)
                .json({ message: "No token, authorization denied" });
        }
        const decoded = jwt.verify(token, config.jwtSecret);
        console.log(decoded)

        if (decoded.role !== "admin") {
            return res.status(403).json({ message: "Admin access required" });
        }

        req.user = decoded;
        logger.info(`Authenticated admin: ${req.userId}`);
        next();
    } catch (error) {
        logger.error({ message: "Token validation failed", error: error.message });
        res.status(401).json({ message: "Token is not valid" });
    }
}; 