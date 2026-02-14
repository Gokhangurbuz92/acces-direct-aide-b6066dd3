console.log("Start");
try {
    process.env.ADMIN_TOKEN = "TEST";
    const auth = await import('../api/_utils/auth.js');
    console.log("Auth module loaded", auth);

    // Test auth directly
    const req = { headers: { authorization: 'Bearer TEST' } };
    const result = auth.verifyAdmin(req);
    console.log("Direct Verify Result:", result);

    await import('../api/_handlers/admin/inbox.js');
    console.log("Inbox loaded");
} catch (e) {
    console.error("Error:", e);
}
