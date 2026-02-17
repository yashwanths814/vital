const admin = require('firebase-admin');

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.applicationDefault()
  });
}

const db = admin.firestore();

// Helper function to find authority email
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

// Helper function for next role
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
    if (event.httpMethod !== 'POST') {
      return {
        statusCode: 405,
        body: JSON.stringify({ error: 'Method not allowed' })
      };
    }

    const { issueId, userId } = JSON.parse(event.body);
    
    if (!issueId || !userId) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'issueId and userId are required' })
      };
    }

    const issueRef = db.collection('issues').doc(issueId);
    const issueDoc = await issueRef.get();
    
    if (!issueDoc.exists) {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: 'Issue not found' })
      };
    }

    const issue = issueDoc.data();
    
    // Check if user is the owner
    if (issue.villagerId !== userId) {
      return {
        statusCode: 403,
        body: JSON.stringify({ error: 'Not authorized to escalate this issue' })
      };
    }

    // Check if issue is already resolved
    if (issue.status === 'resolved' || issue.status === 'closed') {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Issue already resolved' })
      };
    }

    // Check due date
    const dueDate = issue.resolveDueAt?.toDate();
    const now = new Date();
    
    if (dueDate && now < dueDate) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Manual escalation allowed only after due date' })
      };
    }

    // Check if already used manual escalation
    if (issue.manualEscalationUsed) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Manual escalation already used' })
      };
    }

    // Get current role and find next role
    const currentRole = issue.assignedRole || 'pdo';
    const nextRoleValue = nextRole(currentRole);
    
    if (!nextRoleValue) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Cannot escalate further' })
      };
    }

    // Find authority for next role
    const auth = await findAuthorityEmail(
      nextRoleValue,
      issue.panchayatId,
      issue.taluk,
      issue.district
    );

    if (!auth) {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: 'No authority found for escalation' })
      };
    }

    // Start a batch write
    const batch = db.batch();
    
    // Update issue
    batch.update(issueRef, {
      assignedRole: nextRoleValue,
      assignedToUid: auth.uid,
      manualEscalationUsed: true,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      escalation: {
        lastEscalatedTo: nextRoleValue,
        history: admin.firestore.FieldValue.arrayUnion({
          type: 'manual',
          from: currentRole,
          to: nextRoleValue,
          at: admin.firestore.FieldValue.serverTimestamp(),
          reason: 'Manual escalation requested by villager'
        })
      }
    });

    // Add to mail queue
    const mailQueueRef = db.collection('mail_queue').doc();
    batch.set(mailQueueRef, {
      to: auth.email,
      subject: `Issue Escalated: ${issue.title || issueId}`,
      html: `
        <div style="font-family:Arial,sans-serif">
          <h2>Issue Escalated (Manual)</h2>
          <p><b>Issue ID:</b> ${issueId}</p>
          <p><b>Title:</b> ${issue.title || 'Untitled'}</p>
          <p><b>From:</b> ${currentRole.toUpperCase()} → <b>To:</b> ${nextRoleValue.toUpperCase()}</p>
          <p><b>Reason:</b> Manual escalation requested by villager</p>
          <p><b>Panchayat:</b> ${issue.panchayatId || '-'}</p>
          <p><b>Taluk:</b> ${issue.taluk || '-'}</p>
          <p><b>District:</b> ${issue.district || '-'}</p>
        </div>
      `,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      status: 'pending'
    });

    await batch.commit();

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 
        success: true, 
        message: 'Issue escalated successfully',
        escalatedTo: nextRoleValue,
        authorityEmail: auth.email
      })
    };
  } catch (error) {
    console.error('Error escalating issue:', error);
    
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