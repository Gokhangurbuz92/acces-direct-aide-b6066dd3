import Layout from "./Layout.jsx";

import APropos from "./APropos";

import Accessibilite from "./Accessibilite";

import Actualites from "./Actualites";
import ActualiteDetail from "./ActualiteDetail";

import AdminAideEdit from "./AdminAideEdit";

import AdminAides from "./AdminAides";

import AdminAppointments from "./AdminAppointments";

import AdminStructures from "./AdminStructures";

import AdminDemarcheEdit from "./AdminDemarcheEdit";

import AdminDemarches from "./AdminDemarches";

import AdminGuideSync from "./AdminGuideSync";

import AdminMessages from "./AdminMessages";

import AdminRecentSyncs from "./AdminRecentSyncs";

import AdminSources from "./AdminSources";

import AdminSync from "./AdminSync";

import AdminTestSync from "./AdminTestSync";

import AppointmentRequest from "./AppointmentRequest";

import AideDetail from "./AideDetail";

import Aides from "./Aides";

import Annuaire from "./Annuaire";

import Confidentialite from "./Confidentialite";

import Contact from "./Contact";

import Cookies from "./Cookies";

import DemarcheDetail from "./DemarcheDetail";

import LoginPro from "./LoginPro"; // [NEW]

import SentryTestPage from "./SentryTestPage"; // [NEW - Standalone]
import BeneficiaryMessages from "./BeneficiaryMessages";

import Guides from "./Guides";
import GuideDetail from "./GuideDetail";
import Tools from "./Tools";
import ToolDetail from "./ToolDetail";

import Dispositifs from "./Dispositifs"; // [NEW]


import Demarches from "./Demarches";

import Home from "./Home";

import MentionsLegales from "./MentionsLegales";

import SourcesMethode from "./SourcesMethode";

import SentryTest from "@/components/SentryTest"; // [NEW]

import StructureDetail from "./StructureDetail";

import AdminReview from "./AdminReview";

import AdminLogin from "./AdminLogin";
import AdminInbox from "./admin/Inbox";
import AdminRuns from "./admin/Runs";

// Lot 4: Pro Module Imports
import ProLayout from "./pro/ProLayout";
import ProLogin from "./pro/Login";
import ProRegister from "./pro/Register";
import ProForgotPassword from "./pro/ForgotPassword";
import ProResetPassword from "./pro/ResetPassword";
import ProDashboard from "./pro/Dashboard";
import ProServices from "./pro/Services";
import ProTeam from "./pro/Team";
import ProStructure from "./pro/Structure";
import Impact from "./Impact";
import Mission from "./Mission";
import Method from "./Method";
import Sources from "./Sources";
import Security from "./Security";
import Partners from "./Partners";
import SuggestStructure from "./SuggestStructure";
import SubventionDossier from "./SubventionDossier";

import ProAppointments from "./pro/Appointments";
import ProAppointmentDetail from "./pro/AppointmentDetail";

import RequireAuth from "@/components/RequireAuth";

import { BrowserRouter as Router, Route, Routes, useLocation, Navigate } from 'react-router-dom';
import { apiClient } from '@/api/client';
import { useState, useEffect } from 'react';

const PAGES = {
    AdminLogin: AdminLogin,
    APropos: APropos,

    Accessibilite: Accessibilite,

    Actualites: Actualites,
    ActualiteDetail: ActualiteDetail,

    AdminAideEdit: AdminAideEdit,

    AdminAides: AdminAides,

    AdminGuideSync: AdminGuideSync,

    AdminMessages: AdminMessages,

    AdminRecentSyncs: AdminRecentSyncs,

    AdminSources: AdminSources,

    AdminSync: AdminSync,

    AdminTestSync: AdminTestSync,

    AideDetail: AideDetail,

    Aides: Aides,

    Annuaire: Annuaire,

    Confidentialite: Confidentialite,

    Contact: Contact,

    Cookies: Cookies,

    DemarcheDetail: DemarcheDetail,

    LoginPro: LoginPro, // [NEW]

    Demarches: Demarches,

    Home: Home,

    MentionsLegales: MentionsLegales,

    SourcesMethode: SourcesMethode,



    SentryTest: SentryTest,

    StructureDetail: StructureDetail,
    AdminInbox: AdminInbox,
    AdminRuns: AdminRuns,

}

import { Helmet } from 'react-helmet-async';

