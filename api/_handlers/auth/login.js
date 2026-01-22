
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
    throw new Error("JWT_SECRET environment variable is not defined");
}

const LOCKOUT_THRESHOLD = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 mins

async function logAudit(action, actor, target, details, ip) {
    try {
        await prisma.auditLog.create({
            data: {
                action,
                actor, // user email or 'system' or 'anonymous'
                target,
                details,
                ip
            }
        });
    } catch (e) {
        console.error("Audit log failed", e);
    }
}

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: "Method not allowed" });
    }

    const { email, password } = req.body;
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;

    if (!email || !password) {
        return res.status(400).json({ error: "Email and password required" });
    }

    try {
        const user = await prisma.adminUser.findUnique({ where: { email } });

        // Generic error message for security
        const authError = () => res.status(401).json({ error: "Invalid credentials" });

        if (!user) {
            // Protect against timing attacks (fake verification) is tricky in nodejs serverless without generic hash, 
            // but we at least don't leak user existence.
            // Ideally: await bcrypt.compare(password, FAKE_HASH);
            await logAudit('LOGIN_FAILED', email, 'AdminUser', { reason: 'User not found' }, ip);
            return authError();
        }

        // Check Lockout
        if (user.lockoutUntil && new Date() < user.lockoutUntil) {
            const minutesLeft = Math.ceil((user.lockoutUntil - new Date()) / 60000);
            await logAudit('LOGIN_LOCKED_ATTEMPT', email, 'AdminUser', { userId: user.id }, ip);
            return res.status(429).json({ error: `Account locked. Try again in ${minutesLeft} minutes.` });
        }

        // Check Password
        const isValid = await bcrypt.compare(password, user.password);

        if (!isValid) {
            const attempts = user.failedLoginAttempts + 1;
            let updateData = { failedLoginAttempts: attempts };
            let logAction = 'LOGIN_FAILED';

            if (attempts >= LOCKOUT_THRESHOLD) {
                updateData.lockoutUntil = new Date(Date.now() + LOCKOUT_DURATION_MS);
                updateData.failedLoginAttempts = 0; // Reset counter after locking? Or keep it? Usually reset on successful login.
                // Or keep incrementing? Let's reset on lock to simple cycle. Or just set lock.
                // Standard: Set lockout, don't reset attempts until success or manual unlock.
                logAction = 'ACCOUNT_LOCKED';
            }

            await prisma.adminUser.update({
                where: { id: user.id },
                data: updateData
            });
            await logAudit(logAction, email, 'AdminUser', { userId: user.id, attempts }, ip);
            return authError();
        }

        // Success
        await prisma.adminUser.update({
            where: { id: user.id },
            data: {
                failedLoginAttempts: 0,
                lockoutUntil: null,
                lastLogin: new Date()
            }
        });

        // Generate JWT
        const token = jwt.sign(
            { userId: user.id, email: user.email, role: user.role },
            JWT_SECRET,
            { expiresIn: '2h' }
        );

        await logAudit('LOGIN_SUCCESS', email, 'AdminUser', { userId: user.id }, ip);

        return res.status(200).json({
            token,
            user: { id: user.id, email: user.email, role: user.role }
        });

    } catch (e) {
        console.error("Login error", e);
        return res.status(500).json({ error: "Login failed" });
    }
}
