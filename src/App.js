import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Container } from 'react-bootstrap';

import { Provider } from 'react-redux';
import { store } from './app/store';
import LessonPage from './pages/LessonPage'
import LessonListPage from './pages/LessonListPage'
import AuthPage from './pages/AuthPage'


function App() {
	return (
		<Provider store={store}>
            <Container className="col-lg-10 mx-auto p-4 py-md-5">
                <BrowserRouter>
                    {/* <Header /> */}
					<Routes>
                        {/* Главная страница (без ID) - случайные/генерация */}
                        <Route path="/" element={<LessonPage />}></Route>
                    	

                        {/* Список всех уроков */}
                        <Route path="/lessons" element={<LessonListPage />} />

                        {/* Системные уроки по ID */}
                        <Route path="/lesson/:lessonId" element={<LessonPage />} />
                        
                        {/* Аутентификация */}
                        <Route path="/auth" element={<AuthPage />} />
                        {/* <Route path="/register" element={<AuthPage />} /> */}

						{/*
						<Route path="/registration" element={<Registration />}></Route>
                        <Route path="/login" element={<Login />}></Route>                         
						<Route path="/books" element={<BooksPage />}></Route>
                        <Route path="/books/:bookId" element={<BookDetailsPage />}></Route>


                        <Route path="/bookshelf" element={
                            <ProtectedRoute allowedRoles={['user']}>
                                <BookshelfPage />
                            </ProtectedRoute>
                        }></Route>

                        <Route path="/bookshelf/:bookshelfId" element={
                            <ProtectedRoute allowedRoles={['user']}>
                                <BookshelfDetailsPage />
                            </ProtectedRoute>
                        }></Route>


                        <Route path="/admin/tags" element={
                            <ProtectedRoute allowedRoles={['admin']}>
                                <AdminTagsPage />
                            </ProtectedRoute>
                        }></Route>

                        <Route path="/admin/books" element={
                            <ProtectedRoute allowedRoles={['admin']}>
                                <AdminBooksPage />
                            </ProtectedRoute>
                        }></Route>
						*/}
                    </Routes>

                </BrowserRouter>
            </Container>
        </Provider>
	);
}

export default App;
