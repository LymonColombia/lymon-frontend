import { Stagehand } from "@browserbasehq/stagehand";
import dotenv from "dotenv";
import { createStagehand } from "./helpers/stagehand-factory.js";
import { assertIncludes } from "./helpers/assert.js";

dotenv.config();

const APP_URL = process.env.APP_URL || "http://localhost:4200";

async function login(stagehand: Stagehand) {
  const page = stagehand.context.pages()[0];

  await page.goto(`${APP_URL}/login`);
  await page.waitForLoadState("networkidle");
  await page.waitForSelector("#email", { timeout: 10000 });

  const email = process.env.LOGIN_EMAIL || "test@example.com";
  const password = process.env.LOGIN_PASSWORD || "password123";

  console.log(`Logging in as ${email}...`);
  await page.locator("#email").fill(email);
  await page.locator("#password").fill(password);
  await page.locator("button[type='submit']").click();

  // Wait for redirect away from login
  await page.waitForTimeout(4000);

  const url = page.url();
  console.log("URL after login:", url);

  if (url.includes("/login")) {
    const bodyText = await page.locator("body").innerText().catch(() => "");
    console.error("Still on login page:", bodyText.substring(0, 500));
    throw new Error("Login failed — still on /login after submit");
  }
}

async function main() {
  const stagehand = createStagehand();
  try {
    await stagehand.init();
    await login(stagehand);

    const page = stagehand.context.pages()[0];

    await page.goto(`${APP_URL}/settings`);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(2000);

    const url = page.url();
    console.log("URL after navigating to settings:", url);

    if (url.includes("/login")) {
      throw new Error("Redirected back to login — session not persisted");
    }

    // ─── Stagehand IA: act + Playwright deterministic assertions ───
    await stagehand.act("Fill the business name field with 'Empresa Stagehand Test'");
    await page.locator('text=Guardar cambios').first().click();

    await page.waitForTimeout(3000);

    const bodyText = await page.locator("body").innerText().catch(() => "");
    console.log("Body text after save:", bodyText.substring(0, 1000));

    // Validación determinística con Playwright
    assertIncludes(bodyText, "Empresa Stagehand Test", "Stagehand debería haber llenado el nombre");
    assertIncludes(bodyText, "actualizado", "El perfil debería mostrar mensaje de éxito");

    // Extracción con IA para demostrar Stagehand extract
    const extracted = await stagehand.extract("Extract the current business name shown on the page") as any;
    const extractedText = typeof extracted === "string" ? extracted : extracted?.extraction || "";
    console.log("IA extracted:", extractedText);
    assertIncludes(extractedText, "Empresa Stagehand Test", "La IA debería extraer el nombre actualizado");

    console.log("✅ Tenant profile E2E passed");
  } catch (error) {
    console.error("Test failed:", error);
    process.exit(1);
  } finally {
    await stagehand.close();
  }
}

main();
