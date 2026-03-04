import { Home, Heart, Briefcase, FileText, AlertTriangle } from 'lucide-react';

const NEEDS = [
    { key: 'logement', label: 'Logement', icon: Home, color: 'bg-blue-50 text-blue-800 border-blue-200 hover:bg-blue-100' },
    { key: 'sante', label: 'Santé', icon: Heart, color: 'bg-rose-50 text-rose-800 border-rose-200 hover:bg-rose-100' },
    { key: 'travail', label: 'Travail / Emploi', icon: Briefcase, color: 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100' },
    { key: 'papiers', label: 'Papiers / Droits', icon: FileText, color: 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100' },
    { key: 'urgence', label: 'Urgence', icon: AlertTriangle, color: 'bg-red-50 text-red-800 border-red-200 hover:bg-red-100' },
];

export default function StepNeed({ onNext }) {
    return (
        <div>
            <h2 className="mb-1 text-lg font-semibold text-slate-900">Quel est votre besoin principal ?</h2>
            <p className="mb-5 text-sm text-slate-600">Choisissez la catégorie qui correspond le mieux.</p>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2" role="group" aria-label="Catégorie de besoin">
                {NEEDS.map(({ key, label, icon: Icon, color }) => (
                    <button
                        key={key}
                        type="button"
                        onClick={() => onNext({ need: key })}
                        className={`flex items-center gap-3 rounded-xl border px-4 py-3 min-h-[2.75rem] text-left text-base sm:text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 ${color}`}
                    >
                        <Icon className="h-5 w-5 shrink-0" aria-hidden="true" />
                        {label}
                    </button>
                ))}
            </div>
        </div>
    );
}
