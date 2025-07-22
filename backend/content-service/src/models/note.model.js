const mongoose = require("mongoose");

const noteSchema = new mongoose.Schema(
	{
		userId: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "User",
			required: true,
		},
		title: { type: String, required: true },
		primaryLanguage: { type: String, required: true },
		englishNoteContent: { type: String, required: true },
		hindiNoteContent: { type: String, required: true },
		fileId: { type: mongoose.Schema.Types.ObjectId, ref: "fs.files" },
		fileName: String,
		fileType: String,
		fileSize: Number,
		tags: [String],
		folder: { type: String, default: "General" },
	},
	{ timestamps: true }
);

noteSchema.index({ title: "text", englishNoteContent: "text", hindiNoteContent: "text" });

const Note = mongoose.model("Note", noteSchema);

module.exports = Note;
