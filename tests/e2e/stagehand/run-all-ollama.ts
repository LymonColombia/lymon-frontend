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

async function main() {
  for (const test of tests) {
    console.log(`\n========== Running ${test} (Ollama) ==========`);
    try {
      execSync(`npx tsx ${test}`, { stdio: "inherit", env: { ...process.env, PROVIDER: "ollama" } });
      console.log(`✅ ${test} passed`);
    } catch (error) {
      console.error(`❌ ${test} failed`);
      process.exit(1);
    }
  }
  console.log("\n🎉 All Ollama tests passed");
}

main();
