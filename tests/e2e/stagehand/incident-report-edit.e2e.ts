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

    await page.goto(`${APP_URL}/incident-report/edit/1`);
    await page.evaluate(() => {
      history.replaceState({ report: { id: '1', title: 'Daño general', description: 'Desc', propertyId: 'prop-1', createdAt: '2026-05-25T00:00:00Z' } }, '');
    });
    await page.reload(); // Angular will read history.state on reload
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(2000);

    const url = page.url();
    if (url.includes("/login")) {
      throw new Error("Redirected back to login — session not persisted");
    }

    // Update title with stagehand act
    await stagehand.act("Fill the title field with 'Incidente Editado Stagehand'");

    // Playwright deterministic selector for save button
    await page.locator('text=Guardar').first().click();

    await page.waitForTimeout(3000);

    const bodyText = await page.locator("body").innerText().catch(() => "");
    console.log("Body text after save:", bodyText.substring(0, 1000));
    assertIncludes(bodyText, "actualizada", "La edición debería guardarse correctamente");

    console.log("✅ Incident report edit E2E passed");
  } catch (error) {
    console.error("Test failed:", error);
    process.exit(1);
  } finally {
    await stagehand.close();
  }
}

main();
