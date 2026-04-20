import React, { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authService } from '../services/ticketService';
import { useRealTimeValidation } from '../utils/validation';
import { 
    HiOutlineOfficeBuilding, 
    HiOutlineTicket, 
    HiOutlineBell, 
    HiOutlineShieldCheck,
    HiEye,
    HiEyeOff,
    HiArrowRight,
    HiLightningBolt
} from 'react-icons/hi';
import { FcGoogle } from 'react-icons/fc';

const LoginPage = () => {
    const { user, login } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();
    
    const [form, setForm] = useState({ email: '', password: '' });
    const [errors, setErrors] = useState({});
    const [touched, setTouched] = useState({});

    const handleChange = (name, value) => {
        setForm(prev => ({ ...prev, [name]: value }));
        setTouched(prev => ({ ...prev, [name]: true }));
        
        // Only validate email
        if (name === 'email') {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!value) {
                setErrors(prev => ({ ...prev, email: 'Email is required' }));
            } else if (!emailRegex.test(value)) {
                setErrors(prev => ({ ...prev, email: 'Please enter a valid email address' }));
            } else {
                setErrors(prev => ({ ...prev, email: '' }));
            }
        }
    };

    const handleBlur = (name) => {
        setTouched(prev => ({ ...prev, [name]: true }));
        if (name === 'email') {
            handleChange(name, form[name]);
        }
    };

    const validateAll = () => {
        const newErrors = {};
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        
        if (!form.email) {
            newErrors.email = 'Email is required';
        } else if (!emailRegex.test(form.email)) {
            newErrors.email = 'Please enter a valid email address';
        }
        
        if (!form.password) {
            newErrors.password = 'Password is required';
        }
        
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const isFormValid = form.email && !errors.email && form.password && !errors.password;
    
    const [submitting, setSubmitting] = useState(false);
    const [serverError, setServerError] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [activeTab, setActiveTab] = useState('signin');

    if (user) {
        const from = location.state?.from?.pathname || "/";
        return <Navigate to={from} replace />;
    }

    const handleFieldChange = (event) => {
        const { name, value } = event.target;
        handleChange(name, value);
        if (serverError) {
            setServerError('');
        }
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        setServerError('');
        
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

    const features = [
        { icon: <HiOutlineOfficeBuilding />, title: "Bookings", color: "text-primary" },
        { icon: <HiOutlineTicket />, title: "Tickets", color: "text-secondary" },
        { icon: <HiOutlineBell />, title: "Alerts", color: "text-accent" },
        { icon: <HiOutlineShieldCheck />, title: "Secure", color: "text-info" }
    ];

    return (
        <div className="min-h-screen w-full flex items-center justify-center bg-base-300 relative overflow-hidden p-6">
            {/* Subtle background pulses for depth */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-40">
                <div className="absolute top-[10%] left-[15%] w-96 h-96 bg-primary/20 rounded-full blur-[100px]"></div>
                <div className="absolute bottom-[20%] right-[20%] w-[500px] h-[500px] bg-secondary/10 rounded-full blur-[120px]"></div>
            </div>

            <div className="relative z-10 w-full max-w-[520px]">
                <div className="card bg-base-100 shadow-2xl border border-base-content/5 rounded-[2.5rem] overflow-hidden">
                    <div className="card-body p-8 sm:p-12">
                        {/* Branding at the top of the card */}
                        <div className="flex flex-col items-center mb-10">
                            <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center shadow-lg shadow-primary/30 mb-4 animate-bounce-slow">
                                <HiLightningBolt className="w-10 h-10 text-primary-content" />
                            </div>
                            <h1 className="text-4xl font-black text-base-content tracking-tighter">UniOps</h1>
                            <p className="text-xs uppercase tracking-[0.3em] font-bold text-base-content/40 mt-1">Operations Hub</p>
                        </div>

                        {/* Centered Tabs */}
                        <div className="flex bg-base-200 p-1.5 rounded-2xl mb-12 w-fit mx-auto border border-base-content/5">
                            <Link 
                                to="/login"
                                onClick={() => setActiveTab('signin')}
                                className={`px-10 py-3 rounded-xl text-sm font-bold transition-all duration-300 ${activeTab === 'signin' ? 'bg-primary text-primary-content shadow-md' : 'text-base-content/40 hover:text-base-content'}`}
                            >
                                Sign In
                            </Link>
                            <Link 
                                to="/register"
                                onClick={() => setActiveTab('signup')}
                                className={`px-10 py-3 rounded-xl text-sm font-bold transition-all duration-300 ${activeTab === 'signup' ? 'bg-primary text-primary-content shadow-md' : 'text-base-content/40 hover:text-base-content'}`}
                            >
                                Sign Up
                            </Link>
                        </div>

                        <div className="text-center mb-10">
                            <h2 className="text-2xl font-bold text-base-content mb-1">Welcome Back</h2>
                            <p className="text-base-content/50 text-sm">Please enter your credentials to access your account</p>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="form-control">
                                <label className="label py-1">
                                    <span className="label-text font-bold text-xs text-base-content/60 tracking-wide">EMAIL ADDRESS</span>
                                </label>
                                <input
                                    type="email"
                                    name="email"
                                    value={form.email}
                                    onChange={handleFieldChange}
                                    onBlur={() => handleBlur('email')}
                                    className={`input input-bordered bg-base-200/50 focus:bg-base-100 h-14 rounded-2xl transition-all ${
                                        touched.email && errors.email ? 'input-error' : 'border-base-content/10'
                                    }`}
                                    placeholder="your@email.com"
                                    required
                                />
                                {touched.email && errors.email && (
                                    <label className="label">
                                        <span className="label-text-alt text-error font-medium">{errors.email}</span>
                                    </label>
                                )}
                            </div>

                            <div className="form-control">
                                <label className="label py-1">
                                    <span className="label-text font-bold text-xs text-base-content/60 tracking-wide">PASSWORD</span>
                                </label>
                                <div className="relative">
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        name="password"
                                        value={form.password}
                                        onChange={handleFieldChange}
                                        className="input input-bordered bg-base-200/50 focus:bg-base-100 h-14 rounded-2xl w-full pr-12 transition-all border-base-content/10"
                                        placeholder="••••••••"
                                        required
                                    />
                                    <button 
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-base-content/30 hover:text-base-content transition-colors"
                                    >
                                        {showPassword ? <HiEyeOff className="w-5 h-5" /> : <HiEye className="w-5 h-5" />}
                                    </button>
                                </div>
                            </div>

                            {serverError && (
                                <div className="alert alert-error bg-error/10 border-error/20 text-error text-xs p-4 rounded-xl flex items-center gap-2">
                                    <span className="font-bold">Error:</span> {serverError}
                                </div>
                            )}

                            <button
                                type="submit"
                                className="btn btn-primary h-14 rounded-2xl w-full text-lg font-black shadow-lg shadow-primary/20 hover:scale-[1.01] transition-all"
                                disabled={submitting || !isFormValid}
                            >
                                {submitting ? (
                                    <span className="loading loading-spinner"></span>
                                ) : (
                                    <>
                                        Sign In
                                        <HiArrowRight className="ml-2" />
                                    </>
                                )}
                            </button>
                        </form>

                        <div className="mt-8 text-center">
                            <Link to="/forgot-password" size="sm" className="text-sm font-semibold text-base-content/40 hover:text-primary transition-colors">
                                Forgot Password?
                            </Link>
                        </div>

                        {/* Moderate Feature Grid Integrated into the bottom of the card */}
                        <div className="grid grid-cols-4 gap-2 mt-12 pt-8 border-t border-base-content/5">
                            {features.map((item, idx) => (
                                <div key={idx} className="flex flex-col items-center gap-1 group">
                                    <div className={`text-xl ${item.color} opacity-40 group-hover:opacity-100 transition-opacity`}>
                                        {item.icon}
                                    </div>
                                    <span className="text-[10px] font-bold text-base-content/20 group-hover:text-base-content transition-colors uppercase tracking-widest">{item.title}</span>
                                </div>
                            ))}
                        </div>

                        <div className="relative my-10">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-base-content/5"></div>
                            </div>
                            <div className="relative flex justify-center text-[10px] uppercase font-bold tracking-[0.2em]">
                                <span className="bg-base-100 px-4 text-base-content/20">Social Login</span>
                            </div>
                        </div>

                        <button 
                            type="button" 
                            onClick={authService.loginWithGoogle} 
                            className="btn h-14 rounded-2xl w-full bg-base-200 hover:bg-base-300 border-none text-base-content font-bold flex items-center justify-center gap-3 transition-all"
                        >
                            <FcGoogle size={24} />
                            Continue with Google
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;
