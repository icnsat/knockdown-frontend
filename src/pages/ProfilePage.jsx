import { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Form, Button, Alert, Spinner } from 'react-bootstrap';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { fetchUserProfile, updateUserProfile, logout } from '../slices/authSlice';
import Header from '../components/Header';
import Footer from '../components/Footer';
import api from '../api/api';

const ProfilePage = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { user, isLoading } = useSelector((state) => state.auth);
    
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        theme: true,
        language: 'RUS',
        keyboard_layout: 'JCUKEN'
    });
    
    const [editing, setEditing] = useState(false);
    const [saveStatus, setSaveStatus] = useState(null);
    const [stats, setStats] = useState(null);
    const [statsLoading, setStatsLoading] = useState(true);

    // Загрузка данных пользователя
    useEffect(() => {
        if (user) {
            setFormData({
                username: user.username || '',
                email: user.email || '',
                theme: user.theme !== undefined ? user.theme : true,
                language: user.language || 'RUS',
                keyboard_layout: user.keyboard_layout || 'JCUKEN'
            });
        }
    }, [user]);

    // Загрузка общей статистики пользователя
    useEffect(() => {
        const fetchUserStats = async () => {
            try {
                const response = await api.get('/stats/dashboard/');
                setStats(response.data);
            } catch (error) {
                console.error('Ошибка загрузки статистики:', error);
            } finally {
                setStatsLoading(false);
            }
        };
        fetchUserStats();
    }, []);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaveStatus('saving');
        
        try {
            const result = await dispatch(updateUserProfile(formData));
            if (!result.error) {
                setSaveStatus('saved');
                setEditing(false);
                setTimeout(() => setSaveStatus(null), 3000);
            } else {
                setSaveStatus('error');
                setTimeout(() => setSaveStatus(null), 3000);
            }
        } catch (error) {
            setSaveStatus('error');
            setTimeout(() => setSaveStatus(null), 3000);
        }
    };

    const handleLogout = () => {
        dispatch(logout());
        navigate('/');
    };

    if (isLoading) {
        return (
            <>
                <Header />
                <Container className="text-center mt-5">
                    <Spinner animation="border" variant="primary" />
                    <p className="mt-3">Загрузка профиля...</p>
                </Container>
                <Footer />
            </>
        );
    }

    return (
        <div className="d-flex flex-column" style={{ minHeight: '88vh' }}>
            <Header />
            
            <Container className="flex-grow-1 py-4">
                {/* <h1 className="mb-4">Мой профиль</h1> */}
                
                <Row>
                    {/* Левая колонка - настройки профиля */}
                    <Col lg={5} className="mb-4">
                        <Card className="shadow-sm">
                            <Card.Body>
                                <div className="d-flex justify-content-between align-items-center mb-3">
                                    <Card.Title className="mb-0">Настройки</Card.Title>
                                    {!editing && (
                                        <Button 
                                            variant="outline-primary" 
                                            size="sm"
                                            onClick={() => setEditing(true)}
                                        >
                                            Редактировать
                                        </Button>
                                    )}
                                </div>
                                
                                {saveStatus === 'saving' && (
                                    <Alert variant="info" className="mb-3">
                                        <Spinner animation="border" size="sm" className="me-2" />
                                        Сохранение...
                                    </Alert>
                                )}
                                {saveStatus === 'saved' && (
                                    <Alert variant="success" className="mb-3">
                                        ✓ Профиль обновлен
                                    </Alert>
                                )}
                                {saveStatus === 'error' && (
                                    <Alert variant="danger" className="mb-3">
                                        ❌ Ошибка при сохранении
                                    </Alert>
                                )}
                                
                                <Form onSubmit={handleSubmit}>
                                    <Form.Group className="mb-3">
                                        <Form.Label>Имя пользователя</Form.Label>
                                        <Form.Control
                                            type="text"
                                            name="username"
                                            value={formData.username}
                                            onChange={handleChange}
                                            disabled={!editing}
                                            readOnly={!editing}
                                        />
                                    </Form.Group>
                                    
                                    <Form.Group className="mb-3">
                                        <Form.Label>Email</Form.Label>
                                        <Form.Control
                                            type="email"
                                            name="email"
                                            value={formData.email}
                                            onChange={handleChange}
                                            disabled={!editing}
                                            readOnly={!editing}
                                        />
                                    </Form.Group>
                                    
                                    <Form.Group className="mb-3">
                                        <Form.Label>Язык интерфейса</Form.Label>
                                        <Form.Select
                                            name="language"
                                            value={formData.language}
                                            onChange={handleChange}
                                            disabled={!editing}
                                        >
                                            <option value="RUS">Русский</option>
                                            <option value="ENG">English</option>
                                        </Form.Select>
                                    </Form.Group>
                                    
                                    <Form.Group className="mb-3">
                                        <Form.Label>Раскладка клавиатуры</Form.Label>
                                        <Form.Select
                                            name="keyboard_layout"
                                            value={formData.keyboard_layout}
                                            onChange={handleChange}
                                            disabled={!editing}
                                        >
                                            <option value="JCUKEN">ЙЦУКЕН</option>
                                            <option value="QWERTY">QWERTY</option>
                                        </Form.Select>
                                    </Form.Group>
                                    
                                    <Form.Group className="mb-4">
                                        <Form.Check
                                            type="checkbox"
                                            name="theme"
                                            label="Светлая тема"
                                            checked={formData.theme}
                                            onChange={handleChange}
                                            disabled={!editing}
                                        />
                                    </Form.Group>
                                    
                                    {editing && (
                                        <div className="d-flex gap-2">
                                            <Button variant="primary" type="submit" disabled={saveStatus === 'saving'}>
                                                Сохранить
                                            </Button>
                                            <Button 
                                                variant="secondary" 
                                                onClick={() => {
                                                    setEditing(false);
                                                    if (user) {
                                                        setFormData({
                                                            username: user.username || '',
                                                            email: user.email || '',
                                                            theme: user.theme !== undefined ? user.theme : true,
                                                            language: user.language || 'RUS',
                                                            keyboard_layout: user.keyboard_layout || 'JCUKEN'
                                                        });
                                                    }
                                                }}
                                            >
                                                Отмена
                                            </Button>
                                        </div>
                                    )}
                                </Form>

                                {/* Кнопка выхода */}
                                <hr className="my-4" />
                                <Button 
                                    variant="danger" 
                                    className="w-100"
                                    onClick={handleLogout}
                                >
                                    Выйти из аккаунта
                                </Button>
                            </Card.Body>
                        </Card>
                    </Col>
                    
                    {/* Правая колонка - статистика */}
                    <Col lg={7}>
                        <Card className="shadow-sm mb-4">
                            <Card.Body>
                                <Card.Title>Общая статистика</Card.Title>
                                
                                {statsLoading ? (
                                    <div className="text-center py-4">
                                        <Spinner animation="border" size="sm" />
                                    </div>
                                ) : stats ? (
                                    <Row className="text-center">
                                        <Col md={4}>
                                            <div className="p-3 bg-light rounded mb-2">
                                                <h3 className="text-primary mb-0">{stats.total_sessions || 0}</h3>
                                                <small className="text-muted">всего тренировок</small>
                                            </div>
                                        </Col>
                                        <Col md={4}>
                                            <div className="p-3 bg-light rounded mb-2">
                                                <h3 className="text-success mb-0">{stats.total_time || 0} мин</h3>
                                                <small className="text-muted">общее время</small>
                                            </div>
                                        </Col>
                                        <Col md={4}>
                                            <div className="p-3 bg-light rounded mb-2">
                                                <h3 className="text-info mb-0">{stats.best_speed || 0}</h3>
                                                <small className="text-muted">лучшая скорость</small>
                                            </div>
                                        </Col>
                                    </Row>
                                ) : (
                                    <p className="text-muted text-center py-3">
                                        Пока нет данных. Пройдите несколько уроков!
                                    </p>
                                )}
                            </Card.Body>
                        </Card>
                        
                        {/* <Card className="shadow-sm">
                            <Card.Body>
                                <Card.Title>Недавние достижения</Card.Title>
                                <div className="text-center py-4 text-muted">
                                    В разработке...
                                </div>
                            </Card.Body>
                        </Card> */}
                    </Col>
                </Row>
            </Container>
            
            <Footer />
        </div>
    );
};

export default ProfilePage;