import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Container } from 'react-bootstrap';

import { Provider } from 'react-redux';
import { store } from './app/store';
import ProtectedRoute from './components/ProtectedRoute';

import LessonPage from './pages/LessonPage';
import LessonListPage from './pages/LessonListPage';
import AuthPage from './pages/AuthPage';
import ProfilePage from './pages/ProfilePage';
import StatsPage from './pages/StatsPage';


function App() {
	return (
		<Provider store={store}>
            <Container className="col-lg-10 mx-auto p-4 py-md-5">
                <BrowserRouter>
					<Routes>
                        {/* Главная страница (без ID) - случайные уроки/генерация */}
                        <Route path="/" element={<LessonPage />}></Route>
                    	
                        {/* Список всех уроков */}
                        <Route path="/lessons" element={<LessonListPage />} />

                        {/* Системные уроки по ID */}
                        <Route path="/lesson/:lessonId" element={<LessonPage />} />

                        {/* Полная статистика пользователя */}
                        <Route path="/stats" element={<StatsPage />} />
                        
                        {/* Аутентификация */}
                        <Route path="/auth" element={<AuthPage />} />

                        {/* Защищённые маршруты */}
                        <Route element={<ProtectedRoute />}>
                            <Route path="/profile" element={<ProfilePage />} />
                        </Route>
                    </Routes>
                </BrowserRouter>
            </Container>
        </Provider>
	);
}

export default App;
