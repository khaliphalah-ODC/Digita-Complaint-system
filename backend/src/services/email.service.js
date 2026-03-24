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

const transporter = nodemailer.createTransport({
  host: process.env.MAIL_HOST,
  port: Number(process.env.MAIL_PORT),
  secure: process.env.MAIL_SECURE === 'true',
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS,
  },
});

export const sendEmail = async ({ to, subject, text, html }) => {
  return await transporter.sendMail({
    from: process.env.MAIL_FROM || process.env.MAIL_USER,
    to,
    subject,
    text,
    html,
  });
};