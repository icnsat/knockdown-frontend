import { Navigate, Outlet } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Container, Spinner } from 'react-bootstrap';
import Header from '../components/Header';
import Footer from '../components/Footer';

const ProtectedRoute = () => {
    const { isAuthenticated, isLoading } = useSelector((state) => state.auth);

    if (isLoading) {
        return (
            <>
                <Header />
                <Container className="text-center mt-5">
                    <Spinner animation="border" variant="primary" />
                    <p className="mt-3">Загрузка...</p>
                </Container>
                <Footer />
            </>
        );
    }

    return isAuthenticated ? <Outlet /> : <Navigate to="/auth" />;
};

export default ProtectedRoute;