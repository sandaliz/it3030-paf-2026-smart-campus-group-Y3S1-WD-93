import React, { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authService } from '../services/ticketService';
import { useRealTimeValidation } from '../utils/validation';

const LoginPage = () => {
    const { user, login } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();
    
    const {
        values: form,
        errors,
        touched,
        handleChange,
        handleBlur,
        validateAll,
        validateField,
        isFormValid
    } = useRealTimeValidation({ email: '', password: '' });
    
    const [submitting, setSubmitting] = useState(false);
    const [serverError, setServerError] = useState('');

    if (user) {
        const from = location.state?.from?.pathname || "/";
        return <Navigate to={from} replace />;
    }

    const handleFieldChange = (event) => {
        const { name, value } = event.target;
        handleChange(name, value);
        // Clear server error when user starts typing
        if (serverError) {
            setServerError('');
        }
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        setServerError('');
        
        // Validate all fields
        if (!validateAll()) {
            return;
        }
        
        setSubmitting(true);

        try {
            const response = await authService.login(form);
            login(response.token);
            navigate(response.redirectPath || '/', { replace: true });
        } catch (err) {
            setServerError(err.response?.data?.message || err.response?.data || 'Login failed');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="w-full max-w-md px-4">
            <div className="card bg-base-100 shadow-2xl overflow-hidden">
                <div className="bg-primary h-2 w-full"></div>
                <div className="card-body p-8 md:p-10">
                    <div className="avatar mb-4 justify-center">
                        <div className="w-24 rounded-full ring ring-primary ring-offset-base-100 ring-offset-2">
                            <img src="https://img.icons8.com/clouds/200/university.png" alt="Campus Logo" />
                        </div>
                    </div>
                    <h2 className="card-title text-3xl font-bold justify-center mb-2">Smart Campus Hub</h2>
                    <p className="text-base-content/70 mb-6 text-center">Welcome Back! Please sign in to your account with your email and password. </p>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <input
                            type="email"
                            name="email"
                            value={form.email}
                            onChange={handleFieldChange}
                            onBlur={() => handleBlur('email')}
                            className={`input input-bordered w-full ${
                                touched.email && errors.email ? 'input-error' : ''
                            }`}
                            placeholder="Email"
                            required
                        />
                        {touched.email && errors.email && (
                            <label className="label">
                                <span className="label-text-alt text-error text-xs">{errors.email}</span>
                            </label>
                        )}
                        <input
                            type="password"
                            name="password"
                            value={form.password}
                            onChange={handleFieldChange}
                            onBlur={() => handleBlur('password')}
                            className={`input input-bordered w-full ${
                                touched.password && errors.password ? 'input-error' : ''
                            }`}
                            placeholder="Password"
                            required
                        />
                        {touched.password && errors.password && (
                            <label className="label">
                                <span className="label-text-alt text-error text-xs">{errors.password}</span>
                            </label>
                        )}

                        {(serverError || (touched.email && errors.email) || (touched.password && errors.password)) && (
                            <div className="alert alert-error text-sm">
                                <span>{serverError || 'Please fix the errors above'}</span>
                            </div>
                        )}

                        <button
                            type="submit"
                            className="btn btn-primary btn-lg w-full"
                            disabled={submitting || !isFormValid}
                        >
                            {submitting ? 'Signing In...' : 'Login'}
                        </button>
                    </form>

                    <div className="divider">Or</div>

                    <button type="button" onClick={authService.loginWithGoogle} className="btn btn-outline w-full">
                        Continue with Google
                    </button>

                    <p className="text-sm text-center text-base-content/70 mt-4">
                        Don&apos;t have an account? <Link to="/register" className="link link-primary">Create one</Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;
