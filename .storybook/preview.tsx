import type { Preview } from "@storybook/react";
import React from "react";
import { MemoryRouter } from "react-router-dom";

import "../src/index.css";

const preview: Preview = {
    decorators: [
        // Global Router context — components using <Link> need this.
        // Do NOT add MemoryRouter in individual story decorators (causes double-Router crash).
        (Story) => (
            <MemoryRouter>
            <Story />
            </MemoryRouter>
        ),
    ],
    parameters: {
        controls: {
            matchers: {
                color: /(background|color)$/i,
                date: /Date$/i,
            },
        },
    },
};

export default preview;
