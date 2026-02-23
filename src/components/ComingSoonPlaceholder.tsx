import { Lock, LucideIcon } from 'lucide-react';

interface ComingSoonPlaceholderProps {
    title: string;
    icon: LucideIcon;
    description: string;
}

export default function ComingSoonPlaceholder({ title, icon: Icon, description }: ComingSoonPlaceholderProps) {
    return (
        <div className="max-w-4xl mx-auto px-4 py-24 text-center">
            <div className="bg-slate-100 w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-6 text-slate-400">
                <Icon size={40} />
            </div>
            <div className="inline-flex items-center space-x-2 bg-blue-50 text-blue-600 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest mb-4">
                <Lock size={12} />
                <span>Feature Locked</span>
            </div>
            <h2 className="text-3xl font-bold text-slate-900 mb-4">{title}</h2>
            <p className="text-gray-500 max-w-md mx-auto mb-8">{description}</p>
            <div className="p-4 bg-white border border-gray-100 rounded-2xl shadow-sm inline-block">
                <p className="text-sm font-medium text-slate-600">Launching Phase 2: Q2 2025</p>
            </div>
        </div>
    );
}
