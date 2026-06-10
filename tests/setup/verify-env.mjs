/* global process, fetch, URL */
const ALLOWED_HOSTS = ["localhost", "127.0.0.1"];
const API_HEALTH = "http://localhost:8084/health";

export async function verifyEnv() {
  const baseURL = process.env.BASE_URL || "http://localhost:8081";
  const host = new URL(baseURL).hostname;
  if (!ALLOWED_HOSTS.includes(host)) {
    throw new Error(`Refusing to run Playwright against non-local BASE_URL "${baseURL}". Allowed hosts: ${ALLOWED_HOSTS.join(", ")}.`);
  }

  let health;
  try {
    const res = await fetch(API_HEALTH);
    health = await res.json();
  } catch (err) {
    throw new Error(`Could not reach the local Api at ${API_HEALTH} — start it with "npm --prefix ../Api run dev". (${err})`);
  }

  if (!["demo", "dev"].includes(health.environment)) {
    throw new Error(`Local Api reports environment "${health.environment}" — tests only run against demo|dev.`);
  }
}
