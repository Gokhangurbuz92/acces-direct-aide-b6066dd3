import React, { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { apiClient } from "@/api/client";

function isAdminUser(user) {
    if (!user) return false;

    // Normalisé
    if (user.role === "admin") return true;

    // Variantes legacy possibles
    if (user.is_admin === true) return true;
    if (user.isAdmin === true) return true;

    // Roles/permissions multiples
    if (Array.isArray(user.roles) && user.roles.includes("admin")) return true;
    if (Array.isArray(user.permissions) && user.permissions.includes("admin")) return true;

    return false; // ✅ deny by default
}

const PageLoader = () => (
    <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary" />
    </div>
);

export default function AdminGuard({ children }) {
    const [loading, setLoading] = useState(true);
    const [allowed, setAllowed] = useState(false);

    useEffect(() => {
        let cancelled = false;

        (async () => {
            try {
                const user = await apiClient.auth.getUser(); // user ou null
                if (cancelled) return;

                setAllowed(isAdminUser(user));
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();

        return () => {
            cancelled = true;
        };
    }, []);

    if (loading) return <PageLoader />;
    if (!allowed) return <Navigate to="/admin/login" replace />;

    return (
        <>
            <Helmet>
                <meta name="robots" content="noindex, nofollow" />
            </Helmet>
            {children}
        </>
    );
}
