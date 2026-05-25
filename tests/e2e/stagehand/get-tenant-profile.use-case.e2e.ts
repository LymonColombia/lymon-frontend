import { Stagehand } from "@browserbasehq/stagehand";
import dotenv from "dotenv";
import { createStagehand } from "./helpers/stagehand-factory.js";
import { login, getExtractedText } from "./helpers/shared.js";
import { assertIncludes } from "./helpers/assert.js";

dotenv.config();

const APP_URL = process.env.APP_URL || "http://localhost:4200";

async function main() {
  const stagehand = createStagehand();
  try {
    await stagehand.init();
    const page = stagehand.context.pages()[0];
    await login(page);

    await page.goto(`${APP_URL}/settings`);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(2000);

    const url = page.url();
    if (url.includes("/login")) {
      throw new Error("Redirected back to login — session not persisted");
    }

    // Extract tenant name using Stagehand AI
    const extracted = await stagehand.extract("Extract the tenant or business name displayed on the settings page");
    const extractedText = getExtractedText(extracted);
    console.log("Extracted tenant name:", extractedText);

    // Assert that the profile page is displayed
    const bodyText = await page.locator("body").innerText().catch(() => "");
    console.log("Body text:", bodyText.substring(0, 1000));
    assertIncludes(bodyText, "Perfil", "El perfil del tenant debería mostrarse en la página");

    console.log("✅ Get tenant profile use case E2E passed");
  } catch (error) {
    console.error("Test failed:", error);
    process.exit(1);
  } finally {
    await stagehand.close();
  }
}

main();
