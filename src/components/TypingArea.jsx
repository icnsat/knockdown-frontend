import { useState, useEffect, useCallback } from 'react';
import { Card, ProgressBar } from 'react-bootstrap';

const TypingArea = ({ lesson, onComplete }) => {
    const [userInput, setUserInput] = useState('');
    const [startTime, setStartTime] = useState(null);
    const [errorHistory, setErrorHistory] = useState([]);
    const [keystrokes, setKeystrokes] = useState([]);
    const [isCompleted, setIsCompleted] = useState(false);
    const [errorPositions, setErrorPositions] = useState(new Set());

    const targetText = lesson.content;
    const characters = targetText.length;
    const progress = (userInput.length / targetText.length) * 100;

    const getLetterColor = (index) => {
        // Если позиция еще не пройдена - прозрачный фон
        if (index >= userInput.length) {
            return 'transparent';
        }
        
        const currentChar = userInput[index];
        const targetChar = targetText[index];
        const isCorrect = currentChar === targetChar;
        
        // Проверяем, была ли здесь ошибка в истории
        const hadError = errorHistory.some(err => err.position === index);
        
        if (!isCorrect) {
            return '#fbcfcf'; // красный для текущей ошибки
        } else if (hadError) {
            return '#fff3cd'; // желтый для исправленных ошибок
        } else {
            return '#d4edda'; // зеленый для правильных
        }
    };

    // Завершение урока
    const completeLesson = useCallback(() => {
        if (isCompleted) return;
        
        setIsCompleted(true);
        const endTime = Date.now();
        
        const duration = (endTime - startTime) / 1000;
        const minutes = duration / 60;
        const wpm = Math.round((characters / 5) / minutes);
        
        // Считаем количество уникальных позиций с ошибками
        const uniqueErrors = errorPositions.size;
        const accuracy = Math.round(((characters - uniqueErrors) / characters) * 100);

        // Статистика по буквам (с учетом всех ошибок и временем нажатия)
        const letterStats = {};

        // Сначала инициализируем все буквы из текста
        targetText.split('').forEach((char, index) => {
            if (!letterStats[char]) {
                letterStats[char] = {
                    occurrences: 0,
                    errors: 0,
                    totalTime: 0,     // суммарное время для вычисления среднего
                    hitTimes: []       // массив всех времен нажатий 
                };
            }
        });

        // Заполняем статистику из keystrokes
        keystrokes.forEach(keystroke => {
            const char = keystroke.expected; // используем ожидаемый символ
            
            if (letterStats[char]) {
                letterStats[char].occurrences++;
                letterStats[char].totalTime += keystroke.hitTime;
                letterStats[char].hitTimes.push(keystroke.hitTime);

                // Считаем ошибку, если позиция есть в errorPositions
                if (errorPositions.has(keystroke.position)) {
                    letterStats[char].errors++;
                }
            }
        });

        // Вычисляем среднее время для каждой буквы
        Object.keys(letterStats).forEach(char => {
            if (letterStats[char].occurrences > 0) {
                letterStats[char].avgTime = 
                    Math.round(letterStats[char].totalTime / letterStats[char].occurrences);
            } else {
                letterStats[char].avgTime = 0;
            }
            // Удаляем промежуточные поля
            delete letterStats[char].totalTime;
            delete letterStats[char].hitTimes;
        });


        // Статистика по биграммам
        const bigramStats = {};
        for (let i = 1; i < targetText.length; i++) {
            const expectedBigram = targetText[i-1] + targetText[i];
            
            if (!bigramStats[expectedBigram]) {
                bigramStats[expectedBigram] = {
                    occurrences: 0, 
                    errors: 0,
                    totalTime: 0 
                };
            }
            bigramStats[expectedBigram].occurrences++;
            
            // Биграмма считается ошибочной, если хотя бы одна из позиций содержит ошибку
            if (errorPositions.has(i-1) || errorPositions.has(i)) {
                bigramStats[expectedBigram].errors++;
            }

            // Время перехода
            const strokeAtI = keystrokes.find(k => k.position === i);
            const strokeAtPrev = keystrokes.find(k => k.position === i-1);
            
            if (strokeAtI && strokeAtPrev) {
                const transitionTime = strokeAtI.timestamp - strokeAtPrev.timestamp;
                bigramStats[expectedBigram].totalTime += transitionTime;
            }
        }

        // Вычисляем среднее время для биграмм
        Object.keys(bigramStats).forEach(bigram => {
            if (bigramStats[bigram].occurrences > 0) {
                bigramStats[bigram].avgTime = 
                    Math.round(bigramStats[bigram].totalTime / bigramStats[bigram].occurrences);
            }
            delete bigramStats[bigram].totalTime;
        });

        // Передаем результаты
        onComplete({
            speed: wpm,
            accuracy,
            duration: Math.round(duration),
            characters,
            errors: uniqueErrors,
            totalMistakes: errorHistory.length,
            errorHistory,
            letterStats,      // теперь содержит avgTime для каждой буквы
            bigramStats,
            keystrokes        // содержит hitTime для каждого нажатия
        });
    }, [startTime, characters, errorPositions, errorHistory, keystrokes, targetText, onComplete, isCompleted]);


    // Обработчик нажатий клавиш
    const handleKeyDown = useCallback((e) => {
        if (isCompleted) return;

        // Игнорируем специальные клавиши
        if (e.key === 'Shift' || e.key === 'Control' || e.key === 'Alt' || 
            e.key === 'Meta' || e.key === 'CapsLock' || e.key === 'Tab' ||
            e.key === 'Escape') {
            return;
        }

        e.preventDefault();

        // Засекаем время первого нажатия
        if (!startTime && e.key.length === 1) {
            setStartTime(Date.now());
        }

        // Обработка Backspace
        if (e.key === 'Backspace') {
            if (userInput.length > 0) {
                // const lastPos = userInput.length - 1;
                
                // Удаляем последний символ
                setUserInput(prev => prev.slice(0, -1));
                
                // Удаляем последнее нажатие
                setKeystrokes(prev => prev.slice(0, -1));
            }
            return;
        }

        // Обрабатываем только печатные символы
        if (e.key.length === 1 && userInput.length < targetText.length) {
            const currentPos = userInput.length;
            const expectedChar = targetText[currentPos];
            const pressedKey = e.key;

            const isError = pressedKey !== expectedChar;


            const currentTimestamp = Date.now();

            // Вычисляем время нажатия (интервал с предыдущим нажатием)
            let hitTime = 0;
            if (keystrokes.length > 0) {
                const prevKeystroke = keystrokes[keystrokes.length - 1];
                hitTime = currentTimestamp - prevKeystroke.timestamp;
            }

            // Сохраняем информацию о нажатии
            const newKeystroke = {
                expected: expectedChar,
                actual: pressedKey,
                position: currentPos,
                timestamp: currentTimestamp,
                hitTime: hitTime, // добавляем время нажатия
                correct: !isError
            };

            setKeystrokes(prev => [...prev, newKeystroke]);

            if (isError) {
                setErrorPositions(prev => new Set(prev).add(currentPos));
                setErrorHistory(prev => [...prev, {
                    position: currentPos,
                    expected: expectedChar,
                    actual: pressedKey,
                    timestamp: currentTimestamp
                }]);
            }

            setUserInput(prev => prev + pressedKey);

            // Проверка завершения
            if (currentPos + 1 === targetText.length) {
                completeLesson();
            }
        }
    }, [userInput, startTime, targetText, isCompleted, keystrokes, completeLesson]);


    useEffect(() => {
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [handleKeyDown]);

    return (
        <Card className="shadow-sm border-0">
            <Card.Body>                
                <div 
                    className="p-4 rounded-3 mb-3 font-monospace"
                    style={{ 
                        fontSize: '1.3rem', 
                        lineHeight: '2',
                        minHeight: '150px',
                        userSelect: 'none'
                    }}
                >
                    {targetText.split('').map((char, index) => {
                        const isPassed = index < userInput.length;
                        
                        return (
                            <span
                                key={index}
                                style={{
                                    backgroundColor: isPassed ? getLetterColor(index) : 'transparent',
                                    padding: '2px 4px',
                                    margin: '0 1px',
                                    borderRadius: '3px',
                                    borderBottom: isPassed && errorPositions.has(index) ? '3px solid #ffc107' : 'none',
                                    fontWeight: isPassed && errorPositions.has(index) ? 'bold' : 'normal'
                                }}
                            >
                                {char}
                            </span>
                        );
                    })}
                </div>

                <ProgressBar 
                    now={progress} 
                    className="mb-2"
                    style={{ 
                        height: '20px',
                        borderRadius: '10px'
                    }}
                >
                    <div 
                        style={{ 
                            width: `${progress}%`, 
                            backgroundColor: '#8c6e98',
                            height: '100%',
                            borderRadius: '10px',
                            transition: 'width 0.3s ease',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'white',
                            fontSize: '12px'
                        }}
                    >
                    </div>
                </ProgressBar>

                <div className="d-flex justify-content-between text-muted small">
                    <span>Осталось: {targetText.length - userInput.length} символов</span>
                    <span>
                        Ошибок: {errorPositions.size}
                    </span>
                    {startTime && (
                        <span>
                            Время: {Math.round((Date.now() - startTime) / 1000)}с
                        </span>
                    )}
                </div>
            </Card.Body>
        </Card>
    );
};

export default TypingArea;