const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
if (!fs.existsSync(path.join(root, "credentials.json"))) {
  console.error("credentials.json not found. Download the release keystore once with:\n  npx eas-cli credentials -p android\nand choose \"credentials.json: Download credentials from EAS\".");
  process.exit(1);
}

const amazon = process.argv[2] === "amazon";
const task = amazon ? "assembleRelease" : "bundleRelease";
const gradlew = path.join(root, "android", process.platform === "win32" ? "gradlew.bat" : "gradlew");

execSync(`"${gradlew}" ${task}`, {
  stdio: "inherit",
  cwd: path.join(root, "android"),
  env: { ...process.env, SENTRY_DISABLE_AUTO_UPLOAD: "true" }
});

const out = amazon ? "android/app/build/outputs/apk/release/app-release.apk" : "android/app/build/outputs/bundle/release/app-release.aab";
console.log(`\nDone: ${out}`);
