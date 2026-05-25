import dotenv from "dotenv";

dotenv.config();

const APP_URL = process.env.APP_URL || "http://localhost:4200";

export async function login(page: any) {
  await page.goto(`${APP_URL}/login`);
  await page.waitForLoadState("networkidle");
  await page.waitForSelector("#email", { timeout: 10000 });

  const email = process.env.LOGIN_EMAIL || "test@example.com";
  const password = process.env.LOGIN_PASSWORD || "password123";

  console.log(`Logging in as ${email}...`);
  await page.locator("#email").fill(email);
  await page.locator("#password").fill(password);
  await page.locator("button[type='submit']").click();

  await page.waitForTimeout(4000);

  const url = page.url();
  console.log("URL after login:", url);

  if (url.includes("/login")) {
    const bodyText = await page.locator("body").innerText().catch(() => "");
    console.error("Still on login page:", bodyText.substring(0, 500));
    throw new Error("Login failed");
  }
}

export async function getExtractedText(result: any): Promise<string> {
  if (typeof result === "string") return result;
  return result?.extraction || "";
}
