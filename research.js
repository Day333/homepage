'use strict';

const researchDataVersion = '20261015-academic';

function buildResearchCatalog(publications, research) {
    // Older copies of the selected time-series papers do not have category IDs.
    const selectedArea = research.selectedPublicationsArea || 'time-series';
    const works = [
        ...publications.map(work => ({
            ...work,
            id: work.id || work.title,
            researchArea: work.researchArea || selectedArea
        })),
        ...research.additionalWorks
    ];
    const knownAreas = new Set(research.areas.map(area => area.id));
    for (const work of works) {
        if (!knownAreas.has(work.researchArea)) {
            throw new Error('Unknown research area for ' + work.title);
        }
    }
    return works;
}

function element(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
}

function venueLabel(work) {
    const venue = work.venue || 'Preprint';
    let short = venue;
    if (venue.includes('NeurIPS')) short = 'NeurIPS';
    else if (venue.includes('ICASSP')) short = 'ICASSP';
    else if (venue.includes('AAAI')) short = 'AAAI';
    else if (venue.includes('ACM MM')) short = 'ACM MM';
    else if (venue.includes('Information Forensics')) short = 'IEEE TIFS';
    else if (venue.includes('ICIC')) short = 'ICIC';
    else if (venue.includes('CCIS')) short = 'IEEE CCIS';
    else if (/arxiv|preprint/i.test(venue)) short = 'Preprint';
    return short + (work.year ? ' ' + work.year : '');
}

function renderWork(work) {
    const card = element('article', 'research-work');
    card.dataset.workId = work.id;
    const metadata = element('div', 'research-work-meta');
    const venue = element('span', 'research-work-venue', venueLabel(work));
    if (/arxiv|preprint/i.test(work.venue || 'Preprint')) venue.classList.add('is-preprint');
    metadata.appendChild(venue);
    const title = element('h3', 'research-work-title');
    const paper = (work.tags || []).find(tag => tag.text === 'Paper' && tag.link && tag.link !== '#');
    if (paper) {
        const titleLink = element('a', '', work.title);
        titleLink.href = paper.link;
        titleLink.target = '_blank';
        titleLink.rel = 'noopener noreferrer';
        title.appendChild(titleLink);
    } else {
        title.textContent = work.title;
    }
    card.appendChild(title);
    if (work.authors) {
        const authors = element('p', 'research-work-authors');
        authors.innerHTML = work.authors;
        card.appendChild(authors);
    }

    const links = element('div', 'research-work-links');
    (work.tags || []).filter(tag => tag.link && tag.link !== '#').forEach(tag => {
        const link = element('a', 'research-work-link', tag.text.toLowerCase());
        link.href = tag.link;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        links.appendChild(link);
    });
    if (links.childElementCount) metadata.appendChild(links);
    card.appendChild(metadata);
    return card;
}

async function loadResearch() {
    const container = document.getElementById('research-content');
    const filters = document.getElementById('research-area-filters');
    const summary = document.getElementById('research-results-summary');
    try {
        const [publications, research] = await Promise.all(
            ['../data/publications.json', '../data/research.json'].map(async path => {
                const response = await fetch(path + '?v=' + researchDataVersion, { cache: 'no-cache' });
                if (!response.ok) throw new Error('Could not load ' + path);
                return response.json();
            })
        );
        const works = buildResearchCatalog(publications, research);
        const areaWorks = new Map();
        const fragment = document.createDocumentFragment();

        research.areas.forEach((area, index) => {
            const items = works.filter(work => work.researchArea === area.id)
                .sort((a, b) => Number(b.year || 0) - Number(a.year || 0));
            areaWorks.set(area.id, items);

            const filter = element('button', 'research-area-card');
            filter.type = 'button';
            filter.dataset.filter = area.id;
            filter.dataset.area = area.id;
            filter.setAttribute('aria-pressed', 'false');
            filter.setAttribute('aria-controls', 'research-content');
            filter.appendChild(element('span', 'research-area-name', area.title));
            if (items.length) filter.appendChild(element('span', 'research-area-count', '(' + items.length + ')'));
            filters.appendChild(filter);

            const section = element('section', 'research-area-section');
            section.id = area.id;
            section.dataset.area = area.id;
            section.setAttribute('aria-labelledby', area.id + '-title');
            const header = element('div', 'research-section-heading');
            const text = element('div');
            const heading = element('h2', 'research-section-title', area.title);
            heading.id = area.id + '-title';
            text.appendChild(heading);
            text.appendChild(element('p', 'research-section-description', area.description));
            header.appendChild(text);
            section.appendChild(header);

            if (items.length) {
                const grid = element('div', 'research-work-grid');
                items.forEach(work => grid.appendChild(renderWork(work)));
                section.appendChild(grid);
            } else {
                section.appendChild(element('p', 'research-empty', 'No publications yet.'));
            }
            fragment.appendChild(section);
        });
        container.replaceChildren(fragment);

        function applyFilter(selected, updateUrl = false) {
            const area = research.areas.find(item => item.id === selected);
            const active = area ? selected : 'all';
            document.querySelectorAll('[data-filter]').forEach(button => {
                button.setAttribute('aria-pressed', String(button.dataset.filter === active));
            });
            container.querySelectorAll('.research-area-section').forEach(section => {
                section.hidden = active !== 'all' && section.dataset.area !== active;
            });
            summary.textContent = active === 'all'
                ? works.length + ' works across ' + research.areas.length + ' areas'
                : areaWorks.get(active).length
                    ? areaWorks.get(active).length + ' works in ' + area.title
                    : area.title + ' · Research direction';
            if (updateUrl) history.replaceState(null, '', active === 'all' ? location.pathname + location.search : '#' + active);
        }

        document.querySelectorAll('[data-filter]').forEach(button => {
            button.addEventListener('click', () => applyFilter(button.dataset.filter, true));
        });
        window.addEventListener('hashchange', () => applyFilter(location.hash.slice(1)));
        applyFilter(location.hash.slice(1));
    } catch (error) {
        console.error('Error loading research:', error);
        summary.textContent = 'Research is temporarily unavailable.';
        const message = element('p', 'research-error', 'Please refresh the page or visit ');
        const scholar = element('a', '', 'Google Scholar');
        scholar.href = 'https://scholar.google.com/citations?user=OL19JdwAAAAJ&hl=en';
        message.appendChild(scholar);
        message.appendChild(document.createTextNode(' to explore my work.'));
        container.replaceChildren(message);
    } finally {
        container.setAttribute('aria-busy', 'false');
    }
}

loadResearch();
