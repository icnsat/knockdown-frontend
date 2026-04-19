import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Spinner, Alert, Row, Col, Card, Badge, Form } from 'react-bootstrap';
import { useSelector } from 'react-redux';
import Header from '../components/Header';
import Footer from '../components/Footer';
import TypingArea from '../components/TypingArea';
import StatsArea from '../components/StatsArea';
import api from '../api/api';

const LessonPage = () => {
    const decodeText = (str) => {
        if (!str) return str;
        return str.replace(/\\s/g, '␣');
    };

    const { lessonId } = useParams();
    const navigate = useNavigate();
    
    const [lesson, setLesson] = useState(null);
    const [loading, setLoading] = useState(true);
    const [sessionStats, setSessionStats] = useState(null);
    const [savingStatus, setSavingStatus] = useState(null);
    const [error, setError] = useState(null);
    const [isGeneratedLesson, setIsGeneratedLesson] = useState(false);
    const [allLessons, setAllLessons] = useState([]); // для проверки наличия следующего урока    

    const [generateType, setGenerateType] = useState('letters'); // 'auto', 'letters', 'bigrams'
    const [generating, setGenerating] = useState(false);

    const { isAuthenticated } = useSelector((state) => state.auth);

    // Загрузка всех уроков (для проверки наличия следующего)
    useEffect(() => {
        const fetchAllLessons = async () => {
            try {
                const response = await api.get('/lessons/lessons/');
                setAllLessons(response.data);
            } catch (error) {
                console.error('Ошибка загрузки списка уроков:', error);
            }
        };
        fetchAllLessons();
    }, []);


    const generateNewLesson = useCallback(async (type) => {
        if (!isAuthenticated) return;
        
        setError(null);
        setSessionStats(null);

        // Таймер для показа текста "Загрузка урока" через 2 секунды (а то неприятно моргает интерфейс)
        let timer = setTimeout(() => {
            setGenerating(true);
        }, 2000);
        
        try {
            const response = await api.post('/lessons/generate/', { type });
            setLesson(response.data);
            setIsGeneratedLesson(true);
        } catch (error) {
            console.error('Ошибка генерации урока:', error);
            setError('Не удалось сгенерировать урок');
        } finally {
            clearTimeout(timer);
            setGenerating(false);
        }
    }, [isAuthenticated]);

    // Обработчик переключения слайдера
    const handleTypeChange = (e) => {
        const newType = e.target.checked ? 'bigrams' : 'letters';
        setGenerateType(newType);
        generateNewLesson(newType);
    };

    // Загрузка урока (только при первом монтировании или изменении lessonId)
    useEffect(() => {
        const fetchLesson = async () => {
            setLoading(true);
            setError(null);
            setSessionStats(null); // Сбрасываем статистику при загрузке нового урока
            
            try {
                let response;
                
                if (lessonId) {
                    // Случай 1: Системный урок по ID
                    console.log(`Загрузка системного урока ${lessonId}`);
                    response = await api.get(`/lessons/lessons/${lessonId}/`);
                    setIsGeneratedLesson(false);
                    setLesson(response.data);
                } else {
                    // Случай 2: Главная страница - генерация или случайный урок
                    console.log('Загрузка урока для главной страницы');
                    
                    if (isAuthenticated) {
                        // Авторизован - генерируем автоматически
                        const response = await api.post('/lessons/generate/', { type: 'letters' });
                        setIsGeneratedLesson(true);
                        setLesson(response.data);
                    } else {
                        // Не авторизован - случайный системный урок
                        const lessonsResponse = await api.get('/lessons/lessons/');
                        const lessons = lessonsResponse.data;
                        
                        if (lessons.length > 0) {
                            const randomIndex = Math.floor(Math.random() * lessons.length);
                            const randomLessonId = lessons[randomIndex].id;
                            response = await api.get(`/lessons/lessons/${randomLessonId}/`);
                        } else {
                            throw new Error('Нет доступных уроков');
                        }
                        setIsGeneratedLesson(false);
                        setLesson(response.data);
                    }
                }
            } catch (error) {
                console.error('Ошибка загрузки урока:', error);
                setError('Не удалось загрузить урок. Пожалуйста, попробуйте позже.');
            } finally {
                setLoading(false);
            }
        };

        fetchLesson();
    }, [lessonId, isAuthenticated]); // При изменении lessonId загружаем новый урок и сбрасываем статистику

    // Проверка наличия следующего урока
    const hasNextLesson = () => {
        if (!lessonId || !allLessons.length) return false;
        
        const currentIndex = allLessons.findIndex(l => l.id === parseInt(lessonId));
        return currentIndex !== -1 && currentIndex < allLessons.length - 1;
    };

    // Получение ID следующего урока
    const getNextLessonId = () => {
        if (!lessonId || !allLessons.length) return null;
        
        const currentIndex = allLessons.findIndex(l => l.id === parseInt(lessonId));
        if (currentIndex !== -1 && currentIndex < allLessons.length - 1) {
            return allLessons[currentIndex + 1].id;
        }
        return null;
    };

    // Отправка статистики на бэкенд
    const sendStatsToBackend = async (stats) => {
        if (!isAuthenticated) {
            console.log('Пользователь не авторизован, статистика не сохраняется');
            return;
        }

        setSavingStatus('saving');

        try {
            const startTime = stats.keystrokes[0]?.timestamp || Date.now() - stats.duration * 1000;

            const sessionData = {
                lesson: isGeneratedLesson ? null : lesson.id,
                total_duration_seconds: stats.duration,
                total_characters_typed: stats.characters,
                total_errors: stats.errors,
                average_speed_wpm: stats.speed,
                accuracy_percentage: stats.accuracy,
                started_at: new Date(startTime).toISOString(),
                finished_at: new Date(Date.now()).toISOString(),
                
                letter_stats: Object.entries(stats.letterStats).map(([letter, data]) => ({
                    letter: letter.replace(/ /g, '\\s'),
                    occurrences: data.occurrences,
                    errors: data.errors,
                    average_hit_time_ms: data.avgTime || 0
                })),
                
                bigram_stats: Object.entries(stats.bigramStats).map(([bigram, data]) => ({
                    bigram: bigram.replace(/ /g, '\\s'),
                    occurrences: data.occurrences,
                    errors: data.errors,
                    average_transition_time_ms: data.avgTime || 0
                }))
            };

            console.log(sessionData);

            await api.post('/stats/sessions/', sessionData);
            setSavingStatus('saved');
            setTimeout(() => setSavingStatus(null), 3000);
            
        } catch (error) {
            console.error('Ошибка при сохранении статистики:', error);
            setSavingStatus('error');
            setTimeout(() => setSavingStatus(null), 5000);
        }
    };

    const handleLessonComplete = (stats) => {
        setSessionStats(stats);
        sendStatsToBackend(stats);
    };

    const handleRestart = () => {
        setSessionStats(null);
        setSavingStatus(null);
    };

    const handleNextLesson = () => {
        if (hasNextLesson()) {
            const nextId = getNextLessonId();
            navigate(`/lesson/${nextId}`);
        } else {
            // Если следующего урока нет - на страницу со всеми уроками
            navigate('/lessons');
        }
    };

    const handleNewLesson = () => {
        // Для сгенерированных - просто перезагружаем для нового урока
        window.location.reload();
    };

    const handleGoToLessonsList = () => {
        navigate('/lessons');
    };

    if (loading) {
        return (
            <>
                <Header />
                <Container className="text-center mt-5">
                    <Spinner animation="border" variant="primary" />
                    <p className="mt-3">Загрузка урока...</p>
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
                        <button 
                            className="btn btn-primary"
                            onClick={() => navigate('/')}
                        >
                            Вернуться на главную
                        </button>
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
                {/* Информационная карточка для неавторизованных на главной */}
                {!lessonId && !isAuthenticated && !sessionStats && (
                    <Card className="mb-4 bg-light border-0">
                        <Card.Body>
                            <Row className="align-items-center">
                                <Col md={8}>
                                    <h5>🔐 Тренируйтесь и сохраняйте прогресс</h5>
                                    <p className="mb-0 text-muted">
                                        Сейчас вы проходите случайный урок. 
                                        Войдите в аккаунт, чтобы ваша статистика сохранялась 
                                        и мы могли генерировать персонализированные уроки 
                                        специально под ваши проблемные места!
                                    </p>
                                </Col>
                                <Col md={4} className="text-end">
                                    <button 
                                        className="btn btn-warning me-2"
                                        onClick={() => navigate('/auth')}
                                    >
                                        Войти
                                    </button>
                                </Col>
                            </Row>
                        </Card.Body>
                    </Card>
                )}

                {/* Панель выбора типа генерации (только для авторизованных на главной) */}
                {!lessonId && isAuthenticated && !sessionStats && (
                    <Card className="mb-4 shadow-sm border-0">
                        <Card.Body className="text-center">
                            <h5 className="mb-3">🎯 Выберите тип урока</h5>
                            
                            {/* Слайдер */}
                            <div className="d-flex justify-content-center align-items-center gap-3 mb-4">
                                <span className={generateType === 'letters' ? 'fw-bold text-primary' : 'text-muted'}>
                                    🔤 По буквам
                                </span>
                                <Form.Check
                                    type="switch"
                                    id="generate-type-switch"
                                    checked={generateType === 'bigrams'}
                                    onChange={handleTypeChange}
                                    disabled={generating}
                                    style={{ transform: 'scale(1.2)' }}
                                />
                                <span className={generateType === 'bigrams' ? 'fw-bold text-primary' : 'text-muted'}>
                                    🔗 По биграммам
                                </span>
                            </div>
                            
                            {generating && (
                                <div className="text-muted">
                                    <Spinner animation="border" size="sm" className="me-2" />
                                    Генерация урока...
                                </div>
                            )}
                        </Card.Body>
                    </Card>
                )}

                {/* Индикатор типа урока */}
                {lesson && !sessionStats && (
                    <div className="mb-3 d-flex justify-content-between align-items-center">
                        <div>
                            <h2>{decodeText(lesson.title)}</h2>
                            {lesson.description && (
                                <p className="text-muted">{lesson.description}</p>
                            )}
                        </div>
                        <Badge
                            bg={null}
                            style={{ 
                                fontSize: '1rem',
                                backgroundColor: isGeneratedLesson ? '#8c6e98' : '#eecde4',
                                color: isGeneratedLesson ? '#ffffff' : '#000000'
                            }}
                        >
                            {isGeneratedLesson ? '✨ Персональный урок' : '📚 Системный урок'}
                        </Badge>
                    </div>
                )}

                {/* Область тренировки */}
                {lesson && !sessionStats && (
                    <TypingArea 
                        lesson={lesson}
                        onComplete={handleLessonComplete}
                    />
                )}

                {/* Результаты */}
                {sessionStats && (
                    <>
                        {/* Индикатор сохранения */}
                        {savingStatus === 'saving' && (
                            <Alert variant="info" className="text-center">
                                <Spinner animation="border" size="sm" className="me-2" />
                                Сохранение результатов...
                            </Alert>
                        )}
                        
                        {savingStatus === 'saved' && (
                            <Alert variant="success" className="text-center">
                                ✓ Результаты успешно сохранены!
                            </Alert>
                        )}
                        
                        {savingStatus === 'error' && (
                            <Alert variant="danger" className="text-center">
                                ❌ Ошибка при сохранении результатов
                            </Alert>
                        )}

                        <StatsArea 
                            stats={sessionStats}
                            isAuthenticated={isAuthenticated}
                        />
                        
                        {/* Разные кнопки в зависимости от типа урока */}
                        <div className="text-center mt-3">
                            {/* Кнопка "Пройти еще раз" всегда есть */}
                            <button 
                                className="btn btn-outline-primary me-2"
                                onClick={handleRestart}
                            >
                                Пройти еще раз
                            </button>
                            
                            {lessonId ? (
                                // Системный урок
                                <>
                                    {hasNextLesson() ? (
                                        // Если есть следующий урок - показываем три кнопки
                                        <>
                                            <button 
                                                className="btn btn-outline-success me-2"
                                                onClick={handleNextLesson}
                                            >
                                                Следующий урок →
                                            </button>
                                            <button 
                                                className="btn btn-outline-secondary"
                                                onClick={handleGoToLessonsList}
                                            >
                                                К списку уроков
                                            </button>
                                        </>
                                    ) : (
                                        // Если последний урок - только две кнопки
                                        <button 
                                            className="btn btn-outline-secondary"
                                            onClick={handleGoToLessonsList}
                                        >
                                            К списку уроков
                                        </button>
                                    )}
                                </>
                            ) : (
                                // Сгенерированный урок - всегда две кнопки
                                <>
                                    <button 
                                        className="btn btn-outline-success me-2"
                                        onClick={handleNewLesson}
                                    >
                                        Новый урок ✨
                                    </button>
                                    <button 
                                        className="btn btn-outline-secondary"
                                        onClick={handleGoToLessonsList}
                                    >
                                        К списку уроков
                                    </button>
                                </>
                            )}
                        </div>

                        {/* Подсказка для неавторизованных */}
                        {!isAuthenticated && !lessonId && (
                            <div className="text-center mt-4">
                                <small className="text-muted">
                                    Хотите получать персонализированные уроки? 
                                    <button 
                                        className="btn btn-link p-0 ms-1"
                                        onClick={() => navigate('/register')}
                                    >
                                        Зарегистрируйтесь
                                    </button>
                                </small>
                            </div>
                        )}
                    </>
                )}
            </Container>

            <Footer />
        </div>
    );
};

export default LessonPage;