import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Form, Modal, Badge, ProgressBar } from 'react-bootstrap';
import axios from 'axios';
import toast from 'react-hot-toast';
import { 
  Brain, 
  Plus, 
  Play, 
  Edit, 
  Trash2, 
  RefreshCw,
  BookOpen,
  Zap,
  Target,
  Award
} from 'lucide-react';

const Flashcards = () => {
  const [flashcards, setFlashcards] = useState([]);
  const [decks, setDecks] = useState([]);
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [showStudyModal, setShowStudyModal] = useState(false);
  const [currentDeck, setCurrentDeck] = useState(null);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [flippedCard, setFlippedCard] = useState(false);
  const [studySession, setStudySession] = useState({
    totalCards: 0,
    completedCards: 0,
    correctAnswers: 0
  });
  const [generateOptions, setGenerateOptions] = useState({
    noteId: '',
    numberOfCards: 10,
    difficulty: 'medium',
    cardType: 'basic'
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [flashcardsRes, decksRes, notesRes] = await Promise.all([
        axios.get('/flashcards'),
        axios.get('/flashcards/decks'),
        axios.get('/notes')
      ]);

      setFlashcards(flashcardsRes.data);
      setDecks(decksRes.data);
      setNotes(notesRes.data);
    } catch (error) {
      toast.error('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const generateFlashcards = async () => {
    try {
      const response = await axios.post('/flashcards/generate', generateOptions);
      toast.success(`Generated ${response.data.flashcards.length} flashcards!`);
      fetchData();
      setShowGenerateModal(false);
      setGenerateOptions({
        noteId: '',
        numberOfCards: 10,
        difficulty: 'medium',
        cardType: 'basic'
      });
    } catch (error) {
      toast.error('Failed to generate flashcards');
    }
  };

  const startStudySession = (deck) => {
    const deckCards = flashcards.filter(card => card.deckId === deck._id);
    if (deckCards.length === 0) {
      toast.error('No flashcards found in this deck');
      return;
    }

    setCurrentDeck(deck);
    setCurrentCardIndex(0);
    setFlippedCard(false);
    setStudySession({
      totalCards: deckCards.length,
      completedCards: 0,
      correctAnswers: 0
    });
    setShowStudyModal(true);
  };

  const handleCardResponse = (isCorrect) => {
    const deckCards = flashcards.filter(card => card.deckId === currentDeck._id);
    
    setStudySession(prev => ({
      ...prev,
      completedCards: prev.completedCards + 1,
      correctAnswers: prev.correctAnswers + (isCorrect ? 1 : 0)
    }));

    if (currentCardIndex < deckCards.length - 1) {
      setCurrentCardIndex(currentCardIndex + 1);
      setFlippedCard(false);
    } else {
      const accuracy = Math.round((studySession.correctAnswers + (isCorrect ? 1 : 0)) / deckCards.length * 100);
      toast.success(`Study session complete! Accuracy: ${accuracy}%`);
      setShowStudyModal(false);
    }
  };

  const FlashcardComponent = ({ card, flipped, onFlip }) => (
    <div className={`flashcard ${flipped ? 'flipped' : ''}`} onClick={onFlip}>
      <div className="flashcard-inner">
        <div className="flashcard-front">
          <h5 className="mb-0">{card.frontContent}</h5>
        </div>
        <div className="flashcard-back">
          <h5 className="mb-0">{card.backContent}</h5>
        </div>
      </div>
    </div>
  );

  const DifficultyBadge = ({ difficulty }) => {
    const colors = {
      easy: 'success',
      medium: 'warning',
      hard: 'danger'
    };
    return <Badge bg={colors[difficulty]}>{difficulty}</Badge>;
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

  const deckCards = currentDeck ? flashcards.filter(card => card.deckId === currentDeck._id) : [];
  const currentCard = deckCards[currentCardIndex];

  return (
    <Container fluid className="py-4">
      <Row className="mb-4">
        <Col md={8}>
          <h1 className="fw-bold mb-1">Flashcards</h1>
          <p className="text-muted mb-0">Create and study with AI-generated flashcards</p>
        </Col>
        <Col md={4} className="text-md-end">
          <Button
            variant="primary"
            onClick={() => setShowGenerateModal(true)}
          >
            <Zap size={16} className="me-2" />
            Generate Cards
          </Button>
        </Col>
      </Row>

      <Row className="g-4 mb-5">
        <Col md={3}>
          <Card className="text-center border-0 shadow-sm">
            <Card.Body>
              <div className="rounded-circle bg-primary bg-opacity-10 p-3 mx-auto mb-3 d-inline-flex">
                <Brain className="text-primary" size={24} />
              </div>
              <h3 className="fw-bold">{flashcards.length}</h3>
              <p className="text-muted mb-0">Total Cards</p>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="text-center border-0 shadow-sm">
            <Card.Body>
              <div className="rounded-circle bg-success bg-opacity-10 p-3 mx-auto mb-3 d-inline-flex">
                <BookOpen className="text-success" size={24} />
              </div>
              <h3 className="fw-bold">{decks.length}</h3>
              <p className="text-muted mb-0">Study Decks</p>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="text-center border-0 shadow-sm">
            <Card.Body>
              <div className="rounded-circle bg-warning bg-opacity-10 p-3 mx-auto mb-3 d-inline-flex">
                <Target className="text-warning" size={24} />
              </div>
              <h3 className="fw-bold">85%</h3>
              <p className="text-muted mb-0">Average Accuracy</p>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="text-center border-0 shadow-sm">
            <Card.Body>
              <div className="rounded-circle bg-info bg-opacity-10 p-3 mx-auto mb-3 d-inline-flex">
                <Award className="text-info" size={24} />
              </div>
              <h3 className="fw-bold">7</h3>
              <p className="text-muted mb-0">Day Streak</p>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Row className="mb-4">
        <Col>
          <h3 className="fw-bold mb-3">Study Decks</h3>
        </Col>
      </Row>

      {decks.length > 0 ? (
        <Row className="g-4">
          {decks.map((deck) => {
            const deckFlashcards = flashcards.filter(card => card.deckId === deck._id);
            return (
              <Col key={deck._id} md={6} lg={4}>
                <Card className="h-100 border-0 shadow-sm hover-lift">
                  <Card.Body>
                    <div className="d-flex justify-content-between align-items-start mb-3">
                      <h5 className="fw-bold mb-0">{deck.name}</h5>
                      <Badge bg="secondary">{deckFlashcards.length} cards</Badge>
                    </div>
                    
                    <p className="text-muted mb-3">{deck.description}</p>
                    
                    {deck.tags && deck.tags.length > 0 && (
                      <div className="mb-3">
                        {deck.tags.map((tag, index) => (
                          <Badge key={index} bg="light" text="dark" className="me-1">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}
                    
                    <div className="d-flex justify-content-between align-items-center">
                      <small className="text-muted">
                        Created {new Date(deck.createdAt).toLocaleDateString()}
                      </small>
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => startStudySession(deck)}
                        disabled={deckFlashcards.length === 0}
                      >
                        <Play size={12} className="me-1" />
                        Study
                      </Button>
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            );
          })}
        </Row>
      ) : (
        <div className="text-center py-5">
          <Brain size={64} className="text-muted mb-3" />
          <h4 className="text-muted mb-2">No flashcard decks yet</h4>
          <p className="text-muted mb-4">
            Generate your first set of flashcards from your notes using AI.
          </p>
          <Button variant="primary" onClick={() => setShowGenerateModal(true)}>
            <Zap size={16} className="me-2" />
            Generate Your First Deck
          </Button>
        </div>
      )}

      <Modal show={showGenerateModal} onHide={() => setShowGenerateModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Generate Flashcards</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Select Note</Form.Label>
              <Form.Select
                value={generateOptions.noteId}
                onChange={(e) => setGenerateOptions({...generateOptions, noteId: e.target.value})}
                required
              >
                <option value="">Choose a note...</option>
                {notes.map((note) => (
                  <option key={note._id} value={note._id}>{note.title}</option>
                ))}
              </Form.Select>
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label>Number of Cards</Form.Label>
              <Form.Select
                value={generateOptions.numberOfCards}
                onChange={(e) => setGenerateOptions({...generateOptions, numberOfCards: parseInt(e.target.value)})}
              >
                <option value={5}>5 cards</option>
                <option value={10}>10 cards</option>
                <option value={15}>15 cards</option>
                <option value={20}>20 cards</option>
              </Form.Select>
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label>Difficulty Level</Form.Label>
              <Form.Select
                value={generateOptions.difficulty}
                onChange={(e) => setGenerateOptions({...generateOptions, difficulty: e.target.value})}
              >
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </Form.Select>
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label>Card Type</Form.Label>
              <Form.Select
                value={generateOptions.cardType}
                onChange={(e) => setGenerateOptions({...generateOptions, cardType: e.target.value})}
              >
                <option value="basic">Basic (Question/Answer)</option>
                <option value="cloze">Cloze (Fill in the blank)</option>
                <option value="multiple_choice">Multiple Choice</option>
              </Form.Select>
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowGenerateModal(false)}>
            Cancel
          </Button>
          <Button 
            variant="primary" 
            onClick={generateFlashcards}
            disabled={!generateOptions.noteId}
          >
            <Zap size={16} className="me-2" />
            Generate Cards
          </Button>
        </Modal.Footer>
      </Modal>

      <Modal show={showStudyModal} onHide={() => setShowStudyModal(false)} size="lg" backdrop="static">
        <Modal.Header>
          <Modal.Title>{currentDeck?.name}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="mb-4">
            <div className="d-flex justify-content-between align-items-center mb-2">
              <span>Progress</span>
              <span>{studySession.completedCards} of {studySession.totalCards}</span>
            </div>
            <ProgressBar 
              now={(studySession.completedCards / studySession.totalCards) * 100} 
              className="mb-2"
            />
            <div className="d-flex justify-content-between text-muted small">
              <span>Accuracy: {studySession.totalCards > 0 ? Math.round((studySession.correctAnswers / Math.max(studySession.completedCards, 1)) * 100) : 0}%</span>
              <span>Card {currentCardIndex + 1}</span>
            </div>
          </div>

          {currentCard && (
            <>
              <FlashcardComponent
                card={currentCard}
                flipped={flippedCard}
                onFlip={() => setFlippedCard(!flippedCard)}
              />
              
              <div className="text-center mt-4">
                {!flippedCard ? (
                  <Button variant="outline-primary" onClick={() => setFlippedCard(true)}>
                    Reveal Answer
                  </Button>
                ) : (
                  <div>
                    <p className="mb-3">How well did you know this?</p>
                    <div className="d-flex gap-2 justify-content-center">
                      <Button 
                        variant="danger" 
                        onClick={() => handleCardResponse(false)}
                      >
                        Incorrect
                      </Button>
                      <Button 
                        variant="success" 
                        onClick={() => handleCardResponse(true)}
                      >
                        Correct
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </Modal.Body>
      </Modal>
    </Container>
  );
};

export default Flashcards;