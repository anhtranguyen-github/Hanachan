import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
    test: {
        globals: true,
        environment: 'node',
        setupFiles: ['./tests/setup.ts'],
        include: ['tests/**/*.test.ts', 'src/features/**/*.test.ts'],
        exclude: ['node_modules', '.next'],
        testTimeout: 60000, // 60s for bulk tests
        hookTimeout: 120000, // 2min for setup/teardown
        pool: 'forks',
        poolOptions: {
            forks: {
                singleFork: true // Sequential for DB operations
            }
        }
    },
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src')
        }
    }
});
