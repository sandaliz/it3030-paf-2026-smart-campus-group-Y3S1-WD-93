import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Home = () => {
    const { user, getDashboardPath } = useAuth();
    const navigate = useNavigate();

    React.useEffect(() => {
        if (user) {
            const dashboardPath = getDashboardPath();
            if (dashboardPath !== '/') {
                navigate(dashboardPath, { replace: true });
            }
        }
    }, [user, getDashboardPath, navigate]);

    return (
        <div className="min-h-screen bg-gradient-to-b from-base-100 to-base-200">
            {/* Hero Section */}
            <section className="container mx-auto px-6 py-20">
                <div className="text-center max-w-4xl mx-auto">
                    <h1 className="text-5xl md:text-6xl font-bold text-base-content mb-6">
                        Smart Campus
                        <span className="text-primary"> Management</span>
                    </h1>
                    <p className="text-xl text-base-content/70 mb-8 leading-relaxed">
                        UniOps is your comprehensive platform for managing campus resources, 
                        bookings, and operations. Streamline your campus experience with our 
                        intuitive resource management system.
                    </p>
                    
                    <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
                        <Link 
                            to="/resources" 
                            className="btn btn-primary btn-lg px-8 py-4 text-lg font-medium"
                        >
                            Browse Resources
                        </Link>
                        {user?.roles && user.roles.includes('ADMIN') && (
                            <Link 
                                to="/admin/resources" 
                                className="btn btn-outline btn-lg px-8 py-4 text-lg font-medium"
                            >
                                Admin Panel
                            </Link>
                        )}
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section className="container mx-auto px-6 py-16">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    <div className="card bg-base-100 shadow-xl">
                        <div className="card-body text-center">
                            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                                <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                </svg>
                            </div>
                            <h3 className="card-title text-xl mb-2">Resource Management</h3>
                            <p className="text-base-content/70">
                                Efficiently manage classrooms, labs, and equipment with our comprehensive booking system.
                            </p>
                        </div>
                    </div>

                    <div className="card bg-base-100 shadow-xl">
                        <div className="card-body text-center">
                            <div className="w-16 h-16 bg-secondary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                                <svg className="w-8 h-8 text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <h3 className="card-title text-xl mb-2">Real-time Availability</h3>
                            <p className="text-base-content/70">
                                Check resource availability in real-time and book slots that fit your schedule.
                            </p>
                        </div>
                    </div>

                    <div className="card bg-base-100 shadow-xl">
                        <div className="card-body text-center">
                            <div className="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-4">
                                <svg className="w-8 h-8 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                </svg>
                            </div>
                            <h3 className="card-title text-xl mb-2">Role-based Access</h3>
                            <p className="text-base-content/70">
                                Secure access control with different permissions for students, staff, and administrators.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Stats Section */}
            <section className="container mx-auto px-6 py-16">
                <div className="text-center mb-12">
                    <h2 className="text-3xl font-bold text-base-content mb-4">Platform Statistics</h2>
                    <p className="text-base-content/70 text-lg">Join thousands of users managing campus resources efficiently</p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div className="text-center">
                        <div className="text-4xl font-bold text-primary mb-2">50+</div>
                        <p className="text-base-content/70">Resources Available</p>
                    </div>
                    <div className="text-center">
                        <div className="text-4xl font-bold text-secondary mb-2">1000+</div>
                        <p className="text-base-content/70">Active Users</p>
                    </div>
                    <div className="text-center">
                        <div className="text-4xl font-bold text-accent mb-2">24/7</div>
                        <p className="text-base-content/70">System Availability</p>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="container mx-auto px-6 py-16">
                <div className="card bg-primary text-primary-content shadow-2xl">
                    <div className="card-body text-center py-12">
                        <h2 className="text-3xl font-bold mb-4">Ready to Get Started?</h2>
                        <p className="text-lg mb-8 opacity-90">
                            Explore our resource management system and streamline your campus operations.
                        </p>
                        <Link 
                            to="/resources" 
                            className="btn btn-secondary btn-lg px-8 py-4 text-lg font-medium"
                        >
                            Browse Resources Now
                        </Link>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default Home;
