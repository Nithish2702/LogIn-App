import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from './config/api';
import './Login.css';

const Login: React.FC = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [rememberMe, setRememberMe] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        // Load remembered username
        const savedUsername = localStorage.getItem('rememberedUsername');
        if (savedUsername) {
            setUsername(savedUsername);
            setRememberMe(true);
        }
    }, []);

    const validateInput = () => {
        if (!username.trim()) {
            setError('Username is required');
            return false;
        }
        if (username.length < 3) {
            setError('Username must be at least 3 characters');
            return false;
        }
        if (!password) {
            setError('Password is required');
            return false;
        }
        if (password.length < 6) {
            setError('Password must be at least 6 characters');
            return false;
        }
        return true;
    };

    const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError('');

        if (!validateInput()) {
            return;
        }

        setIsLoading(true);

        try {
            const response = await api.post('/login', { 
                username: username.trim().toLowerCase(), 
                password 
            });
            
            if (response.status === 200) {
                // Save username to localStorage
                localStorage.setItem('username', response.data.username);
                
                // Remember username if checkbox is checked
                if (rememberMe) {
                    localStorage.setItem('rememberedUsername', response.data.username);
                } else {
                    localStorage.removeItem('rememberedUsername');
                }
                
                navigate('/welcome');
            }
        } catch (err: any) {
            if (err.response && err.response.data) {
                setError(err.response.data.message);
            } else if (err.message) {
                setError(err.message);
            } else {
                setError('An error occurred. Please try again.');
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="login-container">
            <div className="login-box">
                <h2>Login</h2>
                <form onSubmit={handleLogin}>
                    <div className="form-group">
                        <input
                            type="text"
                            placeholder="Username"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            disabled={isLoading}
                            required
                            autoComplete="username"
                        />
                    </div>
                    <div className="form-group">
                        <input
                            type="password"
                            placeholder="Password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            disabled={isLoading}
                            required
                            autoComplete="current-password"
                        />
                    </div>
                    <div className="form-group checkbox-group">
                        <label>
                            <input
                                type="checkbox"
                                checked={rememberMe}
                                onChange={(e) => setRememberMe(e.target.checked)}
                                disabled={isLoading}
                            />
                            Remember username
                        </label>
                    </div>
                    <button 
                        type="submit" 
                        className="login-button"
                        disabled={isLoading}
                    >
                        {isLoading ? 'Logging in...' : 'Login'}
                    </button>
                </form>
                {error && <p className="error-message">{error}</p>}
                <div className="demo-credentials">
                    <p>Need an account?</p>
                    <button 
                        onClick={() => navigate('/register')} 
                        className="register-link-button"
                        disabled={isLoading}
                    >
                        Create New Account
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Login;
