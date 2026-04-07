import { useState } from 'react';
import { Form, Button, Alert, InputGroup } from 'react-bootstrap';
import { Eye, EyeSlash } from 'react-bootstrap-icons';
import { useDispatch, useSelector } from 'react-redux';
import { loginUser } from '../slices/authSlice';

const LoginForm = ({ onSuccess }) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [validationErrors, setValidationErrors] = useState({});
    
    const dispatch = useDispatch();
    const { isLoading, error } = useSelector((state) => state.auth);

    const validate = () => {
        const errors = {};
        if (!username.trim()) errors.username = 'Введите логин';
        if (!password) errors.password = 'Введите пароль';
        return errors;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        const errors = validate();
        if (Object.keys(errors).length > 0) {
            setValidationErrors(errors);
            return;
        }

        const result = await dispatch(loginUser({ username, password }));
        
        if (!result.error) {
            onSuccess();
        }
    };

    return (
        <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-3" controlId="formUsername">
                <Form.Control
                    type="text"
                    placeholder="Логин"
                    value={username}
                    onChange={(e) => {
                        setUsername(e.target.value);
                        setValidationErrors({});
                    }}
                    isInvalid={!!validationErrors.username}
                    disabled={isLoading}
                />
                <Form.Control.Feedback type="invalid">
                    {validationErrors.username}
                </Form.Control.Feedback>
            </Form.Group>

            <Form.Group className="mb-3" controlId="formPassword">
                <InputGroup>
                    <Form.Control
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Пароль"
                        value={password}
                        onChange={(e) => {
                            setPassword(e.target.value);
                            setValidationErrors({});
                        }}
                        isInvalid={!!validationErrors.password}
                        disabled={isLoading}
                    />
                    <Button 
                        variant="outline-secondary"
                        onClick={() => setShowPassword(!showPassword)}
                        disabled={isLoading}
                    >
                        {showPassword ? <EyeSlash size={20} /> : <Eye size={20}/>}
                    </Button>
                    <Form.Control.Feedback type="invalid">
                        {validationErrors.password}
                    </Form.Control.Feedback>
                </InputGroup>
            </Form.Group>

            {error && (
                <Alert variant="danger" className="mt-3 border-0">
                    {typeof error === 'string' ? error : 'Неверный логин или пароль'}
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
                {isLoading ? 'Вход...' : 'Войти'}
            </Button>
        </Form>
    );
};

export default LoginForm;