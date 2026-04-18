import { Card, Row, Col, Table, Badge } from 'react-bootstrap';
import { Link } from 'react-router-dom';

const StatsArea = ({ stats, isAuthenticated }) => {
    // Функция для отображения пробелов как ␣
    const decodeLetter = (letter) => {
        return letter === '\\s' ? '␣' : letter;
    };

    // Функция для отображения биграмм с пробелами как ␣
    const decodeBigram = (bigram) => {
        return bigram.replace(/\\s/g, '␣');
    };

    // Сортировка букв: сначала по проценту ошибок (по убыванию), потом по скорости (по возрастанию)
    const topLetters = Object.entries(stats.letterStats || {})
        .sort((a, b) => {
            const errorA = a[1].errors / a[1].occurrences;
            const errorB = b[1].errors / b[1].occurrences;
            
            if (errorA !== errorB) {
                return errorB - errorA; // по ошибкам (сначала больше)
            }
            return a[1].avgTime - b[1].avgTime; // по скорости (сначала медленнее)
        })
        .slice(0, 5);

    // Сортировка биграмм: сначала по проценту ошибок (по убыванию), потом по времени (по возрастанию)
    const topBigrams = Object.entries(stats.bigramStats || {})
        .sort((a, b) => {
            const errorA = a[1].errors / a[1].occurrences;
            const errorB = b[1].errors / b[1].occurrences;
            
            if (errorA !== errorB) {
                return errorB - errorA; // по ошибкам (сначала больше)
            }
            return a[1].avgTime - b[1].avgTime; // по времени (сначала медленнее)
        })
        .slice(0, 5);

    // Находим самую быструю и самую медленную букву
    const lettersBySpeed = Object.entries(stats.letterStats || {})
        .filter(([_, data]) => data.avgTime > 0)
        .sort((a, b) => a[1].avgTime - b[1].avgTime);
    
    const fastestLetter = lettersBySpeed[0];
    const slowestLetter = lettersBySpeed[lettersBySpeed.length - 1];

    // // Данные для графиков
    // const speedData = [
    //     { label: 'Текущая', value: stats.speed, max: 200 },
    //     { label: 'Цель', value: 100, max: 200 }
    // ];

    // Форматирование времени
    const formatTime = (ms) => {
        if (!ms) return '—';
        return `${ms}мс`;
    };

    return (
        <Card className="border-0">
            <Card.Body>
                <Card.Title className="mb-4 text-center fs-3">
                    Результаты тренировки
                </Card.Title>

                {/* 1. Основные метрики */}
                <Row className="align-items-stretch mb-4">
                    <Col md={3}>
                        <Card
                            className="h-100 text-white text-center p-3"
                            style={{ backgroundColor: '#4F849D' }}
                        >
                            <h2>{stats.speed}</h2>
                            <p className="mb-0">зн/мин</p>
                        </Card>
                    </Col>
                    <Col md={3}>
                        <Card
                            className="h-100 text-white text-center p-3"
                            style={{ backgroundColor: '#37AAAB' }}
                        >
                            <h2>{stats.accuracy}%</h2>
                            <p className="mb-0">точность</p>
                        </Card>
                    </Col>
                    <Col md={3}>
                        <Card
                            className="h-100 text-white text-center p-3"
                            style={{ backgroundColor: '#C87DA8' }}
                        >
                            <h2>{stats.duration}с</h2>
                            <p className="mb-0">время</p>
                        </Card>
                    </Col>
                    <Col md={3}>
                        <Card
                            className="h-100 text-white text-center p-3"
                            style={{ backgroundColor: '#8c6e98' }}
                        >
                            <h2>{stats.totalMistakes || stats.errors}</h2>
                            <p className="mb-0">всего ошибок</p>
                        </Card>
                    </Col>
                </Row>

                {/* 2. Блок с временем реакции */}
                <Row className="mb-4">
                    <Col md={6}>
                        <Card className="bg-light border-0 h-100">
                            <Card.Body>
                                <h5>⏱️ Среднее время нажатия</h5>
                                {fastestLetter && (
                                    <div className="d-flex justify-content-between mb-2">
                                        <span>Самая быстрая буква:</span>
                                        <span>
                                            <strong>"{decodeLetter(fastestLetter[0])}"</strong> — {formatTime(fastestLetter[1].avgTime)}
                                        </span>
                                    </div>
                                )}
                                {slowestLetter && (
                                    <div className="d-flex justify-content-between">
                                        <span>Самая медленная буква:</span>
                                        <span>
                                            <strong>"{decodeLetter(slowestLetter[0])}"</strong> — {formatTime(slowestLetter[1].avgTime)}
                                        </span>
                                    </div>
                                )}
                            </Card.Body>
                        </Card>
                    </Col>
                    <Col md={6}>
                        <Card className="bg-light border-0 h-100">
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
                {/* <Row className="mb-4">
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
                </Row> */}

                {/* 3. Блок для неавторизованных */}
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
                            <Link to="/auth" className="btn btn-primary" style={{ backgroundColor: '#4F849D', border: 'none' }}>
                                Войти
                            </Link>
                            {/* <Link to="/register" className="btn btn-outline-secondary">
                                Регистрация
                            </Link> */}
                        </div>
                    </div>
                )}

                {/* 4. Детальная статистика (проблемные буквы и биграммы) */}
                <Row className="mt-4">
                    <Col md={6}>
                        <h5 className="text-center">🔤 Проблемные буквы</h5>
                        <Table hover size="sm" className="mt-2">
                            <thead>
                                <tr>
                                    <th>Буква</th>
                                    <th>Ошибок</th>
                                    <th>Процент</th>
                                    <th>Ср. время</th>
                                </tr>
                            </thead>
                            <tbody>
                                {topLetters.map(([letter, data]) => {
                                    const errorPercent = Math.round((data.errors / data.occurrences) * 100);
                                    return (
                                        <tr key={letter}>
                                            <td><strong>{decodeLetter(letter)}</strong></td>
                                            <td>{data.errors}/{data.occurrences}</td>
                                            <td>
                                                <Badge
                                                    bg={null}
                                                    style={{ backgroundColor: errorPercent > 15 ? '#dd5132' : '#e6a026' }}
                                                >
                                                    {errorPercent}%
                                                </Badge>
                                            </td>
                                            <td>{formatTime(data.avgTime)}</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </Table>
                    </Col>
                    
                    <Col md={6}>
                        <h5 className="text-center">🔗 Проблемные биграммы</h5>
                        <Table hover size="sm" className="mt-2">
                            <thead>
                                <tr>
                                    <th>Биграмма</th>
                                    <th>Ошибок</th>
                                    <th>Процент</th>
                                    <th>Ср. время</th>
                                </tr>
                            </thead>
                            <tbody>
                                {topBigrams.map(([bigram, data]) => {
                                    const errorPercent = Math.round((data.errors / data.occurrences) * 100);
                                    return (
                                        <tr key={bigram}>
                                            <td><strong>{decodeBigram(bigram)}</strong></td>
                                            <td>{data.errors}/{data.occurrences}</td>
                                            <td>
                                                <Badge
                                                    bg={null}
                                                    style={{ backgroundColor: errorPercent > 20 ? '#dd5132' : '#e6a026' }}
                                                >
                                                    {errorPercent}%
                                                </Badge>
                                            </td>
                                            <td>{formatTime(data.avgTime)}</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </Table>
                    </Col>
                </Row>

                {/* 5. Дополнительная информация */}
                <Row className="mt-3">
                    <Col md={12}>
                        <div className="text-muted small text-center">
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