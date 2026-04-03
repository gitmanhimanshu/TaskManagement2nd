import { config } from '../config/env';

interface EmailOptions {
  to: string;
  name?: string;
  subject: string;
  htmlContent: string;
}

export const sendEmail = async (options: EmailOptions): Promise<{ success: boolean; message: string }> => {
  try {
    const apiKey = config.email.brevoApiKey;

    if (!apiKey) {
      console.log('⚠️ BREVO_API_KEY not configured');
      return { success: false, message: 'Email service not configured' };
    }

    // Log configuration (without exposing full API key)
    console.log('📧 Sending email via Brevo API');
    console.log(`   To: ${options.to}`);
    console.log(`   Name: ${options.name || 'User'}`);
    console.log(`   From: ${config.email.from}`);
    console.log(`   API Key: ${apiKey.substring(0, 20)}...`);

    const headers = {
      'accept': 'application/json',
      'api-key': apiKey,
      'content-type': 'application/json',
    };

    const payload = {
      sender: {
        name: config.email.fromName,
        email: config.email.from,
      },
      to: [
        {
          email: options.to,
          name: options.name || 'User',
        },
      ],
      subject: options.subject,
      htmlContent: options.htmlContent,
    };

    console.log('   Payload:', JSON.stringify({ ...payload, htmlContent: '[HTML Content]' }));

    const response = await fetch(config.email.brevoApiUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    });

    const responseText = await response.text();

    if (response.ok) {
      console.log(`✓ Email sent successfully via Brevo API`);
      console.log(`   Response: ${responseText}`);
      return { success: true, message: 'Email sent successfully' };
    } else {
      const errorMsg = `Brevo API error: ${response.status} - ${responseText}`;
      console.log(`⚠️ ${errorMsg}`);
      return { success: false, message: errorMsg };
    }
  } catch (error: any) {
    const errorMsg = `Email error: ${error.name}: ${error.message}`;
    console.log(`⚠️ ${errorMsg}`);
    return { success: false, message: errorMsg };
  }
};

export const sendInvitationEmail = async (
  email: string,
  name: string,
  companyName: string,
  inviterName: string,
  token: string
): Promise<{ success: boolean; message: string }> => {
  const inviteUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/accept-invite?token=${token}`;

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #4CAF50; color: white; padding: 20px; text-align: center; }
        .content { background-color: #f9f9f9; padding: 30px; }
        .button { display: inline-block; padding: 12px 30px; background-color: #4CAF50; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>You're Invited!</h1>
        </div>
        <div class="content">
          <h2>Hello ${name},</h2>
          <p><strong>${inviterName}</strong> has invited you to join <strong>${companyName}</strong> on our Task Management System.</p>
          <p>Click the button below to accept the invitation and create your account:</p>
          <div style="text-align: center;">
            <a href="${inviteUrl}" class="button">Accept Invitation</a>
          </div>
          <p>Or copy and paste this link into your browser:</p>
          <p style="word-break: break-all; color: #666;">${inviteUrl}</p>
          <p><strong>Note:</strong> This invitation will expire in 7 days.</p>
        </div>
        <div class="footer">
          <p>If you didn't expect this invitation, you can safely ignore this email.</p>
          <p>&copy; ${new Date().getFullYear()} Task Management System. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to: email,
    name,
    subject: `Invitation to join ${companyName}`,
    htmlContent,
  });
};

export const sendWelcomeEmail = async (
  email: string,
  name: string,
  companyName: string,
  tempPassword: string
): Promise<{ success: boolean; message: string }> => {
  const loginUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/login`;

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #2196F3; color: white; padding: 20px; text-align: center; }
        .content { background-color: #f9f9f9; padding: 30px; }
        .credentials { background-color: #fff; padding: 15px; border-left: 4px solid #2196F3; margin: 20px 0; }
        .button { display: inline-block; padding: 12px 30px; background-color: #2196F3; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Welcome to ${companyName}!</h1>
        </div>
        <div class="content">
          <h2>Hello ${name},</h2>
          <p>Your account has been created successfully. You can now access the Task Management System.</p>
          <div class="credentials">
            <p><strong>Your Login Credentials:</strong></p>
            <p><strong>Email:</strong> ${email}</p>
            <p><strong>Temporary Password:</strong> ${tempPassword}</p>
          </div>
          <p><strong>Important:</strong> Please change your password after your first login for security.</p>
          <div style="text-align: center;">
            <a href="${loginUrl}" class="button">Login Now</a>
          </div>
        </div>
        <div class="footer">
          <p>If you have any questions, please contact your administrator.</p>
          <p>&copy; ${new Date().getFullYear()} Task Management System. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to: email,
    name,
    subject: `Welcome to ${companyName} - Your Account Details`,
    htmlContent,
  });
};
