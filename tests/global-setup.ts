import { verifyEnv } from "./setup/verify-env.mjs";

async function globalSetup() {
  await verifyEnv();
}

export default globalSetup;
