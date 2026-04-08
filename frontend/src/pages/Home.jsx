import React from 'react';
import { useAuth } from '../context/AuthContext';

const Home = () => {
    const { user, logout } = useAuth();

    return (
        <div className="min-h-screen bg-base-200">
            <div className="max-w-4xl mx-auto py-12 px-4">
                <div className="card bg-base-100 shadow-xl">
                    <div className="card-body">
                        <div className="flex items-center gap-4 mb-8">
                            <div className="avatar">
                                <div className="w-24 rounded-full ring ring-primary ring-offset-base-100 ring-offset-2">
                                    <img src={user?.picture || 'https://img.icons8.com/clouds/200/user.png'} alt="Profile" />
                                </div>
                            </div>
                            <div>
                                <h1 className="text-3xl font-bold">Welcome, {user?.name}!</h1>
                                <p className="text-base-content/60">{user?.email}</p>
                            </div>
                        </div>

                        <div className="divider">Your Roles</div>
                        <div className="flex flex-wrap gap-2 mb-8">
                            {user?.roles?.map((role, index) => (
                                <div key={index} className="badge badge-primary badge-lg p-4">
                                    {role}
                                </div>
                            ))}
                        </div>

                        <div className="bg-base-200 p-6 rounded-xl mb-8">
                            <h2 className="text-xl font-semibold mb-4 text-secondary">System Status</h2>
                            <p>You have successfully logged in via Google Auth. All authentication and authorization layers are now verified for your account.</p>
                        </div>

                        <div className="card-actions justify-end">
                            <button onClick={logout} className="btn btn-outline btn-error">
                                Sign Out
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Home;
