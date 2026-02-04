/**
 * Test: open https://7core.co.uk, find the contact form, list all fields found,
 * fill them with test data, and report what was found vs filled.
 * Run in headed mode so you can watch: node test-7core-form-fields.js
 *
 * Usage: node test-7core-form-fields.js
 */

const { chromium } = require("playwright");

const TARGET_URL = "https://7core.co.uk";
const SLOW_MO_MS = 150;

async function getLabelForElement(page, el) {
  try {
    const id = await el.getAttribute("id");
    if (id) {
      const labelEl = await page.locator(`label[for="${id}"]`).first();
      if ((await labelEl.count()) > 0)
        return (await labelEl.textContent()) || "";
    }
    const parent = await el.locator("xpath=..").first();
    if ((await parent.count()) > 0) {
      const tag = await parent.evaluate((n) => n.tagName);
      if (tag === "LABEL") return (await parent.textContent()) || "";
    }
    const prev = await el.locator("xpath=preceding-sibling::*[1]").first();
    if ((await prev.count()) > 0) return (await prev.textContent()) || "";
  } catch (e) {}
  return "";
}

async function run() {
  const browser = await chromium.launch({
    headless: false,
    slowMo: SLOW_MO_MS,
  });

  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 },
    userAgent:
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36",
  });

  const page = await context.newPage();
  page.setDefaultTimeout(15000);
  page.setDefaultNavigationTimeout(20000);

  const fieldsFound = [];
  const fieldsFilled = [];

  try {
    console.log("\n[1] Navigating to", TARGET_URL, "\n");
    await page.goto(TARGET_URL, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(2000);

    // Dismiss cookie banner if present
    try {
      const accept = page
        .locator(
          'button:has-text("Accept"), button:has-text("Agree"), [aria-label*="Accept" i]'
        )
        .first();
      if (await accept.isVisible({ timeout: 1500 })) {
        await accept.click();
        await page.waitForTimeout(500);
      }
    } catch (e) {}

    // Try to open Contact if there's a link
    try {
      const contactLink = page
        .locator('a:has-text("Contact"), a[href*="contact" i]')
        .first();
      if (await contactLink.isVisible({ timeout: 2000 })) {
        await contactLink.click();
        await page.waitForTimeout(2000);
      }
    } catch (e) {}

    // Find forms
    const forms = await page.locator("form").all();
    console.log("[2] Forms on page:", forms.length, "\n");

    for (let formIndex = 0; formIndex < forms.length; formIndex++) {
      const form = forms[formIndex];
      const formId = await form.getAttribute("id").catch(() => "");
      const formName = await form.getAttribute("name").catch(() => "");
      const formInfo = formId || formName || `form ${formIndex + 1}`;
      console.log("--- Form:", formInfo, "---");

      let oneBranchCheckboxChecked = false;

      // Inputs
      const inputs = await form
        .locator(
          "input:not([type='hidden']):not([type='submit']):not([type='image'])"
        )
        .all();
      for (const el of inputs) {
        try {
          if (!(await el.isVisible())) continue;
          const tag = "input";
          const type = (await el.getAttribute("type")) || "text";
          const name = (await el.getAttribute("name")) || "";
          const id = (await el.getAttribute("id")) || "";
          const placeholder = (await el.getAttribute("placeholder")) || "";
          const label = await getLabelForElement(page, el);
          const required = (await el.getAttribute("required")) != null;
          const info = {
            tag,
            type,
            name,
            id,
            label: label.trim(),
            placeholder,
            required,
          };
          fieldsFound.push(info);
          console.log("  [FOUND] input", JSON.stringify(info));

          let filled = false;
          const role = (name || id || label).toLowerCase();
          if (type === "email") {
            await el.fill("test@example.com");
            filled = true;
          } else if (type === "tel" || type === "phone" || role.includes("phone")) {
            await el.fill("07700900123");
            filled = true;
          } else if (
            role.includes("first") ||
            (role.includes("name") &&
              !role.includes("last") &&
              !role.includes("company"))
          ) {
            await el.fill("Test");
            filled = true;
          } else if (role.includes("last")) {
            await el.fill("User");
            filled = true;
          } else if (role.includes("company")) {
            await el.fill("Test Ltd");
            filled = true;
          } else if (type === "text") {
            await el.fill("Test value");
            filled = true;
          } else if (type === "checkbox") {
            const isBranch =
              role.includes("branch") ||
              role.includes("location") ||
              (name && name.toLowerCase().includes("branch"));
            if (isBranch && !oneBranchCheckboxChecked) {
              await el.check();
              filled = true;
              oneBranchCheckboxChecked = true;
              console.log("  [FILLED] branch checkbox (one selected):", label || name || id);
            }
          }
          if (filled) {
            fieldsFilled.push(info);
            if (type !== "checkbox" || !role.includes("branch")) {
              console.log("  [FILLED] input", name || id || "(no name)");
            }
          }
        } catch (e) {
          console.log("  [SKIP input]", e.message);
        }
      }

      // Textareas
      const textareas = await form.locator("textarea").all();
      for (const el of textareas) {
        try {
          if (!(await el.isVisible())) continue;
          const name = (await el.getAttribute("name")) || "";
          const id = (await el.getAttribute("id")) || "";
          const placeholder = (await el.getAttribute("placeholder")) || "";
          const label = await getLabelForElement(page, el);
          const info = {
            tag: "textarea",
            name,
            id,
            label: label.trim(),
            placeholder,
          };
          fieldsFound.push(info);
          console.log("  [FOUND] textarea", JSON.stringify(info));
          await el.fill("This is a test message from the 7core form test.");
          fieldsFilled.push(info);
          console.log("  [FILLED] textarea", name || id || "(no name)");
        } catch (e) {
          console.log("  [SKIP textarea]", e.message);
        }
      }

      // Selects
      const selects = await form.locator("select").all();
      for (const el of selects) {
        try {
          if (!(await el.isVisible())) continue;
          const name = (await el.getAttribute("name")) || "";
          const id = (await el.getAttribute("id")) || "";
          const label = await getLabelForElement(page, el);
          const options = await el.locator("option").all();
          const optionTexts = [];
          for (const opt of options) {
            const v = await opt.getAttribute("value");
            const t = await opt.textContent();
            optionTexts.push({ value: v || "", text: (t || "").trim() });
          }
          const info = {
            tag: "select",
            name,
            id,
            label: label.trim(),
            options: optionTexts,
          };
          fieldsFound.push(info);
          console.log("  [FOUND] select", JSON.stringify(info));

          // Pick first non-placeholder option
          let pickIndex = 0;
          if (options.length > 1) {
            const firstText = (optionTexts[0]?.text || "").toLowerCase();
            if (/choose|select|please|--/.test(firstText)) pickIndex = 1;
          }
          await el.selectOption({ index: pickIndex });
          fieldsFilled.push(info);
          console.log(
            "  [FILLED] select",
            name || id || "(no name)",
            "-> option index",
            pickIndex
          );
        } catch (e) {
          console.log("  [SKIP select]", e.message);
        }
      }

      console.log("");
    }

    console.log("\n========== SUMMARY ==========\n");
    console.log("Fields found:", fieldsFound.length);
    fieldsFound.forEach((f, i) =>
      console.log(
        `  ${i + 1}. ${f.tag} name="${f.name || ""}" id="${
          f.id || ""
        }" label="${(f.label || "").slice(0, 40)}"`
      )
    );
    console.log("\nFields filled:", fieldsFilled.length);
    fieldsFilled.forEach((f, i) =>
      console.log(
        `  ${i + 1}. ${f.tag} name="${f.name || ""}" id="${f.id || ""}"`
      )
    );
    console.log("\n==============================\n");

    await page.waitForTimeout(3000);
  } finally {
    await browser.close();
  }
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
