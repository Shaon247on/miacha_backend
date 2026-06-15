import nodemailer from 'nodemailer';

// Configure email transporter
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export const sendOTPEmail = async (email: string, otp: string, name: string) => {
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Password Reset OTP</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          line-height: 1.6;
          color: #333;
        }
        .container {
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
          background-color: #f9f9f9;
          border-radius: 10px;
        }
        .header {
          text-align: center;
          padding: 20px;
          background-color: #E07B3F;
          border-radius: 10px 10px 0 0;
          color: white;
        }
        .content {
          padding: 30px;
          background-color: white;
          border-radius: 0 0 10px 10px;
        }
        .otp-code {
          font-size: 32px;
          font-weight: bold;
          text-align: center;
          padding: 20px;
          background-color: #f0f0f0;
          border-radius: 8px;
          letter-spacing: 5px;
          color: #E07B3F;
          margin: 20px 0;
        }
        .footer {
          text-align: center;
          padding: 20px;
          font-size: 12px;
          color: #666;
        }
        .button {
          display: inline-block;
          padding: 12px 24px;
          background-color: #E07B3F;
          color: white;
          text-decoration: none;
          border-radius: 5px;
          margin: 20px 0;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Password Reset Request</h1>
        </div>
        <div class="content">
          <p>Dear ${name},</p>
          <p>We received a request to reset your password for your HVAC Service account.</p>
          <p>Please use the following OTP (One-Time Password) to reset your password:</p>
          <div class="otp-code">
            ${otp}
          </div>
          <p>This OTP is valid for <strong>10 minutes</strong>. If you didn't request this, please ignore this email.</p>
          <p>For security reasons, never share this OTP with anyone.</p>
          <hr />
          <p style="font-size: 14px; color: #666;">
            If you're having trouble with the OTP, please contact our support team.
          </p>
        </div>
        <div class="footer">
          <p>&copy; ${new Date().getFullYear()} HVAC Service. All rights reserved.</p>
          <p>This is an automated message, please do not reply.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const textContent = `
    Password Reset Request
    
    Dear ${name},
    
    We received a request to reset your password for your HVAC Service account.
    
    Please use the following OTP (One-Time Password) to reset your password:
    
    ${otp}
    
    This OTP is valid for 10 minutes. If you didn't request this, please ignore this email.
    
    For security reasons, never share this OTP with anyone.
    
    If you're having trouble with the OTP, please contact our support team.
    
    © ${new Date().getFullYear()} HVAC Service. All rights reserved.
  `;

  const mailOptions = {
    from: process.env.EMAIL_FROM || 'noreply@hvacservices.com',
    to: email,
    subject: 'Password Reset OTP - HVAC Service',
    text: textContent,
    html: htmlContent,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`OTP email sent to ${email}`);
    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    return false;
  }
};

export const sendPasswordResetSuccessEmail = async (email: string, name: string) => {
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Password Reset Successful</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          line-height: 1.6;
          color: #333;
        }
        .container {
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
          background-color: #f9f9f9;
          border-radius: 10px;
        }
        .header {
          text-align: center;
          padding: 20px;
          background-color: #28a745;
          border-radius: 10px 10px 0 0;
          color: white;
        }
        .content {
          padding: 30px;
          background-color: white;
          border-radius: 0 0 10px 10px;
        }
        .footer {
          text-align: center;
          padding: 20px;
          font-size: 12px;
          color: #666;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Password Reset Successful</h1>
        </div>
        <div class="content">
          <p>Dear ${name},</p>
          <p>Your password has been successfully reset.</p>
          <p>If you made this change, you can now log in with your new password.</p>
          <p>If you did not reset your password, please contact our support team immediately.</p>
        </div>
        <div class="footer">
          <p>&copy; ${new Date().getFullYear()} HVAC Service. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const mailOptions = {
    from: process.env.EMAIL_FROM || 'noreply@hvacservices.com',
    to: email,
    subject: 'Password Reset Successful - HVAC Service',
    text: 'Your password has been successfully reset.',
    html: htmlContent,
  };

  try {
    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error('Error sending success email:', error);
    return false;
  }
};