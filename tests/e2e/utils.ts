
import fs from 'fs';
import path from 'path';

type FailureArtifacts = {
    screenshotPath: string;
    domPath: string;
    tracePath?: string;
};

export function getAuthUserFromStorageState() {
    const authFile = path.join(__dirname, '../../playwright/.auth/user.json');
    const raw = fs.readFileSync(authFile, 'utf-8');
    const state = JSON.parse(raw);
    const origin = state.origins?.find((entry: any) => entry.origin === 'http://localhost:3000');
    const tokenEntry = origin?.localStorage?.find((entry: any) => entry.name.endsWith('-auth-token'));
    if (!tokenEntry?.value) {
        throw new Error('Unable to locate auth token in storage state.');
    }
    const session = JSON.parse(tokenEntry.value);
    if (!session?.user?.id) {
        throw new Error('No authenticated user found in storage state.');
    }
    return session.user as { id: string; email?: string };
}

const UC_ID_REGEX = /UC-\d{2}\.\d+/i;

function extractUseCaseId(title: string) {
    const match = title.match(UC_ID_REGEX);
    return match ? match[0].toUpperCase() : 'UC-UNKNOWN';
}

function toSlug(value: string) {
    return value
        .replace(/UC-\d{2}\.\d+/gi, '')
        .trim()
        .replace(/[^a-zA-Z0-9-_]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .toLowerCase() || 'unnamed';
}

async function saveFailureArtifacts(page: any, artifactsDir: string): Promise<FailureArtifacts> {
    if (!fs.existsSync(artifactsDir)) {
        fs.mkdirSync(artifactsDir, { recursive: true });
    }

    const screenshotPath = path.join(artifactsDir, 'screenshot.png');
    await page.screenshot({ path: screenshotPath, fullPage: true });

    const domPath = path.join(artifactsDir, 'dom.html');
    const html = await page.content();
    fs.writeFileSync(domPath, html);

    return { screenshotPath, domPath };
}

function writeFailureReport(params: {
    useCaseId: string;
    testTitle: string;
    errorMessage: string;
    artifacts: FailureArtifacts;
}) {
    const { useCaseId, testTitle, errorMessage, artifacts } = params;
    const reportDir = path.join(process.cwd(), 'e2e-error');
    if (!fs.existsSync(reportDir)) {
        fs.mkdirSync(reportDir, { recursive: true });
    }

    const reportPath = path.join(reportDir, 'failures.md');
    const report = [
        `## ${useCaseId} — ${testTitle}`,
        `- **Failure Reason:** ${errorMessage}`,
        `- **Screenshot:** ${artifacts.screenshotPath}`,
        `- **DOM Snapshot:** ${artifacts.domPath}`,
        artifacts.tracePath ? `- **Trace:** ${artifacts.tracePath}` : null,
        ``
    ].filter(Boolean).join('\n');

    if (!fs.existsSync(reportPath)) {
        fs.writeFileSync(reportPath, '# E2E Failure Report\n\n');
    }

    fs.appendFileSync(reportPath, report);
}

export async function logE2EFailure(page: any, testInfo: any) {
    if (testInfo.status === testInfo.expectedStatus) {
        return;
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const useCaseId = extractUseCaseId(testInfo.title);
    const slug = toSlug(testInfo.title);
    const artifactsDir = path.join(process.cwd(), 'e2e-error', 'artifacts', `${timestamp}-${slug}`);
    const artifacts = await saveFailureArtifacts(page, artifactsDir);
    const errorMessage = testInfo.error?.stack || testInfo.error?.message || 'Unknown failure';

    writeFailureReport({
        useCaseId,
        testTitle: testInfo.title,
        errorMessage,
        artifacts
    });
}
