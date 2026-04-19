import React, { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authService } from '../services/ticketService';

const LoginPage = () => {
    const { user, login } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();
    const [form, setForm] = useState({ email: '', password: '' });
    const [error, setError] = useState('');
    const [submitting, setSubmitting] = useState(false);

    if (user) {
        const from = location.state?.from?.pathname || "/";
        return <Navigate to={from} replace />;
    }

    const handleChange = (event) => {
        setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        setError('');
        setSubmitting(true);

        try {
            const response = await authService.login(form);
            login(response.token);
            navigate(response.redirectPath || '/', { replace: true });
        } catch (err) {
            setError(err.response?.data?.message || err.response?.data || 'Login failed');
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
                            onChange={handleChange}
                            className="input input-bordered w-full"
                            placeholder="Email"
                            required
                        />
                        <input
                            type="password"
                            name="password"
                            value={form.password}
                            onChange={handleChange}
                            className="input input-bordered w-full"
                            placeholder="Password"
                            required
                        />

                        {error && (
                            <div className="alert alert-error text-sm">
                                <span>{error}</span>
                            </div>
                        )}

                        <button
                            type="submit"
                            className="btn btn-primary btn-lg w-full"
                            disabled={submitting}
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
