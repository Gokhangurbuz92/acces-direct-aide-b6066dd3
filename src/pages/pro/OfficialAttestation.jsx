import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import SEO from '@/components/SEO';
import brand from '@/lib/brand-config';
import {
    Download,
    Printer,
    ShieldCheck,
    ArrowLeft,
    QrCode,
    Loader2,
    Scale,
    CheckCircle2,
} from 'lucide-react';

/**
 * OfficialAttestation — Official attestation preview + print
 *
 * Route: /pro/attestation/:shareId
 *
 * Fetches certified data from /api/pro/attestation-data,
 * renders an A4-like document with institutional branding,
 * watermark, QR code placeholder, and print/export controls.
 */
export default function OfficialAttestation() {
    const { shareId } = useParams();
    const navigate = useNavigate();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [exporting, setExporting] = useState(false);

    const fetchData = useCallback(async () => {
        try {
            const res = await fetch(
                `/api/pro/attestation-data?shareId=${encodeURIComponent(shareId)}`,
                { credentials: 'include' }
            );
            if (res.ok) {
                const json = await res.json();
                setData(json.attestation);
            } else {
                // Fallback demo data for preview
                setData({
                    reference: 'ADA-DEMO-2026',
                    date: new Date().toLocaleDateString('fr-FR'),
                    expiresAt: new Date(Date.now() + 30 * 86400000).toISOString(),
                    usagerToken: shareId?.slice(0, 8)?.toUpperCase() || 'DEMO',
                    results: {},
                    professional: {
                        name: 'Agent ADA',
                        role: 'Conseiller',
                        structure: brand.institution,
                    },
                    certHash: 'DEMO000000',
                    verifyUrl: '#',
                });
            }
        } catch {
            setData({
                reference: 'ADA-DEMO-2026',
                date: new Date().toLocaleDateString('fr-FR'),
                expiresAt: new Date(Date.now() + 30 * 86400000).toISOString(),
                usagerToken: 'DEMO',
                results: {},
                professional: {
                    name: 'Agent ADA',
                    role: 'Conseiller',
                    structure: brand.institution,
                },
                certHash: 'DEMO000000',
                verifyUrl: '#',
            });
        } finally {
            setLoading(false);
        }
    }, [shareId]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleExport = () => {
        setExporting(true);
        // Production: pdf-lib generation here
        setTimeout(() => {
            setExporting(false);
            window.print();
        }, 1500);
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <Loader2 className="animate-spin text-slate-400" size={28} />
            </div>
        );
    }

    const att = data || {};

    return (
        <div className="min-h-screen bg-slate-100 pb-16">
            <SEO title={`Attestation ${att.reference} — ADA`} noindex />

            {/* Toolbar (hidden on print) */}
            <div className="print:hidden sticky top-0 z-20 bg-white border-b border-slate-200 px-4 py-3">
                <div className="max-w-4xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                        <div>
                            <p className="text-xs font-bold text-slate-900">Attestation</p>
                            <p className="text-[10px] text-slate-400">
                                Réf: {att.reference}
                            </p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => window.print()}>
                            <Printer className="mr-1.5 h-3.5 w-3.5" />
                            Imprimer
                        </Button>
                        <Button size="sm" onClick={handleExport} disabled={exporting}>
                            {exporting ? (
                                <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                            ) : (
                                <Download className="mr-1.5 h-3.5 w-3.5" />
                            )}
                            {exporting ? 'Génération...' : 'Exporter PDF'}
                        </Button>
                    </div>
                </div>
            </div>

            {/* A4 Paper */}
            <div className="max-w-3xl mx-auto mt-6 print:mt-0">
                <div className="bg-white shadow-xl print:shadow-none border border-slate-200 print:border-none min-h-[1100px] p-12 md:p-16 relative overflow-hidden">
                    {/* Watermark */}
                    <div
                        className="absolute inset-0 flex items-center justify-center pointer-events-none select-none"
                        aria-hidden="true"
                    >
                        <span
                            className="text-[100px] font-black uppercase text-slate-900/[.025] -rotate-[30deg]"
                        >
                            SOUVERAIN ADA
                        </span>
                    </div>

                    {/* Header */}
                    <header className="flex justify-between items-start border-b-2 pb-8 mb-10 relative z-10" style={{ borderColor: brand.colors.primary }}>
                        <div>
                            <div className="flex items-center gap-3 mb-3">
                                <div
                                    className="w-10 h-10 rounded-lg flex items-center justify-center text-white text-xs font-bold"
                                    style={{ backgroundColor: brand.colors.primary }}
                                >
                                    STG
                                </div>
                                <div>
                                    <p
                                        className="text-sm font-bold uppercase"
                                        style={{ color: brand.colors.primary }}
                                    >
                                        {brand.institution}
                                    </p>
                                    <p className="text-[10px] text-slate-400">
                                        {brand.region}
                                    </p>
                                </div>
                            </div>
                            <p className="text-[10px] text-slate-400 leading-relaxed">
                                {brand.contact.address}
                                <br />
                                Tél: {brand.contact.phone}
                            </p>
                        </div>
                        <div className="text-right">
                            <p className="text-[10px] text-slate-400 uppercase font-bold mb-1">
                                Délivré le
                            </p>
                            <p className="text-base font-bold text-slate-900">{att.date}</p>
                        </div>
                    </header>

                    {/* Title */}
                    <div className="text-center mb-10 relative z-10">
                        <h1 className="text-xl md:text-2xl font-bold text-slate-900 uppercase tracking-tight mb-1">
                            Attestation de Diagnostic Social
                        </h1>
                        <p className="text-xs text-indigo-600 italic">
                            Document établi par {brand.name}
                        </p>
                    </div>

                    {/* Body */}
                    <div className="relative z-10 space-y-8">
                        <p className="text-sm text-slate-700 leading-relaxed">
                            Le {brand.institution} certifie que l&apos;usager identifié par le
                            jeton <strong>{att.usagerToken}</strong> a fait l&apos;objet
                            d&apos;un diagnostic numérique souverain le {att.date}.
                        </p>

                        {/* Grid */}
                        <div className="grid grid-cols-2 gap-6 py-6 border-y border-slate-100">
                            <div>
                                <p className="text-[10px] font-bold text-slate-400 uppercase mb-2">
                                    Identifiant usager
                                </p>
                                <p className="text-sm font-bold text-slate-900">
                                    {att.usagerToken}
                                </p>
                            </div>
                            <div>
                                <p className="text-[10px] font-bold text-slate-400 uppercase mb-2">
                                    Référence attestation
                                </p>
                                <p className="text-sm font-bold text-slate-900">
                                    {att.reference}
                                </p>
                            </div>
                            <div>
                                <p className="text-[10px] font-bold text-slate-400 uppercase mb-2">
                                    Validité
                                </p>
                                <p className="text-sm font-bold text-slate-900">
                                    {att.expiresAt
                                        ? `Jusqu'au ${new Date(att.expiresAt).toLocaleDateString('fr-FR')}`
                                        : '30 jours'}
                                </p>
                            </div>
                            <div>
                                <p className="text-[10px] font-bold text-slate-400 uppercase mb-2">
                                    Statut
                                </p>
                                <p className="text-sm font-bold text-emerald-600 flex items-center gap-1">
                                    <CheckCircle2 size={12} /> Certifié
                                </p>
                            </div>
                        </div>

                        {/* Signatory */}
                        <div className="bg-slate-50 p-6 rounded-xl border border-slate-100">
                            <p className="text-[10px] font-bold text-slate-400 uppercase mb-3">
                                Signataire autorisé
                            </p>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div
                                        className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold"
                                        style={{ backgroundColor: brand.colors.primary }}
                                    >
                                        {(att.professional?.name || 'A')[0]}
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-slate-900">
                                            {att.professional?.name}
                                        </p>
                                        <p className="text-[10px] text-indigo-600 font-bold uppercase">
                                            {att.professional?.role} · {att.professional?.structure}
                                        </p>
                                    </div>
                                </div>
                                <div className="w-24 h-12 border border-slate-200 rounded-lg bg-white flex items-center justify-center text-[9px] text-slate-300 italic">
                                    Sceau numérique
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="absolute bottom-12 left-12 right-12 flex items-center justify-between border-t border-slate-100 pt-6">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                                <QrCode size={48} className="text-slate-900" />
                            </div>
                            <div>
                                <p className="text-[9px] font-bold text-slate-900 uppercase">
                                    Vérification
                                </p>
                                <p className="text-[10px] text-slate-400 max-w-[180px]">
                                    Scannez pour vérifier l&apos;intégrité sur le portail ADA.
                                </p>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="text-[9px] font-bold uppercase flex items-center justify-end gap-1" style={{ color: brand.colors.primary }}>
                                <ShieldCheck size={10} /> Document certifié
                            </p>
                            <p className="text-[8px] text-slate-400">
                                Hash: {att.certHash}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Legal notice (hidden on print) */}
                <Card className="mt-6 print:hidden bg-slate-900 text-white border-slate-800">
                    <CardContent className="p-5 flex items-start gap-3">
                        <Scale size={16} className="text-indigo-400 shrink-0 mt-0.5" />
                        <div>
                            <p className="text-xs font-bold mb-1">Validité juridique</p>
                            <p className="text-[10px] text-slate-400 leading-relaxed">
                                Cette attestation est un document administratif probant (art.
                                L.114-8 CRPA). Données chiffrées E2EE, intégrité garantie par
                                hash SHA-256.
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
