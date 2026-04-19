import React, { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authService } from '../services/ticketService';
import { useRealTimeValidation, validatePassword } from '../utils/validation';

const RegisterPage = () => {
    const { user, login } = useAuth();
    const navigate = useNavigate();
    
    const {
        values: form,
        errors,
        touched,
        handleChange,
        handleBlur,
        validateAll,
        isFormValid
    } = useRealTimeValidation({
        name: '',
        username: '',
        email: '',
        password: '',
        confirmPassword: '',
        role: 'STUDENT'
    });
    
    const [submitting, setSubmitting] = useState(false);
    const [serverError, setServerError] = useState('');
    const passwordValidation = validatePassword(form.password);

    if (user) {
        return <Navigate to="/" replace />;
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
            setServerError(err.response?.data?.message || err.response?.data || 'Registration failed');
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
                        <div className="form-control">
                            <label className="label">
                                <span className="label-text">Full name</span>
                            </label>
                            <input 
                                className={`input input-bordered w-full ${
                                    touched.name && errors.name ? 'input-error' : ''
                                }`} 
                                name="name" 
                                placeholder="Full name" 
                                value={form.name} 
                                onChange={handleFieldChange}
                                onBlur={() => handleBlur('name')}
                                required 
                            />
                            {touched.name && errors.name && (
                                <label className="label">
                                    <span className="label-text-alt text-error text-xs">{errors.name}</span>
                                </label>
                            )}
                        </div>
                        <div className="form-control">
                            <label className="label">
                                <span className="label-text">Username</span>
                            </label>
                            <input 
                                className={`input input-bordered w-full ${
                                    touched.username && errors.username ? 'input-error' : ''
                                }`} 
                                name="username" 
                                placeholder="Username" 
                                value={form.username} 
                                onChange={handleFieldChange}
                                onBlur={() => handleBlur('username')}
                                required 
                            />
                            {touched.username && errors.username && (
                                <label className="label">
                                    <span className="label-text-alt text-error text-xs">{errors.username}</span>
                                </label>
                            )}
                        </div>
                        <div className="form-control">
                            <label className="label">
                                <span className="label-text">Email</span>
                            </label>
                            <input 
                                type="email"
                                className={`input input-bordered w-full ${
                                    touched.email && errors.email ? 'input-error' : ''
                                }`} 
                                name="email" 
                                placeholder="Email" 
                                value={form.email} 
                                onChange={handleFieldChange}
                                onBlur={() => handleBlur('email')}
                                required 
                            />
                            {touched.email && errors.email && (
                                <label className="label">
                                    <span className="label-text-alt text-error text-xs">{errors.email}</span>
                                </label>
                            )}
                        </div>
                        
                        <div className="form-control">
                            <label className="label">
                                <span className="label-text">Role</span>
                            </label>
                            <select 
                                className="select select-bordered w-full" 
                                name="role" 
                                value={form.role} 
                                onChange={handleFieldChange}
                                onBlur={() => handleBlur('role')}
                                required
                            >
                                <option value="STUDENT">Student</option>
                                <option value="LECTURER">Lecturer</option>
                                <option value="NON_ACADEMIC">Staff</option>
                            </select>
                        </div>
                        
                        <div className="form-control">
                            <label className="label">
                                <span className="label-text">Password</span>
                            </label>
                            <input 
                                type="password"
                                className={`input input-bordered w-full ${
                                    touched.password && errors.password ? 'input-error' : ''
                                }`} 
                                name="password" 
                                placeholder="Password" 
                                value={form.password} 
                                onChange={handleFieldChange}
                                onBlur={() => handleBlur('password')}
                                required 
                            />
                            {touched.password && errors.password && (
                                <label className="label">
                                    <span className="label-text-alt text-error text-xs">{errors.password}</span>
                                </label>
                            )}
                            {/* Password strength indicator */}
                            {touched.password && form.password && (
                                <div className="mt-2">
                                    <div className="flex gap-1">
                                        <span className="text-xs">Password strength:</span>
                                        <span className={`text-xs font-semibold ${
                                            passwordValidation.requirements?.minLength ? 'text-success' : 'text-error'
                                        }`}>8+ chars</span>
                                        <span className={`text-xs font-semibold ${
                                            passwordValidation.requirements?.hasUpperCase ? 'text-success' : 'text-error'
                                        }`}>Upper</span>
                                        <span className={`text-xs font-semibold ${
                                            passwordValidation.requirements?.hasLowerCase ? 'text-success' : 'text-error'
                                        }`}>Lower</span>
                                        <span className={`text-xs font-semibold ${
                                            passwordValidation.requirements?.hasNumbers ? 'text-success' : 'text-error'
                                        }`}>Numbers</span>
                                        <span className={`text-xs font-semibold ${
                                            passwordValidation.requirements?.hasSpecialChar ? 'text-success' : 'text-error'
                                        }`}>Special</span>
                                    </div>
                                    {passwordValidation.strength > 0 && passwordValidation.strength < 3 && (
                                        <span className="text-xs text-warning ml-2">Weak password</span>
                                    )}
                                </div>
                            )}
                        </div>
                        <div className="form-control">
                            <label className="label">
                                <span className="label-text">Confirm password</span>
                            </label>
                            <input 
                                type="password"
                                className={`input input-bordered w-full ${
                                    touched.confirmPassword && errors.confirmPassword ? 'input-error' : ''
                                }`} 
                                name="confirmPassword" 
                                placeholder="Confirm password" 
                                value={form.confirmPassword} 
                                onChange={handleFieldChange}
                                onBlur={() => handleBlur('confirmPassword')}
                                required 
                            />
                            {touched.confirmPassword && errors.confirmPassword && (
                                <label className="label">
                                    <span className="label-text-alt text-error text-xs">{errors.confirmPassword}</span>
                                </label>
                            )}
                        </div>

                        {(serverError || Object.keys(errors).some(key => errors[key])) && (
                            <div className="alert alert-error text-sm">
                                <span>{serverError || 'Please fix the errors above'}</span>
                            </div>
                        )}

                        <button type="submit" className="btn btn-primary w-full" disabled={submitting || !isFormValid}>
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
