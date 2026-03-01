import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
    test: {
        globals: true,
        environment: 'node',
        setupFiles: ['./tests/setup.ts'],
        include: ['**/*.test.ts', '**/*.test.tsx'],
        exclude: ['node_modules', '.next'],
        testTimeout: 60000, // 60s for bulk tests
        hookTimeout: 120000, // 2min for setup/teardown
        // vitest 4: pool options are now top-level
        singleFork: true, // Sequential for DB operations
        // Better error reporting
        dangerouslyIgnoreUnhandledErrors: false,
        // Coverage configuration
        coverage: {
            provider: 'v8',
            reporter: ['text', 'lcov', 'html', 'json'],
            reportsDirectory: './coverage',
            include: ['src/**/*.ts', 'src/**/*.tsx'],
            exclude: [
                'src/**/*.d.ts',
                'src/app/**',          // Next.js pages — tested via e2e
                'src/lib/supabase.ts', // External client
                'src/middleware.ts',   // Edge runtime
                '**/*.config.ts',      // Config files
                '**/*.stories.tsx',    // Storybook stories
            ],
            thresholds: {
                lines: 70,
                functions: 70,
                branches: 60,
                statements: 70,
            },
        },
    },
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src'),
            '@tests': path.resolve(__dirname, './tests'),
        }
    }
});
