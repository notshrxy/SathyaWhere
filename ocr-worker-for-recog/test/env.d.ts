/**
 * ocr-worker-for-recog/test/env.d.ts
 * Type definitions for the testing environment, providing access to
 * Cloudflare Workers vitest pool types.
 */

declare module "cloudflare:test" {
	interface ProvidedEnv extends Env {}
}
