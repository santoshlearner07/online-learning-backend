import nodemailer from 'nodemailer';

export const sendVerificationEmail = async (userEmail, token) => {
    const transporter = nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 587, 
        secure: false, 
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
        },
        // connectionTimeout: 10000, 
        tls: {
        rejectUnauthorized: false 
    }
    });

    const url = `https://itb-tution.vercel.app/verify-email/${token}`; 

    await transporter.sendMail({
        from: `"ITB Tuition" ${process.env.EMAIL_USER}`,
        to: userEmail,
        subject: "Verify Your Account",
        html: `Click <a href="${url}">here</a> to verify.`,
    });
};