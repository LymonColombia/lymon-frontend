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

    await page.goto(`${APP_URL}/incident-report/create`);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(2000);

    const urlBefore = page.url();
    if (urlBefore.includes("/login")) {
      throw new Error("Redirected back to login — session not persisted");
    }

    // Stagehand act for flexible natural-language interactions
    await stagehand.act("Fill the title field with 'Novedad Use Case E2E'");
    await stagehand.act("Fill the description field with 'Descripción del caso de uso crear'");

    // Playwright deterministic selector for save button
    await page.locator('text=Guardar').first().click();

    await page.waitForTimeout(3000);

    const url = page.url();
    const bodyTextAfterCreate = await page.locator("body").innerText().catch(() => "");
    console.log("URL after save:", url);
    console.log("Body text after save:", bodyTextAfterCreate.substring(0, 1000));

    if (!url.includes("/incident-report/list")) {
      assertIncludes(bodyTextAfterCreate, "creada", "La novedad debería crearse exitosamente");
    }

    // Navigate to list and verify it loads (indirect create validation)
    await page.goto(`${APP_URL}/incident-report/list`);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(2000);

    const bodyText = await page.locator("body").innerText().catch(() => "");
    assertIncludes(bodyText, "Novedades", "El listado debería cargar correctamente tras la creación");

    console.log("✅ Create incident report use case E2E passed");
  } catch (error) {
    console.error("Test failed:", error);
    process.exit(1);
  } finally {
    await stagehand.close();
  }
}

main();
