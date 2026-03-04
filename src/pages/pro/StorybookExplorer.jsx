import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton, SkeletonList } from '@/components/ui/skeleton';
import SEO from '@/components/SEO';
import EmptyState from '@/components/ui/EmptyState';
import AnimatedCard from '@/components/ui/AnimatedCard';
import {
    Loader2,
    BookOpen,
    Layers,
    Box,
    Component,
    Palette,
    Check,
    AlertCircle,
    Info,
    Search,
    ChevronRight,
    Crown,
    UserCog,
    ShieldCheck,
    Calendar,
    Eye,
    EyeOff,
    Plus,
    Trash2,
    RefreshCw,
    Star,
    Heart,
    Zap,
} from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

/**
 * StorybookExplorer — In-app component documentation
 *
 * Route: /pro/storybook
 *
 * Displays all reusable UI components with interactive demos,
 * grouped by Atoms, Molecules, and Organisms.
 * No external dependency (replaces a full Storybook install).
 */

const CATEGORIES = [
    { key: 'atoms', label: 'Atomes', icon: Box, description: 'Composants de base' },
    { key: 'molecules', label: 'Molécules', icon: Component, description: 'Composants composés' },
    { key: 'organisms', label: 'Organismes', icon: Layers, description: 'Composants complexes' },
    { key: 'feedback', label: 'Feedback', icon: AlertCircle, description: 'États et retours' },
    { key: 'tokens', label: 'Design Tokens', icon: Palette, description: 'Couleurs et typographie' },
];

function SectionTitle({ children }) {
    return <h3 className="text-sm font-bold text-slate-800 mb-3 mt-6 first:mt-0">{children}</h3>;
}

function DemoCard({ title, children }) {
    return (
        <Card className="overflow-hidden">
            <CardHeader className="pb-2">
                <CardTitle className="text-xs font-semibold text-slate-600 uppercase tracking-wider">{title}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
                {children}
            </CardContent>
        </Card>
    );
}

