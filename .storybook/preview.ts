import type { Preview } from "@storybook/react";
import React from "react";
import { MemoryRouter } from "react-router-dom";

import "../src/index.css";

const preview: Preview = {
    decorators: [
        // Provide React Router context to all stories — required by components using <Link>
        (Story) => React.createElement(MemoryRouter, null, React.createElement(Story)),
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
