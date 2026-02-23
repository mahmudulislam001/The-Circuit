'use client';

import { useState, useEffect } from 'react';
import { Shield, MessageSquare, Calendar, BookOpen, Lock, Menu, X, Users, LogOut } from 'lucide-react';
import { createClient } from '../lib/supabase/client';

interface NavbarProps {
    activeTab: string;
    setActiveTab: (tab: string) => void;
}

export default function Navbar({ activeTab, setActiveTab }: NavbarProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [user, setUser] = useState<any>(null);

    useEffect(() => {
        const supabase = createClient();
        supabase.auth.getSession().then(({ data: { session } }) => {
            setUser(session?.user ?? null);
        });

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user ?? null);
        });

        return () => subscription.unsubscribe();
    }, []);

    const handleSignOut = async () => {
        const supabase = createClient();
        await supabase.auth.signOut();
        setActiveTab('home');
        setIsOpen(false);
    };

    const navItems = [
        { id: 'organizers', label: 'Organizers', icon: Users },
        { id: 'reviews', label: 'Explore Reviews', icon: MessageSquare },
        { id: 'competitions', label: 'Upcoming Competitions', icon: Calendar, locked: true },
        { id: 'casebank', label: 'Case Bank', icon: BookOpen, locked: true },
    ];

    return (
        <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-16">
                    <div className="flex items-center cursor-pointer" onClick={() => setActiveTab('home')}>
                        <div className="bg-slate-900 p-2 rounded-lg mr-2">
                            <Shield className="h-6 w-6 text-white" />
                        </div>
                        <span className="text-xl font-bold text-slate-900 tracking-tight">THE CIRCUIT</span>
                    </div>

                    <div className="hidden md:flex space-x-8 items-center">
                        {navItems.map((item) => (
                            <button
                                key={item.id}
                                onClick={() => !item.locked && setActiveTab(item.id)}
                                className={`flex items-center space-x-1 text-sm font-medium transition-colors relative ${activeTab === item.id ? 'text-blue-600 border-b-2 border-blue-600 h-16' : 'text-gray-500 hover:text-gray-900'
                                    } ${item.locked ? 'cursor-not-allowed opacity-60' : ''}`}
                            >
                                <item.icon size={18} />
                                <span>{item.label}</span>
                                {item.locked && <Lock size={10} className="ml-1 text-gray-400" />}
                            </button>
                        ))}

                        {/* Submit Review CTA */}
                        <button
                            onClick={() => setActiveTab('submit')}
                            className="bg-[#0B1426] text-white px-5 py-2 rounded-full text-sm font-semibold hover:bg-[#1A2436] transition-all shadow-sm"
                        >
                            Submit Review
                        </button>

                        {user ? (
                            <button
                                onClick={handleSignOut}
                                className="text-gray-500 hover:text-red-600 transition-colors flex items-center space-x-1 font-semibold text-sm"
                            >
                                <LogOut size={18} />
                                <span>Sign Out</span>
                            </button>
                        ) : (
                            <button
                                onClick={() => setActiveTab('signin')}
                                className="bg-blue-600 text-white px-5 py-2 rounded-full text-sm font-semibold hover:bg-blue-500 transition-all shadow-sm shadow-blue-500/20"
                            >
                                Sign In
                            </button>
                        )}
                    </div>

                    <div className="md:hidden flex items-center">
                        <button onClick={() => setIsOpen(!isOpen)} className="text-gray-500">
                            {isOpen ? <X size={24} /> : <Menu size={24} />}
                        </button>
                    </div>
                </div>
            </div>

            {isOpen && (
                <div className="md:hidden bg-white border-t border-gray-100 p-4 space-y-4 shadow-xl">
                    {navItems.map((item) => (
                        <button
                            key={item.id}
                            onClick={() => { if (!item.locked) { setActiveTab(item.id); setIsOpen(false); } }}
                            className={`flex items-center space-x-3 w-full p-2 ${item.locked ? 'text-gray-300' : 'text-gray-600'}`}
                        >
                            <item.icon size={20} />
                            <span className="font-medium">{item.label}</span>
                            {item.locked && <span className="text-[10px] bg-gray-100 px-1.5 rounded">SOON</span>}
                        </button>
                    ))}

                    <div className="border-t border-gray-100 pt-4 mt-2 space-y-3">
                        <button
                            onClick={() => { setActiveTab('submit'); setIsOpen(false); }}
                            className="w-full bg-[#000080] text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-[#0000a8] transition-all"
                        >
                            Submit Review
                        </button>
                        {user ? (
                            <button
                                onClick={handleSignOut}
                                className="w-full bg-red-50 text-red-600 px-4 py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center space-x-2"
                            >
                                <LogOut size={18} />
                                <span>Sign Out</span>
                            </button>
                        ) : (
                            <button
                                onClick={() => { setActiveTab('signin'); setIsOpen(false); }}
                                className="w-full bg-blue-600 text-white px-4 py-2.5 rounded-xl text-sm font-semibold shadow-lg shadow-blue-500/20"
                            >
                                Sign In
                            </button>
                        )}
                    </div>
                </div>
            )}
        </nav>
    );
}
