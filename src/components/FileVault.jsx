import { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { encryptFile } from '@/lib/crypto-files';
import {
    ShieldCheck,
    Upload,
    X,
    CheckCircle2,
    Lock,
    Loader2,
    FileText,
    AlertCircle,
    File,
} from 'lucide-react';

const MAX_SIZE = 5 * 1024 * 1024; // 5 MB
const ALLOWED_TYPES = [
    'application/pdf',
    'image/jpeg',
    'image/png',
    'image/webp',
];

/**
 * FileVault — Coffre-fort de justificatifs E2EE
 *
 * Props:
 * - shareId: clé de chiffrement dérivée du dossier partagé
 * - onUploadSuccess: callback après envoi réussi
 */
export default function FileVault({ shareId, onUploadSuccess }) {
    const [file, setFile] = useState(null);
    const [status, setStatus] = useState('idle'); // idle | encrypting | uploading | success | error
    const [errorMsg, setErrorMsg] = useState('');
    const inputRef = useRef(null);

    const handleFileChange = (e) => {
        const selected = e.target.files?.[0];
        if (!selected) return;

        if (selected.size > MAX_SIZE) {
            setErrorMsg('Fichier trop volumineux (max 5 Mo)');
            return;
        }

        if (!ALLOWED_TYPES.includes(selected.type)) {
            setErrorMsg('Format non accepté. Utilisez PDF, JPG ou PNG.');
            return;
        }

        setErrorMsg('');
        setFile(selected);
        setStatus('idle');
    };

    const handleUpload = async () => {
        if (!file || !shareId) return;

        try {
            // Step 1: Client-side encryption
            setStatus('encrypting');
            const encryptedBlob = await encryptFile(file, shareId);

            // Step 2: Upload encrypted blob
            setStatus('uploading');
            const formData = new FormData();
            formData.append('file', encryptedBlob);
            formData.append('shareId', shareId);
            formData.append('originalName', file.name);
            formData.append('mimeType', file.type);

            const res = await fetch('/api/pro/dossier/upload-secure', {
                method: 'POST',
                body: formData,
            });

            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                throw new Error(data.error || 'Échec de l\'envoi');
            }

            setStatus('success');
            setTimeout(() => {
                setFile(null);
                setStatus('idle');
                onUploadSuccess?.();
            }, 2500);
        } catch (err) {
            setErrorMsg(err.message || 'Erreur lors du chiffrement');
            setStatus('error');
        }
    };

    const clearFile = () => {
        setFile(null);
        setStatus('idle');
        setErrorMsg('');
        if (inputRef.current) inputRef.current.value = '';
    };

    const isProcessing = status === 'encrypting' || status === 'uploading';

    return (
        <Card>
            <CardHeader className="pb-3">
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                    <ShieldCheck size={14} className="text-indigo-600" />
                    Coffre-fort justificatifs
                </CardTitle>
                <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider flex items-center gap-1">
                    <Lock size={9} /> Chiffrement E2EE
                </p>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Error message */}
                {errorMsg && (
                    <div className="flex items-center gap-2 p-2 bg-red-50 text-red-600 rounded-lg text-xs">
                        <AlertCircle size={12} />
                        {errorMsg}
                    </div>
                )}

                {/* Drop zone or file preview */}
                {!file ? (
                    <label className="border-2 border-dashed border-slate-200 rounded-xl p-6 flex flex-col items-center gap-2 hover:border-indigo-400 hover:bg-indigo-50/30 transition-colors cursor-pointer">
                        <Upload className="text-slate-400" size={24} />
                        <span className="text-xs font-medium text-slate-600">
                            Déposez votre document
                        </span>
                        <span className="text-[10px] text-slate-400">
                            PDF, JPG, PNG · Max 5 Mo
                        </span>
                        <input
                            ref={inputRef}
                            type="file"
                            className="hidden"
                            accept=".pdf,.jpg,.jpeg,.png,.webp"
                            onChange={handleFileChange}
                        />
                    </label>
                ) : (
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center gap-3">
                        <File className="text-indigo-600 shrink-0" size={18} />
                        <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold text-slate-800 truncate">
                                {file.name}
                            </p>
                            <p className="text-[10px] text-slate-400">
                                {(file.size / 1024).toFixed(0)} Ko
                            </p>
                        </div>
                        {!isProcessing && status !== 'success' && (
                            <button
                                onClick={clearFile}
                                className="p-1 text-slate-400 hover:text-red-500"
                                aria-label="Retirer le fichier"
                            >
                                <X size={14} />
                            </button>
                        )}
                    </div>
                )}

                {/* Upload button */}
                {file && (
                    <Button
                        onClick={handleUpload}
                        disabled={isProcessing || status === 'success'}
                        className={`w-full ${status === 'success'
                                ? 'bg-emerald-500 hover:bg-emerald-500'
                                : ''
                            }`}
                    >
                        {status === 'encrypting' && (
                            <>
                                <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                                Chiffrement...
                            </>
                        )}
                        {status === 'uploading' && (
                            <>
                                <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                                Envoi sécurisé...
                            </>
                        )}
                        {status === 'success' && (
                            <>
                                <CheckCircle2 className="mr-2 h-3.5 w-3.5" />
                                Envoyé !
                            </>
                        )}
                        {(status === 'idle' || status === 'error') && (
                            <>
                                <ShieldCheck className="mr-2 h-3.5 w-3.5" />
                                Chiffrer & Envoyer
                            </>
                        )}
                    </Button>
                )}

                {/* Trust footer */}
                <p className="text-[10px] text-slate-400 leading-relaxed">
                    Le fichier est chiffré sur votre appareil avant envoi. Seul votre
                    accompagnateur pourra le déchiffrer.
                </p>
            </CardContent>
        </Card>
    );
}
