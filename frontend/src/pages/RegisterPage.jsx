import React, { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authService } from '../services/ticketService';

const RegisterPage = () => {
    const { user, login } = useAuth();
    const navigate = useNavigate();
    const [form, setForm] = useState({
        name: '',
        username: '',
        email: '',
        password: '',
        confirmPassword: '',
        role: 'STUDENT'
    });
    const [error, setError] = useState('');
    const [submitting, setSubmitting] = useState(false);

    if (user) {
        return <Navigate to="/" replace />;
    }

    const handleChange = (event) => {
        setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        setError('');

        if (form.password !== form.confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        setSubmitting(true);

        try {
            const response = await authService.register({
                name: form.name,
                username: form.username,
                email: form.email,
                password: form.password,
                role: form.role
            });
            login(response.token);
            navigate(response.redirectPath || '/', { replace: true });
        } catch (err) {
            setError(err.response?.data?.message || err.response?.data || 'Registration failed');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="w-full max-w-md px-4">
            <div className="card bg-base-100 shadow-2xl overflow-hidden">
                <div className="bg-secondary h-2 w-full"></div>
                <div className="card-body p-8 md:p-10">
                    <h2 className="card-title text-3xl font-bold justify-center mb-2">Create Account</h2>
                    <p className="text-base-content/70 text-center mb-6">This builds the base local auth flow. Once this is stable, the same backend can also accept Google OAuth sign-ins.</p>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <input className="input input-bordered w-full" name="name" placeholder="Full name" value={form.name} onChange={handleChange} required />
                        <input className="input input-bordered w-full" name="username" placeholder="Username" value={form.username} onChange={handleChange} required />
                        <input className="input input-bordered w-full" type="email" name="email" placeholder="Email" value={form.email} onChange={handleChange} required />
                        
                        <div className="form-control">
                            <label className="label">
                                <span className="label-text">Role</span>
                            </label>
                            <select 
                                className="select select-bordered w-full" 
                                name="role" 
                                value={form.role} 
                                onChange={handleChange} 
                                required
                            >
                                <option value="STUDENT">Student</option>
                                <option value="LECTURER">Lecturer</option>
                                <option value="NON_ACADEMIC">Staff</option>
                            </select>
                        </div>
                        
                        <input className="input input-bordered w-full" type="password" name="password" placeholder="Password" value={form.password} onChange={handleChange} required />
                        <input className="input input-bordered w-full" type="password" name="confirmPassword" placeholder="Confirm password" value={form.confirmPassword} onChange={handleChange} required />

                        {error && (
                            <div className="alert alert-error text-sm">
                                <span>{error}</span>
                            </div>
                        )}

                        <button type="submit" className="btn btn-primary w-full" disabled={submitting}>
                            {submitting ? 'Creating Account...' : 'Register'}
                        </button>
                    </form>

                    <p className="text-sm text-center text-base-content/70 mt-4">
                        Already have an account? <Link to="/login" className="link link-primary">Login</Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default RegisterPage;
