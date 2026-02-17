const admin = require('firebase-admin');
const nodemailer = require('nodemailer');

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.applicationDefault()
  });
}

const db = admin.firestore();

// Email configuration - set these in Netlify environment variables
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS
  }
});

async function sendEmail(to, subject, html) {
  await transporter.sendMail({
    from: process.env.MAIL_USER,
    to,
    subject,
    html
  });
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

    const { mailId } = JSON.parse(event.body);
    
    if (!mailId) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'mailId is required' })
      };
    }

    const mailRef = db.collection('mail_queue').doc(mailId);
    const mailDoc = await mailRef.get();
    
    if (!mailDoc.exists) {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: 'Mail not found' })
      };
    }

    const mail = mailDoc.data();
    
    await sendEmail(mail.to, mail.subject, mail.html);
    
    await mailRef.update({
      status: 'sent',
      sentAt: admin.firestore.FieldValue.serverTimestamp()
    });

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ success: true, message: 'Email sent successfully' })
    };
  } catch (error) {
    console.error('Error processing mail queue:', error);
    
    // Update mail status to failed
    if (mailId) {
      const mailRef = db.collection('mail_queue').doc(mailId);
      await mailRef.update({
        status: 'failed',
        error: error.message
      });
    }

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