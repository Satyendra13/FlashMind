const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
	{
		firstName: { type: String, required: true, trim: true },
		lastName: { type: String, required: true, trim: true },
		email: { type: String, required: true, unique: true, lowercase: true },
		passwordHash: { type: String, required: true },
		emailVerified: { type: Boolean, default: false },
		emailVerificationToken: String,
		passwordResetToken: String,
		passwordResetExpires: Date,
		lastLogin: Date,
		isActive: { type: Boolean, default: true },
		role: { type: String, enum: ["user", "admin"], default: "user" },
	},
	{ timestamps: true }
);

userSchema.pre("save", async function (next) {
	if (!this.isModified("passwordHash")) return next();
	this.passwordHash = await bcrypt.hash(this.passwordHash, 12);
	next();
});

userSchema.methods.comparePassword = async function (candidatePassword) {
	return await bcrypt.compare(candidatePassword, this.passwordHash);
};

const User = mongoose.model("User", userSchema);

module.exports = User;
