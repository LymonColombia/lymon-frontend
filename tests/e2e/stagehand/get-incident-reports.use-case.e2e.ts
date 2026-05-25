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

    await page.goto(`${APP_URL}/incident-report/list`);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(2000);

    const url = page.url();
    if (url.includes("/login")) {
      throw new Error("Redirected back to login — session not persisted");
    }

    // Use Stagehand to extract list information
    const extracted = await stagehand.extract("Extract the list of incident report titles shown on the page");
    const extractedText = getExtractedText(extracted);
    console.log("Extracted reports:", extractedText);

    // Validate structure deterministically
    const bodyText = await page.locator("body").innerText().catch(() => "");
    console.log("Body text:", bodyText.substring(0, 1000));
    assertIncludes(bodyText, "Novedades", "El listado debería cargar correctamente");

    const listItems = await page.locator("tbody tr, .incident-card, [data-testid='incident-item']").count().catch(() => 0);
    if (listItems > 0) {
      console.log(`List structure validated with ${listItems} items`);
    }

    console.log("✅ Get incident reports use case E2E passed");
  } catch (error) {
    console.error("Test failed:", error);
    process.exit(1);
  } finally {
    await stagehand.close();
  }
}

main();
