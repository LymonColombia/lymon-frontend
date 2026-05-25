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

    // Stagehand AI: observe the "Nueva Novedad" button
    const observation = await stagehand.observe("Find the button to create a new incident report");
    console.log("Observation:", observation);

    // Extract page metadata or list count via AI
    const extracted = await stagehand.extract("Extract the page title or the number of incident reports shown in the list");
    const extractedText = getExtractedText(extracted);
    console.log("Extracted text:", extractedText);

    // Deterministic assertion
    const bodyText = await page.locator("body").innerText().catch(() => "");
    console.log("Body text:", bodyText.substring(0, 1000));
    assertIncludes(bodyText, "Novedades", "La lista debería cargar");

    console.log("✅ Incident report list E2E passed");
  } catch (error) {
    console.error("Test failed:", error);
    process.exit(1);
  } finally {
    await stagehand.close();
  }
}

main();
