import { Suspense, lazy, Component } from "react";
import { BrowserRouter, MemoryRouter, Route, Routes, useLocation, Navigate, useParams } from 'react-router-dom';
import { frontendEnv } from "@/config/env";

/**
 * ErrorBoundary — catches chunk-load or mount errors in lazy-loaded routes.
 * Displays a clear fallback instead of a blank page.
 */
class RouteErrorBoundary extends Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, errorMessage: '' };
    }
    static getDerivedStateFromError(error) {
        return {
            hasError: true,
            errorMessage: error?.message || 'Erreur inconnue',
        };
    }
    render() {
        if (this.state.hasError) {
            return (
                <div className="flex min-h-[50vh] items-center justify-center p-4">
                    <div className="w-full max-w-md rounded-lg border border-red-200 bg-red-50 p-6 text-center">
                        <h1 className="mb-2 text-xl font-bold text-red-800">
                            Impossible de charger cette page
                        </h1>
                        <p className="mb-4 text-sm text-red-700">
                            Une erreur est survenue lors du chargement. Veuillez rafraîchir la page.
                        </p>
                        <button
                            type="button"
                            onClick={() => window.location.reload()}
                            className="inline-flex items-center rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
                        >
                            Rafraîchir
                        </button>
                    </div>
                </div>
            );
        }
        return this.props.children;
    }
}

// [LAZY LOADED PAGES]
// Public
const Home = lazy(() => import("./Home.jsx"));
const Login = lazy(() => import("./Login.jsx"));
const Orientation = lazy(() => import("./Orientation.jsx"));
const APropos = lazy(() => import("./APropos.jsx"));
const Accessibilite = lazy(() => import("./Accessibilite.jsx"));
const Actualites = lazy(() => import("./Actualites.jsx"));
const ActualiteDetail = lazy(() => import("./ActualiteDetail.jsx"));
const AideDetail = lazy(() => import("./AideDetail.jsx"));
const Aides = lazy(() => import("./Aides.jsx"));
const Recherche = lazy(() => import("./Recherche.jsx"));
const Annuaire = lazy(() => import("./Annuaire.jsx"));
const Confidentialite = lazy(() => import("./Confidentialite.jsx"));
const Contact = lazy(() => import("./Contact.jsx"));
const Cookies = lazy(() => import("./Cookies.jsx"));
const DemarcheDetail = lazy(() => import("./DemarcheDetail.jsx"));
const Demarches = lazy(() => import("./Demarches.jsx"));
const DispositifDetail = lazy(() => import("./DispositifDetail.jsx"));
const Dispositifs = lazy(() => import("./Dispositifs.jsx"));
const Ressources = lazy(() => import("./Ressources.jsx"));
const RessourceDetail = lazy(() => import("./RessourceDetail.jsx"));
const Guides = lazy(() => import("./Guides.jsx"));
const GuideDetail = lazy(() => import("./GuideDetail.jsx"));
const Tools = lazy(() => import("./Tools.jsx"));
const ToolDetail = lazy(() => import("./ToolDetail.jsx"));
const MentionsLegales = lazy(() => import("./MentionsLegales.jsx"));
const SourcesMethode = lazy(() => import("./SourcesMethode.jsx"));
const Impact = lazy(() => import("./Impact.jsx"));
const Mission = lazy(() => import("./Mission.jsx"));
const Method = lazy(() => import("./Method.jsx"));
const Sources = lazy(() => import("./Sources.jsx"));
const Security = lazy(() => import("./Security.jsx"));
const Partners = lazy(() => import("./Partners.jsx"));
const SuggestStructure = lazy(() => import("./SuggestStructure.jsx"));
const SubventionDossier = lazy(() => import("./SubventionDossier.jsx"));
const Status = lazy(() => import("./Status.jsx"));
const StructureDetail = lazy(() => import("./StructureDetail.jsx"));
const NotFound = lazy(() => import("./NotFound.jsx"));

