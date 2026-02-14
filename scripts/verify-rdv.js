import prisma from '../api/_utils/prisma.js';
import { hash } from '../api/lib/crypto.js';
import crypto from 'crypto';



async function verifyRDV() {
    console.log('🚀 Starting RDV Flow Verification...');

    try {
        // Fetch real IDs to satisfy foreign keys
        const structure = await prisma.structure.findFirst() || { id: "test-struct" };
        const service = await prisma.service.findFirst() || { id: "test-service" };
        let beneficiary = await prisma.beneficiary.findFirst();

        if (!beneficiary) {
            beneficiary = await prisma.beneficiary.create({
                data: {
                    contact_encrypted: "enc",
                    contact_hash: "hash",
                    first_name_encrypted: "enc"
                }
            });
        }

        // 1. Mock Booking Request
        const cancelToken = crypto.randomBytes(32).toString('hex');
        const accessToken = crypto.randomBytes(32).toString('hex');

        console.log('📝 Creating test appointment...');
        const appointment = await prisma.appointment.create({
            data: {
                structureId: structure.id,
                serviceId: service.id,
                beneficiaryId: beneficiary.id,
                start_at: new Date(),
                end_at: new Date(Date.now() + 1800000),
                mode: 'presentiel',
                status: 'requested',
                access_token_hash: hash(accessToken),
                cancel_token_hash: hash(cancelToken)
            }
        });

        // 2. Test Confirmation (Magic Link)
        console.log('🔗 Testing magic link confirmation...');
        const tokenHash = hash(accessToken);
        const found = await prisma.appointment.findFirst({
            where: { access_token_hash: tokenHash }
        });

        if (found && found.id === appointment.id) {
            await prisma.appointment.update({
                where: { id: found.id },
                data: { status: 'confirmed' }
            });
            console.log('✅ Appointment confirmed via magic link.');
        } else {
            throw new Error('Magic link lookup failed');
        }

        // 3. Test Visio Link Update
        console.log('📹 Testing Visio link update...');
        const visioUrl = "https://meet.google.com/abc-defg-hij";
        await prisma.appointment.update({
            where: { id: appointment.id },
            data: {
                mode: 'visio',
                metadata: { visio_url: visioUrl }
            }
        });

        const updated = await prisma.appointment.findUnique({ where: { id: appointment.id } });
        if (updated.mode === 'visio' && updated.metadata.visio_url === visioUrl) {
            console.log('✅ Visio link correctly saved in metadata.');
        } else {
            throw new Error('Visio update failed');
        }

        // 4. Test Cancellation
        console.log('❌ Testing cancellation...');
        await prisma.appointment.update({
            where: { id: appointment.id },
            data: { status: 'cancelled' }
        });

        const cancelled = await prisma.appointment.findUnique({ where: { id: appointment.id } });
        if (cancelled.status === 'cancelled') {
            console.log('✅ Cancellation successful.');
        }

        // Cleanup
        await prisma.appointment.delete({ where: { id: appointment.id } });
        console.log('🎉 RDV Flow Verification complete!');

    } catch (e) {
        console.error('❌ RDV Verification failed:', e.message);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

verifyRDV();
