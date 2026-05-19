/**
 * Remix load context augmentation.
 *
 * bolt.diy historically ran on Cloudflare Pages where the platform proxy
 * exposed `context.cloudflare.env`. After migrating to Vercel/Node we keep
 * the same shape so the existing call sites that consult
 * `context.cloudflare?.env` continue to compile; the actual lookups now
 * fall back to `process.env` at runtime.
 */
declare module '@remix-run/node' {
  interface AppLoadContext {
    cloudflare?: {
      env: NodeJS.ProcessEnv;
    };
  }
}

export {};