const BeneficiaryMessages = lazy(() => import("./BeneficiaryMessages.jsx"));
const AppointmentRequest = lazy(() => import("./AppointmentRequest.jsx"));
const AppointmentCancel = lazy(() => import("./AppointmentCancel.jsx"));
const AppointmentReschedule = lazy(() => import("./AppointmentReschedule.jsx"));
const PublicRdvEntry = lazy(() => import("./PublicRdvEntry.jsx"));
const AuthRdvAccess = lazy(() => import("./AuthRdvAccess.jsx"));
const AuthVerifyEmail = lazy(() => import("./AuthVerifyEmail.jsx"));
const AuthForgotPassword = lazy(() => import("./AuthForgotPassword.jsx"));
const AuthResetPassword = lazy(() => import("./AuthResetPassword.jsx"));
const CompteMessages = lazy(() => import("./CompteMessages.jsx"));
const CompteMessageThread = lazy(() => import("./CompteMessageThread.jsx"));
const Layout = lazy(() => import("./Layout.jsx"));
const AdminGuard = lazy(() => import("@/components/AdminGuard"));
const ProGuard = lazy(() => import("@/components/ProGuard"));

// Admin
const AdminLogin = lazy(() => import("./AdminLogin.jsx"));
const AdminHealth = lazy(() => import("./admin/Health.jsx"));
const AdminInbox = lazy(() => import("./admin/Inbox.jsx"));
const AdminRuns = lazy(() => import("./admin/Runs.jsx"));
const AdminObservability = lazy(() => import("./admin/Observability.jsx"));
const AdminReviewQueue = lazy(() => import("./admin/ReviewQueue.jsx"));
const AdminAideEdit = lazy(() => import("./AdminAideEdit.jsx"));
const AdminAides = lazy(() => import("./AdminAides.jsx"));
const AdminAppointments = lazy(() => import("./AdminAppointments.jsx"));
const AdminStructures = lazy(() => import("./AdminStructures.jsx"));
const AdminDemarcheEdit = lazy(() => import("./AdminDemarcheEdit.jsx"));
const AdminDemarches = lazy(() => import("./AdminDemarches.jsx"));
const AdminGuideSync = lazy(() => import("./AdminGuideSync.jsx"));
const AdminMessages = lazy(() => import("./AdminMessages.jsx"));
const AdminRecentSyncs = lazy(() => import("./AdminRecentSyncs.jsx"));
const AdminSources = lazy(() => import("./AdminSources.jsx"));
const AdminSync = lazy(() => import("./AdminSync.jsx"));
const AdminTestSync = lazy(() => import("./AdminTestSync.jsx"));
const AdminReview = lazy(() => import("./AdminReview.jsx"));

// Pro
const ProLayout = lazy(() => import("./pro/ProLayout.jsx"));
const ProLogin = lazy(() => import("./pro/Login.jsx"));
const ProRegister = lazy(() => import("./pro/Register.jsx"));
const ProForgotPassword = lazy(() => import("./pro/ForgotPassword.jsx"));
const ProResetPassword = lazy(() => import("./pro/ResetPassword.jsx"));
const ProDashboard = lazy(() => import("./pro/Dashboard.jsx"));
const ProServices = lazy(() => import("./pro/Services.jsx"));
const ProAvailability = lazy(() => import("./pro/Availability.jsx"));
const ProTeam = lazy(() => import("./pro/Team.jsx"));
const ProStructure = lazy(() => import("./pro/Structure.jsx"));
const ProAppointments = lazy(() => import("./pro/Appointments.jsx"));
const ProAppointmentDetail = lazy(() => import("./pro/AppointmentDetail.jsx"));
const ProRdvLayout = lazy(() => import("./pro/RdvLayout.jsx"));
const ProRdvNew = lazy(() => import("./pro/RdvNew.jsx"));
const ProRdvAbsences = lazy(() => import("./pro/RdvAbsences.jsx"));
const ProMessages = lazy(() => import("./pro/Messages.jsx"));
const ProMessageThread = lazy(() => import("./pro/MessageThread.jsx"));

// Sentry
const SentryTest = lazy(() => import("@/components/SentryTest.jsx"));
const SentryTestPage = lazy(() => import("./SentryTestPage.jsx"));

// Styleguide
const StyleguideBranding = lazy(() => import("./StyleguideBranding.jsx"));

// Map for _getCurrentPage logic (keeping structure for logic compatibility)
const PAGES = {
    AdminLogin, APropos, Accessibilite, Actualites, ActualiteDetail,
    AdminAideEdit, AdminAides, AdminGuideSync, AdminMessages,
    AdminRecentSyncs, AdminSources, AdminSync, AdminTestSync,
    AideDetail, Aides, Annuaire, Confidentialite, Contact, Cookies,
    DemarcheDetail, DispositifDetail, Login, Demarches, Home, Orientation,
    MentionsLegales, SourcesMethode, SentryTest, StructureDetail,
    AdminInbox, AdminRuns, AdminObservability, AdminReviewQueue, AppointmentRequest, AppointmentCancel, AppointmentReschedule, AdminStructures,
    AdminDemarches, AdminDemarcheEdit, AdminAppointments, AdminReview, Status, PublicRdvEntry, AuthRdvAccess, AuthVerifyEmail, AuthForgotPassword, AuthResetPassword,
    CompteMessages, CompteMessageThread, ProMessages, ProMessageThread
};

