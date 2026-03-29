import { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Spinner, Alert, Badge } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import Header from '../components/Header';
import Footer from '../components/Footer';
import api from '../api/api';

const LessonListPage = () => {
    const [lessons, setLessons] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const { isAuthenticated } = useSelector((state) => state.auth);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchLessons = async () => {
            try {
                const response = await api.get('/lessons/lessons/');
                setLessons(response.data);
            } catch (error) {
                console.error('Ошибка загрузки уроков:', error);
                setError('Не удалось загрузить список уроков');
            } finally {
                setLoading(false);
            }
        };

        fetchLessons();
    }, []);

    // Функция для определения цвета сложности
    const getDifficultyColor = (level) => {
        switch(level) {
            case 1: return 'success';
            case 2: return 'info';
            case 3: return 'warning';
            case 4: return 'danger';
            default: return 'secondary';
        }
    };

    // Функция для определения статуса урока (пройден/нет)
    const getLessonStatus = (lesson) => {
        if (lesson.progress?.is_passed) {
            return { text: 'Пройден', variant: 'success' };
        } else if (lesson.progress) {
            return { text: 'В процессе', variant: 'warning' };
        } else {
            return { text: 'Новый', variant: 'secondary' };
        }
    };

    if (loading) {
        return (
            <>
                <Header />
                <Container className="text-center mt-5">
                    <Spinner animation="border" variant="primary" />
                    <p className="mt-3">Загрузка уроков...</p>
                </Container>
                <Footer />
            </>
        );
    }

    if (error) {
        return (
            <>
                <Header />
                <Container className="mt-5">
                    <Alert variant="danger">
                        <Alert.Heading>Ошибка</Alert.Heading>
                        <p>{error}</p>
                    </Alert>
                </Container>
                <Footer />
            </>
        );
    }

    return (
        <div className="d-flex flex-column" style={{ minHeight: '88vh' }}>
            <Header />
            
            <Container className="flex-grow-1 py-4">
                <h1 className="mb-4">Список уроков</h1>
                
                {!isAuthenticated && (
                    <Alert variant="info" className="mb-4">
                        <Alert.Heading className="fs-5">🔐 Отслеживайте свой прогресс</Alert.Heading>
                        <p className="mb-0">
                            Войдите в аккаунт, чтобы видеть свой прогресс по урокам 
                            и получать персонализированные рекомендации!
                        </p>
                    </Alert>
                )}

                <Row xs={1} md={2} lg={3} className="g-4">
                    {lessons.map((lesson) => {
                        const status = getLessonStatus(lesson);
                        const difficultyColor = getDifficultyColor(lesson.difficulty_level);
                        
                        return (
                            <Col key={lesson.id}>
                                <Card 
                                    className="h-100 shadow-sm hover-card border-0"
                                    style={{ cursor: 'pointer', transition: 'transform 0.2s' }}
                                    onClick={() => navigate(`/lesson/${lesson.id}`)}
                                    onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
                                    onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                                >
                                    <Card.Body>
                                        <div className="d-flex justify-content-between align-items-start mb-2">
                                            <Badge bg="secondary">Урок {lesson.order_index}</Badge>
                                            <Badge bg={status.variant}>{status.text}</Badge>
                                        </div>
                                        
                                        <Card.Title className="mb-3">{lesson.title}</Card.Title>
                                        
                                        {lesson.description && (
                                            <Card.Text className="text-muted small">
                                                {lesson.description.length > 100 
                                                    ? `${lesson.description.substring(0, 100)}...` 
                                                    : lesson.description}
                                            </Card.Text>
                                        )}
                                        
                                        <div className="d-flex justify-content-between align-items-center mt-3">
                                            <Badge bg={difficultyColor}>
                                                Сложность: {lesson.difficulty_level}/5
                                            </Badge>
                                            
                                            {lesson.progress && (
                                                <small className="text-muted">
                                                    ⚡ {lesson.progress.best_speed || 0} зн/мин
                                                </small>
                                            )}
                                        </div>

                                        {/* Прогресс-бар если есть данные */}
                                        {lesson.progress && lesson.progress.completion_count > 0 && (
                                            <div className="mt-3">
                                                <small className="text-muted">
                                                    Пройдено: {lesson.progress.completion_count} раз
                                                </small>
                                            </div>
                                        )}
                                    </Card.Body>
                                    
                                    {/* Бейдж "Рекомендуется" для непройденных уроков с низкой сложностью */}
                                    {/* {!lesson.progress && lesson.difficulty_level <= 2 && (
                                        <div className="position-absolute top-0 start-0 p-2">
                                            <Badge bg="warning" text="dark">🌟 Для начала</Badge>
                                        </div>
                                    )} */}
                                </Card>
                            </Col>
                        );
                    })}
                </Row>

                {lessons.length === 0 && (
                    <Alert variant="info">
                        Пока нет доступных уроков. Попробуйте зайти позже.
                    </Alert>
                )}
            </Container>

            <Footer />

            {/* Стили для карточек */}
            <style>{`
                .hover-card {
                    transition: all 0.3s ease;
                    border: 1px solid rgba(0,0,0,0.08);
                }
                .hover-card:hover {
                    box-shadow: 0 10px 20px rgba(0,0,0,0.1) !important;
                }
            `}</style>
        </div>
    );
};

export default LessonListPage;