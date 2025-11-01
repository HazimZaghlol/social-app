import { createTransport } from "nodemailer";
import EventEmitter from "events";
import { IEmail } from "../../Common";

export const emailEmitter = new EventEmitter();

emailEmitter.on("sendEmail", async ({ to, subject, html }: IEmail) => {
  try {
    const transporter = createTransport({
      host: process.env.EMAIL_HOST,
      port: Number(process.env.EMAIL_PORT),
      secure: true,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    await transporter.sendMail({
      from: `"Our App Team" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html,
    });

    console.log("✅ Email sent successfully to", to);
  } catch (error) {
    console.error("❌ Error sending email:", error);
  }
});

export const sendEmailEvent = async ({ to, subject, html }: IEmail) => {
  emailEmitter.emit("sendEmail", { to, subject, html });
};
