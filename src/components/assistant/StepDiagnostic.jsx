import { useState } from 'react';
import { Button } from '@/components/ui/button';
import VoiceAssistant from '@/components/VoiceAssistant';

const HOUSING_OPTIONS = [
    { key: 'tenant', label: 'Locataire' },
    { key: 'tenant_hlm', label: 'Locataire HLM' },
    { key: 'owner', label: 'Propriétaire' },
    { key: 'free', label: 'Hébergé(e) gratuitement' },
    { key: 'homeless', label: 'Sans domicile fixe' },
];

/**
 * Step 5 of the wizard — collects quantitative data for OpenFisca diagnostic.
 * Birth date, income (salary / unemployment), housing (rent / charges / status).
 */
export default function StepDiagnostic({ onNext, onBack }) {
    const [birthDate, setBirthDate] = useState('');
    const [salary, setSalary] = useState('');
    const [unemployment, setUnemployment] = useState('');
    const [rent, setRent] = useState('');
    const [charges, setCharges] = useState('');
    const [housingStatus, setHousingStatus] = useState('');

    const canContinue = birthDate && housingStatus;

    const handleSubmit = () => {
        onNext({
            birthDate,
            income: {
                salary: Number(salary) || 0,
                unemployment: Number(unemployment) || 0,
            },
            housing: {
                rent: Number(rent) || 0,
                charges: Number(charges) || 0,
                status: housingStatus,
            },
        });
    };

    return (
        <div>
            <h2 className="mb-1 text-lg font-semibold text-slate-900">
                Vos informations pour le calcul
            </h2>
            <div className="flex items-center justify-between mb-5">
                <p className="text-sm text-slate-600">
                    Ces données sont envoyées de manière anonyme au moteur de calcul. Rien n&apos;est enregistré.
                </p>
                <VoiceAssistant
                    text="Nous allons maintenant calculer vos droits. Renseignez votre date de naissance, vos revenus mensuels nets, et votre situation de logement. Ces données sont envoyées de manière anonyme. Rien n'est enregistré."
                />
            </div>

            {/* Birth date */}
            <div className="mb-4">
                <label htmlFor="diag-birthdate" className="mb-1 block text-sm font-medium text-slate-700">
                    Date de naissance <span className="text-red-500">*</span>
                </label>
                <input
                    id="diag-birthdate"
                    type="date"
                    value={birthDate}
                    onChange={(e) => setBirthDate(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20"
                    max={new Date().toISOString().split('T')[0]}
                    required
                />
            </div>

            {/* Income section */}
            <fieldset className="mb-4 rounded-lg border border-slate-100 bg-slate-50/50 p-4">
                <legend className="px-2 text-sm font-medium text-slate-700">Revenus mensuels nets</legend>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div>
                        <label htmlFor="diag-salary" className="mb-1 block text-xs text-slate-600">
                            Salaire net (€/mois)
                        </label>
                        <input
                            id="diag-salary"
                            type="number"
                            min="0"
                            step="1"
                            value={salary}
                            onChange={(e) => setSalary(e.target.value)}
                            placeholder="0"
                            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20"
                        />
                    </div>
                    <div>
                        <label htmlFor="diag-unemployment" className="mb-1 block text-xs text-slate-600">
                            Allocations chômage (€/mois)
                        </label>
                        <input
                            id="diag-unemployment"
                            type="number"
                            min="0"
                            step="1"
                            value={unemployment}
                            onChange={(e) => setUnemployment(e.target.value)}
                            placeholder="0"
                            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20"
                        />
                    </div>
                </div>
            </fieldset>

            {/* Housing section */}
            <fieldset className="mb-4 rounded-lg border border-slate-100 bg-slate-50/50 p-4">
                <legend className="px-2 text-sm font-medium text-slate-700">Logement</legend>

                <div className="mb-3">
                    <span className="mb-1 block text-xs text-slate-600" id="housing-status-label">
                        Statut d&apos;occupation <span className="text-red-500">*</span>
                    </span>
                    <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Statut d'occupation">
                        {HOUSING_OPTIONS.map(({ key, label }) => (
                            <button
                                key={key}
                                type="button"
                                role="radio"
                                aria-checked={housingStatus === key}
                                onClick={() => setHousingStatus(key)}
                                className={`rounded-lg border px-3 py-2 min-h-[2.75rem] text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 ${housingStatus === key
                                    ? 'border-blue-600 bg-blue-50 text-blue-700'
                                    : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                                    }`}
                            >
                                {label}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div>
                        <label htmlFor="diag-rent" className="mb-1 block text-xs text-slate-600">
                            Loyer mensuel (€)
                        </label>
                        <input
                            id="diag-rent"
                            type="number"
                            min="0"
                            step="1"
                            value={rent}
                            onChange={(e) => setRent(e.target.value)}
                            placeholder="0"
                            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20"
                        />
                    </div>
                    <div>
                        <label htmlFor="diag-charges" className="mb-1 block text-xs text-slate-600">
                            Charges locatives (€)
                        </label>
                        <input
                            id="diag-charges"
                            type="number"
                            min="0"
                            step="1"
                            value={charges}
                            onChange={(e) => setCharges(e.target.value)}
                            placeholder="0"
                            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20"
                        />
                    </div>
                </div>
            </fieldset>

            <div className="flex items-center gap-3">
                <Button type="button" variant="outline" size="sm" onClick={onBack}>Retour</Button>
                <Button type="button" size="sm" disabled={!canContinue} onClick={handleSubmit}>
                    Calculer mes droits
                </Button>
            </div>
        </div>
    );
}
