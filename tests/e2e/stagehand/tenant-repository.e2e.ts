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

    // Navigate to settings and edit profile
    await page.goto(`${APP_URL}/settings`);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(2000);

    const url = page.url();
    if (url.includes("/login")) {
      throw new Error("Redirected back to login — session not persisted");
    }

    await stagehand.act("Fill the business name field with 'Empresa Stagehand Test'");
    await page.locator('text=Guardar cambios').first().click();

    await page.waitForTimeout(3000);

    let bodyText = await page.locator("body").innerText().catch(() => "");
    console.log("Body text after save:", bodyText.substring(0, 1000));
    assertIncludes(bodyText, "actualizado", "El perfil debería actualizarse correctamente");

    // Reload settings page to verify persistence
    await page.goto(`${APP_URL}/settings`);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(2000);

    const extracted = await stagehand.extract("Extract the current business name displayed on the settings page");
    const extractedText = getExtractedText(extracted);
    console.log("Persisted business name:", extractedText);
    assertIncludes(extractedText, "Empresa Stagehand Test", "El nombre debería persistir tras recargar");

    bodyText = await page.locator("body").innerText().catch(() => "");
    assertIncludes(bodyText, "Empresa Stagehand Test", "Los cambios del perfil deberían persistir tras recargar");

    console.log("✅ Tenant repository E2E passed");
  } catch (error) {
    console.error("Test failed:", error);
    process.exit(1);
  } finally {
    await stagehand.close();
  }
}

main();
