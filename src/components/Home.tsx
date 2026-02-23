'use client';

import { Shield, TrendingUp, Calendar, BookOpen, Lock } from 'lucide-react';

interface HomeProps {
    setActiveTab: (tab: string) => void;
}

export default function Home({ setActiveTab }: HomeProps) {
    return (
        <div className="space-y-12 pb-20">
            {/* Hero Section */}
            <section className="relative bg-slate-900 py-20 px-4 overflow-hidden">
                <div className="max-w-4xl mx-auto text-center relative z-10">
                    <div className="inline-flex items-center space-x-2 bg-white/10 backdrop-blur-md px-4 py-1.5 rounded-full text-white text-sm font-medium mb-6">
                        <TrendingUp size={16} className="text-blue-400" />
                        <span>Elevating the Case Circuit through Transparency</span>
                    </div>
                    <h1 className="text-4xl md:text-6xl font-extrabold text-white mb-6 leading-tight">
                        Don&apos;t just compete. <br />
                        <span className="text-blue-400">Compete where it matters.</span>
                    </h1>
                    <p className="text-slate-300 text-lg md:text-xl mb-10 max-w-2xl mx-auto">
                        The first accountability and discovery platform for the Bangladeshi business competition ecosystem. Driven by participants, verified by data.
                    </p>
                    <div className="flex flex-col sm:flex-row justify-center space-y-4 sm:space-y-0 sm:space-x-4">
                        <button
                            onClick={() => setActiveTab('reviews')}
                            className="bg-blue-600 text-white px-8 py-4 rounded-xl font-bold text-lg hover:bg-blue-500 transition-all shadow-lg shadow-blue-600/20"
                        >
                            Explore Reviews
                        </button>
                        <button
                            onClick={() => setActiveTab('submit')}
                            className="bg-white/10 text-white border border-white/20 px-8 py-4 rounded-xl font-bold text-lg hover:bg-white/20 transition-all"
                        >
                            Submit Review
                        </button>
                    </div>
                </div>
            </section>

            {/* Feature Cards */}
            <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm">
                    <div className="bg-blue-100 p-3 rounded-lg w-fit mb-6">
                        <Shield className="text-blue-600" size={28} />
                    </div>
                    <h3 className="text-xl font-bold mb-3">Risk Mitigation</h3>
                    <p className="text-gray-600">No more &quot;blind registrations.&quot; Check if a competition has a history of bias or logistics failures before paying the fee.</p>
                </div>

                <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm">
                    <div className="flex justify-between items-start mb-6">
                        <div className="bg-emerald-100 p-3 rounded-lg w-fit">
                            <Calendar className="text-emerald-600" size={28} />
                        </div>
                        <div className="flex items-center space-x-1 bg-slate-100 px-2 py-1 rounded text-[10px] font-bold text-slate-500">
                            <Lock size={10} />
                            <span>COMING SOON</span>
                        </div>
                    </div>
                    <h3 className="text-xl font-bold mb-3 text-slate-800">Upcoming Competitions</h3>
                    <p className="text-gray-500">A unified calendar of all major business case, marketing, and entrepreneurship competitions in Bangladesh.</p>
                </div>

                <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm">
                    <div className="flex justify-between items-start mb-6">
                        <div className="bg-purple-100 p-3 rounded-lg w-fit">
                            <BookOpen className="text-purple-600" size={28} />
                        </div>
                        <div className="flex items-center space-x-1 bg-slate-100 px-2 py-1 rounded text-[10px] font-bold text-slate-500">
                            <Lock size={10} />
                            <span>COMING SOON</span>
                        </div>
                    </div>
                    <h3 className="text-xl font-bold mb-3 text-slate-800">Case Repository</h3>
                    <p className="text-gray-500">Access past problem statements from the top circuits to benchmark your skills and prepare for world-class events.</p>
                </div>
            </div>
        </div>
    );
}
