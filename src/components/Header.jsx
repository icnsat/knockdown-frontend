import { Navbar, Nav, Container, Button } from 'react-bootstrap';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { fetchUserProfile } from '../slices/authSlice';
import { useState, useEffect } from 'react';

import iconLight from '../assets/logo192.png';
import iconDark from '../assets/logo192-dark.png';

const Header = () => {
    const { isAuthenticated, user, accessToken } = useSelector((state) => state.auth);
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const location = useLocation();

    const [theme, setTheme] = useState(
        localStorage.getItem('theme') ||
        document.body.getAttribute('data-bs-theme') || 'light'
    );
        
    useEffect(() => {
        if (accessToken && !user) {
            dispatch(fetchUserProfile());
        }
    }, [accessToken, user, dispatch]);


    useEffect(() => {
        document.body.setAttribute('data-bs-theme', theme);
        localStorage.setItem('theme', theme);
    }, [theme]);

    const handleHomeClick = (e) => {
        e.preventDefault();
        if (location.pathname === '/') {
            window.location.reload();
        } else {
            navigate('/');
        }
    };

    const handleLogoClick = (e) => {
        e.preventDefault();
        e.stopPropagation(); // Предотвращаем всплытие события
        setTheme(prevTheme => prevTheme === 'light' ? 'dark' : 'light');
    };

    const currentIcon = theme === 'light' ? iconLight : iconDark;

    return (
        <Navbar expand="lg" className="px-4">
            <Container fluid>
                <div className="d-flex align-items-center">
                    {/* ЛОГО - меняет тему при нажатии */}
                    <img 
                        src={currentIcon}
                        alt="logo" 
                        width="30" 
                        height="30" 
                        className="me-2"
                        onClick={handleLogoClick}
                        style={{ cursor: 'pointer' }}
                    />
                    
                    {/* НАЗВАНИЕ - обновляет страницу при нажатии */}
                    <Navbar.Brand
                        onClick={handleHomeClick}
                        className="fw-bold fs-3"
                        style={{ cursor: 'pointer' }}
                    >
                        KNOCKDOWN
                    </Navbar.Brand>
                </div>

                <Navbar.Toggle aria-controls="basic-navbar-nav" />
                
                <Navbar.Collapse id="basic-navbar-nav">
                    <Nav className="me-auto">
                        <Nav.Link
                            href="/"
                            onClick={handleHomeClick}
                        >
                            Главная
                        </Nav.Link>
                        <Nav.Link as={Link} to="/lessons">Уроки</Nav.Link>
                        <Nav.Link as={Link} to="/stats">Статистика</Nav.Link>
                    </Nav>
                    
                    <Nav>
                        {isAuthenticated ? (
                            <Nav.Link as={Link} to="/profile">
                                {user?.username || 'Профиль'}
                            </Nav.Link>
                        ) : (
                            <Button 
                                variant="outline" 
                                size="sm"
                                as={Link} 
                                to="/auth"
                            >
                                Вход
                            </Button>
                        )}
                    </Nav>
                </Navbar.Collapse>
            </Container>
        </Navbar>
    );
};

export default Header;