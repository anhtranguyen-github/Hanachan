
import * as fs from 'fs';
import * as path from 'path';

const filePath = path.join(process.cwd(), 'data/grammar.json');
const content = JSON.parse(fs.readFileSync(filePath, 'utf8'));
const grammarPoints = content.data;

const levels: Record<string, string[]> = {
    N5: [],
    N4: [],
    N3: [],
    N2: [],
    N1: []
};

grammarPoints.forEach((g: any) => {
    const level = g.level;
    let jlpt = '';
    if (level >= 1 && level <= 12) jlpt = 'N5';
    else if (level >= 13 && level <= 24) jlpt = 'N4';
    else if (level >= 25 && level <= 36) jlpt = 'N3';
    else if (level >= 37 && level <= 48) jlpt = 'N2';
    else if (level >= 49 && level <= 60) jlpt = 'N1';

    if (jlpt && !levels[jlpt].includes(g.slug)) {
        levels[jlpt].push(g.slug);
    }
});

Object.keys(levels).forEach(jlpt => {
    console.log(`${jlpt}: ${levels[jlpt].length} points`);
});

fs.writeFileSync('grammar_slugs_by_jlpt.json', JSON.stringify(levels, null, 2));
