import { SkeletonList } from '@/components/ui/skeleton';
import { useState, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
    Calendar as CalendarIcon,
    Clock,
    User,
    Video,
    MapPin,
    ChevronRight,
    CheckCircle2,
    ShieldCheck,
    ArrowLeft,
    CalendarCheck,
    Loader2,
    AlertCircle,
} from 'lucide-react';
import { track } from '@vercel/analytics';
import SEO from '@/components/SEO';

/**
 * PublicBooking
 *
 * Interface de prise de RDV côté usager — Design premium avec tunnel
 * en 4 étapes : Conseiller → Créneau → Mode → Confirmation.
 *
 * Se connecte aux API existantes :
 *   - GET  /api/rdv/structures/:slug/services
 *   - GET  /api/rdv/structures/:slug/slots
 *   - POST /api/rdv/appointments
 */
export default function PublicBooking() {
    const { structureSlug } = useParams();
    const navigate = useNavigate();

    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Booking state
    const [services, setServices] = useState([]);
    const [selectedService, setSelectedService] = useState(null);
    const [slots, setSlots] = useState([]);
    const [selectedSlot, setSelectedSlot] = useState(null);
    const [bookingMode, setBookingMode] = useState('VIDEO'); // VIDEO or IN_PERSON
    const [confirmation, setConfirmation] = useState(null);

    // Fetch services for the structure
    const fetchServices = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const token = getToken();
            const res = await fetch(
                `/api/rdv/structures/${encodeURIComponent(structureSlug)}/services`,
                { headers: token ? { Authorization: `Bearer ${token}` } : {} }
            );
            if (!res.ok) throw new Error('Impossible de charger les services.');
            const data = await res.json();
            setServices(data.items || []);
            // Tracker le début du flow si on a réussi à charger la page structure
            track('start_booking_flow', { structure: structureSlug });
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [structureSlug]);

    // Fetch available slots for selected service
    const fetchSlots = useCallback(async (serviceId) => {
        setLoading(true);
        setError('');
        try {
            const token = getToken();
            const from = new Date().toISOString().slice(0, 10);
            const to = new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10);
            const res = await fetch(
                `/api/rdv/structures/${encodeURIComponent(structureSlug)}/slots?serviceId=${encodeURIComponent(serviceId)}&from=${from}&to=${to}`,
                { headers: token ? { Authorization: `Bearer ${token}` } : {} }
            );
            if (!res.ok) throw new Error('Impossible de charger les créneaux.');
            const data = await res.json();

            // Flatten days → slots
            const flatSlots = (data.days || []).flatMap((day) =>
                (day.slots || []).map((s) => ({
                    ...s,
                    date: day.date,
                    displayTime: new Date(s.startAt).toLocaleTimeString('fr-FR', {
                        hour: '2-digit',
                        minute: '2-digit',
                    }),
                    displayDate: new Date(s.startAt).toLocaleDateString('fr-FR', {
                        weekday: 'short',
                        day: 'numeric',
                        month: 'short',
                    }),
                }))
            );
            setSlots(flatSlots);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [structureSlug]);

    // Book the appointment
    const confirmBooking = useCallback(async () => {
        if (!selectedService || !selectedSlot) return;
        setLoading(true);
        setError('');
        try {
            const token = getToken();
            const idempotencyKey = crypto.randomUUID?.() || `${Date.now()}`;
            const res = await fetch('/api/rdv/appointments', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
                body: JSON.stringify({
                    structureSlug,
                    serviceId: selectedService.id,
                    startAt: selectedSlot.startAt,
                    mode: bookingMode,
                    idempotencyKey,
                }),
            });

            if (!res.ok) {
                const errData = await res.json().catch(() => ({}));
                throw new Error(errData.error || 'Impossible de confirmer le RDV.');
            }

            const data = await res.json();
            track('booking_confirm_success', { structure: structureSlug, mode: bookingMode });
            setConfirmation(data);
            setStep(4);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [selectedService, selectedSlot, bookingMode, structureSlug]);

    // Handle service selection
    const handleSelectService = (service) => {
        track('booking_select_service', { structure: structureSlug, service: service.name });
        setSelectedService(service);
        fetchSlots(service.id);
        setStep(2);
    };

    // Handle slot selection
    const handleSelectSlot = (slot) => {
        setSelectedSlot(slot);
        setStep(3);
    };

    // Load services on mount
    useState(() => {
        fetchServices();
    });

    return (
        <div className="min-h-screen bg-slate-50 py-12 px-4">
            <SEO
                title="Prendre rendez-vous"
                description="Réservez un créneau avec un conseiller ADA"
                noindex
            />

            <div className="max-w-2xl mx-auto">
                {/* Header */}
                <div className="text-center mb-10">
                    <div className="inline-flex p-3 bg-indigo-100 rounded-2xl mb-4">
                        <CalendarCheck className="text-indigo-600" size={32} />
                    </div>
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
                        Prendre rendez-vous
                    </h1>
                    <p className="text-slate-500 mt-2">
                        Service Accès Direct Aide
                    </p>
                </div>

                {/* Progress bar */}
                <div className="flex justify-between items-center mb-12 px-6">
                    <StepIndicator current={step} target={1} label="Service" />
                    <div className="flex-1 h-px bg-slate-200 mx-3" />
                    <StepIndicator current={step} target={2} label="Créneau" />
                    <div className="flex-1 h-px bg-slate-200 mx-3" />
                    <StepIndicator current={step} target={3} label="Mode" />
                    <div className="flex-1 h-px bg-slate-200 mx-3" />
                    <StepIndicator current={step} target={4} label="Confirmé" />
                </div>

                {/* Error feedback */}
                {error && (
                    <div
                        className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm flex items-center gap-2"
                        role="alert"
                    >
                        <AlertCircle size={16} /> {error}
                    </div>
                )}

                {/* Step 1: Choose Service */}
                {step === 1 && (
                    <div className="space-y-4">
                        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">
                            Choisissez un service
                        </h2>

                        {loading ? <div className="p-6"><SkeletonList count={3} variant="card" /></div> : services.length === 0 ? (
                            <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center">
                                <CalendarIcon className="mx-auto text-slate-300 mb-3" size={40} />
                                <p className="text-sm text-slate-500">
                                    Aucun service disponible pour cette structure.
                                </p>
                                <Link
                                    to="/structures"
                                    className="text-indigo-600 text-sm font-medium mt-3 inline-block hover:underline"
                                >
                                    Retour à l&apos;annuaire
                                </Link>
                            </div>
                        ) : (
                            services.map((service) => (
                                <button
                                    type="button"
                                    key={service.id}
                                    onClick={() => handleSelectService(service)}
                                    className="w-full bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:border-indigo-400 hover:shadow-md transition-all flex items-center justify-between group text-left"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center">
                                            <CalendarIcon className="text-indigo-600" size={20} />
                                        </div>
                                        <div>
                                            <p className="font-semibold text-slate-900">
                                                {service.name}
                                            </p>
                                            <p className="text-xs text-slate-400">
                                                {service.durationMinutes || 30} min
                                            </p>
                                        </div>
                                    </div>
                                    <ChevronRight className="text-slate-300 group-hover:text-indigo-600 group-hover:translate-x-1 transition-all" />
                                </button>
                            ))
                        )}
                    </div>
                )}

                {/* Step 2: Choose Slot */}
                {step === 2 && (
                    <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-lg">
                        <button
                            type="button"
                            onClick={() => setStep(1)}
                            className="flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-indigo-600 mb-6"
                        >
                            <ArrowLeft size={14} /> Retour aux services
                        </button>

                        <div className="flex items-center gap-4 mb-6">
                            <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center">
                                <CalendarIcon className="text-white" size={18} />
                            </div>
                            <div>
                                <p className="font-bold text-slate-900">
                                    {selectedService?.name}
                                </p>
                                <p className="text-[10px] text-emerald-600 font-bold uppercase flex items-center gap-1">
                                    <ShieldCheck size={10} /> Créneaux en temps réel
                                </p>
                            </div>
                        </div>

                        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">
                            Créneaux disponibles
                        </h3>

                        {loading ? <div className="p-6"><SkeletonList count={3} variant="card" /></div> : slots.length === 0 ? (
                            <p className="text-sm text-slate-500 py-8 text-center">
                                Aucun créneau disponible sur les 14 prochains jours.
                            </p>
                        ) : (
                            <div className="space-y-4 max-h-[400px] overflow-y-auto">
                                {/* Group by date */}
                                {Object.entries(
                                    slots.reduce((acc, slot) => {
                                        const key = slot.displayDate;
                                        if (!acc[key]) acc[key] = [];
                                        acc[key].push(slot);
                                        return acc;
                                    }, {})
                                ).map(([date, dateSlots]) => (
                                    <div key={date}>
                                        <p className="text-xs font-bold text-slate-500 mb-2 uppercase">
                                            {date}
                                        </p>
                                        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                                            {dateSlots.map((slot) => (
                                                <button
                                                    type="button"
                                                    key={slot.startAt}
                                                    onClick={() => handleSelectSlot(slot)}
                                                    className="py-2.5 px-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-semibold text-slate-700 hover:bg-indigo-600 hover:text-white hover:border-indigo-600 transition-all"
                                                >
                                                    {slot.displayTime}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* Step 3: Choose Mode + Confirm */}
                {step === 3 && (
                    <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-lg">
                        <button
                            type="button"
                            onClick={() => setStep(2)}
                            className="flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-indigo-600 mb-6"
                        >
                            <ArrowLeft size={14} /> Retour
                        </button>

                        <h2 className="text-xl font-bold text-slate-900 mb-2">
                            Récapitulatif
                        </h2>
                        <p className="text-slate-500 text-sm mb-8">
                            Vérifiez les informations puis confirmez.
                        </p>

                        {/* Summary */}
                        <div className="space-y-4 mb-8">
                            <SummaryRow
                                icon={<CalendarIcon className="text-indigo-600" size={18} />}
                                label="Service"
                                value={selectedService?.name}
                            />
                            <SummaryRow
                                icon={<Clock className="text-indigo-600" size={18} />}
                                label="Date et heure"
                                value={`${selectedSlot?.displayDate} à ${selectedSlot?.displayTime}`}
                            />
                        </div>

                        {/* Mode selector */}
                        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                            Type de rendez-vous
                        </h3>
                        <div className="grid grid-cols-2 gap-3 mb-8">
                            <button
                                type="button"
                                onClick={() => setBookingMode('VIDEO')}
                                className={`p-4 rounded-xl border-2 text-left transition-all ${bookingMode === 'VIDEO'
                                    ? 'border-indigo-500 bg-indigo-50'
                                    : 'border-slate-200 hover:border-slate-300'
                                    }`}
                            >
                                <Video
                                    className={bookingMode === 'VIDEO' ? 'text-indigo-600' : 'text-slate-400'}
                                    size={20}
                                />
                                <p className="font-semibold text-sm mt-2">Visioconférence</p>
                                <p className="text-[10px] text-slate-400">
                                    Depuis chez vous via Jitsi
                                </p>
                            </button>
                            <button
                                type="button"
                                onClick={() => setBookingMode('IN_PERSON')}
                                className={`p-4 rounded-xl border-2 text-left transition-all ${bookingMode === 'IN_PERSON'
                                    ? 'border-indigo-500 bg-indigo-50'
                                    : 'border-slate-200 hover:border-slate-300'
                                    }`}
                            >
                                <MapPin
                                    className={bookingMode === 'IN_PERSON' ? 'text-indigo-600' : 'text-slate-400'}
                                    size={20}
                                />
                                <p className="font-semibold text-sm mt-2">Sur place</p>
                                <p className="text-[10px] text-slate-400">
                                    En présentiel à la structure
                                </p>
                            </button>
                        </div>

                        <button
                            type="button"
                            onClick={confirmBooking}
                            disabled={loading}
                            className="w-full bg-slate-900 text-white py-4 rounded-xl font-bold text-sm hover:bg-indigo-600 transition-all shadow-lg disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <Loader2 className="animate-spin" size={18} />
                            ) : (
                                <CheckCircle2 size={18} />
                            )}
                            {loading ? 'Confirmation en cours...' : 'Confirmer le rendez-vous'}
                        </button>
                    </div>
                )}

                {/* Step 4: Success */}
                {step === 4 && (
                    <div className="bg-white p-10 rounded-2xl border border-emerald-200 shadow-lg text-center">
                        <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
                            <CheckCircle2 size={36} />
                        </div>
                        <h2 className="text-2xl font-bold text-slate-900 mb-2">
                            C&apos;est confirmé !
                        </h2>
                        <p className="text-slate-500 mb-6 max-w-md mx-auto">
                            Un email de confirmation vous a été envoyé.
                            {bookingMode === 'VIDEO' && (
                                <> Vous pourrez rejoindre la visio directement sur ADA.</>
                            )}
                        </p>

                        {confirmation?.id && (
                            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 mb-6 inline-block">
                                <p className="text-[10px] font-bold uppercase text-slate-400 mb-1">
                                    Référence
                                </p>
                                <p className="text-lg font-mono font-bold text-slate-900">
                                    {confirmation.id.slice(0, 8).toUpperCase()}
                                </p>
                            </div>
                        )}

                        <div className="flex justify-center gap-3">
                            <Link
                                to="/compte/messages"
                                className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700 transition-colors"
                            >
                                Mes messages
                            </Link>
                            <Link
                                to="/"
                                className="px-5 py-2.5 bg-slate-100 text-slate-700 rounded-xl text-sm font-medium hover:bg-slate-200 transition-colors"
                            >
                                Retour à l&apos;accueil
                            </Link>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

function StepIndicator({ current, target, label }) {
    const active = current >= target;
    const isNow = current === target;

    return (
        <div className="flex flex-col items-center gap-1.5">
            <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${active
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-200 text-slate-400'
                    } ${isNow ? 'ring-4 ring-indigo-100' : ''}`}
            >
                {active && current > target ? <CheckCircle2 size={14} /> : target}
            </div>
            <span
                className={`text-[10px] font-bold uppercase tracking-wider ${active ? 'text-slate-800' : 'text-slate-300'
                    }`}
            >
                {label}
            </span>
        </div>
    );
}

function SummaryRow({ icon, label, value }) {
    return (
        <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl">
            <div className="p-2.5 bg-white rounded-lg shadow-sm">{icon}</div>
            <div>
                <p className="text-[10px] font-bold uppercase text-slate-400">
                    {label}
                </p>
                <p className="font-semibold text-slate-900">{value}</p>
            </div>
        </div>
    );
}

function getToken() {
    if (typeof window === 'undefined') return null;
    return sessionStorage.getItem('access_token') || localStorage.getItem('pro_token') || null;
}
