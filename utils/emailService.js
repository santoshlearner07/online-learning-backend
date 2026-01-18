import nodemailer from 'nodemailer';

export const sendVerificationEmail = async (userEmail, token) => {
    const transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST, // smtp-relay.brevo.com
        port: 587,
        secure: false, // TLS
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
        },
    });

    const url = `https://itb-tution.vercel.app/verify-email/${token}`;

    try {
        await transporter.sendMail({
            from: `"ITB Tuition" <nandiyawarsantosh.0719@gmail.com>`, 
            to: userEmail,
            subject: "Verify Your Account",
            html: `
                <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #eee;">
                    <h2 style="color: #1976d2;">Welcome to ITB Tuition</h2>
                    <p>Please click the button below to verify your email address and activate your account.</p>
                    <a href="${url}" style="background-color: #1976d2; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block; margin-top: 10px;">
                        Verify Email
                    </a>
                    <p style="margin-top: 20px; font-size: 12px; color: #666;">If the button doesn't work, copy and paste this link: <br/> ${url}</p>
                </div>
            `,
        });
    } catch (error) {
        console.error("Brevo Email Error:", error);
        throw error; 
    }
};