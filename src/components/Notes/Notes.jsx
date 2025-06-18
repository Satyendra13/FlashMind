import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Form, Modal, Badge } from 'react-bootstrap';
import { useDropzone } from 'react-dropzone';
import axios from 'axios';
import toast from 'react-hot-toast';
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
  Tag
} from 'lucide-react';

const Notes = () => {
  const [notes, setNotes] = useState([]);
  const [filteredNotes, setFilteredNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFolder, setSelectedFolder] = useState('all');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedNote, setSelectedNote] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [folders, setFolders] = useState(['General', 'Study', 'Work', 'Personal']);
  const [newNote, setNewNote] = useState({
    title: '',
    content: '',
    folder: 'General',
    tags: []
  });

  useEffect(() => {
    fetchNotes();
  }, []);

  useEffect(() => {
    filterNotes();
  }, [notes, searchTerm, selectedFolder]);

  const fetchNotes = async () => {
    try {
      const response = await axios.get('/notes');
      setNotes(response.data);
    } catch (error) {
      toast.error('Failed to fetch notes');
    } finally {
      setLoading(false);
    }
  };

  const filterNotes = () => {
    let filtered = notes;

    if (searchTerm) {
      filtered = filtered.filter(note =>
        note.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        note.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
        note.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    if (selectedFolder !== 'all') {
      filtered = filtered.filter(note => note.folder === selectedFolder);
    }

    setFilteredNotes(filtered);
  };

  const onDrop = async (acceptedFiles) => {
    setUploading(true);
    
    try {
      for (const file of acceptedFiles) {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('folder', 'General');

        await axios.post('/notes/upload', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
      }
      
      toast.success('Files uploaded successfully!');
      fetchNotes();
      setShowUploadModal(false);
    } catch (error) {
      toast.error('Failed to upload files');
    } finally {
      setUploading(false);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'text/plain': ['.txt'],
      'image/*': ['.jpg', '.jpeg', '.png', '.gif']
    },
    maxSize: 10 * 1024 * 1024
  });

  const createNote = async () => {
    try {
      await axios.post('/notes/manual', newNote);
      toast.success('Note created successfully!');
      fetchNotes();
      setShowCreateModal(false);
      setNewNote({
        title: '',
        content: '',
        folder: 'General',
        tags: []
      });
    } catch (error) {
      toast.error('Failed to create note');
    }
  };

  const deleteNote = async (noteId) => {
    if (window.confirm('Are you sure you want to delete this note?')) {
      try {
        await axios.delete(`/notes/${noteId}`);
        toast.success('Note deleted successfully');
        fetchNotes();
      } catch (error) {
        toast.error('Failed to delete note');
      }
    }
  };

  const viewNote = (note) => {
    setSelectedNote(note);
    setShowViewModal(true);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const NotesGrid = () => (
    <Row className="g-4">
      {filteredNotes.map((note) => (
        <Col key={note._id} md={6} lg={4}>
          <Card className="h-100 border-0 shadow-sm hover-lift">
            <Card.Body>
              <div className="d-flex justify-content-between align-items-start mb-2">
                <h6 className="fw-bold mb-0" style={{ fontSize: '1rem' }}>
                  {note.title}
                </h6>
                <Badge bg="secondary" className="small">
                  {note.folder}
                </Badge>
              </div>
              
              <p className="text-muted small mb-3" style={{ 
                overflow: 'hidden',
                display: '-webkit-box',
                WebkitLineClamp: 3,
                WebkitBoxOrient: 'vertical'
              }}>
                {note.content}
              </p>
              
              {note.tags.length > 0 && (
                <div className="mb-3">
                  {note.tags.map((tag, index) => (
                    <Badge key={index} bg="light" text="dark" className="me-1 small">
                      <Tag size={10} className="me-1" />
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}
              
              <div className="d-flex justify-content-between align-items-center">
                <small className="text-muted">
                  {formatDate(note.createdAt)}
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
          <p className="text-muted mb-0">Manage your study materials and notes</p>
        </Col>
        <Col md={4} className="text-md-end">
          <Button
            variant="primary"
            className="me-2"
            onClick={() => setShowUploadModal(true)}
          >
            <Upload size={16} className="me-2" />
            Upload Files
          </Button>
          <Button
            variant="outline-primary"
            onClick={() => setShowCreateModal(true)}
          >
            <Plus size={16} className="me-2" />
            Create Note
          </Button>
        </Col>
      </Row>

      <Row className="mb-4">
        <Col md={6}>
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
        <Col md={6}>
          <Form.Select
            value={selectedFolder}
            onChange={(e) => setSelectedFolder(e.target.value)}
          >
            <option value="all">All Folders</option>
            {folders.map((folder) => (
              <option key={folder} value={folder}>{folder}</option>
            ))}
          </Form.Select>
        </Col>
      </Row>

      {filteredNotes.length > 0 ? (
        <NotesGrid />
      ) : (
        <div className="text-center py-5">
          <FileText size={64} className="text-muted mb-3" />
          <h4 className="text-muted mb-2">No notes found</h4>
          <p className="text-muted mb-4">
            {searchTerm || selectedFolder !== 'all' 
              ? 'Try adjusting your search or filter criteria.'
              : 'Start by uploading your first document or creating a new note.'
            }
          </p>
          {!searchTerm && selectedFolder === 'all' && (
            <Button variant="primary" onClick={() => setShowUploadModal(true)}>
              <Upload size={16} className="me-2" />
              Upload Your First Note
            </Button>
          )}
        </div>
      )}

      <Modal show={showUploadModal} onHide={() => setShowUploadModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Upload Files</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div 
            {...getRootProps()} 
            className={`dropzone ${isDragActive ? 'active' : ''}`}
          >
            <input {...getInputProps()} />
            <Upload size={48} className="text-muted mb-3" />
            <h5 className="mb-2">
              {isDragActive ? 'Drop files here' : 'Drag & drop files here'}
            </h5>
            <p className="text-muted mb-3">
              or click to select files
            </p>
            <p className="small text-muted">
              Supported formats: PDF, Word, Text, Images (max 10MB each)
            </p>
          </div>
          {uploading && (
            <div className="text-center mt-3">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Uploading...</span>
              </div>
              <p className="mt-2 text-muted">Processing files...</p>
            </div>
          )}
        </Modal.Body>
      </Modal>

      <Modal show={showCreateModal} onHide={() => setShowCreateModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Create New Note</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Title</Form.Label>
              <Form.Control
                type="text"
                value={newNote.title}
                onChange={(e) => setNewNote({...newNote, title: e.target.value})}
                placeholder="Enter note title"
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Folder</Form.Label>
              <Form.Select
                value={newNote.folder}
                onChange={(e) => setNewNote({...newNote, folder: e.target.value})}
              >
                {folders.map((folder) => (
                  <option key={folder} value={folder}>{folder}</option>
                ))}
              </Form.Select>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Content</Form.Label>
              <Form.Control
                as="textarea" 
                rows={10}
                value={newNote.content}
                onChange={(e) => setNewNote({...newNote, content: e.target.value})}
                placeholder="Enter your note content"
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowCreateModal(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={createNote}>
            Create Note
          </Button>
        </Modal.Footer>
      </Modal>

      <Modal show={showViewModal} onHide={() => setShowViewModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>{selectedNote?.title}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedNote && (
            <>
              <div className="mb-3">
                <Badge bg="secondary" className="me-2">{selectedNote.folder}</Badge>
                <small className="text-muted">
                  Created: {formatDate(selectedNote.createdAt)}
                </small>
              </div>
              {selectedNote.tags.length > 0 && (
                <div className="mb-3">
                  {selectedNote.tags.map((tag, index) => (
                    <Badge key={index} bg="light" text="dark" className="me-1">
                      <Tag size={10} className="me-1" />
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}
              <div className="border rounded p-3" style={{ minHeight: '300px' }}>
                <pre style={{ whiteSpace: 'pre-wrap', fontFamily: 'inherit' }}>
                  {selectedNote.content}
                </pre>
              </div>
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowViewModal(false)}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default Notes;