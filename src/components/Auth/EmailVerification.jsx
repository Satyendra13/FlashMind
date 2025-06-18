import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Spinner } from 'react-bootstrap';
import { Link, useParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { CheckCircle, XCircle, Mail } from 'lucide-react';

const EmailVerification = () => {
  const [status, setStatus] = useState('verifying');
  const [message, setMessage] = useState('');
  const { token } = useParams();
  const { verifyEmail } = useAuth();

  useEffect(() => {
    handleVerification();
  }, [token]);

  const handleVerification = async () => {
    const result = await verifyEmail(token);
    
    if (result.success) {
      setStatus('success');
      setMessage('Your email has been successfully verified!');
    } else {
      setStatus('error');
      setMessage(result.message || 'Email verification failed. The link may be expired or invalid.');
    }
  };

  const renderContent = () => {
    switch (status) {
      case 'verifying':
        return (
          <div className="text-center">
            <Spinner animation="border" variant="primary" className="mb-4" size="lg" />
            <h2 className="fw-bold text-primary mb-3">Verifying Email</h2>
            <p className="text-muted">Please wait while we verify your email address...</p>
          </div>
        );
      
      case 'success':
        return (
          <div className="text-center">
            <div className="text-success mb-4">
              <CheckCircle size={64} />
            </div>
            <h2 className="fw-bold text-success mb-3">Email Verified!</h2>
            <p className="text-muted mb-4">{message}</p>
            <Link to="/login" className="btn btn-primary">
              Continue to Login
            </Link>
          </div>
        );
      
      case 'error':
        return (
          <div className="text-center">
            <div className="text-danger mb-4">
              <XCircle size={64} />
            </div>
            <h2 className="fw-bold text-danger mb-3">Verification Failed</h2>
            <p className="text-muted mb-4">{message}</p>
            <div className="d-flex gap-2 justify-content-center">
              <Link to="/login" className="btn btn-outline-primary">
                Back to Login
              </Link>
              <Link to="/register" className="btn btn-primary">
                Create New Account
              </Link>
            </div>
          </div>
        );
      
      default:
        return null;
    }
  };

  return (
    <div className="auth-container">
      <Container>
        <Row className="justify-content-center">
          <Col md={6} lg={5}>
            <Card className="auth-card">
              <Card.Body className="p-5">
                {renderContent()}
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default EmailVerification;