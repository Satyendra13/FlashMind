import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Form, Modal, ProgressBar, Alert } from 'react-bootstrap';
import axios from 'axios';
import toast from 'react-hot-toast';
import { 
  Play, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Award,
  Target,
  BarChart3,
  RefreshCw
} from 'lucide-react';

const Quiz = () => {
  const [quizzes, setQuizzes] = useState([]);
  const [notes, setNotes] = useState([]);
  const [decks, setDecks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [showQuizModal, setShowQuizModal] = useState(false);
  const [showResultsModal, setShowResultsModal] = useState(false);
  const [currentQuiz, setCurrentQuiz] = useState(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState([]);
  const [timeLeft, setTimeLeft] = useState(0);
  const [quizResults, setQuizResults] = useState(null);
  const [generateOptions, setGenerateOptions] = useState({
    source: 'note',
    sourceId: '',
    quizType: 'multiple_choice',
    numberOfQuestions: 10,
    timeLimit: 15
  });

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    let timer;
    if (showQuizModal && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            handleSubmitQuiz();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [showQuizModal, timeLeft]);

  const fetchData = async () => {
    try {
      const [quizzesRes, notesRes, decksRes] = await Promise.all([
        axios.get('/quizzes'),
        axios.get('/notes'),
        axios.get('/flashcards/decks')
      ]);

      setQuizzes(quizzesRes.data);
      setNotes(notesRes.data);
      setDecks(decksRes.data);
    } catch (error) {
      toast.error('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const generateQuiz = async () => {
    try {
      const response = await axios.post('/quizzes/generate', generateOptions);
      toast.success('Quiz generated successfully!');
      fetchData();
      setShowGenerateModal(false);
      setGenerateOptions({
        source: 'note',
        sourceId: '',
        quizType: 'multiple_choice',
        numberOfQuestions: 10,
        timeLimit: 15
      });
    } catch (error) {
      toast.error('Failed to generate quiz');
    }
  };

  const startQuiz = (quiz) => {
    setCurrentQuiz(quiz);
    setCurrentQuestionIndex(0);
    setUserAnswers(new Array(quiz.questions.length).fill(''));
    setTimeLeft(quiz.timeLimit * 60);
    setShowQuizModal(true);
  };

  const handleAnswerSelect = (answer) => {
    const newAnswers = [...userAnswers];
    newAnswers[currentQuestionIndex] = answer;
    setUserAnswers(newAnswers);
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < currentQuiz.questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      handleSubmitQuiz();
    }
  };

  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const handleSubmitQuiz = async () => {
    try {
      const response = await axios.post(`/quizzes/${currentQuiz._id}/complete`, {
        answers: userAnswers
      });
      
      setQuizResults(response.data);
      setShowQuizModal(false);
      setShowResultsModal(true);
      fetchData();
    } catch (error) {
      toast.error('Failed to submit quiz');
    }
  };

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const QuizCard = ({ quiz }) => (
    <Card className="h-100 border-0 shadow-sm hover-lift">
      <Card.Body>
        <div className="d-flex justify-content-between align-items-start mb-3">
          <h5 className="fw-bold mb-0">{quiz.title}</h5>
          <span className="badge bg-secondary">{quiz.questions.length} questions</span>
        </div>
        
        <div className="d-flex align-items-center mb-2">
          <Clock size={16} className="text-muted me-2" />
          <small className="text-muted">{quiz.timeLimit} minutes</small>
        </div>
        
        <div className="d-flex align-items-center mb-3">
          <Target size={16} className="text-muted me-2" />
          <small className="text-muted capitalize">{quiz.quizType.replace('_', ' ')}</small>
        </div>
        
        <div className="d-flex justify-content-between align-items-center">
          <small className="text-muted">
            Created {new Date(quiz.createdAt).toLocaleDateString()}
          </small>
          <Button
            variant="primary"
            size="sm"
            onClick={() => startQuiz(quiz)}
          >
            <Play size={12} className="me-1" />
            Start Quiz
          </Button>
        </div>
      </Card.Body>
    </Card>
  );

  const QuestionComponent = ({ question, questionIndex, selectedAnswer, onAnswerSelect }) => (
    <Card className="border-0 shadow-sm">
      <Card.Body>
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h6 className="text-muted mb-0">Question {questionIndex + 1}</h6>
          <span className="badge bg-primary">{currentQuiz.quizType.replace('_', ' ')}</span>
        </div>
        
        <h5 className="mb-4">{question.question}</h5>
        
        {currentQuiz.quizType === 'multiple_choice' && (
          <div>
            {question.options.map((option, index) => (
              <Form.Check
                key={index}
                type="radio"
                name={`question-${questionIndex}`}
                id={`question-${questionIndex}-option-${index}`}
                label={option}
                checked={selectedAnswer === option}
                onChange={() => onAnswerSelect(option)}
                className="mb-2"
              />
            ))}
          </div>
        )}
        
        {currentQuiz.quizType === 'true_false' && (
          <div>
            <Form.Check
              type="radio"
              name={`question-${questionIndex}`}
              id={`question-${questionIndex}-true`}
              label="True"
              checked={selectedAnswer === 'true'}
              onChange={() => onAnswerSelect('true')}
              className="mb-2"
            />
            <Form.Check
              type="radio"
              name={`question-${questionIndex}`}
              id={`question-${questionIndex}-false`}
              label="False"
              checked={selectedAnswer === 'false'}
              onChange={() => onAnswerSelect('false')}
              className="mb-2"
            />
          </div>
        )}
        
        {currentQuiz.quizType === 'fill_blank' && (
          <Form.Control
            type="text"
            value={selectedAnswer}
            onChange={(e) => onAnswerSelect(e.target.value)}
            placeholder="Enter your answer"
          />
        )}
      </Card.Body>
    </Card>
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

  const currentQuestion = currentQuiz?.questions[currentQuestionIndex];

  return (
    <Container fluid className="py-4">
      <Row className="mb-4">
        <Col md={8}>
          <h1 className="fw-bold mb-1">Quiz Center</h1>
          <p className="text-muted mb-0">Test your knowledge with AI-generated quizzes</p>
        </Col>
        <Col md={4} className="text-md-end">
          <Button
            variant="primary"
            onClick={() => setShowGenerateModal(true)}
          >
            <Play size={16} className="me-2" />
            Generate Quiz
          </Button>
        </Col>
      </Row>

      <Row className="g-4 mb-5">
        <Col md={3}>
          <Card className="text-center border-0 shadow-sm">
            <Card.Body>
              <div className="rounded-circle bg-primary bg-opacity-10 p-3 mx-auto mb-3 d-inline-flex">
                <BarChart3 className="text-primary" size={24} />
              </div>
              <h3 className="fw-bold">{quizzes.length}</h3>
              <p className="text-muted mb-0">Total Quizzes</p>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="text-center border-0 shadow-sm">
            <Card.Body>
              <div className="rounded-circle bg-success bg-opacity-10 p-3 mx-auto mb-3 d-inline-flex">
                <CheckCircle className="text-success" size={24} />
              </div>
              <h3 className="fw-bold">15</h3>
              <p className="text-muted mb-0">Completed</p>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="text-center border-0 shadow-sm">
            <Card.Body>
              <div className="rounded-circle bg-warning bg-opacity-10 p-3 mx-auto mb-3 d-inline-flex">
                <Award className="text-warning" size={24} />
              </div>
              <h3 className="fw-bold">87%</h3>
              <p className="text-muted mb-0">Average Score</p>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="text-center border-0 shadow-sm">
            <Card.Body>
              <div className="rounded-circle bg-info bg-opacity-10 p-3 mx-auto mb-3 d-inline-flex">
                <Target className="text-info" size={24} />
              </div>
              <h3 className="fw-bold">98%</h3>
              <p className="text-muted mb-0">Best Score</p>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Row className="mb-4">
        <Col>
          <h3 className="fw-bold mb-3">Available Quizzes</h3>
        </Col>
      </Row>

      {quizzes.length > 0 ? (
        <Row className="g-4">
          {quizzes.map((quiz) => (
            <Col key={quiz._id} md={6} lg={4}>
              <QuizCard quiz={quiz} />
            </Col>
          ))}
        </Row>
      ) : (
        <div className="text-center py-5">
          <BarChart3 size={64} className="text-muted mb-3" />
          <h4 className="text-muted mb-2">No quizzes available</h4>
          <p className="text-muted mb-4">
            Generate your first quiz from your notes or flashcard decks.
          </p>
          <Button variant="primary" onClick={() => setShowGenerateModal(true)}>
            <Play size={16} className="me-2" />
            Generate Your First Quiz
          </Button>
        </div>
      )}

      <Modal show={showGenerateModal} onHide={() => setShowGenerateModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Generate New Quiz</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Source Type</Form.Label>
              <Form.Select
                value={generateOptions.source}
                onChange={(e) => setGenerateOptions({...generateOptions, source: e.target.value, sourceId: ''})}
              >
                <option value="note">From Note</option>
                <option value="deck">From Flashcard Deck</option>
              </Form.Select>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>
                Select {generateOptions.source === 'note' ? 'Note' : 'Deck'}
              </Form.Label>
              <Form.Select
                value={generateOptions.sourceId}
                onChange={(e) => setGenerateOptions({...generateOptions, sourceId: e.target.value})}
                required
              >
                <option value="">Choose a {generateOptions.source}...</option>
                {(generateOptions.source === 'note' ? notes : decks).map((item) => (
                  <option key={item._id} value={item._id}>
                    {item.title || item.name}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Quiz Type</Form.Label>
              <Form.Select
                value={generateOptions.quizType}
                onChange={(e) => setGenerateOptions({...generateOptions, quizType: e.target.value})}
              >
                <option value="multiple_choice">Multiple Choice</option>
                <option value="true_false">True/False</option>
                <option value="fill_blank">Fill in the Blank</option>
                <option value="mixed">Mixed</option>
              </Form.Select>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Number of Questions</Form.Label>
              <Form.Select
                value={generateOptions.numberOfQuestions}
                onChange={(e) => setGenerateOptions({...generateOptions, numberOfQuestions: parseInt(e.target.value)})}
              >
                <option value={5}>5 questions</option>
                <option value={10}>10 questions</option>
                <option value={15}>15 questions</option>
                <option value={20}>20 questions</option>
              </Form.Select>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Time Limit (minutes)</Form.Label>
              <Form.Select
                value={generateOptions.timeLimit}
                onChange={(e) => setGenerateOptions({...generateOptions, timeLimit: parseInt(e.target.value)})}
              >
                <option value={5}>5 minutes</option>
                <option value={10}>10 minutes</option>
                <option value={15}>15 minutes</option>
                <option value={30}>30 minutes</option>
                <option value={60}>60 minutes</option>
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
            onClick={generateQuiz}
            disabled={!generateOptions.sourceId}
          >
            <Play size={16} className="me-2" />
            Generate Quiz
          </Button>
        </Modal.Footer>
      </Modal>

      <Modal show={showQuizModal} onHide={() => {}} size="lg" backdrop="static">
        <Modal.Header>
          <Modal.Title className="d-flex align-items-center">
            <span className="me-3">{currentQuiz?.title}</span>
            <span className={`badge ${timeLeft < 60 ? 'bg-danger' : 'bg-primary'}`}>
              <Clock size={12} className="me-1" />
              {formatTime(timeLeft)}
            </span>
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="mb-4">
            <ProgressBar 
              now={((currentQuestionIndex + 1) / (currentQuiz?.questions.length || 1)) * 100} 
              className="mb-2"
            />
            <div className="d-flex justify-content-between text-muted small">
              <span>Question {currentQuestionIndex + 1} of {currentQuiz?.questions.length}</span>
              <span>{userAnswers.filter(answer => answer !== '').length} answered</span>
            </div>
          </div>

          {currentQuestion && (
            <QuestionComponent
              question={currentQuestion}
              questionIndex={currentQuestionIndex}
              selectedAnswer={userAnswers[currentQuestionIndex]}
              onAnswerSelect={handleAnswerSelect}
            />
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button 
            variant="outline-secondary" 
            onClick={handlePreviousQuestion}
            disabled={currentQuestionIndex === 0}
          >
            Previous
          </Button>
          <div className="flex-grow-1 text-center">
            <small className="text-muted">
              {userAnswers[currentQuestionIndex] ? 'Answer selected' : 'Select an answer'}
            </small>
          </div>
          <Button 
            variant="primary" 
            onClick={handleNextQuestion}
          >
            {currentQuestionIndex === (currentQuiz?.questions.length || 1) - 1 ? 'Submit Quiz' : 'Next'}
          </Button>
        </Modal.Footer>
      </Modal>

      <Modal show={showResultsModal} onHide={() => setShowResultsModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Quiz Results</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {quizResults && (
            <>
              <div className="text-center mb-4">
                <div className={`rounded-circle p-4 mx-auto mb-3 d-inline-flex ${
                  quizResults.score >= 80 ? 'bg-success' : 
                  quizResults.score >= 60 ? 'bg-warning' : 'bg-danger'
                } bg-opacity-10`}>
                  <Award className={`${
                    quizResults.score >= 80 ? 'text-success' : 
                    quizResults.score >= 60 ? 'text-warning' : 'text-danger'
                  }`} size={48} />
                </div>
                <h2 className="fw-bold mb-2">{quizResults.score}%</h2>
                <p className="text-muted mb-0">
                  You got {quizResults.correctAnswers} out of {quizResults.totalQuestions} questions correct
                </p>
              </div>

              <Row className="g-3 mb-4">
                <Col md={4}>
                  <Card className="text-center border-0 bg-light">
                    <Card.Body>
                      <CheckCircle className="text-success mb-2" size={24} />
                      <h5 className="fw-bold">{quizResults.correctAnswers}</h5>
                      <small className="text-muted">Correct</small>
                    </Card.Body>
                  </Card>
                </Col>
                <Col md={4}>
                  <Card className="text-center border-0 bg-light">
                    <Card.Body>
                      <XCircle className="text-danger mb-2" size={24} />
                      <h5 className="fw-bold">{quizResults.totalQuestions - quizResults.correctAnswers}</h5>
                      <small className="text-muted">Incorrect</small>
                    </Card.Body>
                  </Card>
                </Col>
                <Col md={4}>
                  <Card className="text-center border-0 bg-light">
                    <Card.Body>
                      <Clock className="text-info mb-2" size={24} />
                      <h5 className="fw-bold">{formatTime(quizResults.timeTaken)}</h5>
                      <small className="text-muted">Time Taken</small>
                    </Card.Body>
                  </Card>
                </Col>
              </Row>

              <Alert variant={quizResults.score >= 80 ? 'success' : quizResults.score >= 60 ? 'warning' : 'danger'}>
                <strong>
                  {quizResults.score >= 80 ? 'Excellent work!' : 
                   quizResults.score >= 60 ? 'Good job!' : 'Keep studying!'}
                </strong>
                {quizResults.score >= 80 
                  ? ' You have a strong understanding of the material.'
                  : quizResults.score >= 60
                  ? ' You\'re on the right track. Review the incorrect answers.'
                  : ' Consider reviewing the material and trying again.'
                }
              </Alert>
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowResultsModal(false)}>
            Close
          </Button>
          <Button variant="primary" onClick={() => setShowResultsModal(false)}>
            <RefreshCw size={16} className="me-2" />
            Take Another Quiz
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default Quiz;