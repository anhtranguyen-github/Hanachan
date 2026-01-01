
import fs from 'fs';
import path from 'path';

const DATA_DIR = 'D:/PROJECT/hanachan_v2_final/processed_data';
const files = [
    { name: 'processed_radicals.json', type: 'radical' },
    { name: 'processed_kanji.json', type: 'kanji' },
    { name: 'processed_vocab.json', type: 'vocabulary' },
    { name: 'processed_grammar.json', type: 'grammar' }
];

console.log('📊 --- Processed Data Analysis ---');

files.forEach(file => {
    const filePath = path.join(DATA_DIR, file.name);
    if (!fs.existsSync(filePath)) {
        console.log(`❌ File not found: ${file.name}`);
        return;
    }

    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    const total = data.length;
    const levelMap = {};
    let missingLevel = 0;

    data.forEach(item => {
        const lvl = item.level;
        if (lvl) {
            levelMap[lvl] = (levelMap[lvl] || 0) + 1;
        } else {
            missingLevel++;
        }
    });

    const levels = Object.keys(levelMap).map(Number).sort((a, b) => a - b);
    const minLevel = levels.length > 0 ? Math.min(...levels) : 0;
    const maxLevel = levels.length > 0 ? Math.max(...levels) : 0;
    const levelCount = levels.length;

    console.log(`\n📄 File: ${file.name}`);
    console.log(` - Total Records: ${total}`);
    console.log(` - Distinct Levels: ${levelCount} (Range: ${minLevel} - ${maxLevel})`);
    if (missingLevel > 0) console.log(` - Records missing level: ${missingLevel}`);

    // Check if 60 levels are covered
    if (levelCount < 60) {
        const missing = [];
        for (let i = 1; i <= 60; i++) {
            if (!levelMap[i]) missing.push(i);
        }
        if (missing.length < 10) {
            console.log(` - Missing levels: ${missing.join(', ')}`);
        } else {
            console.log(` - Missing levels count: ${missing.length}`);
        }
    } else {
        console.log(` ✅ Covers all 60 levels!`);
    }

    // specific check for radicals
    if (file.type === 'radical') {
        console.log(` - Radicals count: ${total} (Expected ~480)`);
    }
});

console.log('\n----------------------------------');
