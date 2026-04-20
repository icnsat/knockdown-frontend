import { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Table, Spinner, Alert, Button, Badge } from 'react-bootstrap';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Title, Tooltip, Legend } from 'chart.js';
import Header from '../components/Header';
import Footer from '../components/Footer';
import api from '../api/api';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Title, Tooltip, Legend);

const StatsPage = () => {
    const decodeLetter = (letter) => {
        return letter === '\\s' ? '␣' : letter;
    };

    const decodeBigram = (bigram) => {
        return bigram.replace(/\\s/g, '␣');
    };

    const { isAuthenticated } = useSelector((state) => state.auth);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    
    // Данные с бэкенда
    const [dashboard, setDashboard] = useState(null);
    const [dailyStats, setDailyStats] = useState([]);
    const [recentSessions, setRecentSessions] = useState([]);
    const [letterStats, setLetterStats] = useState([]);
    const [bigramStats, setBigramStats] = useState([]);

    useEffect(() => {
        if (!isAuthenticated) return;
        
        const fetchAllStats = async () => {
            try {
                const [dashboardRes, dailyRes, sessionsRes, lettersRes, bigramsRes] = await Promise.all([
                    api.get('/stats/dashboard/'),
                    api.get('/stats/daily/'),
                    api.get('/stats/sessions/?limit=50'),
                    api.get('/stats/letters/'),
                    api.get('/stats/bigrams/')
                ]);
                
                setDashboard(dashboardRes.data);
                setDailyStats([...dailyRes.data].reverse());
                setRecentSessions(sessionsRes.data);
                setLetterStats(lettersRes.data);
                setBigramStats(bigramsRes.data);
            } catch (err) {
                setError('Не удалось загрузить статистику');
            } finally {
                setLoading(false);
            }
        };
        
        fetchAllStats();
    }, [isAuthenticated]);

    if (!isAuthenticated) {
        return (
            <>
                <Header />
                <Container className="text-center mt-5">
                    <Alert variant="warning">
                        <Alert.Heading>
                            <i className="bi bi-lock me-2"></i>
                            Требуется авторизация
                        </Alert.Heading>
                        <p>Войдите в аккаунт для просмотра статистики</p>
                        <Button as={Link} to="/auth" variant="outline-dark">
                            <i className="bi bi-box-arrow-in-right me-2"></i>
                            Войти
                        </Button>
                    </Alert>
                </Container>
                <Footer />
            </>
        );
    }

    if (loading) {
        return (
            <>
                <Header />
                <Container className="text-center mt-5">
                    <Spinner animation="border" variant="primary" />
                    <p className="mt-3">Загрузка статистики...</p>
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
                    <Alert variant="danger">{error}</Alert>
                </Container>
                <Footer />
            </>
        );
    }

    // Данные для графика прогресса по дням
    const progressChartData = {
        labels: dailyStats.map(item => item.date),
        datasets: [
            {
                label: 'Скорость (зн/мин)',
                data: dailyStats.map(item => item.average_speed_wpm),
                borderColor: '#8c6e98',
                tension: 0.3,
                fill: true,
                yAxisID: 'y',
            },
            {
                label: 'Точность (%)',
                data: dailyStats.map(item => item.average_accuracy_percentage),
                borderColor: '#C87DA8',
                tension: 0.3,
                fill: true,
                yAxisID: 'y1',
            }
        ],
    };

    const progressChartOptions = {
        responsive: true,
        interaction: { mode: 'index', intersect: false },
        plugins: {
            legend: { position: 'top' },
        },
        scales: {
            y: { title: { display: true, text: 'Скорость (зн/мин)' }, beginAtZero: true },
            y1: { title: { display: true, text: 'Точность (%)' }, position: 'right', beginAtZero: true, max: 100 }
        }
    };

    // Данные для графика прогресса по последним сессиям
    const sessionsForChart = [...recentSessions].reverse();
    const sessionChartData = {
        labels: sessionsForChart.map((_, idx) => idx + 1),
        datasets: [
            {
                label: 'Скорость (зн/мин)',
                data: sessionsForChart.map(s => s.average_speed_wpm),
                borderColor: '#37AAAB',
                tension: 0.3,
                fill: true,
            },
            {
                label: 'Точность (%)',
                data: sessionsForChart.map(s => s.accuracy_percentage),
                borderColor: '#4F849D',
                tension: 0.3,
                fill: true,
            }
        ],
    };

    const sessionChartOptions = {
        responsive: true,
        interaction: { mode: 'index', intersect: false },
        plugins: {
            legend: { position: 'top' },
        },
        scales: {
            x: { title: { display: true, text: 'Номер тренировки' } },
            y: { title: { display: true, text: 'Скорость (зн/мин)' }, beginAtZero: true },
            y1: { title: { display: true, text: 'Точность (%)' }, position: 'right', beginAtZero: true, max: 100 }
        }
    };

    // Данные для круговой диаграммы
    const lessonTypes = {};
    recentSessions.forEach(session => {
        const type = session.lesson_title ? 'Системные' : 'Сгенерированные';
        lessonTypes[type] = (lessonTypes[type] || 0) + 1;
    });
    
    const pieChartData = {
        labels: Object.keys(lessonTypes),
        datasets: [{
            data: Object.values(lessonTypes),
            backgroundColor: ['#8c6e98', '#eecde4'],
        }]
    };

    const formatDate = (dateStr) => new Date(dateStr).toLocaleDateString('ru-RU');
    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return mins > 0 ? `${mins} мин ${secs} сек` : `${secs} сек`;
    };

    return (
        <div className="d-flex flex-column" style={{ minHeight: '88vh' }}>
            <Header />
            
            <Container className="flex-grow-1 py-4">
                {/* 1. Ключевые метрики */}
                <Row className="justify-content-between align-items-stretch mb-4">
                    <Col md={2}>
                        <Card
                            className="h-100 text-white text-center p-3"
                            style={{ backgroundColor: '#37AAAB' }} 
                        >  
                            <h2>{dashboard?.total_sessions || 0}</h2>
                            <span>всего тренировок</span>
                        </Card>
                    </Col>
                    <Col md={2}>
                        <Card
                            className="h-100 text-white text-center p-3"
                            style={{ backgroundColor: '#4F849D' }} 
                        >
                            <h2>{dashboard?.total_time || 0} мин</h2>
                            <span>общее время</span>
                        </Card>
                    </Col>
                    <Col md={2}>
                        <Card
                            className="h-100 text-white text-center p-3"
                            style={{ backgroundColor: '#6E799B' }}
                        >
                            <h2>{dashboard?.best_speed || 0}</h2>
                            <span>лучшая скорость</span>
                        </Card>
                    </Col>
                    <Col md={2}>
                        <Card
                            className="h-100 text-white text-center p-3"
                            style={{ backgroundColor: '#8c6e98' }}
                        >
                            <h2>{dashboard?.avg_speed || 0}</h2>
                            <span>средняя скорость</span>
                        </Card>
                    </Col>
                    <Col md={2}>
                        <Card
                            className="h-100 text-white text-center p-3"
                            style={{ backgroundColor: '#C87DA8' }}
                        >
                            <h2>{dashboard?.avg_accuracy || 0}%</h2>
                            <span>средняя точность</span>
                        </Card>
                    </Col>
                </Row>

                {/* 2.1. График прогресса по дням */}
                {dailyStats.length > 0 && (
                    <Card className="shadow-sm mb-4">
                        <Card.Body>
                            <Card.Title className="text-center">Динамика прогресса по дням</Card.Title>
                            <Line data={progressChartData} options={progressChartOptions} />
                        </Card.Body>
                    </Card>
                )}

                {/* 2.2. График прогресса по сессиям */}
                {recentSessions.length > 2 && (
                    <Card className="shadow-sm mb-4">
                        <Card.Body>
                            <Card.Title className="text-center">Динамика прогресса по последним тренировкам</Card.Title>
                            <Line data={sessionChartData} options={sessionChartOptions} />
                        </Card.Body>
                    </Card>
                )}

                {/* 3. Дополнительные графики */}
                <Row className="mb-4">
                    <Col md={6}>
                        <Card className="shadow-sm h-100">
                            <Card.Body>
                                <Card.Title className="text-center">Распределение тренировок</Card.Title>
                                {Object.keys(lessonTypes).length > 0 ? (
                                    <Doughnut data={pieChartData} />
                                ) : (
                                    <p className="text-muted text-center py-4">Нет данных</p>
                                )}
                            </Card.Body>
                        </Card>
                    </Col>
                    <Col md={6}>
                        <Card className="shadow-sm">
                            <Card.Body>
                                <Card.Title className="text-center">Прогресс точности</Card.Title>
                                {dailyStats.length > 0 ? (
                                    <Bar
                                        data={{
                                            labels: dailyStats.slice(-10).map(item => item.date),
                                            datasets: [{
                                                label: 'Точность (%)',
                                                data: dailyStats.slice(-10).map(item => item.average_accuracy_percentage),
                                                backgroundColor: '#4F849D',
                                            }]
                                        }}
                                        options={{
                                            responsive: true,
                                            scales: { y: { max: 100 } } 
                                        }}
                                    />
                                ) : (
                                    <p className="text-muted text-center py-4">Нет данных</p>
                                )}
                            </Card.Body>
                        </Card>

                        <Card className="shadow-sm">
                            <Card.Body>
                                <Card.Title className="text-center">Прогресс скорости</Card.Title>
                                {dailyStats.length > 0 ? (
                                    <Bar
                                        data={{
                                            labels: dailyStats.slice(-10).map(item => item.date),
                                            datasets: [{
                                                label: 'Скорость (зн/мин)',
                                                data: dailyStats.slice(-10).map(item => item.average_speed_wpm),
                                                backgroundColor: '#37AAAB',
                                            }]
                                        }}
                                        options={{ 
                                            responsive: true, 
                                            scales: { y: { beginAtZero: true } }
                                        }}
                                    />
                                ) : (
                                    <p className="text-muted text-center py-4">Нет данных</p>
                                )}
                            </Card.Body>
                        </Card>
                    </Col>
                </Row>

                {/* 4. Последние тренировки */}
                <Card className="shadow-sm mb-4">
                    <Card.Body>
                        <Card.Title className="mb-3 text-center">
                            <i className="bi bi-clock-history me-2"></i>
                            Последние тренировки
                        </Card.Title>
                        {recentSessions.length > 0 ? (
                            <Table hover responsive>
                                <thead>
                                    <tr>
                                        <th><i className="bi bi-calendar me-1"></i> Дата</th>
                                        <th><i className="bi bi-book me-1"></i> Урок</th>
                                        <th><i className="bi bi-speedometer2 me-1"></i> Скорость</th>
                                        <th><i className="bi bi-bullseye me-1"></i> Точность</th>
                                        <th><i className="bi bi-x-circle me-1"></i> Ошибки</th>
                                        <th><i className="bi bi-stopwatch me-1"></i> Время</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {recentSessions.map(session => (
                                        <tr key={session.id}>
                                            <td>{formatDate(session.finished_at)}</td>
                                            <td>{session.lesson_title || 'Сгенерированный'}</td>
                                            <td>
                                                <Badge
                                                    bg={null}
                                                    style={{ backgroundColor: '#4F849D' }}
                                                >
                                                    {session.average_speed_wpm}
                                                </Badge>
                                            </td>
                                            <td>
                                                <Badge
                                                    bg={null}
                                                    style={{ backgroundColor: session.accuracy_percentage >= 90 ? '#409750' : '#e6a026' }}
                                                >
                                                    {session.accuracy_percentage}%
                                                </Badge>
                                            </td>
                                            <td>{session.total_errors}</td>
                                            <td>{formatTime(session.total_duration_seconds)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </Table>
                        ) : (
                            <p className="text-muted text-center py-3">Нет тренировок</p>
                        )}
                    </Card.Body>
                </Card>

                {/* 5. Проблемные буквы и биграммы */}
                <Row>
                    <Col md={6}>
                        <Card className="shadow-sm mb-4">
                            <Card.Body>
                                <Card.Title className="text-center">
                                    <i className="bi bi-chat-text me-2"></i>
                                    Проблемные буквы
                                </Card.Title>
                                {letterStats.length > 0 ? (
                                    <Table hover size="sm">
                                        <thead>
                                            <tr>
                                                <th><i className="bi bi-keyboard me-1"></i> Буква</th>
                                                <th><i className="bi bi-hand-index me-1"></i> Нажатий</th>
                                                <th><i className="bi bi-x-circle me-1"></i> Ошибок</th>
                                                <th><i className="bi bi-percent me-1"></i> Ошибок</th>
                                                <th><i className="bi bi-clock me-1"></i> Ср. время</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {letterStats.map((item, idx) => (
                                                <tr key={idx}>
                                                    <td><strong>{decodeLetter(item.letter)}</strong></td>
                                                    <td>{item.occurrences}</td>
                                                    <td>{item.errors}</td>
                                                    <td>
                                                        <Badge
                                                            bg={null}
                                                            style={{ backgroundColor: item.error_percent > 15 ? '#dd5132' : '#e6a026' }}
                                                        >
                                                            {item.error_percent}%
                                                        </Badge>
                                                    </td>
                                                    <td>{item.avg_time} мс</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </Table>
                                ) : (
                                    <p className="text-muted text-center py-3">Нет данных</p>
                                )}
                            </Card.Body>
                        </Card>
                    </Col>

                    <Col md={6}>
                        <Card className="shadow-sm mb-4">
                            <Card.Body>
                                <Card.Title className="text-center">
                                    <i className="bi bi-link-45deg me-2"></i>
                                    Проблемные биграммы
                                </Card.Title>
                                {bigramStats.length > 0 ? (
                                    <Table hover size="sm">
                                        <thead>
                                            <tr>
                                                <th><i className="bi bi-link-45deg me-1"></i> Биграмма</th>
                                                <th><i className="bi bi-hand-index me-1"></i> Появлений</th>
                                                <th><i className="bi bi-x-circle me-1"></i> Ошибок</th>
                                                <th><i className="bi bi-percent me-1"></i> Ошибок</th>
                                                <th><i className="bi bi-clock me-1"></i> Ср. время</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {bigramStats.map((item, idx) => (
                                                <tr key={idx}>
                                                    <td><strong>{decodeBigram(item.bigram)}</strong></td>
                                                    <td>{item.occurrences}</td>
                                                    <td>{item.errors}</td>
                                                    <td>
                                                        <Badge
                                                            bg={null}
                                                            style={{backgroundColor: item.error_percent > 20 ? '#dd5132' : '#e6a026' }}
                                                        >
                                                            {item.error_percent}%
                                                        </Badge>
                                                    </td>
                                                    <td>{item.avg_time} мс</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </Table>
                                ) : (
                                    <p className="text-muted text-center py-3">Нет данных</p>
                                )}
                            </Card.Body>
                        </Card>
                    </Col>
                </Row>

                {/* 6. Дополнительная статистика */}
                <Row>
                    <Col md={6} className="d-flex">
                        <Card className="shadow-sm w-100">
                            <Card.Body>
                                <Card.Title className="text-center">
                                    <i className="bi bi-trophy me-2"></i>
                                    Личные рекорды
                                </Card.Title>
                                <div className="d-flex justify-content-around text-center mt-3">
                                    <div>
                                        <h3 className="text-primary">{dashboard?.best_speed || 0}</h3>
                                        <small>макс. скорость</small>
                                    </div>
                                    <div>
                                        <h3 className="text-success">{dashboard?.avg_accuracy || 0}%</h3>
                                        <small>сред. точность</small>
                                    </div>
                                    <div>
                                        <h3 className="text-info">{Math.floor((dashboard?.total_time || 0) / 60)} ч</h3>
                                        <small>всего часов</small>
                                    </div>
                                </div>
                            </Card.Body>
                        </Card>
                    </Col>
                    <Col md={6} className="d-flex">
                        <Card className="shadow-sm w-100">
                            <Card.Body>
                                <Card.Title className="text-center">
                                    <i className="bi bi-lightbulb me-2"></i>
                                    Рекомендации
                                </Card.Title>
                                {letterStats.length > 0 && (
                                    <p className="mb-1 mt-4">
                                        <i className="bi bi-arrow-right-circle-fill text-danger me-2"></i>
                                        Чаще всего ошибки в букве <strong>"{decodeLetter(letterStats[0]?.letter)}"</strong> — потренируйте её
                                    </p>
                                )}
                                {bigramStats.length > 0 && (
                                    <p className="mb-1">
                                        <i className="bi bi-arrow-right-circle-fill text-danger me-2"></i>
                                        Проблемная биграмма: <strong>"{decodeBigram(bigramStats[0]?.bigram)}"</strong>
                                    </p>
                                )}
                                {(!letterStats.length && !bigramStats.length) && (
                                    <p className="text-muted mt-4">
                                        <i className="bi bi-info-circle me-2"></i>
                                        Пройдите несколько уроков для получения рекомендаций
                                    </p>
                                )}
                            </Card.Body>
                        </Card>
                    </Col>
                </Row>
            </Container>
            
            <Footer />
        </div>
    );
};

export default StatsPage;