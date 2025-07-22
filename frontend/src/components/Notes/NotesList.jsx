import { Calendar, Edit, Eye, Tag, Trash2 } from "lucide-react";
import { Badge, Button } from "react-bootstrap";
const formatDate = (dateString) => {
	return new Date(dateString).toLocaleDateString("en-US", {
		year: "numeric",
		month: "short",
		day: "numeric",
		hour: "2-digit",
		minute: "2-digit",
	});
};
const NotesList = ({
	filteredNotes,
	viewNote,
	editNoteHandler,
	deleteNote,
}) => (
	<div className="list-group">
		{filteredNotes.map((note) => (
			<div
				key={note._id}
				className="list-group-item border-0 shadow-sm mb-3 rounded"
			>
				<div className="d-flex justify-content-between align-items-start">
					<div className="flex-grow-1">
						<div className="d-flex align-items-center mb-2">
							<h6 className="fw-bold mb-0 me-3">{note.title}</h6>
							<div>
								{note.primaryLanguage && (
									<Badge bg="primary" text="white" className="me-1">
										{note.primaryLanguage.toLowerCase() === "english"
											? "EN"
											: "HI"}
									</Badge>
								)}
								<Badge bg="secondary" className="small">
									{note.folder}
								</Badge>
							</div>
						</div>
						<p
							className="text-muted mb-2"
							style={{
								overflow: "hidden",
								display: "-webkit-box",
								WebkitLineClamp: 2,
								WebkitBoxOrient: "vertical",
							}}
						>
							{note.primaryLanguage
								? note.primaryLanguage.toLowerCase() === "english"
									? note.englishNoteContent
									: note.hindiNoteContent
								: note.content}
						</p>
						{note.tags && note.tags.length > 0 && (
							<div className="mb-2">
								{note.tags.map((tag, index) => (
									<Badge
										key={index}
										bg="light"
										text="dark"
										className="me-1 small"
									>
										<Tag size={10} className="me-1" />
										{tag}
									</Badge>
								))}
							</div>
						)}
						<small className="text-muted">
							<Calendar size={12} className="me-1" />
							{formatDate(note.createdAt)}
						</small>
					</div>
					<div className="btn-group" role="group">
						<Button
							variant="outline-primary"
							size="sm"
							onClick={() => viewNote(note)}
						>
							<Eye size={12} />
						</Button>
						<Button
							variant="outline-secondary"
							size="sm"
							onClick={() => editNoteHandler(note)}
						>
							<Edit size={12} />
						</Button>
						<Button
							variant="outline-danger"
							size="sm"
							onClick={() => deleteNote(note._id)}
						>
							<Trash2 size={12} />
						</Button>
					</div>
				</div>
			</div>
		))}
	</div>
);

export default NotesList;
