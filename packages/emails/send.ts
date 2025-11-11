import { Resend } from "resend";
import { render } from "@react-email/render";
import { WelcomeEmail, PaymentFailedEmail, MonthlySummaryEmail } from "./templates";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendWelcomeEmail(
  to: string,
  memberName: string,
  businessName: string
) {
  try {
    const html = render(<WelcomeEmail memberName={memberName} businessName={businessName} />);
    
    const { data, error } = await resend.emails.send({
      from: `${businessName} <noreply@vintigo.com>`,
      to,
      subject: `Welcome to ${businessName}!`,
      html,
    });

    if (error) {
      console.error("Failed to send welcome email:", error);
      return { success: false, error };
    }

    return { success: true, data };
  } catch (error) {
    console.error("Error sending welcome email:", error);
    return { success: false, error };
  }
}

export async function sendPaymentFailedEmail(
  to: string,
  memberName: string,
  amount: string,
  businessName: string
) {
  try {
    const html = render(
      <PaymentFailedEmail 
        memberName={memberName} 
        amount={amount}
        businessName={businessName}
      />
    );
    
    const { data, error } = await resend.emails.send({
      from: `${businessName} <noreply@vintigo.com>`,
      to,
      subject: `Payment Failed - ${businessName}`,
      html,
    });

    if (error) {
      console.error("Failed to send payment failed email:", error);
      return { success: false, error };
    }

    return { success: true, data };
  } catch (error) {
    console.error("Error sending payment failed email:", error);
    return { success: false, error };
  }
}

export async function sendMonthlySummaryEmail(
  to: string,
  businessName: string,
  stats: {
    newMembers: number;
    revenue: string;
    activeMembers: number;
  }
) {
  try {
    const html = render(
      <MonthlySummaryEmail businessName={businessName} stats={stats} />
    );
    
    const { data, error } = await resend.emails.send({
      from: `Vintigo Platform <noreply@vintigo.com>`,
      to,
      subject: `Monthly Summary - ${businessName}`,
      html,
    });

    if (error) {
      console.error("Failed to send monthly summary email:", error);
      return { success: false, error };
    }

    return { success: true, data };
  } catch (error) {
    console.error("Error sending monthly summary email:", error);
    return { success: false, error };
  }
}