// Simple Admin Route Guard - auth check only here, not on public routes
function AdminRoute({ children }) {
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState(null);

    useEffect(() => {
        apiClient.auth.getUser().then(u => {
            setUser(u);
            setLoading(false);
        });
    }, []);

    if (loading) return <div>Chargement...</div>;
    if (!user) return <Navigate to="/admin/login" replace />;

    return (
        <>
            <Helmet>
                <meta name="robots" content="noindex, nofollow" />
            </Helmet>
            {children}
        </>
    );
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
            <Routes>
                <Route path="/__sentry_test" element={<SentryTestPage />} />
            </Routes>
        );
    }

    const currentPage = _getCurrentPage(location.pathname);

    // Lot 4: Pro Routes (Bypass Public Layout)
    if (location.pathname.startsWith('/pro')) {
        return (
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
        );
    }

    return (
        <Layout currentPageName={currentPage}>
            <Routes>

                <Route path="/" element={<Home />} />


                <Route path="/apropos" element={<APropos />} />

                <Route path="/accessibilite" element={<Accessibilite />} />

                <Route path="/actualites" element={<Actualites />} />
                <Route path="/actualites/:slug" element={<ActualiteDetail />} />

                <Route path="/admin/login" element={<AdminLogin />} />
                <Route path="/admin/inbox" element={<AdminRoute><AdminInbox /></AdminRoute>} />
                <Route path="/admin/runs" element={<AdminRoute><AdminRuns /></AdminRoute>} />

                <Route path="/adminaideedit" element={<AdminRoute><AdminAideEdit /></AdminRoute>} />

                <Route path="/adminaides" element={<AdminRoute><AdminAides /></AdminRoute>} />
                <Route path="/admin" element={<Navigate to="/adminaides" replace />} />

                <Route path="/adminguidesync" element={<AdminRoute><AdminGuideSync /></AdminRoute>} />

                <Route path="/adminmessages" element={<AdminRoute><AdminMessages /></AdminRoute>} />

                <Route path="/admin/review" element={<AdminRoute><AdminReview /></AdminRoute>} />

                <Route path="/adminrecentsyncs" element={<AdminRoute><AdminRecentSyncs /></AdminRoute>} />

                <Route path="/adminsources" element={<AdminRoute><AdminSources /></AdminRoute>} />
                <Route path="/adminrecentsyncs" element={<RequireAuth><AdminRecentSyncs /></RequireAuth>} />

                <Route path="/adminsources" element={<RequireAuth><AdminSources /></RequireAuth>} />

                <Route path="/adminsync" element={<RequireAuth><AdminSync /></RequireAuth>} />

                <Route path="/admintestsync" element={<RequireAuth><AdminTestSync /></RequireAuth>} />

                <Route path="/appointmentrequest" element={<AppointmentRequest />} />

                <Route path="/adminappointments" element={<RequireAuth><AdminAppointments /></RequireAuth>} />

                <Route path="/adminstructures" element={<RequireAuth><AdminStructures /></RequireAuth>} />

                <Route path="/admindemarches" element={<RequireAuth><AdminDemarches /></RequireAuth>} />

                <Route path="/admindemarcheedit" element={<RequireAuth><AdminDemarcheEdit /></RequireAuth>} />

                <Route path="/aidedetail" element={<AideDetail />} />
                <Route path="/aide/view" element={<AideDetail />} />
                <Route path="/aide/:slug" element={<AideDetail />} />

                <Route path="/aides" element={<Aides />} />
                <Route path="/categories/:slug" element={<Aides />} />
                <Route path="/situations/:slug" element={<Aides />} />

                <Route path="/annuaire" element={<Annuaire />} />
                <Route path="/structures/view" element={<StructureDetail />} />
                <Route path="/structures/:slug" element={<StructureDetail />} />

                <Route path="/confidentialite" element={<Confidentialite />} />

                <Route path="/contact" element={<Contact />} />

                <Route path="/cookies" element={<Cookies />} />

                <Route path="/demarches/view" element={<DemarcheDetail />} />
                <Route path="/demarches/:slug" element={<DemarcheDetail />} />

                {/* Conditional Route: Only available if explicitly enabled */}
                {import.meta.env.VITE_DEV_LOGIN_ENABLED === 'true' && (
                    <Route path="/login/pro" element={<LoginPro />} />
                )}

                <Route path="/demarches" element={<Demarches />} />

                <Route path="/home" element={<Home />} />

                <Route path="/mentionslegales" element={<MentionsLegales />} />

                <Route path="/sourcesmethode" element={<SourcesMethode />} />

                {/* Sentry Test Route - Only accessible if manually navigated to */}
                <Route path="/sentry-test" element={<SentryTest />} />

                {/* Lot 6: Beneficiary Messages (FALC) via Token */}
                <Route path="/r/:token/messages" element={<BeneficiaryMessages />} />

                <Route path="/bonnes-pratiques" element={<Guides />} />
                <Route path="/bonnes-pratiques/:slug" element={<GuideDetail />} />

                <Route path="/outils" element={<Tools />} />
                <Route path="/outils/:slug" element={<ToolDetail />} />

                <Route path="/dispositifs" element={<Dispositifs />} />

                <Route path="/impact" element={<Impact />} />
                <Route path="/notre-mission" element={<Mission />} />
                <Route path="/notre-methode" element={<Method />} />
                <Route path="/sources" element={<Sources />} />
                <Route path="/securite-et-rgpd" element={<Security />} />
                <Route path="/partenaires" element={<Partners />} />
                <Route path="/proposer-une-structure" element={<SuggestStructure />} />
                <Route path="/dossier-subventions" element={<SubventionDossier />} />

                <Route path="/actualites/view" element={<ActualiteDetail />} />

                {/* Legacy Redirects */}
                <Route path="/AideDetail" element={<Navigate to="/aidedetail" replace />} />
                <Route path="/StructureDetail" element={<Navigate to="/annuaire" replace />} />
                <Route path="/structuredetail" element={<Navigate to="/annuaire" replace />} />
                <Route path="/DemarcheDetail" element={<Navigate to="/demarches" replace />} />
                <Route path="/demarchedetail" element={<Navigate to="/demarches" replace />} />
                <Route path="/Annuaire" element={<Navigate to="/annuaire" replace />} />
                <Route path="/Aides" element={<Navigate to="/aides" replace />} />


                <Route path="*" element={<Navigate to="/home" replace />} />


            </Routes>
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