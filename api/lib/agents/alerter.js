import logger from '../../_utils/logger.js';

/**
 * Agent Alerter
 *
 * Mission : Notifier les pros des changements
 * pertinents pour leurs bénéficiaires.
 *
 * Note: In production, this will query ProUser and create
 * ProNotification records. Currently a skeleton that logs
 * changes without DB writes until the notification system
 * is fully wired.
 */

export class Alerter {
    constructor() {
        this.name = 'alerter';
    }

    /**
     * @param {Array<{id: string, titre: string, category?: string}>} changes
     * @returns {Promise<{ok: boolean, notified: number}>}
     */
    async notify(changes) {
        if (!changes || changes.length === 0) {
            return { ok: true, notified: 0 };
        }

        // Log each change for audit trail
        for (const change of changes) {
            logger.info({
                msg: 'agent.alerter.change_detected',
                changeId: change.id,
                titre: change.titre,
                category: change.category,
            });
        }

        logger.info({
            msg: 'agent.alerter.complete',
            changes: changes.length,
            notified: 0,
            note: 'ProNotification creation deferred until notification system is fully wired',
        });

        return { ok: true, notified: 0 };
    }
}
