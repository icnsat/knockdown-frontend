import { useState } from 'react';
import { Form, Button, Alert, Row, Col } from 'react-bootstrap';
import { useDispatch, useSelector } from 'react-redux';
import { registerUser } from '../slices/authSlice';

const RegisterForm = ({ onSuccess }) => {
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: '',
        re_password: '',
    });
    
    const [validationErrors, setValidationErrors] = useState({});
    
    const dispatch = useDispatch();
    const { isLoading, error } = useSelector((state) => state.auth);

    const validate = () => {
        const errors = {};
        
        if (!formData.username.trim()) {
            errors.username = 'Логин обязателен';
        } else if (formData.username.length < 3) {
            errors.username = 'Минимум 3 символа';
        }
        
        if (!formData.email.trim()) {
            errors.email = 'Email обязателен';
        } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
            errors.email = 'Неверный формат email';
        }
        
        if (!formData.password) {
            errors.password = 'Пароль обязателен';
        } else if (formData.password.length < 6) {
            errors.password = 'Минимум 6 символов';
        }
        
        if (formData.password !== formData.re_password) {
            errors.re_password = 'Пароли не совпадают';
        }
        
        return errors;
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
        
        if (validationErrors[name]) {
            setValidationErrors(prev => ({ ...prev, [name]: null }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        const errors = validate();
        if (Object.keys(errors).length > 0) {
            setValidationErrors(errors);
            return;
        }

        const result = await dispatch(registerUser(formData));
        
        if (!result.error) {
            onSuccess();
        }
    };

    return (
        <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-3" controlId="regUsername">
                <Form.Control
                    type="text"
                    name="username"
                    placeholder="Логин"
                    value={formData.username}
                    onChange={handleChange}
                    isInvalid={!!validationErrors.username}
                    disabled={isLoading}
                />
                <Form.Control.Feedback type="invalid">
                    {validationErrors.username}
                </Form.Control.Feedback>
            </Form.Group>

            <Form.Group className="mb-3" controlId="regEmail">
                <Form.Control
                    type="email"
                    name="email"
                    placeholder="Email"
                    value={formData.email}
                    onChange={handleChange}
                    isInvalid={!!validationErrors.email}
                    disabled={isLoading}
                />
                <Form.Control.Feedback type="invalid">
                    {validationErrors.email}
                </Form.Control.Feedback>
            </Form.Group>

            <Form.Group className="mb-3" controlId="regPassword">
                <Form.Control
                    type="password"
                    name="password"
                    placeholder="Пароль"
                    value={formData.password}
                    onChange={handleChange}
                    isInvalid={!!validationErrors.password}
                    disabled={isLoading}
                />
                <Form.Control.Feedback type="invalid">
                    {validationErrors.password}
                </Form.Control.Feedback>
            </Form.Group>

            <Form.Group className="mb-3" controlId="regRePassword">
                <Form.Control
                    type="password"
                    name="re_password"
                    placeholder="Повторите пароль"
                    value={formData.re_password}
                    onChange={handleChange}
                    isInvalid={!!validationErrors.re_password}
                    disabled={isLoading}
                />
                <Form.Control.Feedback type="invalid">
                    {validationErrors.re_password}
                </Form.Control.Feedback>
            </Form.Group>
            {error && (
                <Alert variant="danger" className="mt-3 border-0">
                    {typeof error === 'string' ? error : 'Ошибка регистрации'}
                </Alert>
            )}

            <Button 
                type="submit" 
                className="w-100 py-2 fw-bold"
                style={{ 
                    backgroundColor: '#8c6e98',
                    borderColor: '#8c6e98'
                }}
                disabled={isLoading}
            >
                {isLoading ? 'Регистрация...' : 'Зарегистрироваться'}
            </Button>
        </Form>
    );
};

export default RegisterForm;