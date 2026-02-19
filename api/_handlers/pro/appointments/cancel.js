import prisma from '../../../_utils/prisma.js';
import { requireProStructureContext } from '../../../_utils/auth.js';
import { withProRdvHandler } from '../../../_utils/with-pro-rdv-handler.js';
/**
 * @param {import('../../../_utils/http-types').ApiRequest} req
 * @param {import('../../../_utils/http-types').ApiResponse} res
 */

async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const proCtx = requireProStructureContext(req, res);
  if (!proCtx) return;

  const id = String(req.body?.id || '').trim();
  if (!id) return res.status(400).json({ error: 'Missing appointment ID' });

  const appointment = await prisma.proAppointment.findUnique({
    where: { id },
  });
  if (!appointment) return res.status(404).json({ error: 'Appointment not found' });
  if (appointment.structureId !== proCtx.structureId) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  const updated = await prisma.proAppointment.update({
    where: { id },
    data: { status: 'cancelled' },
  });

  return res.status(200).json({
    ok: true,
    item: {
      id: updated.id,
      status: updated.status,
      startAt: updated.startAt,
      endAt: updated.endAt,
      start_at: updated.startAt,
      end_at: updated.endAt,
    },
  });
}

export default withProRdvHandler('pro.appointments.cancel', handler);
