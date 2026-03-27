import express from 'express';
import { sendEmail } from '../services/email.service.js';
import verifyToken from '../middleware/verifyToken.js';
import { allowRoles } from '../middleware/roleAccess.js';
import { validate, contactFormSchema } from '../utils/middleware/passwordValidation.js';
import { sendError, sendSuccess } from '../utils/response.js';

const router = express.Router();

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
    if (!targetEmail) {
      return sendError(res, 500, 'Contact email is not configured');
    }

    const safeName = String(fullName || '').trim();
    const safeEmail = String(email || '').trim().toLowerCase();
    const safeOrganization = String(organization || '').trim();
    const safeSubject = String(subject || '').trim();
    const safeMessage = String(message || '').trim();

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
        <p><strong>Name:</strong> ${safeName}</p>
        <p><strong>Email:</strong> ${safeEmail}</p>
        <p><strong>Organization:</strong> ${safeOrganization || 'Not provided'}</p>
        <p><strong>Subject:</strong> ${safeSubject}</p>
        <p><strong>Message:</strong></p>
        <p>${safeMessage.replace(/\n/g, '<br>')}</p>
      `
    });

    return sendSuccess(res, 200, 'Your message has been sent successfully.');
  } catch (error) {
    console.error('CONTACT FORM ERROR:', error);
    return sendError(res, 500, 'Unable to send your message right now.', error?.message);
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
