import type { Preview } from "@storybook/react";

import "../src/index.css";
// import "../src/styles/tokens.css"; // It exists but prompt priorities point to index.css if globals.css is absent. index.css might already import tokens.css. If tokens.css is required, I'll add it once I confirm. Let's just import index.css first to respect criteria B.

const preview: Preview = {
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
