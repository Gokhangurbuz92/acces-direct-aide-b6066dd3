import type { Meta, StoryObj } from "@storybook/react";
import AidGrid from "./AidGrid";
import type { AidGridProps } from "./AidGrid";

const NOW = new Date("2026-02-20T00:00:00.000Z");

const MOCK_ITEMS: AidGridProps["items"] = [
    {
        title: "Aide personnalisée au logement (APL)",
        href: "/aides/apl",
        summary:
            "L\u2019APL est une aide financière destinée à réduire le montant de votre loyer ou de votre redevance en foyer.",
        isUrgent: false,
        verifiedAt: new Date("2026-02-10T00:00:00.000Z"),
        sourceLabel: "CAF",
        sourceUrl: "https://www.caf.fr",
        now: NOW,
    },
    {
        title: "Aide d\u2019urgence hébergement",
        href: "/aides/urgence-hebergement",
        summary:
            "Dispositif d\u2019hébergement d\u2019urgence pour les personnes sans domicile fixe.",
        isUrgent: true,
        verifiedAt: new Date("2026-01-28T00:00:00.000Z"),
        sourceLabel: "SIAO",
        sourceUrl: "https://www.siao.fr",
        now: NOW,
    },
    {
        title: "Complémentaire santé solidaire (CSS)",
        href: "/aides/css",
        summary:
            "La CSS prend en charge la part complémentaire de vos dépenses de santé.",
        isUrgent: false,
        verifiedAt: new Date("2026-02-01T00:00:00.000Z"),
        sourceLabel: "Ameli",
        sourceUrl: "https://www.ameli.fr",
        now: NOW,
    },
];

const meta = {
    title: "Organisms/AidGrid",
    component: AidGrid,
    tags: ["autodocs"],
} satisfies Meta<typeof AidGrid>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Grid with 3 items */
export const WithItems: Story = {
    args: {
        items: MOCK_ITEMS,
        hasActiveFilters: false,
    },
};

/** Empty with active filters → shows EmptyState */
export const EmptyWithActiveFilters: Story = {
    args: {
        items: [],
        hasActiveFilters: true,
        onReset: () => { },
    },
};

/** Empty without active filters → neutral text, NOT EmptyState */
export const EmptyWithoutActiveFilters: Story = {
    args: {
        items: [],
        hasActiveFilters: false,
    },
};
