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

    // CREATE
    await page.goto(`${APP_URL}/incident-report/create`);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(2000);

    let url = page.url();
    if (url.includes("/login")) {
      throw new Error("Redirected back to login — session not persisted");
    }

    await stagehand.act("Fill the title field with 'Incidente de prueba'");
    await stagehand.act("Fill the description field with 'Validación CRUD del repositorio'");
    await page.locator('text=Guardar').first().click();

    await page.waitForTimeout(3000);
    let bodyText = await page.locator("body").innerText().catch(() => "");
    console.log("Body text after create:", bodyText.substring(0, 1000));
    if (!page.url().includes("/incident-report/list")) {
      assertIncludes(bodyText, "creada", "El incidente debería crearse exitosamente");
    }

    // READ (list)
    await page.goto(`${APP_URL}/incident-report/list`);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(2000);

    bodyText = await page.locator("body").innerText().catch(() => "");
    console.log("Body text after list:", bodyText.substring(0, 1000));
    assertIncludes(bodyText, "Novedades", "El listado debería cargar correctamente");

    // EDIT
    await page.goto(`${APP_URL}/incident-report/edit/1`);
    await page.evaluate(() => {
      history.replaceState({ report: { id: '1', title: 'Daño general', description: 'Desc', propertyId: 'prop-1', createdAt: '2026-05-25T00:00:00Z' } }, '');
    });
    await page.reload();
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(2000);

    await stagehand.act("Fill the title field with 'Título actualizado'");
    await page.locator('text=Guardar').first().click();

    await page.waitForTimeout(3000);
    bodyText = await page.locator("body").innerText().catch(() => "");
    console.log("Body text after edit:", bodyText.substring(0, 1000));
    assertIncludes(bodyText, "actualizada", "El incidente debería actualizarse exitosamente");

    // Verify list loads after edit (indirect repository validation)
    await page.goto(`${APP_URL}/incident-report/list`);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(2000);

    bodyText = await page.locator("body").innerText().catch(() => "");
    assertIncludes(bodyText, "Novedades", "El listado debería seguir visible tras la edición");

    console.log("✅ Incident report repository E2E passed");
  } catch (error) {
    console.error("Test failed:", error);
    process.exit(1);
  } finally {
    await stagehand.close();
  }
}

main();
