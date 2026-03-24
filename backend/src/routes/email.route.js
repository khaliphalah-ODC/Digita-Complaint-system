import express from 'express';
import { sendEmail } from '../services/email.service.js';
import verifyToken from '../middleware/verifyToken.js';
import { allowRoles } from '../middleware/roleAccess.js';

const router = express.Router();

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
