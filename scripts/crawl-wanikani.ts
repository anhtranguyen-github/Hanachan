import fs from 'fs';

// WaniKani API Token provided by user
// WaniKani API Token - Use environment variable for security
const API_TOKEN = process.env.WANIKANI_API_TOKEN; 
if (!API_TOKEN) {
    console.error('❌ Missing WANIKANI_API_TOKEN environment variable');
    process.exit(1);
}
const REVISION = '20170710';

async function fetchCollection(url: string) {
    let allData: any[] = [];
    let nextUrl: string | null = url;

    while (nextUrl) {
        console.log(`Đang lấy dữ liệu từ: ${nextUrl}`);
        try {
            const response = await fetch(nextUrl, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${API_TOKEN}`,
                    'Wanikani-Revision': REVISION 
                }
            });

            if (!response.ok) {
                throw new Error(`Lỗi HTTP! Trạng thái: ${response.status} - ${response.statusText}`);
            }

            const json: any = await response.json();
            allData = allData.concat(json.data);
            nextUrl = json.pages.next_url;

            await new Promise(resolve => setTimeout(resolve, 500)); 
        } catch (error) {
            console.error('❌ Lỗi khi fetch:', error);
            break;
        }
    }
    return allData;
}

async function crawlWaniKani() {
    console.log('🚀 Bắt đầu cào dữ liệu toàn diện từ WaniKani...');

    // 1. Fetch all subjects
    console.log('--- Đang lấy Subjects (có thể mất vài phút) ---');
    const subjects = await fetchCollection('https://api.wanikani.com/v2/subjects');
    console.log(`✅ Đã lấy ${subjects.length} subjects.`);

    // 2. Fetch all assignments
    console.log('--- Đang lấy Assignments ---');
    const assignments = await fetchCollection('https://api.wanikani.com/v2/assignments');
    console.log(`✅ Đã lấy ${assignments.length} assignments.`);

    // Create a map of assignments for easier merging
    const assignmentMap = new Map();
    assignments.forEach((a: any) => {
        assignmentMap.set(a.data.subject_id, a.data);
    });

    // 3. Merge data
    const mergedData = subjects.map((s: any) => {
        const assignment = assignmentMap.get(s.id);
        return {
            ...s,
            assignment: assignment || null
        };
    });

    const fileName = 'docs/wanikani/wanikani_subjects.json';
    fs.writeFileSync(fileName, JSON.stringify(mergedData, null, 2), 'utf-8');
    console.log(`💾 Đã lưu ${mergedData.length} bản ghi vào ${fileName}`);
}

crawlWaniKani().catch(console.error);
