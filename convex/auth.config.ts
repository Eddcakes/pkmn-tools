type EnvMap = Record<string, string | undefined>;

const env = (globalThis as { process?: { env?: EnvMap } }).process?.env;
const siteUrl = env?.CONVEX_SITE_URL;

if (!siteUrl) {
  throw new Error("Missing CONVEX_SITE_URL for Convex Auth.");
}

export default {
  providers: [
    {
      domain: siteUrl,
      applicationID: "convex"
    }
  ]
};
