const express = require('express');
const mongoose = require('mongoose');
const multer = require('multer');
const GridFSBucket = require('mongodb').GridFSBucket;
const cors = require('cors');
const jwt = require('jsonwebtoken');
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');
const Tesseract = require('tesseract.js');
require('dotenv').config();

const app = express();
const PORT = process.env.NOTES_PORT || 3002;

app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/flashcard-app', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

let bucket;
mongoose.connection.once('open', () => {
  bucket = new GridFSBucket(mongoose.connection.db, { bucketName: 'uploads' });
});

const noteSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  content: { type: String, required: true },
  fileId: { type: mongoose.Schema.Types.ObjectId, ref: 'fs.files' },
  fileName: String,
  fileType: String,
  fileSize: Number,
  tags: [String],
  folder: { type: String, default: 'General' }
}, { timestamps: true });

noteSchema.index({ title: 'text', content: 'text' });

const Note = mongoose.model('Note', noteSchema);

const authMiddleware = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ message: 'No token, authorization denied' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    req.userId = decoded.userId;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Token is not valid' });
  }
};

const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
      'image/jpeg',
      'image/png',
      'image/gif'
    ];

    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type'), false);
    }
  }
});

const extractTextFromFile = async (buffer, mimetype, filename) => {
  try {
    switch (mimetype) {
      case 'application/pdf':
        const pdfData = await pdfParse(buffer);
        return pdfData.text;

      case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
        const docxResult = await mammoth.extractRawText({ buffer });
        return docxResult.value;

      case 'text/plain':
        return buffer.toString('utf-8');

      case 'image/jpeg':
      case 'image/png':
      case 'image/gif':
        const ocrResult = await Tesseract.recognize(buffer, 'eng');
        return ocrResult.data.text;

      default:
        throw new Error('Unsupported file type');
    }
  } catch (error) {
    console.error('Text extraction error:', error);
    throw new Error('Failed to extract text from file');
  }
};

app.post('/upload', authMiddleware, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const { folder = 'General' } = req.body;

    const uploadStream = bucket.openUploadStream(req.file.originalname, {
      metadata: {
        userId: req.userId,
        originalName: req.file.originalname,
        mimetype: req.file.mimetype,
        uploadDate: new Date()
      }
    });

    uploadStream.end(req.file.buffer);

    uploadStream.on('finish', async () => {
      try {
        const extractedText = await extractTextFromFile(
          req.file.buffer,
          req.file.mimetype,
          req.file.originalname
        );

        const note = new Note({
          userId: req.userId,
          title: req.file.originalname.replace(/\.[^/.]+$/, ''),
          content: extractedText,
          fileId: uploadStream.id,
          fileName: req.file.originalname,
          fileType: req.file.mimetype,
          fileSize: req.file.size,
          folder: folder,
          tags: []
        });

        await note.save();

        res.status(201).json({
          message: 'File uploaded and processed successfully',
          note: note
        });
      } catch (error) {
        console.error('Note creation error:', error);
        res.status(500).json({ message: 'Failed to process uploaded file' });
      }
    });

    uploadStream.on('error', (error) => {
      console.error('Upload error:', error);
      res.status(500).json({ message: 'Failed to upload file' });
    });

  } catch (error) {
    console.error('Upload handler error:', error);
    res.status(500).json({ message: 'Server error during file upload' });
  }
});

app.post('/manual', authMiddleware, async (req, res) => {
  try {
    const { title, content, folder = 'General', tags = [] } = req.body;

    if (!title || !content) {
      return res.status(400).json({ message: 'Title and content are required' });
    }

    const note = new Note({
      userId: req.userId,
      title,
      content,
      folder,
      tags
    });

    await note.save();

    res.status(201).json({
      message: 'Note created successfully',
      note: note
    });
  } catch (error) {
    console.error('Manual note creation error:', error);
    res.status(500).json({ message: 'Server error creating note' });
  }
});

app.get('/', authMiddleware, async (req, res) => {
  try {
    const { page = 1, limit = 20, search, folder } = req.query;

    const query = { userId: req.userId };

    if (search) {
      query.$text = { $search: search };
    }

    if (folder && folder !== 'all') {
      query.folder = folder;
    }

    const notes = await Note.find(query)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Note.countDocuments(query);

    res.json({
      notes,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error('Notes fetch error:', error);
    res.status(500).json({ message: 'Server error fetching notes' });
  }
});

app.get('/:id', authMiddleware, async (req, res) => {
  try {
    const note = await Note.findOne({ _id: req.params.id, userId: req.userId });

    if (!note) {
      return res.status(404).json({ message: 'Note not found' });
    }

    res.json(note);
  } catch (error) {
    console.error('Note fetch error:', error);
    res.status(500).json({ message: 'Server error fetching note' });
  }
});

app.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { title, content, folder, tags } = req.body;

    const note = await Note.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      { title, content, folder, tags },
      { new: true }
    );

    if (!note) {
      return res.status(404).json({ message: 'Note not found' });
    }

    res.json({
      message: 'Note updated successfully',
      note: note
    });
  } catch (error) {
    console.error('Note update error:', error);
    res.status(500).json({ message: 'Server error updating note' });
  }
});

app.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const note = await Note.findOne({ _id: req.params.id, userId: req.userId });

    if (!note) {
      return res.status(404).json({ message: 'Note not found' });
    }

    if (note.fileId) {
      try {
        await bucket.delete(note.fileId);
      } catch (fileError) {
        console.error('File deletion error:', fileError);
      }
    }

    await Note.findByIdAndDelete(req.params.id);

    res.json({ message: 'Note deleted successfully' });
  } catch (error) {
    console.error('Note deletion error:', error);
    res.status(500).json({ message: 'Server error deleting note' });
  }
});

app.get('/file/:fileId', authMiddleware, async (req, res) => {
  try {
    const downloadStream = bucket.openDownloadStream(
      new mongoose.Types.ObjectId(req.params.fileId)
    );

    downloadStream.on('error', (error) => {
      console.error('File download error:', error);
      res.status(404).json({ message: 'File not found' });
    });

    downloadStream.pipe(res);
  } catch (error) {
    console.error('File download handler error:', error);
    res.status(500).json({ message: 'Server error downloading file' });
  }
});

app.listen(PORT, () => {
  console.log(`Notes service running on port ${PORT}`);
});