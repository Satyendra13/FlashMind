import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import axios from 'axios';
import { 
  BookOpen, 
  Brain, 
  FileText, 
  Award, 
  TrendingUp, 
  Plus,
  Upload,
  Play
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalNotes: 0,
    totalFlashcards: 0,
    totalQuizzes: 0,
    completedQuizzes: 0,
    averageScore: 0,
    studyStreak: 0
  });
  const [recentActivity, setRecentActivity] = useState([]);
  const [performanceData, setPerformanceData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [statsRes, activityRes, performanceRes] = await Promise.all([
        axios.get('/dashboard/stats', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
        }),
        axios.get('/dashboard/recent-activity', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
        }),
        axios.get('/dashboard/performance', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
        })
      ]);

      setStats(statsRes.data);
      setRecentActivity(activityRes.data);
      setPerformanceData(performanceRes.data);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ title, value, icon: Icon, color, trend }) => (
    <Card className="h-100 border-0 shadow-sm">
      <Card.Body className="d-flex align-items-center">
        <div className={`rounded-circle p-3 me-3 bg-${color} bg-opacity-10`}>
          <Icon className={`text-${color}`} size={24} />
        </div>
        <div className="flex-grow-1">
          <h6 className="text-muted mb-1 fw-normal">{title}</h6>
          <h3 className="mb-0 fw-bold">{value}</h3>
          {trend && (
            <small className={`text-${trend > 0 ? 'success' : 'danger'}`}>
              <TrendingUp size={12} className="me-1" />
              {trend > 0 ? '+' : ''}{trend}%
            </small>
          )}
        </div>
      </Card.Body>
    </Card>
  );

  const QuickActionCard = ({ title, description, icon: Icon, color, to, action }) => (
    <Card className="h-100 border-0 shadow-sm hover-lift">
      <Card.Body className="text-center p-4">
        <div className={`rounded-circle p-3 mx-auto mb-3 bg-${color} bg-opacity-10 d-inline-flex`}>
          <Icon className={`text-${color}`} size={32} />
        </div>
        <h5 className="fw-bold mb-2">{title}</h5>
        <p className="text-muted mb-3">{description}</p>
        {to ? (
          <Button as={Link} to={to} variant={color} size="sm">
            Get Started
          </Button>
        ) : (
          <Button variant={color} size="sm" onClick={action}>
            Get Started
          </Button>
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

  return (
    <Container fluid className="py-4">
      <Row className="mb-4">
        <Col>
          <h1 className="fw-bold mb-1">Welcome back, {user?.firstName}! 👋</h1>
          <p className="text-muted mb-0">Here's what's happening with your studies today.</p>
        </Col>
      </Row>

      <Row className="g-4 mb-5">
        <Col md={6} xl={3}>
          <StatCard
            title="Total Notes"
            value={stats.totalNotes}
            icon={FileText}
            color="primary"
            trend={12}
          />
        </Col>
        <Col md={6} xl={3}>
          <StatCard
            title="Flashcards Created"
            value={stats.totalFlashcards}
            icon={Brain}
            color="success"
            trend={8}
          />
        </Col>
        <Col md={6} xl={3}>
          <StatCard
            title="Quizzes Completed"
            value={stats.completedQuizzes}
            icon={Award}
            color="warning"
            trend={-2}
          />
        </Col>
        <Col md={6} xl={3}>
          <StatCard
            title="Average Score"
            value={`${stats.averageScore}%`}
            icon={TrendingUp}
            color="info"
            trend={5}
          />
        </Col>
      </Row>

      <Row className="g-4 mb-5">
        <Col lg={8}>
          <Card className="border-0 shadow-sm">
            <Card.Header className="bg-white border-0 py-3">
              <h5 className="fw-bold mb-0">Performance Overview</h5>
            </Card.Header>
            <Card.Body>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={performanceData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="score" fill="#0d6efd" radius={4} />
                </BarChart>
              </ResponsiveContainer>
            </Card.Body>
          </Card>
        </Col>
        <Col lg={4}>
          <Card className="border-0 shadow-sm">
            <Card.Header className="bg-white border-0 py-3">
              <h5 className="fw-bold mb-0">Recent Activity</h5>
            </Card.Header>
            <Card.Body className="px-0">
              {recentActivity.length > 0 ? (
                <div className="list-group list-group-flush">
                  {recentActivity.map((activity, index) => (
                    <div key={index} className="list-group-item border-0 px-3">
                      <div className="d-flex align-items-center">
                        <div className="rounded-circle bg-primary bg-opacity-10 p-2 me-3">
                          <FileText size={16} className="text-primary" />
                        </div>
                        <div className="flex-grow-1">
                          <h6 className="mb-1">{activity.title}</h6>
                          <small className="text-muted">{activity.time}</small>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4">
                  <p className="text-muted mb-0">No recent activity</p>
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Row className="mb-4">
        <Col>
          <h3 className="fw-bold mb-3">Quick Actions</h3>
        </Col>
      </Row>

      <Row className="g-4">
        <Col md={6} lg={3}>
          <QuickActionCard
            title="Upload Notes"
            description="Upload your study materials and let AI analyze them"
            icon={Upload}
            color="primary"
            to="/notes"
          />
        </Col>
        <Col md={6} lg={3}>
          <QuickActionCard
            title="Create Flashcards"
            description="Generate AI-powered flashcards from your notes"
            icon={Plus}
            color="success"
            to="/flashcards"
          />
        </Col>
        <Col md={6} lg={3}>
          <QuickActionCard
            title="Take a Quiz"
            description="Test your knowledge with personalized quizzes"
            icon={Play}
            color="warning"
            to="/quiz"
          />
        </Col>
        <Col md={6} lg={3}>
          <QuickActionCard
            title="Study Flashcards"
            description="Review your flashcards with spaced repetition"
            icon={BookOpen}
            color="info"
            to="/flashcards"
          />
        </Col>
      </Row>
    </Container>
  );
};

export default Dashboard;