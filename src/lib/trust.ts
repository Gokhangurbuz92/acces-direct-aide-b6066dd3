/**
 * Centralised "missing data" policy for trust surface.
 * SSOT: never show "Non renseigné".
 */

export type MissingDatePolicy = "label" | "hide";

export interface TrustDisplayPolicy {
    /** How to handle missing dates: "label" shows "Date inconnue", "hide" omits the line */
    missingDate: MissingDatePolicy;
}

export const DEFAULT_TRUST_POLICY: TrustDisplayPolicy = {
    missingDate: "hide",
};

/** @deprecated Policy default is now 'hide' — this label should no longer appear in UI */
export const MISSING_DATE_LABEL = "Date inconnue";

/**
 * Returns a formatted date string or null when the line should be hidden.
 * Default policy is now 'hide' — no more 'Date inconnue'.
 */
export function resolveDateDisplay(
    date: Date | string | null | undefined,
    policy: MissingDatePolicy = "hide",
): string | null {
    if (!date) {
        return policy === "label" ? MISSING_DATE_LABEL : null;
    }

    const parsed = typeof date === "string" ? new Date(date) : date;

    if (isNaN(parsed.getTime())) {
        return policy === "label" ? MISSING_DATE_LABEL : null;
    }

    return new Intl.DateTimeFormat("fr-FR", {
        day: "numeric",
        month: "long",
        year: "numeric",
    }).format(parsed);
}
