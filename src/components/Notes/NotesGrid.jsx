import { Calendar, Edit, Eye, Tag, Trash2 } from "lucide-react";
import { Badge, Button, Card, Col, Row } from "react-bootstrap";
const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
};
const NotesGrid = ({
    filteredNotes,
    viewNote,
    editNoteHandler,
    deleteNote,

}) => (
    <Row className="g-4">
        {filteredNotes.map((note) => (
            <Col key={note._id} md={6} lg={4}>
                <Card className="h-100 border-0 shadow-sm hover-lift">
                    <Card.Body>
                        <div className="d-flex justify-content-between align-items-start mb-2">
                            <h6 className="fw-bold mb-0" style={{ fontSize: "1rem" }}>
                                {note.title}
                            </h6>
                            <Badge bg="secondary" className="small">
                                {note.folder}
                            </Badge>
                        </div>

                        <p
                            className="text-muted small mb-3"
                            style={{
                                overflow: "hidden",
                                display: "-webkit-box",
                                WebkitLineClamp: 3,
                                WebkitBoxOrient: "vertical",
                            }}
                        >
                            {note.content}
                        </p>

                        {note.tags && note.tags.length > 0 && (
                            <div className="mb-3">
                                {note.tags.map((tag, index) => (
                                    <Badge
                                        key={index}
                                        bg="light"
                                        text="dark"
                                        className="me-1 small"
                                    >
                                        <div className="d-flex align-items-center">

                                            <Tag size={10} className="me-1" />
                                            <span>{tag}</span>
                                        </div>
                                    </Badge>
                                ))}
                            </div>
                        )}

                        <div className="d-flex justify-content-between align-items-center">
                            <small className="text-muted">
                                <div className="d-flex align-items-center">
                                    <Calendar size={12} className="me-1" />
                                    <span>{formatDate(note.createdAt)}</span>
                                </div>
                            </small>
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
                    </Card.Body>
                </Card>
            </Col>
        ))}
    </Row>
);

export default NotesGrid