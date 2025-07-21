import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import axios from "axios";
import {
	Container,
	Row,
	Col,
	Card,
	Button,
	Spinner,
	Badge,
	Alert,
	Form,
} from "react-bootstrap";
import {
	ArrowLeft,
	Edit,
	Trash2,
	Download,
	Tag,
	Folder,
	Calendar,
	FileText,
	AlertTriangle,
	Brain,
	Zap,
	Save,
	XCircle,
} from "lucide-react";
import toast from "react-hot-toast";

const NoteView = () => {
	const { id } = useParams();
	const navigate = useNavigate();
	const [note, setNote] = useState(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");
	const [deleteLoading, setDeleteLoading] = useState(false);
	const [isEditing, setIsEditing] = useState(false);
	const [editedNote, setEditedNote] = useState(null);
	const [updateLoading, setUpdateLoading] = useState(false);
	const [newTag, setNewTag] = useState("");

	useEffect(() => {
		fetchNote();
	}, [id]);

	const fetchNote = async () => {
		try {
			setLoading(true);
			const response = await axios.get(`/content/notes/${id}`, {
				headers: {
					Authorization: `Bearer ${localStorage.getItem("token")}`,
				},
			});
			setNote(response.data);
			setEditedNote(response.data);
			setError("");
		} catch (err) {
			console.error("Error fetching note:", err);
			setError(
				"Failed to fetch note. It might not exist or you may not have permission to view it."
			);
			toast.error("Failed to fetch note.");
		} finally {
			setLoading(false);
		}
	};

	const handleDelete = async () => {
		if (window.confirm("Are you sure you want to delete this note?")) {
			try {
				setDeleteLoading(true);
				await axios.delete(`/content/notes/${id}`, {
					headers: {
						Authorization: `Bearer ${localStorage.getItem("token")}`,
					},
				});
				toast.success("Note deleted successfully!");
				navigate("/notes");
			} catch (error) {
				console.error("Delete note error:", error);
				toast.error("Failed to delete note");
				setDeleteLoading(false);
			}
		}
	};

	const handleUpdate = async () => {
		if (!editedNote.title.trim() || !editedNote.content.trim()) {
			toast.error("Title and content are required");
			return;
		}
		try {
			setUpdateLoading(true);
			const response = await axios.put(`/content/notes/${id}`, editedNote, {
				headers: {
					Authorization: `Bearer ${localStorage.getItem("token")}`,
				},
			});
			setNote(response.data.note);
			setEditedNote(response.data.note);
			setIsEditing(false);
			toast.success("Note updated successfully!");
		} catch (err) {
			console.error("Update note error:", err);
			toast.error("Failed to update note.");
		} finally {
			setUpdateLoading(false);
		}
	};

	const handleDownload = async () => {
		if (!note?.fileId) return;
		try {
			const response = await axios({
				url: `/content/notes/file/${note.fileId}`,
				method: "GET",
				responseType: "blob",
				headers: {
					Authorization: `Bearer ${localStorage.getItem("token")}`,
				},
			});
			const url = window.URL.createObjectURL(new Blob([response.data]));
			const link = document.createElement("a");
			link.href = url;
			link.setAttribute("download", note.fileName);
			document.body.appendChild(link);
			link.click();
			link.remove();
			toast.success("File download started.");
		} catch (error) {
			console.error("Download error:", error);
			toast.error("Failed to download file.");
		}
	};

	const addTag = () => {
		if (newTag.trim() && !editedNote.tags.includes(newTag.trim())) {
			setEditedNote((prev) => ({
				...prev,
				tags: [...prev.tags, newTag.trim()],
			}));
			setNewTag("");
		}
	};

	const removeTag = (tagIndex) => {
		setEditedNote((prev) => ({
			...prev,
			tags: prev.tags.filter((_, index) => index !== tagIndex),
		}));
	};

	const formatDate = (dateString) => {
		return new Date(dateString).toLocaleDateString("en-US", {
			year: "numeric",
			month: "long",
			day: "numeric",
			hour: "2-digit",
			minute: "2-digit",
		});
	};

	const renderNoteContent = (content) => {
		if (!content) return null;
		const lines = content.split(/\r?\n/);
		return lines.map((line, idx) => {
			const trimmed = line.trim();
			// If the whole line is wrapped in **...**
			if (/^\*\*.*\*\*$/.test(trimmed)) {
				return (
					<div
						key={idx}
						style={{
							fontWeight: "bold",
							color: "#764ba2",
							background: "#f3eaff",
							padding: "0.5em 1em",
							borderRadius: "8px",
							margin: "0.5em 0",
						}}
					>
						{trimmed.replace(/^\*\*/, "").replace(/\*\*$/, "")}
					</div>
				);
			}
			// Otherwise, replace all **text** with <strong>text</strong>
			const parts = [];
			let lastIndex = 0;
			const regex = /\*\*(.+?)\*\*/g;
			let match;
			while ((match = regex.exec(line)) !== null) {
				if (match.index > lastIndex) {
					parts.push(line.slice(lastIndex, match.index));
				}
				parts.push(
					<strong key={idx + "-b-" + match.index} style={{ color: "#764ba2" }}>
						{match[1]}
					</strong>
				);
				lastIndex = match.index + match[0].length;
			}
			if (lastIndex < line.length) {
				parts.push(line.slice(lastIndex));
			}
			return (
				<div key={idx} style={{ whiteSpace: "pre-wrap" }}>
					{parts.length ? parts : line}
				</div>
			);
		});
	};

	if (loading) {
		return (
			<Container className="py-5 text-center">
				<Spinner animation="border" variant="primary" />
				<p className="text-muted mt-2">Loading note...</p>
			</Container>
		);
	}

	if (error) {
		return (
			<Container className="py-5">
				<Alert variant="danger">
					<AlertTriangle className="me-2" />
					{error}
				</Alert>
				<Button variant="secondary" onClick={() => navigate("/notes")}>
					<ArrowLeft className="me-2" />
					Back to Notes
				</Button>
			</Container>
		);
	}

	if (!note) {
		return null;
	}

	return (
		<Container fluid className="py-4">
			<Row className="mb-4">
				<Col>
					<Button
						variant="outline-secondary"
						onClick={() =>
							isEditing ? setIsEditing(false) : navigate("/notes")
						}
						disabled={updateLoading}
						className="d-flex align-items-center"
					>
						<ArrowLeft size={16} className="me-2" />
						<span>{isEditing ? "Cancel Edit" : "Back to All Notes"}</span>
					</Button>
				</Col>
			</Row>

			<Row>
				{/* Main Content */}
				<Col lg={8}>
					<Card className="border-0 shadow-sm mb-4">
						<Card.Body className="p-4 p-md-5">
							{isEditing ? (
								<Form>
									<Form.Group className="mb-3">
										<Form.Label className="fw-bold">Title</Form.Label>
										<Form.Control
											type="text"
											value={editedNote.title}
											onChange={(e) =>
												setEditedNote({ ...editedNote, title: e.target.value })
											}
											placeholder="Enter note title"
											disabled={updateLoading}
										/>
									</Form.Group>
									<Form.Group className="mb-3">
										<Form.Label className="fw-bold">Content</Form.Label>
										<Form.Control
											as="textarea"
											rows={20}
											value={editedNote.content}
											onChange={(e) =>
												setEditedNote({
													...editedNote,
													content: e.target.value,
												})
											}
											placeholder="Enter your note content"
											disabled={updateLoading}
											style={{ lineHeight: "1.8", fontSize: "1.1rem" }}
										/>
									</Form.Group>
								</Form>
							) : (
								<>
									<h1 className="fw-bold mb-3">{note.title}</h1>
									<div
										className="text-muted mb-4"
										style={{ fontSize: "0.9rem" }}
									>
										Last updated: {formatDate(note.updatedAt)}
									</div>
									<div
										className="note-content"
										style={{
											fontFamily: "inherit",
											fontSize: "1.1rem",
											lineHeight: "1.8",
										}}
									>
										{renderNoteContent(note.content)}
									</div>
								</>
							)}
						</Card.Body>
					</Card>
				</Col>

				{/* Sidebar */}
				<Col lg={4}>
					{isEditing ? (
						<div className="position-sticky" style={{ top: "1.5rem" }}>
							<Card className="border-0 shadow-sm mb-4">
								<Card.Header className="bg-white border-0 py-3">
									<h5 className="fw-bold mb-0">Edit Details</h5>
								</Card.Header>
								<Card.Body>
									<Form.Group className="mb-3">
										<Form.Label className="fw-bold">Folder</Form.Label>
										<Form.Select
											value={editedNote.folder}
											onChange={(e) =>
												setEditedNote({ ...editedNote, folder: e.target.value })
											}
											disabled={updateLoading}
										>
											<option value="General">General</option>
											<option value="Study">Study</option>
											<option value="Work">Work</option>
											<option value="Personal">Personal</option>
										</Form.Select>
									</Form.Group>

									<Form.Group className="mb-3">
										<Form.Label className="fw-bold">Tags</Form.Label>
										<div className="d-flex mb-2">
											<Form.Control
												type="text"
												value={newTag}
												onChange={(e) => setNewTag(e.target.value)}
												placeholder="Add a tag"
												onKeyPress={(e) =>
													e.key === "Enter" && (e.preventDefault(), addTag())
												}
												disabled={updateLoading}
											/>
											<Button
												variant="outline-primary"
												className="ms-2"
												onClick={addTag}
												disabled={updateLoading}
											>
												Add
											</Button>
										</div>
										<div>
											{editedNote.tags.map((tag, index) => (
												<Badge
													key={index}
													bg="primary"
													className="me-1 mb-1"
													style={{ cursor: "pointer" }}
													onClick={() => removeTag(index)}
												>
													{tag} ×
												</Badge>
											))}
										</div>
									</Form.Group>
								</Card.Body>
								<Card.Footer className="bg-white border-0 d-grid gap-2 p-3">
									<Button
										variant="primary"
										onClick={handleUpdate}
										disabled={updateLoading}
										className="d-flex align-items-center justify-content-center"
									>
										{updateLoading ? (
											<Spinner size="sm" animation="border" className="me-2" />
										) : (
											<Save size={16} className="me-2" />
										)}
										<span>{updateLoading ? "Saving..." : "Save Changes"}</span>
									</Button>
									<Button
										variant="secondary"
										onClick={() => {
											setIsEditing(false);
											setEditedNote(note);
										}}
										disabled={updateLoading}
										className="d-flex align-items-center justify-content-center"
									>
										<XCircle size={16} className="me-2" />
										<span>Cancel</span>
									</Button>
								</Card.Footer>
							</Card>
						</div>
					) : (
						<div className="position-sticky" style={{ top: "1.5rem" }}>
							<Card className="border-0 shadow-sm mb-4">
								<Card.Header className="bg-white border-0 py-3">
									<h5 className="fw-bold mb-0">Note Details</h5>
								</Card.Header>
								<Card.Body>
									<div className="mb-3">
										<strong className="d-flex align-items-center mb-2">
											<Folder size={16} className="me-2 text-primary" />
											Folder
										</strong>
										<Badge bg="primary">{note.folder}</Badge>
									</div>
									{note.tags && note.tags.length > 0 && (
										<div className="mb-3">
											<strong className="d-flex align-items-center mb-2">
												<Tag size={16} className="me-2 text-success" />
												Tags
											</strong>
											<div>
												{note.tags.map((tag, index) => (
													<Badge key={index} bg="success" className="me-1 mb-1">
														{tag}
													</Badge>
												))}
											</div>
										</div>
									)}
									<div className="mb-3">
										<strong className="d-flex align-items-center mb-2">
											<Calendar size={16} className="me-2 text-info" />
											Created
										</strong>
										<p className="text-muted mb-0">
											{formatDate(note.createdAt)}
										</p>
									</div>
									{note.fileName && (
										<div className="mb-3">
											<strong className="d-flex align-items-center mb-2">
												<FileText size={16} className="me-2 text-warning" />
												Original File
											</strong>
											<p className="text-muted mb-0">{note.fileName}</p>
										</div>
									)}
								</Card.Body>
							</Card>
							<Card className="border-0 shadow-sm mb-4">
								<Card.Header className="bg-white border-0 py-3">
									<h5 className="fw-bold mb-0">Actions</h5>
								</Card.Header>
								<Card.Body className="d-grid gap-2">
									<Button
										variant="outline-primary"
										onClick={() => setIsEditing(true)}
										className="d-flex align-items-center justify-content-center"
									>
										<Edit size={16} className="me-2" />
										<span>Edit Note</span>
									</Button>
									{note.fileId && (
										<Button
											variant="outline-success"
											onClick={handleDownload}
											className="d-flex align-items-center justify-content-center"
										>
											<Download size={16} className="me-2" />
											<span>Download File</span>
										</Button>
									)}
									<Button
										variant="outline-danger"
										onClick={handleDelete}
										disabled={deleteLoading}
										className="d-flex align-items-center justify-content-center"
									>
										{deleteLoading ? (
											<Spinner size="sm" animation="border" className="me-2" />
										) : (
											<Trash2 size={16} className="me-2" />
										)}
										<span>Delete Note</span>
									</Button>
								</Card.Body>
							</Card>
							<Card className="border-0 shadow-sm">
								<Card.Header className="bg-white border-0 py-3">
									<h5 className="fw-bold mb-0">Next Steps</h5>
								</Card.Header>
								<Card.Body className="d-grid gap-2">
									<Button
										variant="primary"
										onClick={() => navigate("/flashcards")}
										className="d-flex align-items-center justify-content-center"
									>
										<Brain size={16} className="me-2" />
										<span>Generate Flashcards</span>
									</Button>
									<Button
										variant="warning"
										onClick={() => navigate("/quiz")}
										className="d-flex align-items-center justify-content-center"
									>
										<Zap size={16} className="me-2" />
										<span>Create a Quiz</span>
									</Button>
								</Card.Body>
							</Card>
						</div>
					)}
				</Col>
			</Row>
		</Container>
	);
};

export default NoteView;
