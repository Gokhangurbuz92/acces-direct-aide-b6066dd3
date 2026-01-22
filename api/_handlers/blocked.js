// Block access to dev routes in production
export default function handler(req, res) {
    res.status(404).json({ error: "Not Found" });
}
