'use client';

import { useState, useEffect } from 'react';
import { Shield, Calendar, BookOpen, CheckCircle2, XCircle } from 'lucide-react';
import { createClient } from '../lib/supabase/client';
import Navbar from '../components/Navbar';
import Home from '../components/Home';
import ReviewsFeed from '../components/ReviewsFeed';
import SmartReviewForm from '../components/SmartReviewForm';
import ComingSoonPlaceholder from '../components/ComingSoonPlaceholder';
import Organizers from '../components/Organizers';
import SignIn from '../components/SignIn';

export default function Page() {
  const [activeTab, setActiveTab] = useState('home');

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 selection:bg-blue-100">
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />

      <main>
        {activeTab === 'home' && <Home setActiveTab={setActiveTab} />}
        {activeTab === 'organizers' && <Organizers />}
        {activeTab === 'reviews' && <ReviewsFeed />}
        {activeTab === 'submit' && <SmartReviewForm setActiveTab={setActiveTab} />}
        {activeTab === 'signin' && <SignIn setActiveTab={setActiveTab} />}
        {activeTab === 'competitions' && (
          <ComingSoonPlaceholder
            title="Upcoming Competitions"
            icon={Calendar}
            description="A unified calendar for all business competitions in Bangladesh."
          />
        )}
        {activeTab === 'casebank' && (
          <ComingSoonPlaceholder
            title="The Case Vault"
            icon={BookOpen}
            description="Crowdsourced library of past competition cases."
          />
        )}
      </main>

      <footer className="bg-white border-t border-gray-100 py-12 mt-20">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <div className="flex justify-center items-center space-x-2 mb-6">
            <div className="bg-slate-900 p-1.5 rounded-lg">
              <Shield className="h-5 w-5 text-white" />
            </div>
            <span className="text-lg font-bold text-slate-900 tracking-tight">THE CIRCUIT</span>
          </div>
          <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest">
            Elevating competition standards since 2026
          </p>
        </div>
      </footer>
    </div>
  );
}
