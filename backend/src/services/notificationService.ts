import nodemailer from "nodemailer";
import { env } from "../config/env.js";

// Lazy-init transporter so missing SMTP config doesn't crash at startup
let transporter: nodemailer.Transporter | null = null;
function getTransporter() {
  if (!transporter && env.SMTP_HOST) {
    transporter = nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      auth: { user: env.SMTP_USER, pass: env.SMTP_PASS }
    });
  }
  return transporter;
}

// Lazy-init Twilio client
let twilioClient: import("twilio").Twilio | null = null;
async function getTwilio() {
  if (!twilioClient && env.TWILIO_ACCOUNT_SID?.startsWith("AC") && env.TWILIO_AUTH_TOKEN) {
    const twilio = await import("twilio");
    twilioClient = twilio.default(env.TWILIO_ACCOUNT_SID, env.TWILIO_AUTH_TOKEN);
  }
  return twilioClient;
}

export interface MechanicNotificationTarget {
  name: string;
  phone: string;
  email: string;
}

export interface BreakdownDetails {
  requestId: string;
  customerName: string;
  customerPhone: string;
  problemCategory: string;
  address: string;
  latitude: number;
  longitude: number;
}

export async function notifyNearbyMechanics(
  mechanics: MechanicNotificationTarget[],
  breakdown: BreakdownDetails
) {
  const mapLink = `https://maps.google.com/?q=${breakdown.latitude},${breakdown.longitude}`;
  const smsBody = `[EngineX] BREAKDOWN ALERT\nJob: ${breakdown.problemCategory}\nLocation: ${breakdown.address}\nCustomer: ${breakdown.customerName} — ${breakdown.customerPhone}\nMap: ${mapLink}\nRequest ID: ${breakdown.requestId}`;
  const emailBody = `
    <h2>🚨 New Breakdown Alert — EngineX</h2>
    <p><strong>Job type:</strong> ${breakdown.problemCategory}</p>
    <p><strong>Location:</strong> ${breakdown.address}</p>
    <p><strong>Customer:</strong> ${breakdown.customerName}</p>
    <p><strong>Customer phone:</strong> <a href="tel:${breakdown.customerPhone}">${breakdown.customerPhone}</a></p>
    <p><a href="${mapLink}">Open in Google Maps</a></p>
    <p>Request ID: ${breakdown.requestId}</p>
    <hr/>
    <p><small>You are receiving this because you are a verified EngineX mechanic in this area.</small></p>
  `;

  const twilio = await getTwilio();
  const mailer = getTransporter();

  const notifications = mechanics.map(async (mechanic) => {
    const tasks: Promise<unknown>[] = [];

    // SMS
    if (twilio && env.TWILIO_FROM_NUMBER && mechanic.phone) {
      tasks.push(
        twilio.messages.create({
          body: smsBody,
          from: env.TWILIO_FROM_NUMBER,
          to: mechanic.phone
        }).catch((err) => console.error(`SMS to ${mechanic.phone} failed:`, err))
      );
    }

    // Voice call with TwiML
    if (twilio && env.TWILIO_FROM_NUMBER && mechanic.phone) {
      const twiml = `<Response><Say voice="alice">Hello ${mechanic.name}. You have a new breakdown job on EngineX. ${breakdown.problemCategory} at ${breakdown.address}. Customer phone is ${breakdown.customerPhone.split("").join(" ")}. Please open the EngineX app for details.</Say></Response>`;
      tasks.push(
        twilio.calls.create({
          twiml,
          from: env.TWILIO_FROM_NUMBER,
          to: mechanic.phone
        }).catch((err) => console.error(`Call to ${mechanic.phone} failed:`, err))
      );
    }

    // Email
    if (mailer && mechanic.email) {
      tasks.push(
        mailer.sendMail({
          from: env.SMTP_FROM,
          to: mechanic.email,
          subject: `[EngineX] New breakdown job — ${breakdown.problemCategory}`,
          html: emailBody
        }).catch((err) => console.error(`Email to ${mechanic.email} failed:`, err))
      );
    }

    if (tasks.length === 0) {
      console.log(`[notify] No channels configured — would notify ${mechanic.name} (${mechanic.phone})`);
    }

    return Promise.allSettled(tasks);
  });

  await Promise.allSettled(notifications);
}
