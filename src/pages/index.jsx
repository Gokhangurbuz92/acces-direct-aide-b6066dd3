import React, { Suspense, lazy } from "react";
import Layout from "./Layout.jsx";
import { BrowserRouter as Router, Route, Routes, useLocation, Navigate, useParams } from 'react-router-dom';
import AdminGuard from "@/components/AdminGuard";

// [LAZY LOADED PAGES]
// Public
const Home = lazy(() => import("./Home.jsx"));
const APropos = lazy(() => import("./APropos.jsx"));
const Accessibilite = lazy(() => import("./Accessibilite.jsx"));
const Actualites = lazy(() => import("./Actualites.jsx"));
const ActualiteDetail = lazy(() => import("./ActualiteDetail.jsx"));
const AideDetail = lazy(() => import("./AideDetail.jsx"));
const Aides = lazy(() => import("./Aides.jsx"));
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
const StructureDetail = lazy(() => import("./StructureDetail.jsx"));
const NotFound = lazy(() => import("./NotFound.jsx"));
const LoginPro = lazy(() => import("./LoginPro.jsx"));
const BeneficiaryMessages = lazy(() => import("./BeneficiaryMessages.jsx"));
const AppointmentRequest = lazy(() => import("./AppointmentRequest.jsx"));

// Admin
const AdminLogin = lazy(() => import("./AdminLogin.jsx"));
const AdminHealth = lazy(() => import("./admin/Health.jsx"));
const AdminInbox = lazy(() => import("./admin/Inbox.jsx"));
const AdminRuns = lazy(() => import("./admin/Runs.jsx"));
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
const AdminReports = lazy(() => import("./AdminReports.jsx"));

// Pro
const ProLayout = lazy(() => import("./pro/ProLayout.jsx"));
const ProLogin = lazy(() => import("./pro/Login.jsx"));
const ProRegister = lazy(() => import("./pro/Register.jsx"));
const ProForgotPassword = lazy(() => import("./pro/ForgotPassword.jsx"));
const ProResetPassword = lazy(() => import("./pro/ResetPassword.jsx"));
const ProDashboard = lazy(() => import("./pro/Dashboard.jsx"));
const ProServices = lazy(() => import("./pro/Services.jsx"));
const ProTeam = lazy(() => import("./pro/Team.jsx"));
const ProStructure = lazy(() => import("./pro/Structure.jsx"));
const ProAppointments = lazy(() => import("./pro/Appointments.jsx"));
const ProAppointmentDetail = lazy(() => import("./pro/AppointmentDetail.jsx"));

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
    DemarcheDetail, DispositifDetail, LoginPro, Demarches, Home,
    MentionsLegales, SourcesMethode, SentryTest, StructureDetail,
    AdminInbox, AdminRuns, AppointmentRequest, AdminStructures,
    AdminDemarches, AdminDemarcheEdit, AdminAppointments, AdminReview
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

function _getCurrentPage(url) {
    if (url.endsWith('/')) {
        url = url.slice(0, -1);
    }
    let urlLastPart = url.split('/').pop();
    if (urlLastPart.includes('?')) {
        urlLastPart = urlLastPart.split('?')[0];
    }

    const pageName = Object.keys(PAGES).find(page => {
        // Handle special case for nested path like /login/pro
        if (page === 'LoginPro' && url.endsWith('/login/pro')) return true;
        return page.toLowerCase() === urlLastPart.toLowerCase()
    });
    return pageName || 'Home';
}

