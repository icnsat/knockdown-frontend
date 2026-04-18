import { useState } from 'react';
import { Col, Card, Nav, Alert } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import LoginForm from '../components/LoginForm';
import RegisterForm from '../components/RegisterForm';

const AuthPage = () => {
    const [activeTab, setActiveTab] = useState('login');
    const [message, setMessage] = useState(null);
    const navigate = useNavigate();

    const handleAuthSuccess = (type) => {
        if (type === 'login') {
            navigate('/');
        } else if (type === 'register') {
            setMessage({
                variant: 'success',
                text: 'Регистрация успешна! Теперь вы можете войти.'
            });
            setActiveTab('login');
        }
    };

    return (
        // <Container fluid className="min-vh-100 d-flex align-items-center justify-content-center">
        <div className="d-flex flex-column" style={{ minHeight: '88vh' }}>
            <Header />

            {/* <Row className="w-100"> */}
            <div className="d-flex flex-grow-1 align-items-center">
                <Col md={6} lg={5} xl={4} className="mx-auto">
                    <Card className="border-0 rounded-4">
                        <Card.Body className="p-5">                            
                            {message && (
                                <Alert 
                                    variant={message.variant} 
                                    className="mb-4"
                                    onClose={() => setMessage(null)}
                                    dismissible
                                >
                                    {message.text}
                                </Alert>
                            )}
                            
                            <Nav variant="tabs" className="mb-4 justify-content-center" activeKey={activeTab}>
                                <Nav.Item>
                                    <Nav.Link 
                                        eventKey="login" 
                                        onClick={() => setActiveTab('login')}
                                        className={activeTab === 'login' ? 'fw-bold' : ''}
                                        style={{ 
                                            color: '#8c6e98',
                                        }}
                                    >
                                        Вход
                                    </Nav.Link>
                                </Nav.Item>
                                <Nav.Item>
                                    <Nav.Link 
                                        eventKey="register" 
                                        onClick={() => setActiveTab('register')}
                                        className={activeTab === 'register' ? 'fw-bold' : ''}
                                        style={{ 
                                            color: '#8c6e98',
                                        }}
                                    >
                                        Регистрация
                                    </Nav.Link>
                                </Nav.Item>
                            </Nav>

                            {activeTab === 'login' ? (
                                <LoginForm onSuccess={() => handleAuthSuccess('login')} />
                            ) : (
                                <RegisterForm onSuccess={() => handleAuthSuccess('register')} />
                            )}
                        </Card.Body>
                    </Card>
                </Col>
            {/* </Row> */}
            </div>

            <Footer />
        </div>
        // </Container>
    );
};

export default AuthPage;