// Loading Fallback
const PageLoader = () => (
    <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
    </div>
);

function LegacyAideRedirect() {
    const { slug } = useParams();
    return <Navigate to={`/aides/${slug}`} replace />;
}

/**
 * Redirects legacy /entity/view?id=xxx URLs to /entity/xxx
 */
function LegacyViewRedirect({ basePath }) {
    const location = useLocation();
    const id = new URLSearchParams(location.search).get('id');
    return <Navigate to={`${basePath}/${id || ''}`} replace />;
}

/**
 * @param {string} url
 */
function _getCurrentPage(url) {
    if (url.endsWith('/')) {
        url = url.slice(0, -1);
    }
    let urlLastPart = url.split('/').pop() || '';
    if (urlLastPart.includes('?')) {
        urlLastPart = urlLastPart.split('?')[0];
    }

    const pageName = Object.keys(PAGES).find(page => {
        return page.toLowerCase() === urlLastPart.toLowerCase()
    });
    return pageName || 'Home';
}

// Create a wrapper component that uses useLocation inside the Router context
function PagesContent() {
    const location = useLocation();


    // LOT SENTRY: Special standalone route that bypasses Layout (and thus Base44 auth imports)
    // LOT 5.1: Production Hardening - Only available if VITE_PUBLIC_DIAGNOSTICS is true
    if (location.pathname === '/__sentry_test' && frontendEnv.flags.publicDiagnostics) {
        return (
            <Suspense fallback={<PageLoader />}>
                <Routes>
                    <Route path="/__sentry_test" element={<SentryTestPage />} />
                </Routes>
            </Suspense>
        );
    }

    const currentPage = _getCurrentPage(location.pathname);

    // Lot 4: Pro Routes (Bypass Public Layout)
    if (location.pathname.startsWith('/pro')) {
        return (
            <Suspense fallback={<PageLoader />}>
                <Routes>
                    <Route path="/pro" element={<ProLayout />}>
                        <Route index element={<Navigate to="dashboard" replace />} />
                        <Route path="login" element={<ProLogin />} />
                        <Route path="register" element={<ProRegister />} />
                        <Route path="forgot-password" element={<ProForgotPassword />} />
                        <Route path="reset-password" element={<ProResetPassword />} />
                        <Route path="dashboard" element={<ProGuard><ProDashboard /></ProGuard>} />
                        <Route path="rdv" element={<ProGuard><ProRdvLayout /></ProGuard>}>
                            <Route index element={<Navigate to="agenda" replace />} />
                            <Route path="services" element={<ProServices />} />
                            <Route path="disponibilites" element={<ProAvailability />} />
                            <Route path="agenda" element={<ProAppointments />} />
                            <Route path="new" element={<ProRdvNew />} />
                            <Route path="absences" element={<ProRdvAbsences />} />
                        </Route>
                        <Route path="messages" element={<ProGuard><ProMessages /></ProGuard>} />
                        <Route path="messages/:conversationId" element={<ProGuard><ProMessageThread /></ProGuard>} />
                        <Route path="services" element={<Navigate to="/pro/rdv/services" replace />} />
                        <Route path="availability" element={<Navigate to="/pro/rdv/disponibilites" replace />} />
                        <Route path="appointments" element={<Navigate to="/pro/rdv/agenda" replace />} />
                        <Route path="team" element={<ProGuard><ProTeam /></ProGuard>} />
                        <Route path="structure" element={<ProGuard><ProStructure /></ProGuard>} />
                        <Route path="appointments/:id" element={<ProGuard><ProAppointmentDetail /></ProGuard>} />
                    </Route>
                </Routes>
            </Suspense>
        );
    }

    return (
        <Suspense fallback={<PageLoader />}>
            <Layout currentPageName={currentPage}>
                <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/auth/login" element={<RouteErrorBoundary><AuthRdvAccess mode="login" /></RouteErrorBoundary>} />
                    <Route path="/auth/signup" element={<RouteErrorBoundary><AuthRdvAccess mode="signup" /></RouteErrorBoundary>} />
                    <Route path="/auth/verify-email" element={<AuthVerifyEmail />} />
                    <Route path="/auth/forgot" element={<AuthForgotPassword />} />
                    <Route path="/auth/reset" element={<AuthResetPassword />} />
                    <Route path="/compte/messages" element={<CompteMessages />} />
                    <Route path="/compte/messages/:conversationId" element={<CompteMessageThread />} />
                    <Route path="/a-propos" element={<APropos />} />
                    <Route path="/accessibilite" element={<Accessibilite />} />
                    <Route path="/actualites" element={<Actualites />} />
                    <Route path="/actualites/view" element={<LegacyViewRedirect basePath="/actualites" />} />
                    <Route path="/actualites/:slug" element={<ActualiteDetail />} />

                    <Route path="/admin/login" element={<AdminLogin />} />
                    <Route path="/admin/health" element={<AdminGuard><AdminHealth /></AdminGuard>} />
                    <Route path="/admin/observability" element={<AdminGuard><AdminObservability /></AdminGuard>} />
                    <Route path="/admin/review-queue" element={<AdminGuard><AdminReviewQueue /></AdminGuard>} />
                    <Route path="/admin/inbox" element={<AdminGuard><AdminInbox /></AdminGuard>} />
                    <Route path="/admin/runs" element={<AdminGuard><AdminRuns /></AdminGuard>} />
                    <Route path="/admin/aides/:id" element={<AdminGuard><AdminAideEdit /></AdminGuard>} />
                    <Route path="/admin/aides" element={<AdminGuard><AdminAides /></AdminGuard>} />
                    <Route path="/admin" element={<Navigate to="/admin/aides" replace />} />
                    <Route path="/admin/guides/sync" element={<AdminGuard><AdminGuideSync /></AdminGuard>} />
                    <Route path="/admin/messages" element={<AdminGuard><AdminMessages /></AdminGuard>} />
                    <Route path="/admin/review" element={<AdminGuard><AdminReview /></AdminGuard>} />
                    <Route path="/admin/sync/recent" element={<AdminGuard><AdminRecentSyncs /></AdminGuard>} />
                    <Route path="/admin/sources" element={<AdminGuard><AdminSources /></AdminGuard>} />
                    <Route path="/admin/sync" element={<AdminGuard><AdminSync /></AdminGuard>} />
                    <Route path="/admin/sync/test" element={<AdminGuard><AdminTestSync /></AdminGuard>} />
                    <Route path="/appointments/request" element={<AppointmentRequest />} />
                    <Route path="/appointments/cancel/:token" element={<AppointmentCancel />} />
                    <Route path="/appointments/reschedule/:token" element={<AppointmentReschedule />} />
                    <Route path="/rdv/:structureSlug" element={<PublicRdvEntry view="landing" />} />
                    <Route path="/rdv/:structureSlug/services" element={<PublicRdvEntry view="services" />} />
                    <Route path="/rdv/:structureSlug/creneaux" element={<PublicRdvEntry view="creneaux" />} />
                    <Route path="/admin/appointments" element={<AdminGuard><AdminAppointments /></AdminGuard>} />
                    <Route path="/admin/structures" element={<AdminGuard><AdminStructures /></AdminGuard>} />
                    <Route path="/admin/demarches" element={<AdminGuard><AdminDemarches /></AdminGuard>} />
                    <Route path="/admin/demarches/:id" element={<AdminGuard><AdminDemarcheEdit /></AdminGuard>} />

                    {/* Legacy Admin Redirects */}
                    <Route path="/adminaides" element={<Navigate to="/admin/aides" replace />} />
                    <Route path="/adminstructures" element={<Navigate to="/admin/structures" replace />} />
                    <Route path="/adminappointments" element={<Navigate to="/admin/appointments" replace />} />
                    <Route path="/admindemarches" element={<Navigate to="/admin/demarches" replace />} />

                    <Route path="/aidedetail" element={<AideDetail />} />
                    <Route path="/aide/view" element={<AideDetail />} />
                    <Route path="/aides/view" element={<LegacyViewRedirect basePath="/aides" />} />
                    <Route path="/aide/:slug" element={<LegacyAideRedirect />} />
                    <Route path="/aides/:slug" element={<AideDetail />} />
                    <Route path="/aides" element={<Aides />} />
                    <Route path="/recherche" element={<Recherche />} />
                    <Route path="/categories/:slug" element={<Aides />} />
                    <Route path="/situations/:slug" element={<Aides />} />

                    <Route path="/structures" element={<Annuaire />} />
                    <Route path="/annuaire" element={<Navigate to="/structures" replace />} />
                    <Route path="/structures/view" element={<LegacyViewRedirect basePath="/structures" />} />
                    <Route path="/structures/:slug" element={<StructureDetail />} />

                    <Route path="/politique-confidentialite" element={<Confidentialite />} />
                    <Route path="/confidentialite" element={<Navigate to="/politique-confidentialite" replace />} />
                    <Route path="/contact" element={<Contact />} />
                    <Route path="/cookies" element={<Cookies />} />
                    <Route path="/demarches/view" element={<LegacyViewRedirect basePath="/demarches" />} />
                    <Route path="/demarches/:slug" element={<DemarcheDetail />} />

                    {/* Legacy alias — canonical route is /pro/login */}
                    <Route path="/login/pro" element={<Navigate to="/pro/login" replace />} />

                    <Route path="/orientation" element={<Orientation />} />
                    <Route path="/demarches" element={<Demarches />} />
                    <Route path="/home" element={<Navigate to="/" replace />} />
                    <Route path="/mentions-legales" element={<MentionsLegales />} />
                    <Route path="/sourcesmethode" element={<SourcesMethode />} />
                    <Route path="/sentry-test" element={<SentryTest />} />
                    <Route path="/r/:token/messages" element={<BeneficiaryMessages />} />
                    <Route path="/bonnes-pratiques" element={<Guides />} />
                    <Route path="/bonnes-pratiques/:slug" element={<GuideDetail />} />
                    <Route path="/outils" element={<Tools />} />
                    <Route path="/outils/:slug" element={<ToolDetail />} />
                    <Route path="/dispositifs" element={<Dispositifs />} />
                    <Route path="/dispositifs/:slug" element={<DispositifDetail />} />
                    <Route path="/dispositifs/view" element={<DispositifDetail />} />

                    <Route path="/ressources" element={<Ressources />} />
                    <Route path="/ressources/:slug" element={<RessourceDetail />} />
                    <Route path="/ressources/view" element={<RessourceDetail />} />

                    <Route path="/impact" element={<Impact />} />
                    <Route path="/notre-mission" element={<Mission />} />
                    <Route path="/notre-methode" element={<Method />} />
                    <Route path="/sources" element={<Sources />} />
                    <Route path="/securite-et-rgpd" element={<Security />} />
                    <Route path="/partenaires" element={<Partners />} />
                    <Route path="/proposer-une-structure" element={<SuggestStructure />} />
                    <Route path="/dossier-subventions" element={<SubventionDossier />} />
                    <Route path="/status" element={<Status />} />

                    {/* Styleguide */}
                    <Route path="/styleguide/branding" element={<StyleguideBranding />} />

                    <Route path="/AideDetail" element={<Navigate to="/aidedetail" replace />} />
                    <Route path="/StructureDetail" element={<Navigate to="/annuaire" replace />} />
                    <Route path="/structuredetail" element={<Navigate to="/annuaire" replace />} />
                    <Route path="/DemarcheDetail" element={<Navigate to="/demarches" replace />} />
                    <Route path="/demarchedetail" element={<Navigate to="/demarches" replace />} />
                    <Route path="/Annuaire" element={<Navigate to="/annuaire" replace />} />
                    <Route path="/Aides" element={<Navigate to="/aides" replace />} />

                    {/* Phase 1: /assistant redirect → /orientation */}
                    <Route path="/assistant" element={<Navigate to="/orientation" replace />} />

                    {/* Mon assistant "bientôt disponible" page */}
                    <Route path="/mon-assistant" element={
                        <div className="p-8 text-center">
                            <h1 className="text-2xl font-bold mb-4">Mon Assistant</h1>
                            <p>Bientôt disponible</p>
                        </div>
                    } />


                    <Route path="*" element={<NotFound />} />
                </Routes>
            </Layout>
        </Suspense>
    );
}

export default function Pages({ url }) {
    const isServer = typeof window === 'undefined' || url !== undefined;
    if (isServer) {
        return (
            <MemoryRouter initialEntries={[url || '/']}>
                <PagesContent />
            </MemoryRouter>
        );
    }
    return (
        <BrowserRouter>
            <PagesContent />
        </BrowserRouter>
    );
}
