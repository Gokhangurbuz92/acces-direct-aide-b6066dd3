module.exports = {
    async preVisit(page, context) {
        const { injectAxe } = await import('axe-playwright');
        await injectAxe(page);
    },
    async postVisit(page, context) {
        const { checkA11y } = await import('axe-playwright');
        const { getStoryContext } = await import('@storybook/test-runner');
        const storyContext = await getStoryContext(page, context);

        if (storyContext?.parameters?.a11y?.disable) {
            return;
        }

        try {
            await checkA11y(page, '#storybook-root', {
                detailedReport: true,
                detailedReportOptions: { html: true },
                includedImpacts: ['critical', 'serious']
            });
        } catch (error) {
            console.error(`A11y violation in ${context.id}: `, JSON.stringify(error, null, 2));
            throw error;
        }
    },
};
