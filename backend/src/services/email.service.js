// import nodemailer from 'nodemailer';

// export const transporter = nodemailer.createTransport({
//     host: process.env.MAIL_HOST,
//     port: Number(process.env.MAIL_PORT),
//     secure: process.env.MAIL_SECURE === 'true', // true for 465, false for other ports
//     auth: {
//         user: process.env.MAIL_USER,
//         pass: process.env.MAIL_PASS,
//     },
// })

// export const sendEmail = async (to, subject, Text, html) => {
//     const mailOptions = {
//         from: process.env.MAIL_FROM,
//         to,
//         subject,
//         text: Text,
//         html,
//     };

//     return transporter.sendMail(mailOptions);
// }

import nodemailer from 'nodemailer';

let transporter = null;

const getMailConfig = () => ({
  host: String(process.env.MAIL_HOST || '').trim(),
  port: Number(process.env.MAIL_PORT || 0),
  secure: process.env.MAIL_SECURE === 'true',
  user: String(process.env.MAIL_USER || '').trim(),
  pass: String(process.env.MAIL_PASS || '').trim()
});

export const isEmailConfigured = () => {
  const config = getMailConfig();
  return Boolean(config.host && config.port > 0 && config.user && config.pass);
};

const getTransporter = () => {
  if (!isEmailConfigured()) {
    return null;
  }

  if (!transporter) {
    const config = getMailConfig();
    transporter = nodemailer.createTransport({
      host: config.host,
      port: config.port,
      secure: config.secure,
      auth: {
        user: config.user,
        pass: config.pass,
      },
    });
  }

  return transporter;
};

export const sendEmail = async ({ to, subject, text, html, replyTo }) => {
  const activeTransporter = getTransporter();
  if (!activeTransporter) {
    throw new Error('Email transport is not configured.');
  }

  return await activeTransporter.sendMail({
    from: process.env.MAIL_FROM || process.env.MAIL_USER,
    to,
    subject,
    text,
    html,
    replyTo,
  });
};
