const mongoose = require("mongoose");
const multer = require("multer");
const { GridFSBucket } = require("mongodb");
const pdfParse = require("pdf-parse");
const mammoth = require("mammoth");
const Note = require("../models/note.model");
const logger = require("../utils/logger");
const path = require("path");
const fs = require("fs");
const aiClient = require("../services/ai.client");

let bucket;
mongoose.connection.once("open", () => {
	bucket = new GridFSBucket(mongoose.connection.db, { bucketName: "uploads" });
	logger.info("GridFS Bucket initialized.");
});

const storage = multer.diskStorage({
	// destination: function (req, file, cb) {
	// 	cb(null, path.join(__dirname, "../../uploads"));
	// },
	filename: function (req, file, cb) {
		const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
		cb(null, uniqueSuffix + '-' + file.originalname);
	}
});
const upload = multer({
	storage: storage,
	limits: { fileSize: 100 * 1024 * 1024 }, // 100MB limit
	fileFilter: (req, file, cb) => {
		console.log(file, "file")
		const allowedTypes = [
			"application/pdf",
			"application/msword",
			"application/vnd.openxmlformats-officedocument.wordprocessingml.document",
			"text/plain",
			"image/jpeg",
			"image/png",
			"image/gif",
		];
		if (allowedTypes.includes(file.mimetype)) {
			cb(null, true);
		} else {
			cb(new Error("Invalid file type"), false);
		}
	},
}).single("file");

const extractTextFromFile = async (buffer, mimetype) => {
	logger.info(`Extracting text from file of type: ${mimetype}`);
	try {
		if (mimetype.startsWith("image/") || mimetype === "application/pdf") {
			logger.info(`Sending image/pdf to AI service for text extraction.`);
			const base64Image = buffer.toString("base64");
			const extractedText = await aiClient.generateNoteFromImage(base64Image, mimetype);
			if (!extractedText) {
				logger.warn("AI-based text extraction returned empty. Falling back to simple extraction for PDF.");
				return ""; // No fallback for images
			}
			return extractedText;
		}

		switch (mimetype) {
			case "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
				const docxResult = await mammoth.extractRawText({ buffer });
				return docxResult.value;
			case "text/plain":
				return buffer.toString("utf-8");
			default:
				throw new Error("Unsupported file type for text extraction");
		}
	} catch (error) {
		logger.error({ message: "Text extraction failed", error: error.message });
		throw new Error("Failed to extract text from file");
	}
};

const uploadNote = async (req, res) => {
	logger.info(`File upload process started for user: ${req.userId}`);
	if (!req.file) {
		logger.warn(
			`File upload failed for user: ${req.userId}. No file provided.`
		);
		return res.status(400).json({ message: "No file uploaded" });
	}

	const { folder = "General" } = req.body;
	const filePath = req.file.path;
	const fileBuffer = fs.readFileSync(filePath);
	const uploadStream = bucket.openUploadStream(req.file.originalname, {
		metadata: {
			userId: req.userId,
			originalName: req.file.originalname,
			mimetype: req.file.mimetype,
		},
	});
	uploadStream.end(fileBuffer);

	uploadStream.on("finish", async () => {
		logger.info(`File stored in GridFS with id: ${uploadStream.id}`);
		try {
			const extractedText = await extractTextFromFile(
				fileBuffer,
				req.file.mimetype
			);
			if (!extractedText) {
				logger.warn("No text extracted from file.");
				return res.status(500).json({ message: "No text extracted from file." });
			}
			const note = new Note({
				userId: req.userId,
				title: req.file.originalname.replace(/\.[^/.]+$/, ""),
				primaryLanguage: extractedText.primaryLanguage,
				englishNoteContent: extractedText.englishNoteContent,
				hindiNoteContent: extractedText.hindiNoteContent,
				fileId: uploadStream.id,
				fileName: req.file.originalname,
				fileType: req.file.mimetype,
				fileSize: req.file.size,
				folder: folder,
				tags: [],
			});
			await note.save();
			logger.info(
				`Note created from file for user: ${req.userId}, noteId: ${note._id}`
			);
			// Delete the file from disk after processing
			fs.unlink(filePath, (err) => {
				if (err) logger.error({ message: "Failed to delete temp file", error: err.message });
			});
			res
				.status(201)
				.json({ message: "File uploaded and processed successfully", note });
		} catch (error) {
			logger.error({
				message: `Note creation from file failed for user: ${req.userId}`,
				error: error.message,
			});
			// Delete the file from disk if error occurs
			fs.unlink(filePath, (err) => {
				if (err) logger.error({ message: "Failed to delete temp file", error: err.message });
			});
			res.status(500).json({ message: "Failed to process uploaded file" });
		}
	});

	uploadStream.on("error", (error) => {
		logger.error({
			message: `GridFS upload stream error for user: ${req.userId}`,
			error: error.message,
		});
		// Delete the file from disk if error occurs
		fs.unlink(filePath, (err) => {
			if (err) logger.error({ message: "Failed to delete temp file", error: err.message });
		});
		res.status(500).json({ message: "Failed to upload file" });
	});
};

