import express from 'express';
import complaintDB from '../model/connect.js';
import {
  insertContactSubmissionQuery,
  updateContactSubmissionDeliveryQuery
} from '../model/contactSubmission.model.js';
import { isEmailConfigured, sendEmail } from '../services/email.service.js';
import verifyToken from '../middleware/verifyToken.js';
import { allowRoles } from '../middleware/roleAccess.js';
import { validate, contactFormSchema } from '../utils/middleware/passwordValidation.js';
import { sendError, sendSuccess } from '../utils/response.js';

const router = express.Router();

const runQuery = (sql, params = []) =>
  new Promise((resolve, reject) => {
    complaintDB.run(sql, params, function onRun(err) {
      if (err) return reject(err);
      return resolve(this);
    });
  });

const escapeHtml = (value) =>
  String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

router.post('/contact', validate(contactFormSchema), async (req, res) => {
  try {
    const {
      full_name: fullName,
      email,
      organization,
      subject,
      message
    } = req.body || {};

    const targetEmail = process.env.CONTACT_FORM_TO || process.env.MAIL_FROM || process.env.MAIL_USER;

    const safeName = String(fullName || '').trim();
    const safeEmail = String(email || '').trim().toLowerCase();
    const safeOrganization = String(organization || '').trim();
    const safeSubject = String(subject || '').trim();
    const safeMessage = String(message || '').trim();
    let submissionId = null;

    try {
      const persistedSubmission = await runQuery(insertContactSubmissionQuery, [
        safeName,
        safeEmail,
        safeOrganization,
        safeSubject,
        safeMessage,
        'pending',
        null,
        targetEmail || null
      ]);
      submissionId = Number(persistedSubmission?.lastID) || null;
    } catch (persistError) {
      console.error('CONTACT FORM PERSIST ERROR:', persistError);
    }

    const markSubmission = async (deliveryStatus, deliveryError = null) => {
      if (!submissionId) return;
      try {
        await runQuery(updateContactSubmissionDeliveryQuery, [
          deliveryStatus,
          deliveryError,
          targetEmail || null,
          deliveryStatus,
          submissionId
        ]);
      } catch (updateError) {
        console.error('CONTACT FORM STATUS UPDATE ERROR:', updateError);
      }
    };

    if (!targetEmail || !isEmailConfigured()) {
      await markSubmission('saved', !targetEmail ? 'Contact inbox email is not configured.' : 'Email transport is not configured.');
      return sendSuccess(res, 200, 'Your message has been received and saved for follow-up.', {
        submission_id: submissionId,
        delivery_status: 'saved'
      });
    }

    try {
      await sendEmail({
        to: targetEmail,
        subject: `[Contact Form] ${safeSubject}`,
        text: [
          'New contact form submission',
          `Name: ${safeName}`,
          `Email: ${safeEmail}`,
          `Organization: ${safeOrganization || 'Not provided'}`,
          `Subject: ${safeSubject}`,
          '',
          safeMessage
        ].join('\n'),
        html: `
          <h2>New contact form submission</h2>
          <p><strong>Name:</strong> ${escapeHtml(safeName)}</p>
          <p><strong>Email:</strong> ${escapeHtml(safeEmail)}</p>
          <p><strong>Organization:</strong> ${escapeHtml(safeOrganization || 'Not provided')}</p>
          <p><strong>Subject:</strong> ${escapeHtml(safeSubject)}</p>
          <p><strong>Message:</strong></p>
          <p>${escapeHtml(safeMessage).replace(/\n/g, '<br>')}</p>
        `,
        replyTo: safeEmail
      });

      await markSubmission('sent');
      return sendSuccess(res, 200, 'Your message has been sent successfully.', {
        submission_id: submissionId,
        delivery_status: 'sent'
      });
    } catch (error) {
      console.error('CONTACT FORM EMAIL ERROR:', error);
      await markSubmission('saved', error?.message || 'Email delivery failed.');
      return sendSuccess(res, 200, 'Your message has been received and saved for follow-up.', {
        submission_id: submissionId,
        delivery_status: 'saved'
      });
    }
  } catch (error) {
    console.error('CONTACT FORM ERROR:', error);
    return sendSuccess(res, 200, 'Your message has been received and saved for follow-up.', {
      submission_id: null,
      delivery_status: 'saved'
    });
  }
});

router.post('/send', verifyToken, allowRoles('super_admin', 'org_admin'), async (req, res) => {
  try {
    const { to, subject, text, html } = req.body;

    const info = await sendEmail({
      to,
      subject,
      text,
      html,
    });

    res.status(200).json({
      message: 'Email sent successfully',
      messageID: info.messageId,
    });
  } catch (error) {
    console.error('EMAIL ERROR:', error);
    res.status(500).json({
      message: 'Error sending email',
      error: error.message,
    });
  }
});

export default router;
