require('dotenv').config();
const sgMail = require('@sendgrid/mail');

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

async function testBetterEmail() {
    console.log('📧 Testing Improved Email...');

    const msg = {
        to: 'uraj4259@gmail.com',
        from: {
            email: "uday72192@gmail.com",
            name: 'AI Voice Agent Team'
        },
        subject: 'Welcome to AI Voice Agent SaaS Platform',
        text: `Hello Uday,

Welcome to AI Voice Agent SaaS! Your account is now active.

Your communication setup is working perfectly:
✅ SMS notifications
✅ Email alerts  
✅ Voice calls

Best regards,
AI Voice Agent Team

---
If you no longer wish to receive these emails, please contact support.`,
        html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #2563eb;">Welcome to AI Voice Agent SaaS!</h2>
            
            <p>Hello Uday,</p>
            
            <p>Welcome to <strong>AI Voice Agent SaaS</strong>! Your account is now active and ready to use.</p>
            
            <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3 style="color: #059669; margin-top: 0;">✅ Your Communication Setup is Complete</h3>
                <ul style="color: #374151;">
                    <li>📱 SMS notifications</li>
                    <li>📧 Email alerts</li>
                    <li>📞 Voice calls</li>
                </ul>
            </div>
            
            <p>You can now start scheduling calls, sending messages, and managing your communication campaigns.</p>
            
            <div style="text-align: center; margin: 30px 0;">
                <a href="http://localhost:3000/vendor/dashboard" 
                   style="background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                   Access Your Dashboard
                </a>
            </div>
            
            <p style="color: #6b7280; font-size: 14px;">
                Best regards,<br>
                <strong>AI Voice Agent Team</strong>
            </p>
            
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
            <p style="color: #9ca3af; font-size: 12px;">
                If you no longer wish to receive these emails, please contact our support team.
            </p>
        </div>`
    };

    try {
        await sgMail.send(msg);
        console.log('✅ Professional email sent successfully!');
        console.log('📧 Check your inbox (should have better deliverability)');
    } catch (error) {
        console.log('❌ Email failed:', error.message);
    }
}

testBetterEmail();