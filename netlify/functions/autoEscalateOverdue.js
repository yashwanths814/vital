const admin = require('firebase-admin');

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.applicationDefault()
  });
}

const db = admin.firestore();

// Helper functions (same as manualEscalateIssue)
async function findAuthorityEmail(role, panchayatId, taluk, district) {
  let query = db
    .collection('authorities')
    .where('role', '==', role)
    .where('verified', '==', true);

  if (role === 'pdo') {
    query = query.where('panchayatId', '==', panchayatId || '');
  } else if (role === 'tdo') {
    query = query
      .where('taluk', '==', taluk || '')
      .where('district', '==', district || '');
  } else if (role === 'ddo') {
    query = query.where('district', '==', district || '');
  }

  const snap = await query.limit(1).get();
  if (snap.empty) return null;

  const doc = snap.docs[0];
  const data = doc.data();
  const email = data.email || '';
  
  if (!email) return null;
  
  return { email, uid: doc.id };
}

function nextRole(role) {
  if (role === 'pdo') return 'tdo';
  if (role === 'tdo') return 'ddo';
  return null;
}

exports.handler = async (event, context) => {
  // For CORS
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
      },
      body: ''
    };
  }

  try {
    // This function should be called by a cron job
    // You can add a secret key for security
    const secretKey = event.headers['x-cron-secret'];
    if (process.env.CRON_SECRET && secretKey !== process.env.CRON_SECRET) {
      return {
        statusCode: 401,
        body: JSON.stringify({ error: 'Unauthorized' })
      };
    }

    const now = admin.firestore.Timestamp.now();
    
    // Find overdue issues
    const overdueIssues = await db
      .collection('issues')
      .where('status', 'not-in', ['resolved', 'closed'])
      .where('resolveDueAt', '<=', now)
      .limit(50)
      .get();

    const results = [];
    
    for (const doc of overdueIssues.docs) {
      try {
        const issue = doc.data();
        const issueId = doc.id;

        // Check if auto-escalated recently (24-hour cooldown)
        const lastAutoEscalation = issue.autoEscalatedAt;
        if (lastAutoEscalation) {
          const lastEscalationTime = lastAutoEscalation.toDate();
          const hoursSinceLastEscalation = (new Date() - lastEscalationTime) / (1000 * 60 * 60);
          if (hoursSinceLastEscalation < 24) {
            continue;
          }
        }

        // Get current role and next role
        const currentRole = issue.assignedRole || 'pdo';
        const nextRoleValue = nextRole(currentRole);
        
        if (!nextRoleValue) {
          continue;
        }

        // Find authority for next role
        const auth = await findAuthorityEmail(
          nextRoleValue,
          issue.panchayatId,
          issue.taluk,
          issue.district
        );

        if (!auth) {
          results.push({
            issueId,
            status: 'skipped',
            reason: 'No authority found'
          });
          continue;
        }

        // Update issue
        const batch = db.batch();
        const issueRef = db.collection('issues').doc(issueId);
        
        batch.update(issueRef, {
          assignedRole: nextRoleValue,
          assignedToUid: auth.uid,
          autoEscalatedAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          escalation: {
            lastEscalatedTo: nextRoleValue,
            history: admin.firestore.FieldValue.arrayUnion({
              type: 'auto',
              from: currentRole,
              to: nextRoleValue,
              at: admin.firestore.FieldValue.serverTimestamp(),
              reason: 'Auto escalation: due date passed and not resolved'
            })
          }
        });

        // Add to mail queue
        const mailQueueRef = db.collection('mail_queue').doc();
        batch.set(mailQueueRef, {
          to: auth.email,
          subject: `Issue Auto-Escalated: ${issue.title || issueId}`,
          html: `
            <div style="font-family:Arial,sans-serif">
              <h2>Issue Auto-Escalated</h2>
              <p><b>Issue ID:</b> ${issueId}</p>
              <p><b>Title:</b> ${issue.title || 'Untitled'}</p>
              <p><b>From:</b> ${currentRole.toUpperCase()} → <b>To:</b> ${nextRoleValue.toUpperCase()}</p>
              <p><b>Reason:</b> Auto escalation: due date passed and not resolved</p>
              <p><b>Panchayat:</b> ${issue.panchayatId || '-'}</p>
              <p><b>Taluk:</b> ${issue.taluk || '-'}</p>
              <p><b>District:</b> ${issue.district || '-'}</p>
            </div>
          `,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          status: 'pending'
        });

        await batch.commit();
        
        results.push({
          issueId,
          status: 'escalated',
          escalatedTo: nextRoleValue,
          authorityEmail: auth.email
        });
        
      } catch (error) {
        results.push({
          issueId: doc.id,
          status: 'error',
          error: error.message
        });
      }
    }

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        success: true,
        processed: results.length,
        results
      })
    };
  } catch (error) {
    console.error('Error in auto escalation:', error);
    
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ error: error.message })
    };
  }
};