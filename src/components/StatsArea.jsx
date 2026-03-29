// components/StatsArea.jsx
import React from 'react';
import { Card, Row, Col, Table, ProgressBar } from 'react-bootstrap';
import { Link } from 'react-router-dom';

const StatsArea = ({ stats, isAuthenticated }) => {
    // Функция для отображения пробелов как ␣
    const displayChar = (char) => {
        return char === ' ' ? '␣' : char;
    };

    // Функция для отображения биграмм с пробелами как ␣
    const displayBigram = (bigram) => {
        return bigram.replace(/ /g, '␣');
    };

    // Сортируем буквы по проценту ошибок
    const topLetters = Object.entries(stats.letterStats || {})
        .sort((a, b) => (b[1].errors / b[1].occurrences) - (a[1].errors / a[1].occurrences))
        .slice(0, 5);

    // Сортируем биграммы по проценту ошибок
    const topBigrams = Object.entries(stats.bigramStats || {})
        .sort((a, b) => (b[1].errors / b[1].occurrences) - (a[1].errors / a[1].occurrences))
        .slice(0, 5);

    // Находим самую быструю и самую медленную букву
    const lettersBySpeed = Object.entries(stats.letterStats || {})
        .filter(([_, data]) => data.avgTime > 0)
        .sort((a, b) => a[1].avgTime - b[1].avgTime);
    
    const fastestLetter = lettersBySpeed[0];
    const slowestLetter = lettersBySpeed[lettersBySpeed.length - 1];

    // Данные для графиков
    const speedData = [
        { label: 'Текущая', value: stats.speed, max: 200 },
        { label: 'Цель', value: 100, max: 200 }
    ];

    // Форматирование времени
    const formatTime = (ms) => {
        if (!ms) return '—';
        return `${ms}мс`;
    };

    return (
        <Card className="shadow-sm">
            <Card.Body>
                <Card.Title className="mb-4 text-center fs-3">
                    Результаты тренировки
                </Card.Title>

                {/* Основные метрики */}
                <Row className="mb-4 text-center">
                    <Col md={3}>
                        <div className="p-3 bg-light rounded">
                            <h1 className="text-primary display-4">{stats.speed}</h1>
                            <p className="text-muted mb-0">зн/мин</p>
                        </div>
                    </Col>
                    <Col md={3}>
                        <div className="p-3 bg-light rounded">
                            <h1 className="text-success display-4">{stats.accuracy}%</h1>
                            <p className="text-muted mb-0">точность</p>
                        </div>
                    </Col>
                    <Col md={3}>
                        <div className="p-3 bg-light rounded">
                            <h1 className="text-info display-4">{stats.duration}с</h1>
                            <p className="text-muted mb-0">время</p>
                        </div>
                    </Col>
                    <Col md={3}>
                        <div className="p-3 bg-light rounded">
                            <h1 className="text-warning display-4">{stats.totalMistakes || stats.errors}</h1>
                            <p className="text-muted mb-0">всего ошибок</p>
                        </div>
                    </Col>
                </Row>

                {/* Блок с временем реакции */}
                <Row className="mb-4">
                    <Col md={6}>
                        <Card className="bg-light">
                            <Card.Body>
                                <h5>⏱️ Среднее время нажатия</h5>
                                {fastestLetter && (
                                    <div className="d-flex justify-content-between mb-2">
                                        <span>Самая быстрая буква:</span>
                                        <span>
                                            <strong>"{displayChar(fastestLetter[0])}"</strong> — {formatTime(fastestLetter[1].avgTime)}
                                        </span>
                                    </div>
                                )}
                                {slowestLetter && (
                                    <div className="d-flex justify-content-between">
                                        <span>Самая медленная буква:</span>
                                        <span>
                                            <strong>"{displayChar(slowestLetter[0])}"</strong> — {formatTime(slowestLetter[1].avgTime)}
                                        </span>
                                    </div>
                                )}
                            </Card.Body>
                        </Card>
                    </Col>
                    <Col md={6}>
                        <Card className="bg-light">
                            <Card.Body>
                                <h5>📊 Общее время</h5>
                                <div className="d-flex justify-content-between mb-2">
                                    <span>Всего символов:</span>
                                    <span><strong>{stats.characters}</strong></span>
                                </div>
                                <div className="d-flex justify-content-between">
                                    <span>Среднее время на символ:</span>
                                    <span>
                                        <strong>{Math.round(stats.duration * 1000 / stats.characters)}мс</strong>
                                    </span>
                                </div>
                            </Card.Body>
                        </Card>
                    </Col>
                </Row>

                {/* Графики */}
                <Row className="mb-4">
                    <Col md={6}>
                        <h5>Скорость</h5>
                        {speedData.map((item, idx) => (
                            <div key={idx} className="mb-2">
                                <div className="d-flex justify-content-between">
                                    <span>{item.label}</span>
                                    <span>{item.value} зн/мин</span>
                                </div>
                                <ProgressBar 
                                    now={(item.value / item.max) * 100} 
                                    variant={idx === 0 ? 'primary' : 'secondary'}
                                />
                            </div>
                        ))}
                    </Col>
                    <Col md={6}>
                        <h5>Точность</h5>
                        <div className="text-center">
                            <div style={{ position: 'relative', display: 'inline-block' }}>
                                <svg width="120" height="120">
                                    <circle
                                        cx="60"
                                        cy="60"
                                        r="50"
                                        fill="none"
                                        stroke="#e0e0e0"
                                        strokeWidth="10"
                                    />
                                    <circle
                                        cx="60"
                                        cy="60"
                                        r="50"
                                        fill="none"
                                        stroke="#28a745"
                                        strokeWidth="10"
                                        strokeDasharray={`${2 * Math.PI * 50 * stats.accuracy / 100} ${2 * Math.PI * 50 * (100 - stats.accuracy) / 100}`}
                                        strokeDashoffset={2 * Math.PI * 50 * 0.25}
                                        transform="rotate(-90 60 60)"
                                    />
                                    <text x="60" y="65" textAnchor="middle" fontSize="20">
                                        {stats.accuracy}%
                                    </text>
                                </svg>
                            </div>
                        </div>
                    </Col>
                </Row>

                {/* Блок для неавторизованных */}
                {!isAuthenticated && (
                    <div className="text-center p-4 mb-4 bg-light rounded">
                        <h5 className="text-secondary mb-3">
                            🔐 Хотите сохранять прогресс?
                        </h5>
                        <p className="mb-3">
                            Войдите в аккаунт, чтобы ваши результаты сохранялись 
                            и вы могли отслеживать прогресс со временем!
                        </p>
                        <div className="d-flex justify-content-center gap-3">
                            <Link to="/login" className="btn btn-primary">
                                Войти
                            </Link>
                            <Link to="/register" className="btn btn-outline-primary">
                                Регистрация
                            </Link>
                        </div>
                    </div>
                )}

                {/* Детальная статистика */}
                <Row className="mt-4">
                    <Col md={6}>
                        <h5>Проблемные буквы</h5>
                        <Table striped bordered hover size="sm">
                            <thead>
                                <tr>
                                    <th>Буква</th>
                                    <th>Ошибок</th>
                                    <th>Процент</th>
                                    <th>Ср. время</th>
                                </tr>
                            </thead>
                            <tbody>
                                {topLetters.map(([letter, data]) => (
                                    <tr key={letter}>
                                        <td><strong>{displayChar(letter)}</strong></td>
                                        <td>{data.errors}/{data.occurrences}</td>
                                        <td>
                                            {Math.round((data.errors / data.occurrences) * 100)}%
                                        </td>
                                        <td>{formatTime(data.avgTime)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </Table>
                    </Col>
                    
                    <Col md={6}>
                        <h5>Проблемные биграммы</h5>
                        <Table striped bordered hover size="sm">
                            <thead>
                                <tr>
                                    <th>Биграмма</th>
                                    <th>Ошибок</th>
                                    <th>Процент</th>
                                    <th>Ср. время</th>
                                </tr>
                            </thead>
                            <tbody>
                                {topBigrams.map(([bigram, data]) => (
                                    <tr key={bigram}>
                                        <td><strong>{displayBigram(bigram)}</strong></td>
                                        <td>{data.errors}/{data.occurrences}</td>
                                        <td>
                                            {Math.round((data.errors / data.occurrences) * 100)}%
                                        </td>
                                        <td>{formatTime(data.avgTime)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </Table>
                    </Col>
                </Row>

                {/* Дополнительная информация */}
                <Row className="mt-3">
                    <Col md={12}>
                        <div className="text-muted small">
                            <p className="mb-1">
                                <strong>Всего нажатий:</strong> {stats.keystrokes?.length || 0} | 
                                <strong> Уникальных букв:</strong> {Object.keys(stats.letterStats || {}).length} | 
                                <strong> Уникальных биграмм:</strong> {Object.keys(stats.bigramStats || {}).length}
                            </p>
                        </div>
                    </Col>
                </Row>
            </Card.Body>
        </Card>
    );
};

export default StatsArea;