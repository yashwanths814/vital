// firebase/functions/index.js

const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp();

// Auto Escalation Function
exports.triggerAutoEscalation = functions.https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'User not authenticated');
    }

    const { issueId } = data;

    try {
        const issueRef = admin.firestore().collection('issues').doc(issueId);
        const issueDoc = await issueRef.get();

        if (!issueDoc.exists) {
            throw new functions.https.HttpsError('not-found', 'Issue not found');
        }

        const issue = issueDoc.data();
        const currentLevel = issue.escalatedLevel || 0;

        // Check if auto escalation should happen
        const slaDays = issue.slaDays || 7;
        const createdAt = issue.createdAt.toDate();
        const now = new Date();
        const daysPassed = Math.floor((now - createdAt) / (1000 * 60 * 60 * 24));

        let nextLevel = currentLevel;
        let nextEscalationDays = 0;

        if (currentLevel === 0) {
            nextLevel = 1;
            nextEscalationDays = slaDays;
        } else if (currentLevel === 1) {
            nextLevel = 2;
            nextEscalationDays = slaDays * 2;
        } else {
            throw new functions.https.HttpsError('failed-precondition', 'Already at maximum escalation level');
        }

        if (daysPassed < nextEscalationDays) {
            throw new functions.https.HttpsError('failed-precondition',
                `Auto escalation not due yet. Requires ${nextEscalationDays} days, only ${daysPassed} days passed.`);
        }

        // Perform auto escalation
        const escalationHistory = issue.escalation?.history || [];
        escalationHistory.push({
            type: 'auto',
            from: getAuthorityName(currentLevel),
            to: getAuthorityName(nextLevel),
            at: admin.firestore.FieldValue.serverTimestamp(),
            reason: `Auto escalated after ${daysPassed} days (SLA: ${slaDays} days)`,
            level: nextLevel
        });

        await issueRef.update({
            escalatedLevel: nextLevel,
            assignedRole: getRoleFromLevel(nextLevel),
            'escalation.history': escalationHistory,
            'escalation.lastEscalatedTo': getAuthorityName(nextLevel),
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });

        // Send notification to the new authority
        await sendNotificationToAuthority(nextLevel, issue);

        return {
            success: true,
            message: `Auto escalated to ${getAuthorityName(nextLevel)}`,
            newLevel: nextLevel
        };

    } catch (error) {
        console.error('Auto escalation error:', error);
        throw new functions.https.HttpsError('internal', error.message);
    }
});

// Manual Escalation Function
exports.manualEscalateIssue = functions.https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'User not authenticated');
    }

    const { issueId } = data;
    const userId = context.auth.uid;

    try {
        const issueRef = admin.firestore().collection('issues').doc(issueId);
        const issueDoc = await issueRef.get();

        if (!issueDoc.exists) {
            throw new functions.https.HttpsError('not-found', 'Issue not found');
        }

        const issue = issueDoc.data();

        // Check if manual escalation is allowed
        if (issue.manualEscalationUsed) {
            throw new functions.https.HttpsError('failed-precondition', 'Manual escalation already used');
        }

        // Check if 4 days have passed
        const createdAt = issue.createdAt.toDate();
        const now = new Date();
        const daysPassed = Math.floor((now - createdAt) / (1000 * 60 * 60 * 24));

        if (daysPassed < 4) {
            throw new functions.https.HttpsError('failed-precondition',
                `Manual escalation requires 4 days. Only ${daysPassed} days passed.`);
        }

        // Get next authority level (skip one level ahead)
        const currentLevel = issue.escalatedLevel || 0;
        let nextLevel = currentLevel + 1;

        if (nextLevel > 2) {
            nextLevel = 2; // Cap at DDO
        }

        // Update issue with manual escalation
        const escalationHistory = issue.escalation?.history || [];
        escalationHistory.push({
            type: 'manual',
            from: getAuthorityName(currentLevel),
            to: getAuthorityName(nextLevel),
            at: admin.firestore.FieldValue.serverTimestamp(),
            reason: 'Manually escalated by villager',
            level: nextLevel
        });

        await issueRef.update({
            escalatedLevel: nextLevel,
            assignedRole: getRoleFromLevel(nextLevel),
            manualEscalationUsed: true,
            'escalation.history': escalationHistory,
            'escalation.lastEscalatedTo': getAuthorityName(nextLevel),
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });

        // Send notification to the new authority
        await sendNotificationToAuthority(nextLevel, issue);

        return {
            success: true,
            message: `Manually escalated to ${getAuthorityName(nextLevel)}`,
            newLevel: nextLevel
        };

    } catch (error) {
        console.error('Manual escalation error:', error);
        throw new functions.https.HttpsError('internal', error.message);
    }
});

// Helper functions
function getAuthorityName(level) {
    switch (level) {
        case 0: return 'PDO';
        case 1: return 'TDO';
        case 2: return 'DDO';
        default: return 'PDO';
    }
}

function getRoleFromLevel(level) {
    switch (level) {
        case 0: return 'pdo';
        case 1: return 'tdo';
        case 2: return 'ddo';
        default: return 'pdo';
    }
}

async function sendNotificationToAuthority(level, issue) {
    // Implement notification logic here
    // This could be email, push notification, or in-app notification
    console.log(`Sending notification to ${getAuthorityName(level)} for issue ${issue.id}`);
}