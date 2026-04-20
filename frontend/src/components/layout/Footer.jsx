import React from 'react';

const Footer = () => {
    const currentYear = new Date().getFullYear();

    return (
        <footer className="bg-base-300 text-base-content/80 mt-0">
            <div className="container mx-auto px-6 py-12">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div>
                        <h3 className="text-lg font-bold text-base-content mb-4">UniOps</h3>
                        <p className="text-sm text-base-content/70">
                            Smart Campus Management System for efficient resource booking and operations management.
                        </p>
                    </div>
                    
                    <div>
                        <h3 className="text-lg font-bold text-base-content mb-4">Quick Links</h3>
                        <ul className="space-y-2 text-sm text-base-content/70">
                            <li><a href="/resources" className="hover:text-primary transition-colors">Browse Resources</a></li>
                            <li><a href="/admin/resources" className="hover:text-primary transition-colors">Admin Panel</a></li>
                            <li><a href="/about" className="hover:text-primary transition-colors">About</a></li>
                        </ul>
                    </div>
                    
                    <div>
                        <h3 className="text-lg font-bold text-base-content mb-4">Contact</h3>
                        <p className="text-sm text-base-content/70">
                            Get in touch with our support team for any questions or assistance.
                        </p>
                    </div>
                </div>
                
                <div className="border-t border-base-content/20 mt-8 pt-8 text-center">
                    <p className="text-sm">
                        © {currentYear} UniOps - Smart Campus Management System. All rights reserved.
                    </p>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