const createManualNote = async (req, res) => {
	try {
		const { title, content, folder = "General", tags = [] } = req.body;
		logger.info(`Creating manual note for user: ${req.userId}`);
		if (!title || !content) {
			logger.warn(
				`Manual note creation failed for user: ${req.userId}. Missing title or content.`
			);
			return res
				.status(400)
				.json({ message: "Title and content are required" });
		}
		const note = new Note({
			userId: req.userId,
			title: title.trim(),
			content: content.trim(),
			folder,
			tags,
		});
		await note.save();
		logger.info(
			`Manual note created successfully for user: ${req.userId}, noteId: ${note._id}`
		);
		res.status(201).json({ message: "Note created successfully", note });
	} catch (error) {
		logger.error({
			message: "Server error creating manual note",
			error: error.message,
		});
		res.status(500).json({ message: "Server error creating note" });
	}
};

const getAllNotes = async (req, res) => {
	try {
		const { page = 1, limit = 20, search, folder } = req.query;
		const query = { userId: req.userId };
		if (search) {
			query.$or = [
				{ title: { $regex: search, $options: "i" } },
				{ content: { $regex: search, $options: "i" } },
				{ tags: { $in: [new RegExp(search, "i")] } },
			];
		}
		if (folder && folder !== "all") {
			query.folder = folder;
		}
		logger.info(
			`Fetching notes for user: ${req.userId} with query: ${JSON.stringify(
				query
			)}`
		);
		const notes = await Note.find(query)
			.sort({ createdAt: -1 })
			.limit(limit * 1)
			.skip((page - 1) * limit);
		const total = await Note.countDocuments(query);
		logger.info(`Found ${notes.length} notes for user: ${req.userId}.`);
		res.json({
			notes,
			totalPages: Math.ceil(total / limit),
			currentPage: parseInt(page),
			total,
		});
	} catch (error) {
		logger.error({
			message: `Error fetching notes for user: ${req.userId}`,
			error: error.message,
		});
		res.status(500).json({ message: "Server error fetching notes" });
	}
};

const getNoteById = async (req, res) => {
	try {
		logger.info(
			`Fetching note with id: ${req.params.id} for user: ${req.userId}`
		);
		const note = await Note.findOne({ _id: req.params.id, userId: req.userId });
		if (!note) {
			logger.warn(
				`Note not found with id: ${req.params.id} for user: ${req.userId}`
			);
			return res.status(404).json({ message: "Note not found" });
		}
		logger.info(`Successfully fetched note with id: ${req.params.id}`);
		res.json(note);
	} catch (error) {
		logger.error({
			message: `Error fetching note with id: ${req.params.id}`,
			error: error.message,
		});
		res.status(500).json({ message: "Server error fetching note" });
	}
};

const updateNote = async (req, res) => {
	try {
		const { title, content, folder, tags } = req.body;
		logger.info(
			`Updating note with id: ${req.params.id} for user: ${req.userId}`
		);
		if (!title || !content) {
			logger.warn(
				`Note update failed for user: ${req.userId}. Missing title or content.`
			);
			return res
				.status(400)
				.json({ message: "Title and content are required" });
		}
		const note = await Note.findOneAndUpdate(
			{ _id: req.params.id, userId: req.userId },
			{
				title: title.trim(),
				content: content.trim(),
				folder,
				tags: tags || [],
			},
			{ new: true }
		);
		if (!note) {
			logger.warn(
				`Note not found for update with id: ${req.params.id} for user: ${req.userId}`
			);
			return res.status(404).json({ message: "Note not found" });
		}
		logger.info(`Note updated successfully with id: ${req.params.id}`);
		res.json({ message: "Note updated successfully", note });
	} catch (error) {
		logger.error({
			message: `Error updating note with id: ${req.params.id}`,
			error: error.message,
		});
		res.status(500).json({ message: "Server error updating note" });
	}
};

const deleteNote = async (req, res) => {
	try {
		logger.info(
			`Deleting note with id: ${req.params.id} for user: ${req.userId}`
		);
		const note = await Note.findOne({ _id: req.params.id, userId: req.userId });
		if (!note) {
			logger.warn(
				`Note not found for deletion with id: ${req.params.id} for user: ${req.userId}`
			);
			return res.status(404).json({ message: "Note not found" });
		}
		if (note.fileId) {
			try {
				await bucket.delete(note.fileId);
				logger.info(
					`Associated file deleted from GridFS with id: ${note.fileId}`
				);
			} catch (fileError) {
				logger.error({
					message: "GridFS file deletion error",
					error: fileError.message,
				});
			}
		}
		await Note.findByIdAndDelete(req.params.id);
		logger.info(`Note deleted successfully with id: ${req.params.id}`);
		res.json({ message: "Note deleted successfully" });
	} catch (error) {
		logger.error({
			message: `Error deleting note with id: ${req.params.id}`,
			error: error.message,
		});
		res.status(500).json({ message: "Server error deleting note" });
	}
};

const downloadFile = async (req, res) => {
	try {
		const fileId = new mongoose.Types.ObjectId(req.params.fileId);
		logger.info(`Request to download file with id: ${fileId}`);
		const downloadStream = bucket.openDownloadStream(fileId);
		downloadStream.on("error", (error) => {
			logger.error({
				message: `File download error, fileId: ${fileId}`,
				error: error.message,
			});
			res.status(404).json({ message: "File not found" });
		});
		downloadStream.pipe(res);
	} catch (error) {
		logger.error({
			message: `File download handler error`,
			error: error.message,
		});
		res.status(500).json({ message: "Server error downloading file" });
	}
};

module.exports = {
	upload,
	uploadNote,
	createManualNote,
	getAllNotes,
	getNoteById,
	updateNote,
	deleteNote,
	downloadFile,
};
