
import { YoutubeTranscript } from 'youtube-transcript';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env' });

const id = '-cbuS40rNSw';

async function run() {
    console.log(`Testing ${id}...`);
    try {
        // We have to reach into the internal logic or just use fetch
        const identifier = id;
        const USER_AGENT = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_4) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/85.0.4183.83 Safari/537.36,gzip(gfe)';
        const videoPageResponse = await fetch(`https://www.youtube.com/watch?v=${identifier}`, {
            headers: { 'User-Agent': USER_AGENT },
        });
        const videoPageBody = await videoPageResponse.text();
        const splittedHTML = videoPageBody.split('"captions":');

        if (splittedHTML.length <= 1) {
            console.log('No captions found in HTML');
            return;
        }

        const captions = JSON.parse(splittedHTML[1].split(',"videoDetails')[0].replace('\n', ''))?.playerCaptionsTracklistRenderer;
        if (!captions || !captions.captionTracks) {
            console.log('No caption tracks found');
            return;
        }

        console.log('Available tracks:', captions.captionTracks.map(t => `${t.languageCode} (${t.kind || 'manual'})`));

        const track = captions.captionTracks.find(t => t.languageCode === 'ja') || captions.captionTracks[0];
        console.log(`Using track: ${track.languageCode}`);

        const transcriptResponse = await fetch(track.baseUrl, {
            headers: { 'User-Agent': USER_AGENT },
        });
        const transcriptBody = await transcriptResponse.text();

        console.log('Transcript Body Preview:', transcriptBody.substring(0, 500));

        const RE_XML_TRANSCRIPT = /<text start="([^"]*)" dur="([^"]*)">([^<]*)<\/text>/g;
        const results = [...transcriptBody.matchAll(RE_XML_TRANSCRIPT)];
        console.log(`Regex matches: ${results.length}`);

        if (results.length === 0 && transcriptBody.includes('<?xml')) {
            console.log('XML format detected but no matches. Checking for different tags...');
            const otherMatch = [...transcriptBody.matchAll(/<p t="(\d+)" d="(\d+)">([^<]*)<\/p>/g)];
            console.log(`Alternative regex (p tags) matches: ${otherMatch.length}`);
        }

    } catch (e) {
        console.log(`Error:`, e);
    }
}

run();
