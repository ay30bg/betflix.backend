const nodemailer = require('nodemailer');

const sendEmail = async (to, subject, html) => {
  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail', // Replace with SendGrid or other service if needed
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    await transporter.sendMail({
      from: `"Betflix Password Reset" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html,
    });
    console.log('Email sent to:', to);
  } catch (err) {
    console.error('Email sending error:', err);
    throw new Error('Failed to send email');
  }
};

module.exports = sendEmail;
