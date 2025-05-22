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

const sendEmail = async (to, subject, html) => {
  try {
    const transporter = nodemailer.createTransport({
      host: 'mail.privateemail.com', // Namecheap Private Email SMTP server
      port: 465, // Use 465 for SSL or 587 for TLS
      secure: true, // Set to true for port 465 (SSL), false for port 587 (TLS)
      auth: {
        user: process.env.EMAIL_USER, // Your full Namecheap Private Email address (e.g., info@yourdomain.com)
        pass: process.env.EMAIL_PASS, // Your Namecheap Private Email password
      },
    });

    await transporter.sendMail({
      from: `"Betflix Password Reset" <${process.env.EMAIL_USER}>`, // Must match your Namecheap email address
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
