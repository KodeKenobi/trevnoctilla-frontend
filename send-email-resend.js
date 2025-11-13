/**
 * Send email using Resend (works on all Railway plans)
 */
const { Resend } = require("resend");
const fs = require("fs");
const path = require("path");

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const TO_EMAIL = process.argv[2] || "kodekenobi@gmail.com";
const TIER = process.argv[3] || "free";

if (!RESEND_API_KEY) {
  console.log("❌ RESEND_API_KEY not set");
  console.log("Get your API key from: https://resend.com/api-keys");
  process.exit(1);
}

// Tier information matching backend structure
const tierInfo = {
  free: {
    name: "Free Tier",
    calls: "5 API calls per month",
    features: [
      "PDF text extraction",
      "Basic image conversion",
      "QR code generation",
      "Admin dashboard access",
      "Community support",
    ],
    upgrade_message:
      "Ready for more? Upgrade to Production ($29/month) for 5,000 API calls or Enterprise ($49/month) for unlimited calls!",
  },
  premium: {
    name: "Production Plan",
    calls: "5,000 API calls per month",
    features: [
      "PDF operations (merge, split, extract)",
      "Video/audio conversion",
      "Image processing",
      "QR code generation",
      "Admin dashboard access",
      "Priority support",
    ],
    upgrade_message:
      "Need unlimited calls? Upgrade to Enterprise ($49/month) for unlimited API calls and enterprise features!",
  },
  enterprise: {
    name: "Enterprise Plan",
    calls: "Unlimited API calls",
    features: [
      "All file processing capabilities",
      "Enterprise client dashboard",
      "Dedicated support",
      "Custom SLAs",
      "White-label options",
      "Unlimited API calls",
    ],
    upgrade_message:
      "You're on our highest tier! Enjoy unlimited access to all features.",
  },
};

// Function to render the welcome email template
function renderWelcomeEmail(tier) {
  const tierData = tierInfo[tier.toLowerCase()] || tierInfo.free;
  const templatePath = path.join(
    __dirname,
    "trevnoctilla-backend",
    "templates",
    "emails",
    "welcome.html"
  );

  let html = fs.readFileSync(templatePath, "utf8");

  // Replace template variables
  html = html.replace(/\{\{ tier_info\.name \}\}/g, tierData.name);
  html = html.replace(/\{\{ tier_info\.calls \}\}/g, tierData.calls);
  html = html.replace(
    /\{\{ tier_info\.upgrade_message \}\}/g,
    tierData.upgrade_message
  );

  // Replace the features loop
  const featuresHtml = tierData.features
    .map((feature) => `<li style="margin: 8px 0">${feature}</li>`)
    .join("\n                    ");
  // Match the Jinja2 loop pattern (multiline)
  html = html.replace(
    /{% for feature in tier_info\.features %}\s*<li style="margin: 8px 0">\{\{ feature \}\}<\/li>\s*{% endfor %}/gs,
    featuresHtml
  );

  return html;
}

console.log("=".repeat(60));
console.log("Send Email via Resend");
console.log("=".repeat(60));
console.log(`To: ${TO_EMAIL}`);
console.log(`Tier: ${TIER}`);
console.log("\n📧 Sending email...\n");

const resend = new Resend(RESEND_API_KEY);
const htmlContent = renderWelcomeEmail(TIER);

resend.emails
  .send({
    from: "Trevnoctilla <onboarding@resend.dev>",
    to: TO_EMAIL,
    subject: "Welcome to Trevnoctilla!",
    html: htmlContent,
  })
  .then((data) => {
    console.log("✅ SUCCESS: Email sent!");
    console.log("Email ID:", data.id);
    process.exit(0);
  })
  .catch((error) => {
    console.log("❌ FAILED:", error.message);
    process.exit(1);
  });
