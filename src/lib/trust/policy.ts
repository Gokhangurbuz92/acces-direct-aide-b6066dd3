/**
 * Trust policy — single source of truth for "missing data" display rules.
 *
 * These constants are consumed by:
 *   - normalize.ts (data sanitization)
 *   - mappers.ts  (view-model construction)
 *   - UI components read verifiedAt: if null → they display "Date inconnue" or hide
 *
 * Rule: the data layer NEVER fabricates "Non renseigné".
 * Rule: the data layer returns null when data is missing or invalid.
 * The UI decides how to display null values (e.g. "Date inconnue" or hide entirely).
 */

export const TRUST_POLICY = {
    /**
     * How to handle a missing verifiedAt date in the UI layer.
     * - "label": display a neutral label (e.g. "Date inconnue")
     * - "hide": hide the element entirely
     */
    missingDateBehavior: "label" as const,

    /**
     * Label displayed by the UI when verifiedAt is null.
     * This is NOT output by the data layer — it exists here as a constant
     * for shared reference. Components like FreshnessTag use this value.
     */
    unknownDateLabel: "Date inconnue",

    /**
     * Maximum allowed future skew in days.
     * Dates more than this far in the future are treated as invalid (→ null).
     * Tolerance covers timezone differences and minor clock skew.
     */
    maxFutureSkewDays: 2,
} as const;

/** Milliseconds equivalent of maxFutureSkewDays. */
export const MAX_FUTURE_SKEW_MS = TRUST_POLICY.maxFutureSkewDays * 24 * 60 * 60 * 1000;
