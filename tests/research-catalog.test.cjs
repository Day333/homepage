const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');
const publications = JSON.parse(fs.readFileSync(path.join(root, 'data/publications.json'), 'utf8'));
const research = JSON.parse(fs.readFileSync(path.join(root, 'data/research.json'), 'utf8'));
const context = vm.createContext({});
const source = fs.readFileSync(path.join(root, 'research.js'), 'utf8');
vm.runInContext(source.replace(/\nloadResearch\(\);\s*$/, '\n'), context);
const buildCatalog = vm.runInContext('buildResearchCatalog', context);

const expectedTimeSeriesTitles = [
    ...publications.map(work => work.title),
    ...research.additionalWorks.filter(work => work.researchArea === 'time-series').map(work => work.title)
].sort();

test('both current and cached legacy data retain all eight time-series papers', () => {
    const legacyPublications = publications.map(({ id, researchArea, ...work }) => work);
    for (const input of [publications, legacyPublications]) {
        const catalog = buildCatalog(input, research);
        const timeSeriesTitles = Array.from(catalog.filter(work => work.researchArea === 'time-series'), work => work.title).sort();
        assert.equal(catalog.length, 14);
        assert.equal(timeSeriesTitles.length, 8);
        assert.deepEqual(timeSeriesTitles, expectedTimeSeriesTitles);
        assert.equal(new Set(catalog.map(work => work.id)).size, 14);
    }
});

test('an unknown category reports an error instead of silently hiding a paper', () => {
    const uncategorized = publications.map((work, index) => index ? work : { ...work, researchArea: 'unknown' });
    assert.throws(() => buildCatalog(uncategorized, research), /Unknown research area for MSAR/);
});
