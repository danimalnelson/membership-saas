import { NextAuthOptions } from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import EmailProvider from "next-auth/providers/email";
import { prisma } from "@wine-club/db";
import type { Adapter } from "next-auth/adapters";
import { Resend } from "resend";

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma) as Adapter,
  providers: [
    EmailProvider({
      server: {
        host: "smtp.resend.com",
        port: 465,
        auth: {
          user: "resend",
          pass: process.env.RESEND_API_KEY || "",
        },
      },
      from: process.env.EMAIL_FROM || "onboarding@resend.dev",
      async sendVerificationRequest({ identifier: email, url }) {
        if (!resend) {
          console.error("[AUTH] Resend not configured - RESEND_API_KEY missing");
          throw new Error("Email service not configured");
        }
        
        const fromEmail = process.env.EMAIL_FROM || "onboarding@resend.dev";
        
        try {
          console.log(`[AUTH] Attempting to send magic link to: ${email} from: ${fromEmail}`);
          
          const result = await resend.emails.send({
            from: fromEmail,
            to: email,
            subject: "Sign in to Vintigo",
            html: `
              <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
                <h2>Sign in to Vintigo</h2>
                <p>Click the button below to sign in:</p>
                <a href="${url}" style="display: inline-block; background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0;">Sign In</a>
                <p style="color: #666; font-size: 14px;">This link expires in 24 hours. If you didn't request this email, you can safely ignore it.</p>
              </div>
            `,
          });
          
          console.log(`[AUTH] Email sent successfully. ID: ${result.data?.id}`);
        } catch (error: any) {
          console.error("[AUTH] Error sending email:", {
            message: error?.message,
            statusCode: error?.statusCode,
            name: error?.name,
            error: error,
          });
          throw error;
        }
      },
    }),
  ],
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/auth/signin",
    error: "/auth/error",
  },
  callbacks: {
    async signIn({ user, account, profile, email, credentials }) {
      // Check if this is a new user (first sign-in)
      if (user && user.id) {
        try {
          const existingUser = await prisma.user.findUnique({
            where: { id: user.id },
            include: {
              businesses: true,
            },
          });

          // If user has no previous accounts or businesses, this is their first sign-in
          if (existingUser && existingUser.businesses.length === 0) {
            const accounts = await prisma.account.findMany({
              where: { userId: user.id },
            });

            // Only one account means this is the first sign-in
            if (accounts.length === 1) {
              console.log(`[AUTH] New user detected: ${user.email}, sending welcome email`);
              
              // Send welcome email (non-blocking)
              if (resend && user.email) {
                resend.emails.send({
                  from: process.env.EMAIL_FROM || "onboarding@resend.dev",
                  to: user.email,
                  subject: "Welcome to Vintigo!",
                  html: `
                    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
                      <h2>Welcome to Vintigo!</h2>
                      <p>Your account has been successfully created.</p>
                      <p>Get started by creating your first wine club business and begin accepting members.</p>
                      <a href="${process.env.NEXTAUTH_URL || "http://localhost:3000"}/onboarding" 
                         style="display: inline-block; background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0;">
                        Get Started
                      </a>
                      <p style="color: #666; font-size: 14px;">Need help? Contact our support team.</p>
                    </div>
                  `,
                }).catch((error) => {
                  console.error("[AUTH] Failed to send welcome email:", error);
                });
              }
            }
          }
        } catch (error) {
          console.error("[AUTH] Error checking new user status:", error);
          // Don't block sign-in if welcome email fails
        }
      }

      return true; // Allow sign-in
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.sub!;
        session.businessId = token.businessId as string | undefined;
      }
      return session;
    },
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.sub = user.id;
      }

      // Allow updating businessId via update trigger
      if (trigger === "update" && session?.businessId) {
        token.businessId = session.businessId;
      }

      // Load default businessId if not set
      if (!token.businessId && token.sub) {
        const businessUser = await prisma.businessUser.findFirst({
          where: { userId: token.sub },
          include: { business: true },
          orderBy: { createdAt: "asc" },
        });
        if (businessUser) {
          token.businessId = businessUser.businessId;
        }
      }

      return token;
    },
  },
};

