const nodemailer = require('nodemailer');

const sendEmailOTP = async (email, otp) => {
    try {
        if (!process.env.EMAIL_SERVICE_USER || !process.env.EMAIL_SERVICE_PASSWORD) {
            throw new Error('Email service credentials are not configured in .env');
        }

        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_SERVICE_USER,
                pass: process.env.EMAIL_SERVICE_PASSWORD,
            },
        });

        const mailOptions = {
            from: `"SarkariMinds" <${process.env.EMAIL_SERVICE_USER}>`,
            to: email,
            subject: 'Confirm Your Email - SarkariMinds',
            html: `
                <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; padding: 40px; background-color: #f4f7f6;">
                    <div style="max-width: 500px; margin: 0 auto; background-color: #ffffff; padding: 30px; border-radius: 20px; box-shadow: 0 10px 25px rgba(0,0,0,0.05); text-align: center;">
                        <h1 style="color: #1a73e8; margin-bottom: 10px; font-size: 28px; font-weight: 900;">SarkariMinds</h1>
                        <p style="color: #666; font-size: 16px; margin-bottom: 30px;">Verification code for your new account:</p>
                        <div style="background-color: #f8f9fa; padding: 25px; border-radius: 12px; margin: 20px 0; border: 2px dashed #dee2e6;">
                            <span style="font-size: 42px; font-weight: 900; letter-spacing: 10px; color: #1a73e8;">${otp}</span>
                        </div>
                        <p style="color: #999; font-size: 12px; margin-top: 30px;">This code will expire in 5 minutes.<br>If you did not request this, please ignore this email.</p>
                    </div>
                </div>
            `,
        };

        await transporter.sendMail(mailOptions);

        if (process.env.NODE_ENV === 'development') {
            console.log(`[EMAIL SUCCESS] Sent to ${email} | OTP: ${otp}`);
        }
        return { success: true };
    } catch (error) {
        if (process.env.NODE_ENV === 'development') {
            console.error('[EMAIL ERROR]:', error.message);
        }
        return {
            success: false,
            error: process.env.NODE_ENV === 'development' ? error.message : 'Failed to send verification email'
        };
    }
};

const sendSMSOTP = async (mobile, otp) => {
    try {
        if (!process.env.SMS_PROVIDER_API_KEY || !process.env.SMS_PROVIDER_SECRET) {
            // If not configured, just log in dev and return success for testing
            if (process.env.NODE_ENV === 'development') {
                console.log(`[SMS MOCK] To: ${mobile} | Code: ${otp}`);
                return { success: true };
            }
            throw new Error('SMS service credentials are not configured');
        }

        const twilio = require('twilio')(process.env.SMS_PROVIDER_API_KEY, process.env.SMS_PROVIDER_SECRET);

        await twilio.messages.create({
            body: `Your SarkariMinds verification code is: ${otp}. Valid for 5 minutes.`,
            from: process.env.SMS_SENDER_NUMBER,
            to: mobile
        });

        if (process.env.NODE_ENV === 'development') {
            console.log(`[SMS SUCCESS] Sent to ${mobile} | OTP: ${otp}`);
        }
        return { success: true };
    } catch (error) {
        console.error('[SMS ERROR]:', error.message);
        // Fallback for development if Twilio fails
        if (process.env.NODE_ENV === 'development') {
            console.log(`[SMS FALLBACK MOCK] To: ${mobile} | Code: ${otp}`);
            return { success: true };
        }
        return { success: false, error: 'Failed to send SMS OTP' };
    }
};

module.exports = { sendEmailOTP, sendSMSOTP };