// Create a wrapper component that uses useLocation inside the Router context
function PagesContent() {
    const location = useLocation();


    // LOT SENTRY: Special standalone route that bypasses Layout (and thus Base44 auth imports)
    // LOT 5.1: Production Hardening - Only available if VITE_PUBLIC_DIAGNOSTICS is true
    if (location.pathname === '/__sentry_test' && import.meta.env.VITE_PUBLIC_DIAGNOSTICS === 'true') {
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
                        <Route path="dashboard" element={<ProDashboard />} />
                        <Route path="services" element={<ProServices />} />
                        <Route path="team" element={<ProTeam />} />
                        <Route path="structure" element={<ProStructure />} />
                        <Route path="appointments" element={<ProAppointments />} />
                        <Route path="appointments/:id" element={<ProAppointmentDetail />} />
                    </Route>
                </Routes>
            </Suspense>
        );
    }

    return (
        <Layout currentPageName={currentPage}>
            <Suspense fallback={<PageLoader />}>
                <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/a-propos" element={<APropos />} />
                    <Route path="/accessibilite" element={<Accessibilite />} />
                    <Route path="/actualites" element={<Actualites />} />
                    <Route path="/actualites/view" element={<ActualiteDetail />} />
                    <Route path="/actualites/:slug" element={<ActualiteDetail />} />

                    <Route path="/admin/login" element={<AdminLogin />} />
                    <Route path="/admin/health" element={<AdminGuard><AdminHealth /></AdminGuard>} />
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
                    <Route path="/admin/appointments" element={<AdminGuard><AdminAppointments /></AdminGuard>} />
                    <Route path="/admin/structures" element={<AdminGuard><AdminStructures /></AdminGuard>} />
                    <Route path="/admin/demarches" element={<AdminGuard><AdminDemarches /></AdminGuard>} />
                    <Route path="/admin/demarches/:id" element={<AdminGuard><AdminDemarcheEdit /></AdminGuard>} />
                    <Route path="/admin/reports" element={<AdminGuard><AdminReports /></AdminGuard>} />

                    {/* Legacy Admin Redirects */}
                    <Route path="/adminaides" element={<Navigate to="/admin/aides" replace />} />
                    <Route path="/adminstructures" element={<Navigate to="/admin/structures" replace />} />
                    <Route path="/adminappointments" element={<Navigate to="/admin/appointments" replace />} />
                    <Route path="/admindemarches" element={<Navigate to="/admin/demarches" replace />} />

                    <Route path="/aidedetail" element={<AideDetail />} />
                    <Route path="/aide/view" element={<AideDetail />} />
                    <Route path="/aides/view" element={<AideDetail />} />
                    <Route path="/aide/:slug" element={<LegacyAideRedirect />} />
                    <Route path="/aides/:slug" element={<AideDetail />} />
                    <Route path="/aides" element={<Aides />} />
                    <Route path="/categories/:slug" element={<Aides />} />
                    <Route path="/situations/:slug" element={<Aides />} />

                    <Route path="/annuaire" element={<Navigate to="/structures" replace />} />
                    <Route path="/structures" element={<Annuaire />} />
                    <Route path="/structures/view" element={<StructureDetail />} />
                    <Route path="/structures/:slug" element={<StructureDetail />} />

                    <Route path="/confidentialite" element={<Confidentialite />} />
                    <Route path="/contact" element={<Contact />} />
                    <Route path="/cookies" element={<Cookies />} />
                    <Route path="/demarches/view" element={<DemarcheDetail />} />
                    <Route path="/demarches/:slug" element={<DemarcheDetail />} />

                    {/* Conditional Route */}
                    {import.meta.env.VITE_DEV_LOGIN_ENABLED === 'true' && (
                        <Route path="/login/pro" element={<LoginPro />} />
                    )}

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

                    {/* Styleguide */}
                    <Route path="/styleguide/branding" element={<StyleguideBranding />} />

                    <Route path="/AideDetail" element={<Navigate to="/aidedetail" replace />} />
                    <Route path="/StructureDetail" element={<Navigate to="/annuaire" replace />} />
                    <Route path="/structuredetail" element={<Navigate to="/annuaire" replace />} />
                    <Route path="/DemarcheDetail" element={<Navigate to="/demarches" replace />} />
                    <Route path="/demarchedetail" element={<Navigate to="/demarches" replace />} />
                    <Route path="/Annuaire" element={<Navigate to="/annuaire" replace />} />
                    <Route path="/Aides" element={<Navigate to="/aides" replace />} />

                    <Route path="*" element={<NotFound />} />
                </Routes>
            </Suspense>
        </Layout>
    );
}

export default function Pages() {
    return (
        <Router>
            <PagesContent />
        </Router>
    );
}