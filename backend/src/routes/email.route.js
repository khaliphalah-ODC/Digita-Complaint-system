// import express from 'express';
// import { sendEmail } from '../services/email.service.js';

// const router = express.Router();

// router.post('/send', async (req, res) => {
//   try {
//     const info = await sendEmail({
//       to: process.env.EMAIL_USER,
//       subject: 'Test Email',
//       text: 'This is a test email sent from the backend.',
//       html: '<p>This is a test email sent from the backend.</p>',
//     });

//     res.status(200).json({
//       message: 'Email sent successfully',
//       messageID: info.messageId
//     });

//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ message: 'Error sending email' });
//   }
// });

// export default router;


// import express from 'express';
// import { sendEmail } from '../services/email.service.js';

// const router = express.Router();

// router.post('/send', async (req, res) => {
//   try {
//     const { to, subject, text, html } = req.body;

//     const info = await sendEmail({
//       to,
//       subject,
//       text,
//       html,
//     });

//     res.status(200).json({
//       message: 'Email sent successfully',
//       messageID: info.messageId,
//     });
//   } catch (error) {
//   console.error('EMAIL ERROR:', error);
//   res.status(500).json({
//     message: 'Error sending email',
//     error: error.message
//   });
// }
// });

// export default router;



import express from 'express';
import { sendEmail } from '../services/email.service.js';

const router = express.Router();

router.post('/send', async (req, res) => {
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