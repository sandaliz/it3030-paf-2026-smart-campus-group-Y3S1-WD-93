import React from 'react';
import { useAuth } from './context/AuthContext';
import NotificationPanel from './components/NotificationPanel';

const Navbar = () => {
    const { user, logout } = useAuth();

    if (!user) return null;

    return (
        <div className="navbar bg-base-100 shadow-md px-6">
            <div className="flex-1">
                <a className="btn btn-ghost text-xl normal-case font-bold text-primary">UniOps Hub</a>
            </div>
            <div className="flex-none gap-2">
                <NotificationPanel />
                <div className="dropdown dropdown-end ml-4">
                    <label tabIndex={0} className="btn btn-ghost btn-circle avatar border-primary/20 border-2">
                        <div className="w-10 rounded-full">
                            <img src={user.picture || "https://img.icons8.com/clouds/100/user.png"} alt="profile" />
                        </div>
                    </label>
                    <ul tabIndex={0} className="mt-3 z-[1] p-2 shadow-2xl menu menu-sm dropdown-content bg-base-100 rounded-box w-52 border border-base-200">
                        <li className="menu-title px-4 py-2 text-xs opacity-50">{user.name}</li>
                        <li><a>Profile</a></li>
                        <li><a>Settings</a></li>
                        <div className="divider my-0"></div>
                        <li><a onClick={logout} className="text-error">Logout</a></li>
                    </ul>
                </div>
            </div>
        </div>
    );
};

export default Navbar;
