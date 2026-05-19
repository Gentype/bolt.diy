/**
 * Global `Env` type used throughout the provider/llm subsystem.
 *
 * Originally a Cloudflare Workers binding interface. After migrating from
 * Cloudflare Pages to Vercel/Node, environment variables come from
 * `process.env`, so `Env` is now an alias of `NodeJS.ProcessEnv`. Property
 * access on `Env` still works for the known keys below, but they are
 * `string | undefined` like any process env value.
 */
declare type Env = NodeJS.ProcessEnv;
