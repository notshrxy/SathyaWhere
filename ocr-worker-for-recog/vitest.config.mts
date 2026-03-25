/**
 * ocr-worker-for-recog/vitest.config.mts
 * Vitest configuration for the OCR Worker, setting up the testing environment 
 * using Cloudflare Workers' specific testing rules.
 */

import { defineWorkersConfig } from '@cloudflare/vitest-pool-workers/config';

export default defineWorkersConfig({
	test: {
		poolOptions: {
			workers: {
				wrangler: { configPath: './wrangler.jsonc' },
			},
		},
	},
});
