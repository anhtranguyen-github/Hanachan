const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function testFrontendEndpoint() {
    console.log('Testing Next.js API endpoint for adding video...');

    // Test video ID: Po2KG7tJNJ8 
    const testVideoId = 'Po2KG7tJNJ8';

    // Initialize Supabase admin client to delete the video first so we force a fresh process
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('Clearing old cache for', testVideoId, '...');
    await supabase.from('videos').delete().eq('youtube_id', testVideoId);

    try {
        console.log('Sending request to Next.js API...');
        const response = await fetch('http://localhost:3000/api/videos', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ youtube_id: testVideoId }),
        });

        const data = await response.json();
        console.log('Status code:', response.status);
        console.log('Response body:', JSON.stringify(data, null, 2));
    } catch (error) {
        console.error('Error hitting endpoint:', error);
    }
}

testFrontendEndpoint();
