import nodemailer from 'nodemailer';
import crypto from 'crypto';

// Create email transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER || 'your-email@gmail.com',
    pass: process.env.EMAIL_PASSWORD || 'your-app-password'
  }
});

// Generate 4-digit OTP
export function generateOtp(): string {
  return crypto.randomInt(1000, 9999).toString();
}

// Send OTP email
export async function sendOtpEmail(email: string, otp: string, fullName: string): Promise<void> {
  const mailOptions = {
    from: process.env.EMAIL_USER || 'noreply@rentiverse.com',
    to: email,
    subject: 'Verify Your Email - Rentiverse',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #3B82F6; padding: 20px; text-align: center;">
          <h1 style="color: white; margin: 0;">Rentiverse</h1>
        </div>
        
        <div style="padding: 30px; background-color: #f9f9f9;">
          <h2 style="color: #333;">Hello ${fullName}!</h2>
          
          <p style="color: #666; font-size: 16px;">
            Thank you for signing up with Rentiverse. To complete your registration, 
            please verify your email address using the OTP below:
          </p>
          
          <div style="text-align: center; margin: 30px 0;">
            <div style="background-color: #3B82F6; color: white; font-size: 32px; font-weight: bold; padding: 20px; border-radius: 8px; letter-spacing: 8px; display: inline-block;">
              ${otp}
            </div>
          </div>
          
          <p style="color: #666; font-size: 14px;">
            This OTP is valid for 10 minutes. If you didn't sign up for Rentiverse, 
            please ignore this email.
          </p>
          
          <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #ddd;">
            <p style="color: #999; font-size: 12px; margin: 0;">
              This is an automated email, please do not reply.
            </p>
          </div>
        </div>
      </div>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`OTP email sent to ${email}`);
  } catch (error) {
    console.error('Error sending OTP email:', error);
    throw new Error('Failed to send verification email');
  }
}

// Send welcome email after verification
export async function sendWelcomeEmail(email: string, fullName: string): Promise<void> {
  const mailOptions = {
    from: process.env.EMAIL_USER || 'noreply@rentiverse.com',
    to: email,
    subject: 'Welcome to Rentiverse!',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #10B981; padding: 20px; text-align: center;">
          <h1 style="color: white; margin: 0;">Welcome to Rentiverse!</h1>
        </div>
        
        <div style="padding: 30px; background-color: #f9f9f9;">
          <h2 style="color: #333;">Hello ${fullName}!</h2>
          
          <p style="color: #666; font-size: 16px;">
            Your email has been successfully verified! Welcome to Rentiverse, 
            your trusted rental management platform.
          </p>
          
          <div style="background-color: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #333; margin-top: 0;">What you can do:</h3>
            <ul style="color: #666;">
              <li>Browse our extensive product catalog</li>
              <li>Book rentals with flexible duration options</li>
              <li>Track your rental orders in real-time</li>
              <li>Make secure payments with Razorpay</li>
              <li>Manage your account and preferences</li>
            </ul>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.FRONTEND_URL || 'http://localhost:5000'}" 
               style="background-color: #3B82F6; color: white; text-decoration: none; padding: 12px 30px; border-radius: 6px; font-weight: bold; display: inline-block;">
              Start Renting Now
            </a>
          </div>
          
          <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #ddd;">
            <p style="color: #999; font-size: 12px; margin: 0;">
              Need help? Contact our support team at support@rentiverse.com
            </p>
          </div>
        </div>
      </div>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Welcome email sent to ${email}`);
  } catch (error) {
    console.error('Error sending welcome email:', error);
    // Don't throw error for welcome email as it's not critical
  }
}
