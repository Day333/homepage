'use strict';

const areaIcons = {
    'time-series': '<path d="M3 17l4-5 4 3 5-9 5 4"/><path d="M3 4v16h18"/>',
    'ai4science': '<circle cx="12" cy="12" r="2"/><ellipse cx="12" cy="12" rx="10" ry="4"/><ellipse cx="12" cy="12" rx="10" ry="4" transform="rotate(60 12 12)"/><ellipse cx="12" cy="12" rx="10" ry="4" transform="rotate(120 12 12)"/>',
    'ai-safety': '<path d="M12 3l8 3v6c0 5-8 9-8 9s-8-4-8-9V6z"/><path d="M8 12l3 3 5-6"/>',
    'agent': '<rect x="4" y="7" width="16" height="13" rx="4"/><path d="M12 3v4M1 12h3m16 0h3M9 16h6"/><circle cx="8.5" cy="12" r=".7"/><circle cx="15.5" cy="12" r=".7"/>'
};

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
    return short + (work.year ? ' · ' + work.year : '');
}

function renderWork(work) {
    const card = element('article', 'research-work');
    card.dataset.workId = work.id;
    const metadata = element('div', 'research-work-meta');
    const venue = element('span', 'research-work-venue', venueLabel(work));
    if (/arxiv|preprint/i.test(work.venue || 'Preprint')) venue.classList.add('is-preprint');
    metadata.appendChild(venue);
    card.appendChild(metadata);

    card.appendChild(element('h3', 'research-work-title', work.title));
    if (work.authors) {
        const authors = element('p', 'research-work-authors');
        authors.innerHTML = work.authors;
        card.appendChild(authors);
    }

    const links = element('div', 'research-work-links');
    (work.tags || []).filter(tag => tag.link && tag.link !== '#').forEach(tag => {
        const link = element('a', 'research-work-link', tag.text);
        link.href = tag.link;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        link.appendChild(element('span', '', ' ↗'));
        links.appendChild(link);
    });
    if (links.childElementCount) card.appendChild(links);
    return card;
}

async function loadResearch() {
    const container = document.getElementById('research-content');
    const filters = document.getElementById('research-area-filters');
    const summary = document.getElementById('research-results-summary');
    try {
        const [publications, research] = await Promise.all(
            ['../data/publications.json', '../data/research.json'].map(async path => {
                const response = await fetch(path);
                if (!response.ok) throw new Error('Could not load ' + path);
                return response.json();
            })
        );
        const works = [...publications, ...research.additionalWorks];
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
            filter.innerHTML = '<svg class="research-area-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + areaIcons[area.id] + '</svg>';
            filter.appendChild(element('span', 'research-area-name', area.title));
            filter.appendChild(element('span', 'research-area-caption', area.eyebrow));
            filter.appendChild(element('span', 'research-area-count', items.length ? items.length + ' works' : 'Research direction'));
            filters.appendChild(filter);

            const section = element('section', 'research-area-section');
            section.id = area.id;
            section.dataset.area = area.id;
            section.setAttribute('aria-labelledby', area.id + '-title');
            const header = element('div', 'research-section-heading');
            header.appendChild(element('span', 'research-section-number', String(index + 1).padStart(2, '0')));
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
                const interests = element('div', 'research-interest-card');
                interests.appendChild(element('p', 'research-interest-label', 'RESEARCH INTERESTS'));
                const topics = element('div', 'research-interest-topics');
                (area.interests || []).forEach(interest => topics.appendChild(element('span', '', interest)));
                interests.appendChild(topics);
                section.appendChild(interests);
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
