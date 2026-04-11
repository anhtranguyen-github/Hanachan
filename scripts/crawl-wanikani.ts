import fs from 'fs';

// WaniKani API Token provided by user
const API_TOKEN = 'c64f8759-d793-4198-9c0f-d83541831778'; 
const INITIAL_URL = 'https://api.wanikani.com/v2/subjects';

async function crawlWaniKaniSubjects() {
    let allSubjects: any[] = [];
    let nextUrl: string | null = INITIAL_URL;

    console.log('🚀 Bắt đầu cào dữ liệu từ WaniKani...');

    while (nextUrl) {
        console.log(`Đang lấy dữ liệu từ: ${nextUrl}`);
        
        try {
            const response = await fetch(nextUrl, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${API_TOKEN}`,
                    'Wanikani-Revision': '20170710' 
                }
            });

            if (!response.ok) {
                throw new Error(`Lỗi HTTP! Trạng thái: ${response.status} - ${response.statusText}`);
            }

            const json: any = await response.json();
            
            allSubjects = allSubjects.concat(json.data);
            nextUrl = json.pages.next_url;

            // Wait 500ms between requests to be safe with rate limits
            await new Promise(resolve => setTimeout(resolve, 500)); 

        } catch (error) {
            console.error('❌ Có lỗi xảy ra trong quá trình cào:', error);
            break;
        }
    }

    console.log(`✅ Đã cào xong! Tổng số subjects thu thập được: ${allSubjects.length}`);
    
    const fileName = 'wanikani_subjects.json';
    fs.writeFileSync(fileName, JSON.stringify(allSubjects, null, 2), 'utf-8');
    console.log(`💾 Đã lưu dữ liệu vào file: ${fileName}`);
}

crawlWaniKaniSubjects().catch(console.error);
