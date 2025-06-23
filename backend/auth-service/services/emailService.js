const nodemailer = require("nodemailer");
const logger = require("../config/logger");

const transporter = nodemailer.createTransport({
	service: "gmail",
	auth: {
		user: process.env.EMAIL_USER,
		pass: process.env.EMAIL_APP_PASSWORD,
	},
});

const sendVerificationEmail = async (email, token) => {
	const verificationUrl = `${process.env.FRONTEND_URL}/verify-email/${token}`;
	const mailOptions = {
		from: process.env.FROM_EMAIL || "noreply@flashmind.com",
		to: email,
		subject: "Verify Your Email - FlashMind",
		html: `
      <h2>Welcome to FlashMind!</h2>
      <p>Please click the link below to verify your email address:</p>
      <a href="${verificationUrl}" style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Verify Email</a>
      <p>If you didn't create an account, please ignore this email.</p>
    `,
	};

	try {
		await transporter.sendMail(mailOptions);
		logger.info(`Verification email sent to ${email}`);
	} catch (error) {
		logger.error(`Failed to send verification email to ${email}`, {
			error: error.message,
		});
	}
};

const sendPasswordResetEmail = async (email, token) => {
	const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${token}`;
	const mailOptions = {
		from: process.env.FROM_EMAIL || "noreply@flashmind.com",
		to: email,
		subject: "Password Reset - FlashMind",
		html: `
            <h2>Password Reset Request</h2>
            <p>You requested a password reset. Click the link below to reset your password:</p>
            <a href="${resetUrl}" style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Reset Password</a>
            <p>This link will expire in 1 hour.</p>
            <p>If you didn't request this, please ignore this email.</p>
        `,
	};

	try {
		await transporter.sendMail(mailOptions);
		logger.info(`Password reset email sent to ${email}`);
	} catch (error) {
		logger.error(`Failed to send password reset email to ${email}`, {
			error: error.message,
		});
	}
};

module.exports = {
	sendVerificationEmail,
	sendPasswordResetEmail,
};
