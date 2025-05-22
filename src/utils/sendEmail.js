// const nodemailer = require('nodemailer');

// const sendEmail = async (to, subject, html) => {
//   try {
//     const transporter = nodemailer.createTransport({
//       service: 'gmail', // Replace with SendGrid or other service if needed
//       auth: {
//         user: process.env.EMAIL_USER,
//         pass: process.env.EMAIL_PASS,
//       },
//     });

//     await transporter.sendMail({
//       from: `"Betflix Password Reset" <${process.env.EMAIL_USER}>`,
//       to,
//       subject,
//       html,
//     });
//     console.log('Email sent to:', to);
//   } catch (err) {
//     console.error('Email sending error:', err);
//     throw new Error('Failed to send email');
//   }
// };

// module.exports = sendEmail;


const nodemailer = require('nodemailer');
require('dotenv').config(); // Load environment variables from .env file

const sendEmail = async (to, subject, html) => {
  try {
    // Validate environment variables
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      throw new Error('Missing EMAIL_USER or EMAIL_PASS environment variables');
    }

    // Log credentials (for debugging, remove in production)
    console.log('Using email:', process.env.EMAIL_USER);
    console.log('Password set:', process.env.EMAIL_PASS ? 'Yes' : 'No');

    // Create Nodemailer transporter with Namecheap Private Email settings
    const transporter = nodemailer.createTransport({
      host: 'mail.privateemail.com', // Namecheap Private Email SMTP server
      port: 465, // SSL port (use 587 for TLS as fallback)
      secure: true, // true for port 465 (SSL), false for port 587 (TLS)
      auth: {
        user: process.env.EMAIL_USER, // Full email address (e.g., info@yourdomain.com)
        pass: process.env.EMAIL_PASS, // Namecheap Private Email password
        method: 'LOGIN', // Explicitly use AUTH LOGIN for compatibility
      },
      logger: true, // Enable detailed logging
      debug: true, // Enable debug output for SMTP communication
      // Optional: Uncomment for TLS on port 587
      // port: 587,
      // secure: false,
      // requireTLS: true,
    });

    // Send email
    const info = await transporter.sendMail({
      from: `"Betflix Password Reset" <${process.env.EMAIL_USER}>`, // Must match EMAIL_USER
      to, // Recipient email address
      subject, // Email subject
      html, // HTML content
    });

    console.log('Email sent to:', to, 'Message ID:', info.messageId);
    return info; // Return the email info for further processing if needed
  } catch (err) {
    console.error('Email sending error:', {
      message: err.message,
      code: err.code,
      response: err.response,
      responseCode: err.responseCode,
      command: err.command,
    });
    throw new Error(`Failed to send email: ${err.message}`);
  }
};

module.exports = sendEmail;
