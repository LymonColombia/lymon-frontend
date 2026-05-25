import { execSync } from "child_process";

const tests = [
  "tests/e2e/stagehand/tenant-profile.e2e.ts",
  "tests/e2e/stagehand/incident-report-list.e2e.ts",
  "tests/e2e/stagehand/incident-report-create.e2e.ts",
  "tests/e2e/stagehand/incident-report-edit.e2e.ts",
  "tests/e2e/stagehand/update-incident-report.use-case.e2e.ts",
  "tests/e2e/stagehand/create-incident-report.use-case.e2e.ts",
  "tests/e2e/stagehand/get-incident-reports.use-case.e2e.ts",
  "tests/e2e/stagehand/get-tenant-profile.use-case.e2e.ts",
  "tests/e2e/stagehand/update-tenant-profile.use-case.e2e.ts",
  "tests/e2e/stagehand/tenant-repository.e2e.ts",
  "tests/e2e/stagehand/incident-report-repository.e2e.ts",
];

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
  for (let i = 0; i < tests.length; i++) {
    const test = tests[i];
    console.log(`\n========== Running ${test} (Gemini) [${i + 1}/${tests.length}] ==========`);
    try {
      execSync(`npx tsx ${test}`, { stdio: "inherit", env: { ...process.env, PROVIDER: "gemini" } });
      console.log(`✅ ${test} passed`);
    } catch (error) {
      console.error(`❌ ${test} failed`);
      process.exit(1);
    }

    // Wait 15s between tests to respect Gemini free tier rate limits (5 req/min)
    if (i < tests.length - 1) {
      console.log("⏳ Waiting 15s for rate limit...");
      await sleep(15000);
    }
  }
  console.log("\n🎉 All Gemini tests passed");
}

main();