// ── ATOMS ──
function AtomsSection() {
    const [inputVal, setInputVal] = useState('');
    const [showPw, setShowPw] = useState(false);

    return (
        <div className="space-y-4">
            <SectionTitle>Buttons</SectionTitle>
            <DemoCard title="Button Variants">
                <div className="flex flex-wrap gap-2">
                    <Button>Default</Button>
                    <Button variant="outline">Outline</Button>
                    <Button variant="ghost">Ghost</Button>
                    <Button variant="destructive">Destructive</Button>
                    <Button disabled>Disabled</Button>
                    <Button size="sm">Small</Button>
                    <Button size="lg">Large</Button>
                </div>
            </DemoCard>

            <DemoCard title="Button avec Icônes">
                <div className="flex flex-wrap gap-2">
                    <Button><Plus className="mr-2 h-4 w-4" />Ajouter</Button>
                    <Button variant="outline"><RefreshCw className="mr-2 h-4 w-4" />Actualiser</Button>
                    <Button variant="destructive"><Trash2 className="mr-2 h-4 w-4" />Supprimer</Button>
                    <Button disabled><Loader2 className="mr-2 h-4 w-4 animate-spin" />Chargement...</Button>
                </div>
            </DemoCard>

            <SectionTitle>Inputs</SectionTitle>
            <DemoCard title="Input Fields">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="sb-email">Email standard</Label>
                        <Input id="sb-email" type="email" placeholder="nom@exemple.fr" value={inputVal} onChange={e => setInputVal(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="sb-pw">Mot de passe avec toggle</Label>
                        <div className="relative">
                            <Input id="sb-pw" type={showPw ? 'text' : 'password'} placeholder="••••••••" />
                            <button type="button" onClick={() => setShowPw(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600" aria-label={showPw ? 'Masquer' : 'Afficher'}>
                                {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="sb-search">Recherche</Label>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                            <Input id="sb-search" className="pl-10" placeholder="Rechercher..." />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="sb-disabled">Désactivé</Label>
                        <Input id="sb-disabled" disabled placeholder="Non modifiable" />
                    </div>
                </div>
            </DemoCard>

            <SectionTitle>Badges & Pills</SectionTitle>
            <DemoCard title="Status Badges">
                <div className="flex flex-wrap gap-2">
                    <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-full text-[10px] font-bold">Actif</span>
                    <span className="px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full text-[10px] font-bold">En attente</span>
                    <span className="px-2 py-0.5 bg-red-50 text-red-700 rounded-full text-[10px] font-bold">Désactivé</span>
                    <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full text-[10px] font-bold">Planifié</span>
                    <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full text-[10px] font-bold">Brouillon</span>
                    <span className="px-2 py-0.5 bg-purple-50 text-purple-700 rounded-full text-[10px] font-bold">Nouveau</span>
                </div>
            </DemoCard>

            <DemoCard title="Role Badges">
                <div className="flex flex-wrap gap-3">
                    <span className="inline-flex items-center gap-1 text-amber-600 text-xs">
                        <Crown size={10} />Responsable
                    </span>
                    <span className="inline-flex items-center gap-1 text-xs">
                        <UserCog size={10} />Agent
                    </span>
                    <span className="inline-flex items-center gap-1 text-emerald-600 text-xs">
                        <ShieldCheck size={10} />Super Admin
                    </span>
                </div>
            </DemoCard>

            <SectionTitle>Icons (Lucide)</SectionTitle>
            <DemoCard title="Icon Sizes & Colors">
                <div className="flex flex-wrap items-center gap-4">
                    {[Star, Heart, Zap, Calendar, Check, Info].map((Icon, i) => (
                        <div key={i} className="flex flex-col items-center gap-1">
                            <Icon size={24} className={['text-amber-500', 'text-red-500', 'text-yellow-500', 'text-indigo-500', 'text-emerald-500', 'text-blue-500'][i]} />
                            <span className="text-[8px] text-slate-400">{Icon.displayName || Icon.name}</span>
                        </div>
                    ))}
                </div>
            </DemoCard>
        </div>
    );
}

// ── MOLECULES ──
function MoleculesSection() {
    const [selectVal, setSelectVal] = useState('pro');
    const [dialogOpen, setDialogOpen] = useState(false);

    return (
        <div className="space-y-4">
            <SectionTitle>Card</SectionTitle>
            <DemoCard title="Card Variants">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <Card>
                        <CardContent className="p-4">
                            <p className="text-sm font-medium">Card standard</p>
                            <p className="text-xs text-slate-500 mt-1">Description du contenu</p>
                        </CardContent>
                    </Card>
                    <Card className="border-indigo-200 bg-indigo-50/30">
                        <CardContent className="p-4">
                            <p className="text-sm font-medium text-indigo-900">Card accentuée</p>
                            <p className="text-xs text-indigo-600 mt-1">Variante indigo</p>
                        </CardContent>
                    </Card>
                    <Card className="border-l-4 border-l-emerald-500">
                        <CardContent className="p-4">
                            <p className="text-sm font-medium">Card avec bordure</p>
                            <p className="text-xs text-slate-500 mt-1">Indicateur latéral</p>
                        </CardContent>
                    </Card>
                    <Card className="opacity-50">
                        <CardContent className="p-4">
                            <p className="text-sm font-medium">Card désactivée</p>
                            <p className="text-xs text-slate-500 mt-1">Réduite en opacité</p>
                        </CardContent>
                    </Card>
                </div>
            </DemoCard>

            <SectionTitle>Select</SectionTitle>
            <DemoCard title="Select Component">
                <div className="max-w-xs">
                    <Label htmlFor="sb-select">Rôle</Label>
                    <Select value={selectVal} onValueChange={setSelectVal}>
                        <SelectTrigger id="sb-select">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="pro">Professionnel</SelectItem>
                            <SelectItem value="admin">Administrateur</SelectItem>
                            <SelectItem value="super">Super Admin</SelectItem>
                        </SelectContent>
                    </Select>
                    <p className="text-xs text-slate-500 mt-1">Valeur sélectionnée : {selectVal}</p>
                </div>
            </DemoCard>

            <SectionTitle>Dialog</SectionTitle>
            <DemoCard title="Dialog / Modal">
                <Button onClick={() => setDialogOpen(true)}>Ouvrir la modale</Button>
                <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Titre de la modale</DialogTitle>
                        </DialogHeader>
                        <p className="text-sm text-slate-600">Contenu de la modale avec formulaire ou confirmation.</p>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setDialogOpen(false)}>Annuler</Button>
                            <Button onClick={() => setDialogOpen(false)}>Confirmer</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </DemoCard>
        </div>
    );
}

// ── ORGANISMS ──
function OrganismsSection() {
    return (
        <div className="space-y-4">
            <SectionTitle>AnimatedCard</SectionTitle>
            <DemoCard title="Stagger Animation">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {[0, 1, 2].map((i) => (
                        <AnimatedCard key={i} index={i}>
                            <Card className="hover:shadow-md transition-shadow">
                                <CardContent className="p-4 text-center">
                                    <p className="text-sm font-medium">Card #{i + 1}</p>
                                    <p className="text-xs text-slate-500">Stagger index: {i}</p>
                                </CardContent>
                            </Card>
                        </AnimatedCard>
                    ))}
                </div>
                <p className="text-[10px] text-slate-400 italic">Respecte prefers-reduced-motion</p>
            </DemoCard>

            <SectionTitle>Stat Cards</SectionTitle>
            <DemoCard title="KPI Cards Pattern">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {[
                        { icon: <Calendar className="text-indigo-500" size={18} />, label: 'RDV aujourd\'hui', value: 12 },
                        { icon: <Star className="text-amber-500" size={18} />, label: 'Score FALC', value: '92%' },
                        { icon: <Heart className="text-red-500" size={18} />, label: 'Satisfaction', value: '4.8/5' },
                        { icon: <Zap className="text-emerald-500" size={18} />, label: 'Temps réponse', value: '< 2h' },
                    ].map((stat, i) => (
                        <Card key={i}>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-xs font-medium text-slate-500">{stat.label}</CardTitle>
                                {stat.icon}
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{stat.value}</div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </DemoCard>
        </div>
    );
}

// ── FEEDBACK ──
function FeedbackSection() {
    return (
        <div className="space-y-4">
            <SectionTitle>Skeleton Loading</SectionTitle>
            <DemoCard title="Skeleton Variants">
                <div className="space-y-3">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                    <Skeleton className="h-10 w-full rounded-lg" />
                    <div className="flex gap-3">
                        <Skeleton className="h-10 w-10 rounded-full" />
                        <div className="space-y-2 flex-1">
                            <Skeleton className="h-4 w-1/3" />
                            <Skeleton className="h-3 w-2/3" />
                        </div>
                    </div>
                </div>
            </DemoCard>

            <DemoCard title="SkeletonList">
                <SkeletonList count={3} variant="card" />
            </DemoCard>

            <SectionTitle>Empty States</SectionTitle>
            <DemoCard title="EmptyState Component">
                <EmptyState
                    icon={<Search size={40} />}
                    title="Aucun résultat"
                    description="Essayez de modifier vos critères de recherche"
                />
            </DemoCard>

            <SectionTitle>Alerts</SectionTitle>
            <DemoCard title="Alert Patterns">
                <div className="space-y-3">
                    <div className="text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg p-3 flex items-center gap-2" role="alert">
                        <Check size={14} className="shrink-0" /> Opération réussie
                    </div>
                    <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-3 flex items-center gap-2" role="alert">
                        <AlertCircle size={14} className="shrink-0" /> Une erreur est survenue
                    </div>
                    <div className="text-sm text-blue-700 bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-center gap-2" role="alert">
                        <Info size={14} className="shrink-0" /> Information contextuelle
                    </div>
                </div>
            </DemoCard>
        </div>
    );
}

// ── DESIGN TOKENS ──
function TokensSection() {
    const colors = [
        { name: 'Indigo 600', class: 'bg-indigo-600', hex: '#4f46e5' },
        { name: 'Emerald 600', class: 'bg-emerald-600', hex: '#059669' },
        { name: 'Amber 500', class: 'bg-amber-500', hex: '#f59e0b' },
        { name: 'Red 500', class: 'bg-red-500', hex: '#ef4444' },
        { name: 'Blue 700', class: 'bg-blue-700', hex: '#1d4ed8' },
        { name: 'Slate 900', class: 'bg-slate-900', hex: '#0f172a' },
        { name: 'Teal 700', class: 'bg-teal-700', hex: '#0f766e' },
        { name: 'Purple 600', class: 'bg-purple-600', hex: '#9333ea' },
    ];

    return (
        <div className="space-y-4">
            <SectionTitle>Palette de Couleurs</SectionTitle>
            <DemoCard title="Brand Colors">
                <div className="grid grid-cols-4 sm:grid-cols-8 gap-3">
                    {colors.map((c) => (
                        <div key={c.name} className="text-center">
                            <div className={`w-full aspect-square rounded-xl ${c.class} shadow-sm`} />
                            <p className="text-[9px] font-medium text-slate-700 mt-1">{c.name}</p>
                            <p className="text-[8px] text-slate-400">{c.hex}</p>
                        </div>
                    ))}
                </div>
            </DemoCard>

            <SectionTitle>Typographie</SectionTitle>
            <DemoCard title="Heading Scale">
                <div className="space-y-2">
                    <h1 className="text-2xl font-bold text-slate-900">Heading 1 — 2xl bold</h1>
                    <h2 className="text-xl font-bold text-slate-900">Heading 2 — xl bold</h2>
                    <h3 className="text-lg font-semibold text-slate-900">Heading 3 — lg semibold</h3>
                    <p className="text-sm text-slate-600">Body — sm regular</p>
                    <p className="text-xs text-slate-500">Caption — xs regular</p>
                    <p className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">Label — [10px] uppercase bold</p>
                </div>
            </DemoCard>

            <SectionTitle>Spacing & Border Radius</SectionTitle>
            <DemoCard title="Border Radius Scale">
                <div className="flex flex-wrap gap-4 items-end">
                    {[
                        { label: 'rounded', class: 'rounded' },
                        { label: 'rounded-md', class: 'rounded-md' },
                        { label: 'rounded-lg', class: 'rounded-lg' },
                        { label: 'rounded-xl', class: 'rounded-xl' },
                        { label: 'rounded-2xl', class: 'rounded-2xl' },
                        { label: 'rounded-full', class: 'rounded-full' },
                    ].map((r) => (
                        <div key={r.label} className="text-center">
                            <div className={`w-12 h-12 bg-indigo-100 border-2 border-indigo-300 ${r.class}`} />
                            <p className="text-[8px] text-slate-500 mt-1">{r.label}</p>
                        </div>
                    ))}
                </div>
            </DemoCard>
        </div>
    );
}

export default function StorybookExplorer() {
    const [activeTab, setActiveTab] = useState('atoms');
    const [searchQuery, setSearchQuery] = useState('');

    const activeCat = CATEGORIES.find(c => c.key === activeTab);

    return (
        <div className="min-h-screen bg-slate-50 py-8 px-4">
            <SEO title="Design System — AccesDirectAide" noindex />
            <div className="max-w-6xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-indigo-600 text-white rounded-2xl">
                            <BookOpen size={22} />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-slate-900">Design System Explorer</h1>
                            <p className="text-xs text-slate-500 italic">Documentation interactive des composants ADA</p>
                        </div>
                    </div>
                    <div className="relative w-full md:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        <Input
                            className="pl-10"
                            placeholder="Filtrer les composants..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
                    {/* Sidebar navigation */}
                    <div className="space-y-2">
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-2">Catégories</p>
                        {CATEGORIES.map((cat) => {
                            const Icon = cat.icon;
                            const active = activeTab === cat.key;
                            return (
                                <button
                                    key={cat.key}
                                    onClick={() => setActiveTab(cat.key)}
                                    className={`w-full p-3 rounded-xl flex items-center gap-3 text-left transition-colors ${active ? 'bg-indigo-600 text-white shadow-md' : 'bg-white text-slate-600 hover:bg-slate-100'}`}
                                >
                                    <Icon size={14} />
                                    <div>
                                        <span className="text-sm font-bold block">{cat.label}</span>
                                        <span className={`text-[9px] ${active ? 'text-indigo-200' : 'text-slate-400'}`}>{cat.description}</span>
                                    </div>
                                </button>
                            );
                        })}

                        {/* Component count */}
                        <div className="mt-4 p-3 bg-white rounded-xl border border-slate-200">
                            <p className="text-[9px] font-bold text-slate-400 uppercase mb-2">Statistiques</p>
                            <div className="space-y-1">
                                <div className="flex justify-between text-xs">
                                    <span className="text-slate-500">Composants</span>
                                    <span className="font-bold text-slate-900">34</span>
                                </div>
                                <div className="flex justify-between text-xs">
                                    <span className="text-slate-500">Variantes</span>
                                    <span className="font-bold text-slate-900">87</span>
                                </div>
                                <div className="flex justify-between text-xs">
                                    <span className="text-slate-500">Tokens</span>
                                    <span className="font-bold text-slate-900">24</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Content area */}
                    <div className="lg:col-span-4">
                        <div className="flex items-center gap-2 mb-4">
                            {activeCat && <activeCat.icon size={16} className="text-indigo-500" />}
                            <h2 className="text-sm font-bold text-slate-800">{activeCat?.label}</h2>
                            <ChevronRight size={12} className="text-slate-300" />
                            <span className="text-xs text-slate-500">{activeCat?.description}</span>
                        </div>

                        {activeTab === 'atoms' && <AtomsSection />}
                        {activeTab === 'molecules' && <MoleculesSection />}
                        {activeTab === 'organisms' && <OrganismsSection />}
                        {activeTab === 'feedback' && <FeedbackSection />}
                        {activeTab === 'tokens' && <TokensSection />}
                    </div>
                </div>
            </div>
        </div>
    );
}
