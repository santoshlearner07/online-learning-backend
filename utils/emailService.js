import * as SibApiV3Sdk from '@getbrevo/brevo';

export const sendVerificationEmail = async (userEmail, token) => {
    const apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();
    
    // Set the API Key
    let apiKey = apiInstance.authentications['apiKey'];
    apiKey.apiKey = process.env.BREVO_API_KEY; 

    const url = `https://itb-tution.vercel.app/verify-email/${token}`;

    const sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();

    sendSmtpEmail.subject = "Verify Your Account";
    sendSmtpEmail.htmlContent = `<html><body><h3>Welcome to ITB</h3><p>Click <a href="${url}">here</a> to verify.</p></body></html>`;
    sendSmtpEmail.sender = { "name": "ITB Tuition", "email": "nandiyawarsantosh.0719@gmail.com" }; 
    sendSmtpEmail.to = [{ "email": userEmail }];

    try {
        await apiInstance.sendTransacEmail(sendSmtpEmail);
        console.log("Email sent successfully via API");
    } catch (error) {
        console.error("Brevo API Error:", error.response?.body || error.message);
        throw error; // Re-throw so your route can catch it
    }
};