import nodemailer from 'nodemailer';

export const sendVerificationEmail = async (userEmail, token) => {
    const transporter = nodemailer.createTransport({
        service: 'gmail',
        host: 'smtp.gmail.com',
        port: 465,
        secure: true,
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
        }
    });

    const url = `http://localhost:5000/api/verify-email/${token}`;

    const mailOptions = {
        from: `"ITB Platform" <${process.env.EMAIL_USER}>`,
        to: userEmail,
        subject: "Verify Your Email Address",
        html: `
            <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #ddd;">
                <h2>Welcome to our Platform!</h2>
                <p>Thank you for registering. Please verify your email to activate your account.</p>
                <a href="${url}" style="background: #1976d2; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">
                    Verify My Account
                </a>
                <p style="margin-top: 20px;">If the button doesn't work, copy and paste this link:</p>
                <p>${url}</p>
            </div>
        `
    };

    return await transporter.sendMail(mailOptions);
};