import React, { useState, useEffect } from "react";
import {
	Container,
	Row,
	Col,
	Card,
	Button,
	Form,
	Modal,
	Badge,
	Spinner,
	Alert,
} from "react-bootstrap";
import { useDropzone } from "react-dropzone";
import axios from "axios";
import toast from "react-hot-toast";
import {
	Upload,
	FileText,
	Search,
	Filter,
	Plus,
	Eye,
	Edit,
	Trash2,
	Download,
	Tag,
	Grid,
	List,
	Folder,
	Calendar,
} from "lucide-react";
import NotesGrid from "./NotesGrid";
import NotesList from "./NotesList";

const Notes = () => {
	const [notes, setNotes] = useState([]);
	const [filteredNotes, setFilteredNotes] = useState([]);
	const [loading, setLoading] = useState(true);
	const [searchTerm, setSearchTerm] = useState("");
	const [selectedFolder, setSelectedFolder] = useState("all");
	const [viewMode, setViewMode] = useState("grid");
	const [showUploadModal, setShowUploadModal] = useState(false);
	const [showCreateModal, setShowCreateModal] = useState(false);
	const [showViewModal, setShowViewModal] = useState(false);
	const [showEditModal, setShowEditModal] = useState(false);
	const [selectedNote, setSelectedNote] = useState(null);
	const [uploading, setUploading] = useState(false);
	const [uploadProgress, setUploadProgress] = useState(0);
	const [folders, setFolders] = useState([]);
	const [newNote, setNewNote] = useState({
		title: "",
		content: "",
		folder: "General",
		tags: [],
	});
	const [editNote, setEditNote] = useState({
		title: "",
		content: "",
		folder: "",
		tags: [],
	});
	const [newTag, setNewTag] = useState("");
	const [createLoading, setCreateLoading] = useState(false);
	const [updateLoading, setUpdateLoading] = useState(false);
	const [deleteLoading, setDeleteLoading] = useState(null); // noteId or null

	useEffect(() => {
		fetchNotes();
	}, []);

	useEffect(() => {
		filterNotes();
	}, [notes, searchTerm, selectedFolder]);

	const fetchNotes = async () => {
		try {
			const response = await axios.get("/content/notes", {
				headers: {
					Authorization: `Bearer ${localStorage.getItem("token")}`,
				},
			});

			const notesData = response.data.notes || [];
			setNotes(notesData);

			// Extract unique folders
			const uniqueFolders = [...new Set(notesData.map((note) => note.folder))];
			setFolders(uniqueFolders);
		} catch (error) {
			console.error("Error fetching notes:", error);
			toast.error("Failed to fetch notes");
		} finally {
			setLoading(false);
		}
	};

	const filterNotes = () => {
		let filtered = notes;

		if (searchTerm) {
			filtered = filtered.filter(
				(note) =>
					note.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
					note.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
					(note.tags &&
						note.tags.some((tag) =>
							tag.toLowerCase().includes(searchTerm.toLowerCase())
						))
			);
		}

		if (selectedFolder !== "all") {
			filtered = filtered.filter((note) => note.folder === selectedFolder);
		}

		setFilteredNotes(filtered);
	};

	const onDrop = async (acceptedFiles) => {
		setUploading(true);
		setUploadProgress(0);

		try {
			console.log(acceptedFiles, "acceptedFiles");
			for (let i = 0; i < acceptedFiles.length; i++) {
				const file = acceptedFiles[i];
				const formData = new FormData();
				formData.append("file", file);
				formData.append("folder", "General");
				console.log(file, "file");
				await axios.post("/content/notes/upload", formData, {
					headers: {
						Authorization: `Bearer ${localStorage.getItem("token")}`,
					},
					onUploadProgress: (progressEvent) => {
						const progress = Math.round(
							((i + progressEvent.loaded / progressEvent.total) /
								acceptedFiles.length) *
								100
						);
						setUploadProgress(progress);
					},
				});
			}

			toast.success("Files uploaded successfully!");
			fetchNotes();
			setShowUploadModal(false);
		} catch (error) {
			console.error("Upload error:", error);
			toast.error("Failed to upload files");
		} finally {
			setUploading(false);
			setUploadProgress(0);
		}
	};

	const { getRootProps, getInputProps, isDragActive } = useDropzone({
		onDrop,
		accept: {
			"application/pdf": [".pdf"],
			"application/msword": [".doc"],
			"application/vnd.openxmlformats-officedocument.wordprocessingml.document":
				[".docx"],
			"text/plain": [".txt"],
			"image/*": [".jpg", ".jpeg", ".png", ".gif"],
		},
		maxSize: 10 * 1024 * 1024,
	});

	const createNote = async () => {
		try {
			if (!newNote.title.trim() || !newNote.content.trim()) {
				toast.error("Title and content are required");
				return;
			}
			setCreateLoading(true);
			await axios.post("/content/notes/manual", newNote, {
				headers: {
					Authorization: `Bearer ${localStorage.getItem("token")}`,
				},
			});
			toast.success("Note created successfully!");
			fetchNotes();
			setShowCreateModal(false);
			setNewNote({ title: "", content: "", folder: "General", tags: [] });
		} catch (error) {
			console.error("Create note error:", error);
			toast.error("Failed to create note");
		} finally {
			setCreateLoading(false);
		}
	};

	const updateNote = async () => {
		try {
			if (!editNote.title.trim() || !editNote.content.trim()) {
				toast.error("Title and content are required");
				return;
			}
			setUpdateLoading(true);
			await axios.put(`/content/notes/${selectedNote._id}`, editNote, {
				headers: {
					Authorization: `Bearer ${localStorage.getItem("token")}`,
				},
			});
			toast.success("Note updated successfully!");
			fetchNotes();
			setShowEditModal(false);
		} catch (error) {
			console.error("Update note error:", error);
			toast.error("Failed to update note");
		} finally {
			setUpdateLoading(false);
		}
	};

	const deleteNote = async (noteId) => {
		if (window.confirm("Are you sure you want to delete this note?")) {
			try {
				setDeleteLoading(noteId);
				await axios.delete(`/content/notes/${noteId}`, {
					headers: {
						Authorization: `Bearer ${localStorage.getItem("token")}`,
					},
				});
				toast.success("Note deleted successfully!");
				fetchNotes();
			} catch (error) {
				console.error("Delete note error:", error);
				toast.error("Failed to delete note");
			} finally {
				setDeleteLoading(null);
			}
		}
	};

	const viewNote = (note) => {
		setSelectedNote(note);
		setShowViewModal(true);
	};

	const editNoteHandler = (note) => {
		setSelectedNote(note);
		setEditNote({
			title: note.title,
			content: note.content,
			folder: note.folder,
			tags: note.tags || [],
		});
		setShowEditModal(true);
	};

	const addTag = (noteType = "new") => {
		if (newTag.trim()) {
			if (noteType === "new") {
				setNewNote((prev) => ({
					...prev,
					tags: [...prev.tags, newTag.trim()],
				}));
			} else {
				setEditNote((prev) => ({
					...prev,
					tags: [...prev.tags, newTag.trim()],
				}));
			}
			setNewTag("");
		}
	};

	const removeTag = (tagIndex, noteType = "new") => {
		if (noteType === "new") {
			setNewNote((prev) => ({
				...prev,
				tags: prev.tags.filter((_, index) => index !== tagIndex),
			}));
		} else {
			setEditNote((prev) => ({
				...prev,
				tags: prev.tags.filter((_, index) => index !== tagIndex),
			}));
		}
	};

	const formatDate = (dateString) => {
		return new Date(dateString).toLocaleDateString("en-US", {
			year: "numeric",
			month: "short",
			day: "numeric",
			hour: "2-digit",
			minute: "2-digit",
		});
	};

	if (loading) {
		return (
			<div className="d-flex justify-content-center align-items-center min-vh-100">
				<div className="spinner-border text-primary" role="status">
					<span className="visually-hidden">Loading...</span>
				</div>
			</div>
		);
	}

	return (
		<Container fluid className="py-4">
			<Row className="mb-4">
				<Col md={8}>
					<h1 className="fw-bold mb-1">My Notes</h1>
					<p className="text-muted mb-0">
						Manage your study materials and notes
					</p>
				</Col>
				<Col md={4} className="text-md-end">
					<Button
						variant="primary"
						className="me-2"
						onClick={() => setShowUploadModal(true)}
					>
						<div className="d-flex justify-content-between align-items-center">
							<Upload size={16} className="me-2" />
							<span>Upload Files</span>
						</div>
					</Button>
					<Button
						variant="outline-primary"
						onClick={() => setShowCreateModal(true)}
					>
						<div className="d-flex justify-content-between align-items-center">
							<Plus size={16} className="me-2" />
							<span>Create Note</span>
						</div>
					</Button>
				</Col>
			</Row>

			<Row className="mb-4">
				<Col md={4}>
					<div className="position-relative">
						<Form.Control
							type="text"
							placeholder="Search notes..."
							value={searchTerm}
							onChange={(e) => setSearchTerm(e.target.value)}
							className="ps-5"
						/>
						<Search
							size={20}
							className="position-absolute top-50 start-0 translate-middle-y ms-3 text-muted"
						/>
					</div>
				</Col>
				<Col md={3}>
					<Form.Select
						value={selectedFolder}
						onChange={(e) => setSelectedFolder(e.target.value)}
					>
						<option value="all">All Folders</option>
						{folders.map((folder) => (
							<option key={folder} value={folder}>
								{folder}
							</option>
						))}
					</Form.Select>
				</Col>
				<Col md={5} className="text-end">
					<div className="btn-group" role="group">
						<Button
							variant={viewMode === "grid" ? "primary" : "outline-primary"}
							size="sm"
							onClick={() => setViewMode("grid")}
						>
							<Grid size={16} />
						</Button>
						<Button
							variant={viewMode === "list" ? "primary" : "outline-primary"}
							size="sm"
							onClick={() => setViewMode("list")}
						>
							<List size={16} />
						</Button>
					</div>
				</Col>
			</Row>

			{filteredNotes.length > 0 ? (
				viewMode === "grid" ? (
					<NotesGrid
						filteredNotes={filteredNotes}
						viewNote={viewNote}
						editNoteHandler={editNoteHandler}
						deleteNote={deleteNote}
					/>
				) : (
					<NotesList
						filteredNotes={filteredNotes}
						viewNote={viewNote}
						editNoteHandler={editNoteHandler}
						deleteNote={deleteNote}
					/>
				)
			) : (
				<div className="text-center py-5">
					<FileText size={64} className="text-muted mb-3" />
					<h4 className="text-muted mb-2">No notes found</h4>
					<p className="text-muted mb-4">
						{searchTerm || selectedFolder !== "all"
							? "Try adjusting your search or filter criteria."
							: "Start by uploading your first document or creating a new note."}
					</p>
					{!searchTerm && selectedFolder === "all" && (
						<Button variant="primary" onClick={() => setShowUploadModal(true)}>
							<div className="d-flex justify-content-between align-items-center">
								<Upload size={16} className="me-2" />
								<span>Upload Your First Note</span>
							</div>
						</Button>
					)}
				</div>
			)}

			{/* Upload Modal */}
			<Modal
				show={showUploadModal}
				onHide={() => setShowUploadModal(false)}
				size="lg"
			>
				<Modal.Header closeButton>
					<Modal.Title>Upload Files</Modal.Title>
				</Modal.Header>
				<Modal.Body>
					<div
						{...getRootProps()}
						className={`dropzone text-center ${isDragActive ? "active" : ""}`}
					>
						<input {...getInputProps()} />
						<span>
							<Upload size={48} className="text-muted mb-3" />
						</span>
						<h5 className="mb-2">
							{isDragActive ? "Drop files here" : "Drag & drop files here"}
						</h5>
						<p className="text-muted mb-3">or click to select files</p>
						<p className="small text-muted">
							Supported formats: PDF, Word, Text, Images (max 10MB each)
						</p>
					</div>
					{uploading && (
						<div className="mt-3">
							<div className="d-flex justify-content-between align-items-center mb-2">
								<span>Uploading...</span>
								<span>{uploadProgress}%</span>
							</div>
							<div className="progress">
								<div
									className="progress-bar"
									role="progressbar"
									style={{ width: `${uploadProgress}%` }}
								></div>
							</div>
						</div>
					)}
				</Modal.Body>
			</Modal>

			{/* Create Note Modal */}
			<Modal
				show={showCreateModal}
				onHide={createLoading ? undefined : () => setShowCreateModal(false)}
				backdrop={createLoading ? "static" : true}
				size="lg"
			>
				<Modal.Header closeButton={!createLoading}>
					<Modal.Title>Create New Note</Modal.Title>
				</Modal.Header>
				<Modal.Body>
					<Form>
						<Form.Group className="mb-3">
							<Form.Label>Title</Form.Label>
							<Form.Control
								type="text"
								value={newNote.title}
								onChange={(e) =>
									setNewNote({ ...newNote, title: e.target.value })
								}
								placeholder="Enter note title"
							/>
						</Form.Group>
						<Form.Group className="mb-3">
							<Form.Label>Folder</Form.Label>
							<Form.Select
								value={newNote.folder}
								onChange={(e) =>
									setNewNote({ ...newNote, folder: e.target.value })
								}
							>
								<option value="General">General</option>
								<option value="Study">Study</option>
								<option value="Work">Work</option>
								<option value="Personal">Personal</option>
							</Form.Select>
						</Form.Group>
						<Form.Group className="mb-3">
							<Form.Label>Tags</Form.Label>
							<div className="d-flex mb-2">
								<Form.Control
									type="text"
									value={newTag}
									onChange={(e) => setNewTag(e.target.value)}
									placeholder="Add a tag"
									onKeyPress={(e) =>
										e.key === "Enter" && (e.preventDefault(), addTag("new"))
									}
								/>
								<Button
									variant="outline-primary"
									className="ms-2"
									onClick={() => addTag("new")}
								>
									Add
								</Button>
							</div>
							<div>
								{newNote.tags.map((tag, index) => (
									<Badge
										key={index}
										bg="primary"
										className="me-1 mb-1"
										style={{ cursor: "pointer" }}
										onClick={() => removeTag(index, "new")}
									>
										{tag} ×
									</Badge>
								))}
							</div>
						</Form.Group>
						<Form.Group className="mb-3">
							<Form.Label>Content</Form.Label>
							<Form.Control
								as="textarea"
								rows={10}
								value={newNote.content}
								onChange={(e) =>
									setNewNote({ ...newNote, content: e.target.value })
								}
								placeholder="Enter your note content"
							/>
						</Form.Group>
					</Form>
				</Modal.Body>
				<Modal.Footer>
					<Button
						variant="secondary"
						onClick={() => setShowCreateModal(false)}
						disabled={createLoading}
					>
						Cancel
					</Button>
					<Button
						variant="primary"
						onClick={createNote}
						disabled={createLoading}
					>
						{createLoading ? (
							<Spinner size="sm" animation="border" className="me-2" />
						) : null}
						Create Note
					</Button>
				</Modal.Footer>
			</Modal>

			{/* Edit Note Modal */}
			<Modal
				show={showEditModal}
				onHide={() => setShowEditModal(false)}
				size="lg"
			>
				<Modal.Header closeButton>
					<Modal.Title>Edit Note</Modal.Title>
				</Modal.Header>
				<Modal.Body>
					<Form>
						<Form.Group className="mb-3">
							<Form.Label>Title</Form.Label>
							<Form.Control
								type="text"
								value={editNote.title}
								onChange={(e) =>
									setEditNote({ ...editNote, title: e.target.value })
								}
								placeholder="Enter note title"
							/>
						</Form.Group>
						<Form.Group className="mb-3">
							<Form.Label>Folder</Form.Label>
							<Form.Select
								value={editNote.folder}
								onChange={(e) =>
									setEditNote({ ...editNote, folder: e.target.value })
								}
							>
								<option value="General">General</option>
								<option value="Study">Study</option>
								<option value="Work">Work</option>
								<option value="Personal">Personal</option>
							</Form.Select>
						</Form.Group>
						<Form.Group className="mb-3">
							<Form.Label>Tags</Form.Label>
							<div className="d-flex mb-2">
								<Form.Control
									type="text"
									value={newTag}
									onChange={(e) => setNewTag(e.target.value)}
									placeholder="Add a tag"
									onKeyPress={(e) =>
										e.key === "Enter" && (e.preventDefault(), addTag("edit"))
									}
								/>
								<Button
									variant="outline-primary"
									className="ms-2"
									onClick={() => addTag("edit")}
								>
									Add
								</Button>
							</div>
							<div>
								{editNote.tags.map((tag, index) => (
									<Badge
										key={index}
										bg="primary"
										className="me-1 mb-1"
										style={{ cursor: "pointer" }}
										onClick={() => removeTag(index, "edit")}
									>
										{tag} ×
									</Badge>
								))}
							</div>
						</Form.Group>
						<Form.Group className="mb-3">
							<Form.Label>Content</Form.Label>
							<Form.Control
								as="textarea"
								rows={10}
								value={editNote.content}
								onChange={(e) =>
									setEditNote({ ...editNote, content: e.target.value })
								}
								placeholder="Enter your note content"
							/>
						</Form.Group>
					</Form>
				</Modal.Body>
				<Modal.Footer>
					<Button variant="secondary" onClick={() => setShowEditModal(false)}>
						Cancel
					</Button>
					<Button variant="primary" onClick={updateNote}>
						{updateLoading ? (
							<Spinner size="sm" animation="border" className="me-2" />
						) : null}
						Update Note
					</Button>
				</Modal.Footer>
			</Modal>

			{/* View Note Modal */}
			<Modal
				show={showViewModal}
				onHide={() => setShowViewModal(false)}
				size="lg"
			>
				<Modal.Header closeButton>
					<Modal.Title>{selectedNote?.title}</Modal.Title>
				</Modal.Header>
				<Modal.Body>
					{selectedNote && (
						<>
							<div className="mb-3">
								<Badge bg="secondary" className="me-2">
									<div className="d-flex align-items-center">
										<Folder size={12} className="me-1" />
										<span>{selectedNote.folder}</span>
									</div>
								</Badge>
								<small className="text-muted">
									<div className="d-flex align-items-center">
										<Calendar size={12} className="me-1" />
										<span>Created: {formatDate(selectedNote.createdAt)}</span>
									</div>
								</small>
							</div>
							{selectedNote.tags && selectedNote.tags.length > 0 && (
								<div className="mb-3">
									{selectedNote.tags.map((tag, index) => (
										<Badge key={index} bg="light" text="dark" className="me-1">
											<div className="d-flex align-items-center">
												<Tag size={10} className="me-1" />
												<span>{tag}</span>
											</div>
										</Badge>
									))}
								</div>
							)}
							<div
								className="border rounded p-3"
								style={{ minHeight: "300px", backgroundColor: "#f8f9fa" }}
							>
								<pre style={{ whiteSpace: "pre-wrap", fontFamily: "inherit" }}>
									{selectedNote.content}
								</pre>
							</div>
						</>
					)}
				</Modal.Body>
				<Modal.Footer>
					<Button
						variant="outline-primary"
						onClick={() => {
							setShowViewModal(false);
							editNoteHandler(selectedNote);
						}}
					>
						<div className="d-flex justify-content-between align-items-center">
							<Edit size={16} className="me-2" />
							<span>Edit</span>
						</div>
					</Button>
					<Button variant="secondary" onClick={() => setShowViewModal(false)}>
						Close
					</Button>
				</Modal.Footer>
			</Modal>
		</Container>
	);
};

export default Notes;
