import { NextResponse } from 'next/server';

export const dynamic = "force-dynamic";


/**
 * GET /api/speech-token
 * Returns an Azure Cognitive Services Speech token for client-side use.
 * The token is fetched server-side to keep the subscription key secret.
 */
export async function GET() {
    const subscriptionKey = process.env.AZURE_SPEECH_KEY;
    const region = process.env.AZURE_SPEECH_REGION || 'eastus';

    if (!subscriptionKey) {
        return NextResponse.json(
            { error: 'Azure Speech key not configured' },
            { status: 503 }
        );
    }

    try {
        const tokenEndpoint = `https://${region}.api.cognitive.microsoft.com/sts/v1.0/issueToken`;

        const response = await fetch(tokenEndpoint, {
            method: 'POST',
            headers: {
                'Ocp-Apim-Subscription-Key': subscriptionKey,
                'Content-Length': '0',
            },
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Azure Speech token error:', response.status, errorText);
            return NextResponse.json(
                { error: 'Failed to fetch speech token', details: errorText },
                { status: response.status }
            );
        }

        const token = await response.text();

        return NextResponse.json(
            { token, region },
            {
                headers: {
                    // Cache for 9 minutes (tokens expire in 10 minutes)
                    'Cache-Control': 'private, max-age=540',
                },
            }
        );
    } catch (error) {
        console.error('Speech token fetch error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}