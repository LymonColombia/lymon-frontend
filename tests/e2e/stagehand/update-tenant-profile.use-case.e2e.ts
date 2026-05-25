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

    // Use stagehand act to update the business name
    await stagehand.act("Fill the business name field with 'Empresa Stagehand Test'");

    // Playwright deterministic selector for Angular custom button
    await page.locator('text=Guardar cambios').first().click();

    await page.waitForTimeout(3000);

    const bodyText = await page.locator("body").innerText().catch(() => "");
    console.log("Body text after save:", bodyText.substring(0, 1000));
    assertIncludes(bodyText, "actualizado", "El perfil debería actualizarse correctamente");

    console.log("✅ Update tenant profile use case E2E passed");
  } catch (error) {
    console.error("Test failed:", error);
    process.exit(1);
  } finally {
    await stagehand.close();
  }
}

main();
