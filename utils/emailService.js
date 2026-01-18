import nodemailer from 'nodemailer';

export const sendVerificationEmail = async (userEmail, token) => {
    const transporter = nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 587,
        secure: false, 
        service: 'gmail', 
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
        },
        connectionTimeout: 10000, // 10 seconds
        greetingTimeout: 10000,
        socketTimeout: 10000,
        dnsServer: '8.8.8.8', 
        debug: true, 
        logger: true 
    });

    const url = `https://itb-tution.vercel.app/verify-email/${token}`;

    await transporter.sendMail({
        from: `"ITB Tuition" <${process.env.EMAIL_USER}>`,
        to: userEmail,
        subject: "Verify Your Account",
        html: `<h3>Welcome to ITB</h3><p>Click <a href="${url}">here</a> to verify.</p>`,
    });
};