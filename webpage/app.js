/* BoneHub Public Datasets — dataset browser
 *
 * Reads `datasetsData` from data.js (generated from data/bonehub_public_datasets.json by
 * scripts/update_webpage.py, already ranked most complete first) and renders:
 *   - a filter sidebar (facets with live counts),
 *   - results as cards or as a compact table,
 *   - a detail drawer showing every field of one dataset.
 * The filter state is mirrored in the URL hash, so a filtered view or a single dataset
 * can be shared as a link.
 */
(function () {
    'use strict';

    // ---------------------------------------------------------------------------------
    // Configuration
    // ---------------------------------------------------------------------------------

    // Field names, as used in data/bonehub_public_datasets.json (and as headers of the CSV export).
    // Values are strings, numbers, null, or (for fields with multiple values) arrays of strings.
    const COL = {
        id: 'BoneHub ID',
        name: 'Dataset Name',
        access: 'Access Link',
        paper: 'Related Paper',
        country: 'Country',
        year: 'Year',
        size: 'Size',
        remarks: 'Remarks',
        images: 'Medical Images Included',
        modality: 'Imaging Modality',
        source: 'Image Source',
        sourceDetails: 'Image Source Details',
        primary: 'Primary Imaged Regions',
        secondary: 'Secondary Imaged Regions',
        bones: 'Available 3D Bone Shapes',
        structures: 'Additional Structures',
        landmarks: 'Landmarks',
        seg: 'Voxel Segmentation Mask',
        mesh: 'Mesh Model',
        cad: 'CAD Model',
        subjects: 'Number of Subjects',
        subjectInfo: 'Available Information per Subject',
        vital: 'Subjects Vital Status',
        condition: 'Subjects Clinical Condition',
        accessPolicy: 'Access Policy',
        redistribution: 'Data Redistribution Policy',
        research: 'Research Use Policy',
        commercial: 'Commercial Use Policy',
        license: 'License'
    };

    const PAGE_SIZE = 25;
    const GUIDE_URL = 'https://github.com/BoneHub/Public-Datasets/blob/main/data/README.md';
    const ISSUES_URL = 'https://github.com/BoneHub/Public-Datasets/issues/new';

    // Anatomical display order for the region and bone facets. Values found in the data
    // but not listed here are shown under "Other".
    const REGION_GROUPS = [
        ['General', ['Whole Body']],
        ['Head', ['Neurocranium', 'Viscerocranium']],
        ['Spine & trunk', ['Cervical Spine', 'Thoracic Spine', 'Lumbar Spine', 'Thoracic Cage', 'Abdomen', 'Pelvis']],
        ['Upper limb', ['Shoulder', 'Upper Arm', 'Elbow', 'Forearm', 'Wrist', 'Hand']],
        ['Lower limb', ['Hip', 'Upper Leg', 'Knee', 'Lower Leg', 'Ankle', 'Foot']]
    ];
    const BONE_GROUPS = [
        ['Skull', ['Cranial Bones', 'Facial Bones']],
        ['Spine', ['Cervical Vertebrae', 'Thoracic Vertebrae', 'Lumbar Vertebrae', 'Sacrum', 'Coccyx']],
        ['Thorax', ['Ribs', 'Sternum']],
        ['Upper limb', ['Clavicle', 'Scapula', 'Proximal Humerus', 'Humerus', 'Radius', 'Ulna', 'Carpals',
            'Metacarpals', 'Phalanges Hand']],
        ['Pelvis & lower limb', ['Hip Bones', 'Proximal Femur', 'Femur', 'Distal Femur', 'Patella',
            'Proximal Tibia', 'Tibia', 'Distal Tibia', 'Proximal Fibula', 'Fibula', 'Distal Fibula', 'Tarsals',
            'Metatarsals', 'Phalanges Foot']]
    ];

    // Nicer display names for a few raw values (keys are normalised: lower-case, single spaces).
    const LABEL_ALIASES = {
        'xray': 'X-ray',
        'x-ray': 'X-ray',
        'ultrasound': 'Ultrasound'
    };

    const FACETS = [
        {
            id: 'data', title: 'Data included', kind: 'flags', match: 'all', open: true,
            note: 'Shows datasets that include every ticked item.',
            options: [
                { key: 'images', label: 'Medical images', test: rec => norm(rec.row[COL.images]) === 'yes' },
                { key: 'segmentation', label: 'Segmentation masks', test: rec => hasValue(rec.row[COL.seg]) },
                { key: 'mesh', label: 'Mesh models', test: rec => hasValue(rec.row[COL.mesh]) },
                { key: 'cad', label: 'CAD models', test: rec => hasValue(rec.row[COL.cad]) },
                { key: 'landmarks', label: 'Landmarks', test: rec => hasValue(rec.row[COL.landmarks]) },
                { key: 'soft-tissue', label: 'Soft-tissue structures', test: rec => hasValue(rec.row[COL.structures]) },
                { key: 'metadata', label: 'Subject metadata', test: rec => hasValue(rec.row[COL.subjectInfo]) }
            ]
        },
        { id: 'modality', title: 'Imaging modality', kind: 'terms', column: COL.modality, open: true, style: 'chips' },
        {
            id: 'region', title: 'Imaged body region', kind: 'terms', column: COL.primary,
            secondaryColumn: COL.secondary, matchToggle: true, open: true, style: 'chips', groups: REGION_GROUPS
        },
        {
            id: 'bones', title: '3D bone shapes', kind: 'terms', column: COL.bones, matchToggle: true, open: true,
            style: 'chips', groups: BONE_GROUPS
        },
        { id: 'numbers', title: 'Subjects, year & size', kind: 'ranges', open: true },
        {
            id: 'usage', title: 'Access & usage rights', kind: 'flags', match: 'all', open: true,
            note: 'Shows datasets that satisfy every ticked item.',
            options: [
                { key: 'open-access', label: 'Open access', test: rec => rec.tokens[COL.accessPolicy].has('open access') },
                { key: 'research', label: 'Research use allowed', test: rec => rec.tokens[COL.research].has('allowed') },
                { key: 'commercial', label: 'Commercial use allowed', test: rec => rec.tokens[COL.commercial].has('allowed') },
                { key: 'redistribution', label: 'Redistribution allowed', test: rec => rec.tokens[COL.redistribution].has('allowed') }
            ]
        },
        { id: 'condition', title: 'Clinical condition', kind: 'terms', column: COL.condition, limit: 8 },
        { id: 'vital', title: 'Vital status', kind: 'terms', column: COL.vital },
        {
            id: 'info', title: 'Subject metadata fields', kind: 'terms', column: COL.subjectInfo, match: 'all',
            limit: 8, note: 'Shows datasets that provide every ticked field.'
        },
        { id: 'source', title: 'Image source', kind: 'terms', column: COL.source },
        { id: 'license', title: 'License', kind: 'terms', column: COL.license, limit: 8 },
        { id: 'country', title: 'Country', kind: 'terms', column: COL.country, limit: 8 }
    ];
    const OPTION_FACETS = FACETS.filter(f => f.kind !== 'ranges');
    const RANGE_FACET = FACETS.find(f => f.kind === 'ranges');

    const RANGES = [
        { key: 'subjects', label: 'Subjects', field: 'subjects', step: '1' },
        { key: 'year', label: 'Year', field: 'year', step: '1' },
        { key: 'size', label: 'Size (GB)', field: 'size', step: 'any' }
    ];

    const SORTS = {
        'default': { label: 'Most complete first' },
        'year-desc': { label: 'Newest first', field: 'year', dir: -1 },
        'year-asc': { label: 'Oldest first', field: 'year', dir: 1 },
        'subjects-desc': { label: 'Most subjects', field: 'subjects', dir: -1 },
        'subjects-asc': { label: 'Fewest subjects', field: 'subjects', dir: 1 },
        'size-asc': { label: 'Smallest download', field: 'size', dir: 1 },
        'size-desc': { label: 'Largest download', field: 'size', dir: -1 },
        'name-asc': { label: 'Name (A–Z)', field: 'name', dir: 1 },
        'name-desc': { label: 'Name (Z–A)', field: 'name', dir: -1 }
    };

    // Detail drawer layout: [column, how to render it].
    const DETAIL_SECTIONS = [
        { title: 'Overview', fields: [[COL.remarks, 'bullets'], [COL.country, 'list'], [COL.year, 'text'], [COL.size, 'size']] },
        {
            title: 'Medical images', fields: [[COL.images, 'text'], [COL.modality, 'chips'], [COL.source, 'chips'],
            [COL.sourceDetails, 'bullets'], [COL.primary, 'chips'], [COL.secondary, 'chips']]
        },
        {
            title: '3D shapes & annotations', fields: [[COL.bones, 'chips'], [COL.seg, 'status'], [COL.mesh, 'status'],
            [COL.cad, 'status'], [COL.structures, 'chips'], [COL.landmarks, 'bullets']]
        },
        {
            title: 'Subjects', fields: [[COL.subjects, 'int'], [COL.subjectInfo, 'chips'], [COL.vital, 'chips'],
            [COL.condition, 'chips']]
        },
        {
            title: 'Usage & license', fields: [[COL.accessPolicy, 'policy'], [COL.research, 'policy'],
            [COL.commercial, 'policy'], [COL.redistribution, 'policy'], [COL.license, 'chips']]
        }
    ];

    const FIELD_LABELS = {
        [COL.remarks]: 'Remarks',
        [COL.country]: 'Country',
        [COL.year]: 'Year',
        [COL.size]: 'Size',
        [COL.images]: 'Images included',
        [COL.modality]: 'Imaging modality',
        [COL.source]: 'Image source',
        [COL.sourceDetails]: 'Source datasets',
        [COL.primary]: 'Primary regions',
        [COL.secondary]: 'Secondary regions',
        [COL.bones]: '3D bone shapes',
        [COL.seg]: 'Segmentation masks',
        [COL.mesh]: 'Mesh models',
        [COL.cad]: 'CAD models',
        [COL.structures]: 'Other structures',
        [COL.landmarks]: 'Landmarks',
        [COL.subjects]: 'Number of subjects',
        [COL.subjectInfo]: 'Metadata per subject',
        [COL.vital]: 'Vital status',
        [COL.condition]: 'Clinical condition',
        [COL.accessPolicy]: 'Access',
        [COL.research]: 'Research use',
        [COL.commercial]: 'Commercial use',
        [COL.redistribution]: 'Redistribution of derivatives',
        [COL.license]: 'License'
    };

    // Short field explanations (from data/README.md), shown as tooltips in the drawer.
    const FIELD_INFO = {
        [COL.size]: 'Approximate size of the dataset.',
        [COL.source]: 'Original: images created for this dataset. Adopted: images taken from other datasets.',
        [COL.sourceDetails]: 'Datasets the adopted images were taken from.',
        [COL.primary]: 'Main areas of focus, fully captured in every image.',
        [COL.secondary]: 'Regions partially or fully captured in some images, alongside the primary regions.',
        [COL.seg]: 'Voxel segmentation masks. Supervised = created or verified by experts; Automatic = generated by algorithms.',
        [COL.mesh]: 'Surface meshes (e.g. STL, OBJ, PLY).',
        [COL.cad]: 'CAD models (e.g. STEP, IGES).',
        [COL.structures]: 'Non-bone structures related to bones, e.g. intervertebral discs, cartilage, muscles, ligaments.',
        [COL.subjects]: 'Total number of subjects. This may differ from the number of images or 3D shapes.',
        [COL.subjectInfo]: 'Information available per subject, in DICOM tags or separate files.',
        [COL.accessPolicy]: 'Open Access = free to access; Restricted = requires approval from the dataset owner.',
        [COL.redistribution]: 'Whether derivatives of this dataset may be redistributed.'
    };

    // Readable names for link targets.
    const DOI_PROVIDERS = {
        '10.5281': 'Zenodo',
        '10.7937': 'TCIA',
        '10.6084': 'Figshare',
        '10.57967': 'Hugging Face',
        '10.17632': 'Mendeley Data',
        '10.7303': 'Synapse',
        '10.5061': 'Dryad',
        '10.13026': 'PhysioNet',
        '10.17605': 'OSF',
        '10.57760': 'Science Data Bank'
    };
    const HOST_PROVIDERS = [
        ['zenodo.org', 'Zenodo'], ['github.com', 'GitHub'], ['drive.google.com', 'Google Drive'],
        ['kaggle.com', 'Kaggle'], ['huggingface.co', 'Hugging Face'], ['simtk.org', 'SimTK'], ['osf.io', 'OSF'],
        ['grand-challenge.org', 'Grand Challenge'], ['codalab.org', 'CodaLab'], ['codalab.lisn.upsaclay.fr', 'CodaLab'],
        ['data.mendeley.com', 'Mendeley Data'], ['synapse.org', 'Synapse'], ['rsna.org', 'RSNA'],
        ['physionet.org', 'PhysioNet'], ['figshare.com', 'Figshare'], ['box.com', 'Box'], ['arxiv.org', 'arXiv'],
        ['cancerimagingarchive.net', 'TCIA']
    ];

    // ---------------------------------------------------------------------------------
    // Small helpers
    // ---------------------------------------------------------------------------------

    function norm(value) {
        return String(value == null ? '' : value).trim().replace(/\s+/g, ' ').toLowerCase();
    }

    // The items of a field: an array's entries, or a single value (text values are also split on ';').
    function splitList(value) {
        if (value == null) return [];
        const items = Array.isArray(value) ? value : String(value).split(';');
        return items.map(s => String(s == null ? '' : s).trim()).filter(Boolean);
    }

    function hasValue(value) {
        return splitList(value).length > 0;
    }

    // A field as plain text: list items joined with '; ' (the CSV export convention).
    function cellText(value) {
        if (value == null) return '';
        return Array.isArray(value) ? value.join('; ') : String(value);
    }

    function toNumber(value) {
        const n = parseFloat(String(value == null ? '' : value).replace(/,/g, ''));
        return Number.isFinite(n) ? n : NaN;
    }

    function capFirst(s) {
        return s ? s.charAt(0).toUpperCase() + s.slice(1) : s;
    }

    function escapeHTML(value) {
        return String(value == null ? '' : value).replace(/[&<>"']/g, c => ({
            '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
        })[c]);
    }

    function fmtInt(n) {
        return Number(n).toLocaleString('en-US');
    }

    function fmtSize(gb) {
        if (!Number.isFinite(gb)) return '';
        if (gb > 0 && gb < 1) return `${Number((gb * 1000).toPrecision(3)).toLocaleString('en-US')} MB`;
        return `${Number(gb.toPrecision(3)).toLocaleString('en-US')} GB`;
    }

    function isURL(s) {
        return /^https?:\/\//i.test(String(s).trim());
    }

    function debounce(fn, ms) {
        let t;
        return function (...args) {
            clearTimeout(t);
            t = setTimeout(() => fn.apply(this, args), ms);
        };
    }

    // Add a BoneHub referral marker to outgoing website URLs.
    function addBonehubReferral(link) {
        try {
            const url = new URL(link);
            if (url.protocol === 'http:' || url.protocol === 'https:') {
                if (!url.searchParams.has('utm_source')) {
                    url.searchParams.set('utm_source', 'bonehub.net');
                }
                return url.toString();
            }
        } catch (error) {
            // Not a URL: keep as is.
        }
        return link;
    }

    function providerName(link) {
        try {
            const url = new URL(link);
            const host = url.hostname.replace(/^www\./, '').toLowerCase();
            if (host === 'doi.org' || host === 'dx.doi.org') {
                const prefix = url.pathname.replace(/^\//, '').split('/')[0];
                if (prefix === '10.48550') return 'arXiv';
                return DOI_PROVIDERS[prefix] || 'DOI';
            }
            const match = HOST_PROVIDERS.find(([h]) => host === h || host.endsWith('.' + h));
            return match ? match[1] : host;
        } catch (error) {
            return 'Link';
        }
    }

    function shortURL(link) {
        const text = String(link).replace(/^https?:\/\/(www\.)?/i, '').replace(/\/$/, '');
        return text.length > 60 ? text.slice(0, 57) + '…' : text;
    }

    const URL_RE = /https?:\/\/[^\s<>"']+/gi;

    // Escape text and turn bare URLs into links.
    function linkify(text) {
        const str = String(text == null ? '' : text);
        let out = '';
        let last = 0;
        str.replace(URL_RE, (match, offset) => {
            // Do not swallow trailing punctuation.
            const url = match.replace(/[.,;:!?)\]]+$/, '');
            out += escapeHTML(str.slice(last, offset));
            out += `<a href="${escapeHTML(url)}" target="_blank" rel="noopener noreferrer">${escapeHTML(shortURL(url))}</a>`;
            last = offset + url.length;
            return match;
        });
        return out + escapeHTML(str.slice(last));
    }

    // ---------------------------------------------------------------------------------
    // State
    // ---------------------------------------------------------------------------------

    const state = {
        q: '',
        sel: {},        // facet id -> Set of option keys
        mode: {},       // facet id -> 'any' | 'all' (facets with a match toggle)
        secondary: false,
        ranges: {},     // range key -> { min, max }
        sort: 'default',
        view: 'cards',
        detail: null,   // BoneHub ID of the open dataset
        shown: PAGE_SIZE
    };

    let records = [];
    let byId = new Map();
    let filtered = [];
    let allColumns = [];
    let searchTerms = [];
    let currentChips = [];
    let lastFocus = null;
    const LABELS = {};  // column -> Map(normalised value -> display label)
    const ui = {};

    // ---------------------------------------------------------------------------------
    // Data preparation
    // ---------------------------------------------------------------------------------

    const TOKEN_COLUMNS = [COL.modality, COL.primary, COL.secondary, COL.bones, COL.vital, COL.condition,
        COL.subjectInfo, COL.source, COL.license, COL.country, COL.accessPolicy, COL.research, COL.commercial,
        COL.redistribution];

    function prepareRecords(data) {
        const forms = {};  // column -> Map(key -> Map(original -> count))
        records = data.map((row, index) => {
            const tokens = {};
            TOKEN_COLUMNS.forEach(col => {
                const set = new Set();
                splitList(row[col]).forEach(original => {
                    const key = norm(original);
                    set.add(key);
                    if (!forms[col]) forms[col] = new Map();
                    if (!forms[col].has(key)) forms[col].set(key, new Map());
                    const counts = forms[col].get(key);
                    counts.set(original, (counts.get(original) || 0) + 1);
                });
                tokens[col] = set;
            });
            return {
                row,
                index,
                id: String(hasValue(row[COL.id]) ? row[COL.id] : index).trim(),
                name: hasValue(row[COL.name]) ? String(row[COL.name]).trim() : 'Untitled dataset',
                year: toNumber(row[COL.year]),
                size: toNumber(row[COL.size]),
                subjects: toNumber(row[COL.subjects]),
                tokens,
                regionsAll: new Set([...tokens[COL.primary], ...tokens[COL.secondary]]),
                haystack: Object.values(row).map(cellText).join(' \n ').toLowerCase()
            };
        });
        byId = new Map(records.map(r => [r.id, r]));

        // Display label = the most common spelling of each value.
        Object.keys(forms).forEach(col => {
            LABELS[col] = new Map();
            forms[col].forEach((counts, key) => {
                let best = '';
                let bestN = -1;
                counts.forEach((n, original) => {
                    if (n > bestN) { best = original; bestN = n; }
                });
                LABELS[col].set(key, LABEL_ALIASES[key] || capFirst(best));
            });
        });
    }

    function displayLabel(col, value) {
        const key = norm(value);
        return LABEL_ALIASES[key] || (LABELS[col] && LABELS[col].get(key)) || capFirst(String(value).trim());
    }

    function prepareFacet(f) {
        if (f.kind === 'ranges') return;
        if (f.kind === 'flags') {
            f.keys = f.options.map(o => o.key);
            f.labels = new Map(f.options.map(o => [o.key, o.label]));
            f.optionMap = new Map(f.options.map(o => [o.key, o]));
            return;
        }
        const cols = [f.column, f.secondaryColumn].filter(Boolean);
        const totals = new Map();
        records.forEach(rec => {
            const keys = new Set();
            cols.forEach(c => rec.tokens[c].forEach(k => keys.add(k)));
            keys.forEach(k => totals.set(k, (totals.get(k) || 0) + 1));
        });
        f.labels = new Map();
        totals.forEach((n, key) => {
            const col = cols.find(c => LABELS[c] && LABELS[c].has(key));
            f.labels.set(key, LABEL_ALIASES[key] || (col ? LABELS[col].get(key) : capFirst(key)));
        });
        const byCount = (a, b) => totals.get(b) - totals.get(a) || f.labels.get(a).localeCompare(f.labels.get(b));
        if (f.groups) {
            const used = new Set();
            f.groupList = f.groups.map(([title, items]) => {
                const keys = items.map(norm).filter(k => totals.has(k) && !used.has(k));
                keys.forEach(k => used.add(k));
                return { title, keys };
            }).filter(g => g.keys.length);
            const rest = [...totals.keys()].filter(k => !used.has(k)).sort(byCount);
            if (rest.length) f.groupList.push({ title: 'Other', keys: rest });
            f.keys = f.groupList.reduce((all, g) => all.concat(g.keys), []);
        } else {
            f.keys = [...totals.keys()].sort(byCount);
        }
    }

    // ---------------------------------------------------------------------------------
    // Filtering & sorting
    // ---------------------------------------------------------------------------------

    function facetMode(f) {
        if (f.matchToggle) return state.mode[f.id] === 'all' ? 'all' : 'any';
        return f.match || 'any';
    }

    function recTerms(rec, f) {
        if (f.secondaryColumn && state.secondary) return rec.regionsAll;
        return rec.tokens[f.column];
    }

    function optionTest(f, key, rec) {
        if (f.kind === 'flags') return f.optionMap.get(key).test(rec);
        return recTerms(rec, f).has(key);
    }

    function matchFacet(rec, f) {
        const sel = state.sel[f.id];
        if (!sel || sel.size === 0) return true;
        if (facetMode(f) === 'all') {
            for (const key of sel) if (!optionTest(f, key, rec)) return false;
            return true;
        }
        for (const key of sel) if (optionTest(f, key, rec)) return true;
        return false;
    }

    function matchSearch(rec) {
        return searchTerms.every(term => rec.haystack.includes(term));
    }

    function matchRanges(rec) {
        for (const r of RANGES) {
            const range = state.ranges[r.key];
            if (!range) continue;
            const v = rec[r.field];
            if (!Number.isFinite(v)) return false;
            if (range.min != null && v < range.min) return false;
            if (range.max != null && v > range.max) return false;
        }
        return true;
    }

    // `skipFacetId` lets facet counts ignore their own selection ("any" facets).
    function passes(rec, skipFacetId) {
        if (!matchSearch(rec) || !matchRanges(rec)) return false;
        for (const f of OPTION_FACETS) {
            if (f.id !== skipFacetId && !matchFacet(rec, f)) return false;
        }
        return true;
    }

    function facetCounts(f) {
        const base = records.filter(rec => passes(rec, facetMode(f) === 'all' ? null : f.id));
        const counts = new Map(f.keys.map(k => [k, 0]));
        base.forEach(rec => {
            f.keys.forEach(k => {
                if (optionTest(f, k, rec)) counts.set(k, counts.get(k) + 1);
            });
        });
        return counts;
    }

    function sortRecords(list) {
        const s = SORTS[state.sort] || SORTS.default;
        if (!s.field) return list.sort((a, b) => a.index - b.index);
        return list.sort((a, b) => {
            if (s.field === 'name') {
                return s.dir * a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' })
                    || a.index - b.index;
            }
            const va = a[s.field];
            const vb = b[s.field];
            const fa = Number.isFinite(va);
            const fb = Number.isFinite(vb);
            if (!fa && !fb) return a.index - b.index;
            if (!fa) return 1;   // missing values always last
            if (!fb) return -1;
            return s.dir * (va - vb) || a.index - b.index;
        });
    }

    function activeFilterCount() {
        let n = state.q ? 1 : 0;
        OPTION_FACETS.forEach(f => { n += state.sel[f.id] ? state.sel[f.id].size : 0; });
        n += Object.keys(state.ranges).length;
        return n;
    }

    // ---------------------------------------------------------------------------------
    // Facet sidebar
    // ---------------------------------------------------------------------------------

    function buildFacets() {
        ui.facets.innerHTML = '';
        FACETS.forEach(f => {
            const details = document.createElement('details');
            details.className = 'facet';
            details.dataset.facet = f.id;
            details.open = !!f.open;
            const summary = document.createElement('summary');
            summary.innerHTML = `<span class="facet-title">${escapeHTML(f.title)}</span>` +
                '<span class="facet-badge" hidden></span>';
            details.appendChild(summary);
            f.el = { details, badge: summary.querySelector('.facet-badge') };
            const body = document.createElement('div');
            body.className = 'facet-body';
            details.appendChild(body);
            if (f.kind === 'ranges') buildRanges(f, body);
            else buildOptions(f, body);
            ui.facets.appendChild(details);
        });
    }

    function buildOptions(f, body) {
        if (f.note) body.insertAdjacentHTML('beforeend', `<p class="facet-note">${escapeHTML(f.note)}</p>`);

        if (f.matchToggle || f.secondaryColumn) {
            const tools = document.createElement('div');
            tools.className = 'facet-tools';
            if (f.matchToggle) {
                tools.insertAdjacentHTML('beforeend',
                    `<div class="seg" role="group" aria-label="Match mode for ${escapeHTML(f.title)}">` +
                    '<span class="seg-label">Match</span>' +
                    '<button type="button" data-mode="any" title="Datasets with at least one of the selected items">Any</button>' +
                    '<button type="button" data-mode="all" title="Datasets with all selected items">All</button>' +
                    '</div>');
            }
            if (f.secondaryColumn) {
                tools.insertAdjacentHTML('beforeend',
                    '<label class="mini-check" title="Also match regions that appear only partially or in some images">' +
                    '<input type="checkbox" data-secondary> Include secondary regions</label>');
            }
            body.appendChild(tools);
            f.el.modeButtons = Array.from(tools.querySelectorAll('[data-mode]'));
            f.el.secondary = tools.querySelector('[data-secondary]');
        }

        if (!f.groupList && f.keys.length > 15) {
            body.insertAdjacentHTML('beforeend',
                `<input type="search" class="facet-search" data-facet-search="${f.id}" ` +
                `placeholder="Find ${escapeHTML(f.title.toLowerCase())}…" aria-label="Find in ${escapeHTML(f.title)}">`);
            f.el.search = body.lastElementChild;
        }

        f.el.options = new Map();
        const makeOption = key => {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = f.style === 'chips' ? 'opt opt-chip' : 'opt opt-row';
            btn.dataset.facet = f.id;
            btn.dataset.key = key;
            btn.setAttribute('aria-pressed', 'false');
            btn.innerHTML = `<span class="opt-label">${escapeHTML(f.labels.get(key))}</span><span class="opt-count"></span>`;
            f.el.options.set(key, { btn, count: btn.lastElementChild });
            return btn;
        };

        const container = document.createElement('div');
        container.className = 'facet-options' + (f.style === 'chips' ? ' is-chips' : '') + (f.groupList ? ' is-grouped' : '');
        f.el.groups = [];
        if (f.groupList) {
            f.groupList.forEach(g => {
                const wrap = document.createElement('div');
                wrap.className = 'opt-group';
                wrap.innerHTML = `<div class="opt-group-title">${escapeHTML(g.title)}</div>`;
                const items = document.createElement('div');
                items.className = 'opt-group-items';
                g.keys.forEach(k => items.appendChild(makeOption(k)));
                wrap.appendChild(items);
                container.appendChild(wrap);
                f.el.groups.push({ wrap, keys: g.keys });
            });
        } else {
            f.keys.forEach(k => container.appendChild(makeOption(k)));
        }
        body.appendChild(container);

        if (f.limit && f.keys.length > f.limit) {
            const more = document.createElement('button');
            more.type = 'button';
            more.className = 'link-btn facet-more';
            more.dataset.more = f.id;
            body.appendChild(more);
            f.el.more = more;
            f.expanded = false;
        }
    }

    function buildRanges(f, body) {
        f.el.ranges = {};
        RANGES.forEach(r => {
            const values = records.map(rec => rec[r.field]).filter(Number.isFinite);
            const lo = values.length ? Math.min(...values) : '';
            const hi = values.length ? Math.max(...values) : '';
            const row = document.createElement('div');
            row.className = 'range-row';
            row.innerHTML =
                `<span class="range-label">${escapeHTML(r.label)}</span>` +
                `<input type="number" inputmode="decimal" step="${r.step}" data-range="${r.key}" data-bound="min" ` +
                `placeholder="${lo}" aria-label="Minimum ${escapeHTML(r.label)}">` +
                '<span class="range-dash" aria-hidden="true">–</span>' +
                `<input type="number" inputmode="decimal" step="${r.step}" data-range="${r.key}" data-bound="max" ` +
                `placeholder="${hi}" aria-label="Maximum ${escapeHTML(r.label)}">`;
            body.appendChild(row);
            f.el.ranges[r.key] = {
                min: row.querySelector('[data-bound="min"]'),
                max: row.querySelector('[data-bound="max"]')
            };
        });
        body.insertAdjacentHTML('beforeend',
            '<p class="facet-note">Placeholders show the full range. Datasets without a value are hidden once a limit is set.</p>');
    }

    function updateFacets() {
        OPTION_FACETS.forEach(f => {
            const sel = state.sel[f.id] || new Set();
            const counts = facetCounts(f);
            const query = f.el.search ? norm(f.el.search.value) : '';
            let hidden = 0;
            f.keys.forEach((key, i) => {
                const o = f.el.options.get(key);
                const n = counts.get(key) || 0;
                const on = sel.has(key);
                o.btn.setAttribute('aria-pressed', on ? 'true' : 'false');
                o.btn.disabled = n === 0 && !on;
                o.count.textContent = n;
                let show = true;
                if (query) {
                    show = on || norm(f.labels.get(key)).includes(query);
                } else if (f.limit && !f.expanded && i >= f.limit && !on) {
                    show = false;
                    hidden++;
                }
                o.btn.hidden = !show;
            });
            f.el.groups.forEach(g => {
                g.wrap.hidden = g.keys.every(k => f.el.options.get(k).btn.hidden);
            });
            if (f.el.more) {
                f.el.more.hidden = !!query || (!f.expanded && hidden === 0);
                f.el.more.textContent = f.expanded ? 'Show fewer' : `Show ${hidden} more`;
            }
            if (f.el.modeButtons) {
                f.el.modeButtons.forEach(b => b.setAttribute('aria-pressed', b.dataset.mode === facetMode(f) ? 'true' : 'false'));
            }
            if (f.el.secondary) f.el.secondary.checked = state.secondary;
            setBadge(f, sel.size);
        });
        setBadge(RANGE_FACET, Object.keys(state.ranges).length);
    }

    function setBadge(f, n) {
        f.el.badge.hidden = n === 0;
        f.el.badge.textContent = n;
    }

    // Expand facets that have an active selection (e.g. when opened from a shared link).
    function openActiveFacets() {
        OPTION_FACETS.forEach(f => { if (state.sel[f.id] && state.sel[f.id].size) f.el.details.open = true; });
        if (Object.keys(state.ranges).length) RANGE_FACET.el.details.open = true;
    }

    // ---------------------------------------------------------------------------------
    // Rendering: results
    // ---------------------------------------------------------------------------------

    function render(options) {
        const keepShown = options && options.keepShown;
        if (!keepShown) state.shown = PAGE_SIZE;
        filtered = sortRecords(records.filter(rec => passes(rec, null)));
        renderCount();
        renderChips();
        updateFacets();
        renderResults();
        syncViewButtons();
        if (ui.drawer.classList.contains('is-open')) updateDrawerNav();
        writeHash();
    }

    function renderCount() {
        const total = filtered.length;
        const filtersOn = activeFilterCount() > 0;
        ui.count.innerHTML = filtersOn
            ? `<strong>${total}</strong> of ${records.length} datasets match`
            : `<strong>${total}</strong> datasets`;
        ui.applyFilters.textContent = `Show ${total} dataset${total === 1 ? '' : 's'}`;
        const n = activeFilterCount();
        ui.filterBadge.hidden = n === 0;
        ui.filterBadge.textContent = n;
    }

    function renderChips() {
        currentChips = [];
        if (state.q) {
            currentChips.push({
                label: `“${state.q}”`, group: 'Search',
                clear: () => { state.q = ''; ui.search.value = ''; updateSearchTerms(); }
            });
        }
        OPTION_FACETS.forEach(f => {
            (state.sel[f.id] || new Set()).forEach(key => {
                currentChips.push({ label: f.labels.get(key), group: f.title, clear: () => state.sel[f.id].delete(key) });
            });
        });
        RANGES.forEach(r => {
            const v = state.ranges[r.key];
            if (!v) return;
            let label;
            if (v.min != null && v.max != null) label = `${r.label}: ${v.min}–${v.max}`;
            else if (v.min != null) label = `${r.label} ≥ ${v.min}`;
            else label = `${r.label} ≤ ${v.max}`;
            currentChips.push({
                label, group: 'Range',
                clear: () => {
                    delete state.ranges[r.key];
                    const inputs = RANGE_FACET.el.ranges[r.key];
                    inputs.min.value = '';
                    inputs.max.value = '';
                }
            });
        });
        if (!currentChips.length) {
            ui.chips.innerHTML = '';
            ui.chips.hidden = true;
            return;
        }
        ui.chips.hidden = false;
        ui.chips.innerHTML = currentChips.map((c, i) =>
            `<button type="button" class="active-chip" data-chip="${i}" title="Remove filter (${escapeHTML(c.group)})">` +
            `<span>${escapeHTML(c.label)}</span><span class="x" aria-hidden="true">×</span>` +
            `<span class="visually-hidden">Remove filter</span></button>`
        ).join('') + '<button type="button" class="link-btn" data-action="clear">Clear all</button>';
    }

    function renderResults() {
        const total = filtered.length;
        const visible = filtered.slice(0, state.shown);
        if (!total) {
            ui.results.innerHTML =
                '<div class="empty-state"><p><strong>No datasets match these filters.</strong></p>' +
                '<p>Try removing a filter, switching a facet to “Any”, or including secondary regions.</p>' +
                '<button type="button" class="btn btn-ghost" data-action="clear">Clear all filters</button></div>';
        } else if (state.view === 'table') {
            ui.results.innerHTML = tableHTML(visible);
        } else {
            ui.results.innerHTML = `<div class="card-list">${visible.map(cardHTML).join('')}</div>`;
        }
        const remaining = total - visible.length;
        ui.showMoreWrap.hidden = remaining <= 0;
        if (remaining > 0) {
            ui.showMore.textContent = `Show ${Math.min(PAGE_SIZE, remaining)} more`;
            ui.showAll.textContent = `Show all ${total}`;
        }
    }

    function selectedKeys(facetId) {
        return state.sel[facetId] || new Set();
    }

    // Comma list of values: selected ones first and highlighted, then "+N more".
    function previewList(values, col, highlight, max) {
        const seen = new Set();
        const items = [];
        values.forEach(v => {
            const k = norm(v);
            if (!seen.has(k)) { seen.add(k); items.push({ k, label: displayLabel(col, v) }); }
        });
        items.sort((a, b) => (highlight.has(b.k) ? 1 : 0) - (highlight.has(a.k) ? 1 : 0));
        const shown = items.slice(0, max).map(it =>
            highlight.has(it.k) ? `<mark>${escapeHTML(it.label)}</mark>` : escapeHTML(it.label));
        const more = items.length - max;
        return shown.join(', ') + (more > 0 ? ` <span class="more">+${more} more</span>` : '');
    }

    function metaParts(rec) {
        const r = rec.row;
        const parts = [];
        if (Number.isFinite(rec.year)) parts.push(String(rec.year));
        if (hasValue(r[COL.country])) parts.push(escapeHTML(splitList(r[COL.country]).join(', ')));
        if (Number.isFinite(rec.subjects)) parts.push(`${fmtInt(rec.subjects)} subject${rec.subjects === 1 ? '' : 's'}`);
        if (Number.isFinite(rec.size)) parts.push(fmtSize(rec.size));
        return parts.map(p => `<span>${p}</span>`).join('');
    }

    function policyClass(value) {
        const k = norm(value);
        if (k === 'open access' || k === 'allowed') return 'ok';
        if (k === 'restricted' || k === 'payment required') return 'warn';
        return 'neutral';
    }

    function accessBadges(rec, short) {
        return splitList(rec.row[COL.accessPolicy]).map(v => {
            const label = short && norm(v) === 'open access' ? 'Open' : v;
            return `<span class="badge badge-${policyClass(v)}" title="Access: ${escapeHTML(v)}">${escapeHTML(label)}</span>`;
        }).join('');
    }

    function modalityTags(rec) {
        const hl = selectedKeys('modality');
        return splitList(rec.row[COL.modality]).map(v =>
            `<span class="tag tag-modality${hl.has(norm(v)) ? ' is-hit' : ''}">${escapeHTML(displayLabel(COL.modality, v))}</span>`
        ).join('');
    }

    function dataTags(rec) {
        const r = rec.row;
        const tags = [];
        const images = norm(r[COL.images]);
        if (images === 'yes') tags.push(['Images', 'Medical images are included']);
        else if (images === 'no') tags.push(['No images', 'Medical images are not included in this dataset', true]);
        if (hasValue(r[COL.seg])) tags.push(['Segmentations', `Voxel segmentation masks: ${cellText(r[COL.seg])}`]);
        if (hasValue(r[COL.mesh])) tags.push(['Meshes', `Mesh models: ${cellText(r[COL.mesh])}`]);
        if (hasValue(r[COL.cad])) tags.push(['CAD', `CAD models: ${cellText(r[COL.cad])}`]);
        if (hasValue(r[COL.landmarks])) tags.push(['Landmarks', 'Anatomical landmarks are included']);
        if (hasValue(r[COL.structures])) tags.push(['Soft tissue', `Additional structures: ${cellText(r[COL.structures])}`]);
        return tags.map(([label, title, muted]) =>
            `<span class="tag tag-data${muted ? ' is-muted' : ''}" title="${escapeHTML(title)}">${label}</span>`).join('');
    }

    function linkButtons(rec) {
        const access = splitList(rec.row[COL.access]).filter(isURL);
        const papers = splitList(rec.row[COL.paper]).filter(isURL);
        const used = {};
        const html = [];
        access.forEach(link => {
            let label = providerName(link);
            used[label] = (used[label] || 0) + 1;
            if (used[label] > 1) label += ` ${used[label]}`;
            html.push(`<a class="btn-link" href="${escapeHTML(addBonehubReferral(link))}" ` +
                `target="_blank" rel="noopener noreferrer" title="Open dataset: ${escapeHTML(link)}">` +
                `${escapeHTML(label)}<span class="ext" aria-hidden="true">↗</span></a>`);
        });
        papers.forEach((link, i) => {
            const label = (papers.length > 1 ? `Paper ${i + 1}` : 'Paper') + (providerName(link) === 'arXiv' ? ' (arXiv)' : '');
            html.push(`<a class="btn-link btn-link-ghost" href="${escapeHTML(addBonehubReferral(link))}" ` +
                `target="_blank" rel="noopener noreferrer" title="Open paper: ${escapeHTML(link)}">` +
                `${escapeHTML(label)}<span class="ext" aria-hidden="true">↗</span></a>`);
        });
        return html.join('');
    }

    function regionPreview(rec, max) {
        const r = rec.row;
        const hl = selectedKeys('region');
        let values = splitList(r[COL.primary]);
        let html = values.length ? previewList(values, COL.primary, hl, max) : '';
        // Selected regions that only appear among the secondary regions.
        const extra = splitList(r[COL.secondary]).filter(v => hl.has(norm(v)) && !rec.tokens[COL.primary].has(norm(v)));
        if (state.secondary && extra.length) {
            html += (html ? '; ' : '') + extra.map(v => `<mark>${escapeHTML(displayLabel(COL.secondary, v))}</mark>`).join(', ') +
                ' <span class="more">(secondary)</span>';
        }
        if (!html && hasValue(r[COL.secondary])) {
            values = splitList(r[COL.secondary]);
            html = previewList(values, COL.secondary, hl, max) + ' <span class="more">(secondary)</span>';
        }
        return html;
    }

    function cardHTML(rec) {
        const r = rec.row;
        const id = escapeHTML(rec.id);
        const facts = [];
        const regions = regionPreview(rec, 6);
        if (regions) facts.push(['Regions', regions]);
        const bones = splitList(r[COL.bones]);
        if (bones.length) facts.push([`Bones (${bones.length})`, previewList(bones, COL.bones, selectedKeys('bones'), 6)]);
        const conditions = splitList(r[COL.condition]);
        if (conditions.length) facts.push(['Subjects', previewList(conditions, COL.condition, selectedKeys('condition'), 4)]);
        const remarks = splitList(r[COL.remarks]).join(' · ');

        return `<article class="card" data-id="${id}">
            <div class="card-head">
                <h3 class="card-title"><button type="button" class="card-open" data-open="${id}">${escapeHTML(rec.name)}</button></h3>
                <div class="card-badges">${accessBadges(rec)}</div>
            </div>
            <div class="card-meta">${metaParts(rec)}</div>
            <div class="card-tags">${modalityTags(rec)}${dataTags(rec)}</div>
            ${facts.length ? `<dl class="card-facts">${facts.map(([k, v]) => `<div><dt>${k}</dt><dd>${v}</dd></div>`).join('')}</dl>` : ''}
            ${remarks ? `<p class="card-remarks">${escapeHTML(remarks)}</p>` : ''}
            <div class="card-actions">
                <div class="card-links">${linkButtons(rec)}</div>
                <button type="button" class="btn-details" data-open="${id}">Details<span aria-hidden="true"> →</span></button>
            </div>
        </article>`;
    }

    function tableHTML(list) {
        const s = SORTS[state.sort] || SORTS.default;
        const th = (label, field, cls) => {
            const klass = cls ? ` class="${cls}"` : '';
            if (!field) return `<th scope="col"${klass}>${label}</th>`;
            const active = s.field === field;
            const aria = active ? (s.dir > 0 ? 'ascending' : 'descending') : 'none';
            const ind = active ? (s.dir > 0 ? '▲' : '▼') : '↕';
            return `<th scope="col"${klass} aria-sort="${aria}"><button type="button" class="th-sort${active ? ' is-active' : ''}" ` +
                `data-sort-field="${field}">${label}<span class="sort-ind" aria-hidden="true">${ind}</span></button></th>`;
        };
        const indicator = (on, abbr, title) =>
            `<span class="ind${on ? ' on' : ''}" title="${title}: ${on ? 'yes' : 'no'}">${abbr}</span>`;

        const rows = list.map(rec => {
            const r = rec.row;
            const primary = splitList(r[COL.primary]).map(v => displayLabel(COL.primary, v));
            const firstLink = splitList(r[COL.access]).find(isURL);
            const ext = firstLink
                ? ` <a class="t-ext" href="${escapeHTML(addBonehubReferral(firstLink))}" target="_blank" rel="noopener noreferrer" ` +
                `title="Open dataset (${escapeHTML(providerName(firstLink))})" aria-label="Open ${escapeHTML(rec.name)} (${escapeHTML(providerName(firstLink))})">↗</a>`
                : '';
            return `<tr data-open="${escapeHTML(rec.id)}" tabindex="0">
                <td class="t-name"><span class="t-title">${escapeHTML(rec.name)}</span>${ext}</td>
                <td class="num">${Number.isFinite(rec.year) ? rec.year : ''}</td>
                <td>${escapeHTML(splitList(r[COL.modality]).map(v => displayLabel(COL.modality, v)).join(', '))}</td>
                <td class="num">${Number.isFinite(rec.subjects) ? fmtInt(rec.subjects) : ''}</td>
                <td class="num">${Number.isFinite(rec.size) ? fmtSize(rec.size) : ''}</td>
                <td class="t-regions" title="${escapeHTML(primary.join(', '))}">${escapeHTML(primary.join(', '))}</td>
                <td class="t-data">${indicator(norm(r[COL.images]) === 'yes', 'Img', 'Medical images')}${indicator(hasValue(r[COL.seg]), 'Seg', 'Segmentation masks')}${indicator(hasValue(r[COL.mesh]), 'Mesh', 'Mesh models')}${indicator(hasValue(r[COL.cad]), 'CAD', 'CAD models')}</td>
                <td class="t-access">${accessBadges(rec, true)}</td>
            </tr>`;
        }).join('');

        return `<div class="table-wrap"><table class="dtable">
            <thead><tr>
                ${th('Dataset', 'name')}${th('Year', 'year', 'num')}${th('Modality')}${th('Subjects', 'subjects', 'num')}
                ${th('Size', 'size', 'num')}${th('Primary regions')}${th('Data')}${th('Access')}
            </tr></thead>
            <tbody>${rows}</tbody>
        </table></div>`;
    }

    // ---------------------------------------------------------------------------------
    // Detail drawer
    // ---------------------------------------------------------------------------------

    function fieldValueHTML(rec, col, kind) {
        const raw = rec.row[col];
        if (!hasValue(raw)) return '<span class="muted">—</span>';
        const highlight = col === COL.primary || col === COL.secondary ? selectedKeys('region')
            : col === COL.bones ? selectedKeys('bones')
                : col === COL.modality ? selectedKeys('modality')
                    : col === COL.condition ? selectedKeys('condition')
                        : new Set();
        const items = splitList(raw);
        switch (kind) {
            case 'chips':
                return `<div class="chips">${items.map(v =>
                    `<span class="chip${highlight.has(norm(v)) ? ' is-hit' : ''}">${escapeHTML(displayLabel(col, v))}</span>`).join('')}</div>`;
            case 'policy':
            case 'status':
                return `<div class="chips">${items.map(v =>
                    `<span class="badge badge-${kind === 'status' ? 'ok' : policyClass(v)}">${escapeHTML(v)}</span>`).join('')}</div>`;
            case 'bullets':
                if (items.length > 1) return `<ul class="bullets">${items.map(v => `<li>${linkify(capFirst(v))}</li>`).join('')}</ul>`;
                return linkify(capFirst(items[0] || ''));
            case 'list':
                return escapeHTML(items.join(', '));
            case 'size':
                return Number.isFinite(rec.size) ? numberWithNote(raw, fmtSize(rec.size)) : linkify(cellText(raw));
            case 'int':
                return Number.isFinite(rec.subjects) ? numberWithNote(raw, fmtInt(rec.subjects)) : linkify(cellText(raw));
            default:
                return linkify(cellText(raw));
        }
    }

    // "706; calculated for 3D bone models only" -> "706 GB (calculated for 3D bone models only)"
    function numberWithNote(raw, formatted) {
        const m = String(raw).trim().match(/^[\d.,]+\s*[;:,-]?\s*(.*)$/);
        const note = m ? m[1].trim() : '';
        return escapeHTML(formatted) + (note ? ` <span class="muted">(${linkify(note)})</span>` : '');
    }

    function fieldRow(rec, col, kind) {
        const info = FIELD_INFO[col];
        const label = FIELD_LABELS[col] || col;
        return `<div class="field"><dt${info ? ` title="${escapeHTML(info)}"` : ''}>${escapeHTML(label)}</dt>` +
            `<dd>${fieldValueHTML(rec, col, kind)}</dd></div>`;
    }

    function drawerHTML(rec) {
        const r = rec.row;
        const covered = new Set([COL.id, COL.name, COL.access, COL.paper]);
        const sections = DETAIL_SECTIONS.map(sec => {
            const rows = sec.fields.filter(([col]) => col in r).map(([col, kind]) => {
                covered.add(col);
                return fieldRow(rec, col, kind);
            }).join('');
            return rows ? `<div class="dsec"><h3>${escapeHTML(sec.title)}</h3><dl class="fields">${rows}</dl></div>` : '';
        });
        // Fields added to the data later still show up.
        const extra = allColumns.filter(c => !covered.has(c));
        if (extra.length) {
            sections.push(`<div class="dsec"><h3>Other</h3><dl class="fields">${extra.map(c => fieldRow(rec, c, 'text')).join('')}</dl></div>`);
        }
        const accessNotes = splitList(r[COL.access]).filter(v => !isURL(v));
        const issueTitle = `Correction for dataset ${rec.id}: ${rec.name}`;

        return `<p class="drawer-kicker">BoneHub ID ${escapeHTML(rec.id)}</p>
            <h2 id="drawerTitle" class="drawer-title">${escapeHTML(rec.name)}</h2>
            <div class="card-meta">${metaParts(rec)}</div>
            <div class="card-tags">${accessBadges(rec)}${modalityTags(rec)}${dataTags(rec)}</div>
            <div class="drawer-actions">${linkButtons(rec)}</div>
            ${accessNotes.length ? `<p class="drawer-note">${accessNotes.map(linkify).join('<br>')}</p>` : ''}
            ${sections.join('')}
            <p class="drawer-foot">Field definitions: <a href="${GUIDE_URL}" target="_blank" rel="noopener noreferrer">field guide</a>
            · Something missing or outdated? <a href="${ISSUES_URL}?title=${encodeURIComponent(issueTitle)}" target="_blank" rel="noopener noreferrer">Report it</a></p>`;
    }

    function openDetail(id) {
        const rec = byId.get(String(id));
        if (!rec) {
            if (state.detail) { state.detail = null; writeHash(); }
            return;
        }
        const wasOpen = ui.drawer.classList.contains('is-open');
        if (!wasOpen) lastFocus = document.activeElement;
        state.detail = rec.id;
        ui.drawerBody.innerHTML = drawerHTML(rec);
        ui.drawerBody.scrollTop = 0;
        updateDrawerNav();
        if (!wasOpen) {
            closeFilters();
            ui.drawer.classList.add('is-open');
            ui.drawer.setAttribute('aria-hidden', 'false');
            setOverlay(true);
            ui.closeDrawer.focus({ preventScroll: true });
        }
        writeHash();
    }

    function closeDetail() {
        if (!ui.drawer.classList.contains('is-open')) return;
        ui.drawer.classList.remove('is-open');
        ui.drawer.setAttribute('aria-hidden', 'true');
        setOverlay(false);
        state.detail = null;
        writeHash();
        if (lastFocus && document.contains(lastFocus)) lastFocus.focus({ preventScroll: true });
        lastFocus = null;
    }

    function updateDrawerNav() {
        const i = filtered.findIndex(rec => rec.id === state.detail);
        ui.drawerPos.textContent = i >= 0 ? `${i + 1} of ${filtered.length}` : '';
        ui.prev.disabled = i <= 0;
        ui.next.disabled = i < 0 || i >= filtered.length - 1;
    }

    function stepDetail(delta) {
        const i = filtered.findIndex(rec => rec.id === state.detail);
        const target = filtered[i + delta];
        if (i >= 0 && target) openDetail(target.id);
    }

    // ---------------------------------------------------------------------------------
    // Mobile filter panel, overlay, toast
    // ---------------------------------------------------------------------------------

    function openFilters() {
        ui.filterPanel.classList.add('is-open');
        ui.openFilters.setAttribute('aria-expanded', 'true');
        setOverlay(true);
        ui.closeFilters.focus({ preventScroll: true });
    }

    function closeFilters() {
        if (!ui.filterPanel.classList.contains('is-open')) return;
        ui.filterPanel.classList.remove('is-open');
        ui.openFilters.setAttribute('aria-expanded', 'false');
        setOverlay(false);
        ui.openFilters.focus({ preventScroll: true });
    }

    function setOverlay(on) {
        ui.backdrop.classList.toggle('is-visible', on);
        document.body.classList.toggle('has-overlay', on);
    }

    let toastTimer;
    function toast(message) {
        ui.toast.textContent = message;
        ui.toast.classList.add('is-visible');
        clearTimeout(toastTimer);
        toastTimer = setTimeout(() => ui.toast.classList.remove('is-visible'), 2200);
    }

    function copyText(text, message) {
        const done = () => toast(message);
        if (navigator.clipboard && window.isSecureContext) {
            navigator.clipboard.writeText(text).then(done, () => window.prompt('Copy this link:', text));
        } else {
            window.prompt('Copy this link:', text);
        }
    }

    // ---------------------------------------------------------------------------------
    // URL hash <-> state
    // ---------------------------------------------------------------------------------

    function parseNumber(value) {
        if (value == null || String(value).trim() === '') return null;
        const n = parseFloat(value);
        return Number.isFinite(n) ? n : null;
    }

    function updateSearchTerms() {
        searchTerms = norm(state.q).split(' ').filter(Boolean);
    }

    function readHash() {
        const p = new URLSearchParams(location.hash.replace(/^#/, ''));
        state.q = p.get('q') || '';
        state.sel = {};
        state.mode = {};
        OPTION_FACETS.forEach(f => {
            const keys = p.getAll(f.id).map(norm).filter(k => f.keys.indexOf(k) !== -1);
            if (keys.length) state.sel[f.id] = new Set(keys);
            if (f.matchToggle && p.get(`${f.id}-match`) === 'all') state.mode[f.id] = 'all';
        });
        state.secondary = p.get('secondary') === '1';
        state.ranges = {};
        RANGES.forEach(r => {
            const min = parseNumber(p.get(`${r.key}-min`));
            const max = parseNumber(p.get(`${r.key}-max`));
            if (min != null || max != null) state.ranges[r.key] = { min, max };
        });
        state.sort = SORTS[p.get('sort')] ? p.get('sort') : 'default';
        state.view = p.get('view') === 'table' ? 'table' : 'cards';
        state.detail = p.get('dataset');
        updateSearchTerms();
    }

    function writeHash() {
        const p = new URLSearchParams();
        if (state.q) p.set('q', state.q);
        OPTION_FACETS.forEach(f => {
            (state.sel[f.id] || new Set()).forEach(k => p.append(f.id, k));
            if (f.matchToggle && state.mode[f.id] === 'all') p.set(`${f.id}-match`, 'all');
        });
        if (state.secondary) p.set('secondary', '1');
        RANGES.forEach(r => {
            const v = state.ranges[r.key];
            if (v && v.min != null) p.set(`${r.key}-min`, v.min);
            if (v && v.max != null) p.set(`${r.key}-max`, v.max);
        });
        if (state.sort !== 'default') p.set('sort', state.sort);
        if (state.view !== 'cards') p.set('view', state.view);
        if (state.detail) p.set('dataset', state.detail);
        const hash = p.toString();
        const base = location.pathname + location.search;
        const next = hash ? `${base}#${hash}` : base;
        if (next !== base + location.hash) history.replaceState(null, '', next);
    }

    function syncControls() {
        ui.search.value = state.q;
        ui.sort.value = state.sort;
        RANGES.forEach(r => {
            const v = state.ranges[r.key] || {};
            const inputs = RANGE_FACET.el.ranges[r.key];
            inputs.min.value = v.min != null ? v.min : '';
            inputs.max.value = v.max != null ? v.max : '';
        });
        syncViewButtons();
    }

    function syncViewButtons() {
        ui.viewButtons.forEach(b => b.setAttribute('aria-pressed', b.dataset.view === state.view ? 'true' : 'false'));
    }

    // ---------------------------------------------------------------------------------
    // CSV export (filtered datasets, all fields, current order; list items joined with '; ')
    // ---------------------------------------------------------------------------------

    function exportToCSV() {
        if (!filtered.length) {
            toast('No datasets to export. Adjust your filters.');
            return;
        }
        const quote = v => `"${cellText(v).replace(/"/g, '""')}"`;
        const lines = [allColumns.map(quote).join(',')];
        filtered.forEach(rec => lines.push(allColumns.map(c => quote(rec.row[c])).join(',')));
        const blob = new Blob(['﻿' + lines.join('\n') + '\n'], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `bonehub_public_datasets_${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(url), 1000);
        toast(`Exported ${filtered.length} dataset${filtered.length === 1 ? '' : 's'}`);
    }

    // ---------------------------------------------------------------------------------
    // Events
    // ---------------------------------------------------------------------------------

    function clearAll() {
        state.q = '';
        ui.search.value = '';
        updateSearchTerms();
        state.sel = {};
        state.mode = {};
        state.secondary = false;
        state.ranges = {};
        OPTION_FACETS.forEach(f => { if (f.el.search) f.el.search.value = ''; });
        syncControls();
        render();
    }

    function bindEvents() {
        const onSearch = debounce(() => {
            state.q = ui.search.value.trim();
            updateSearchTerms();
            render();
        }, 150);
        ui.search.addEventListener('input', onSearch);

        ui.sort.addEventListener('change', () => {
            state.sort = ui.sort.value;
            render();
        });

        ui.viewButtons.forEach(b => b.addEventListener('click', () => {
            state.view = b.dataset.view;
            render({ keepShown: true });
        }));

        ui.exportBtn.addEventListener('click', exportToCSV);
        ui.clear.addEventListener('click', clearAll);
        ui.openFilters.addEventListener('click', openFilters);
        ui.closeFilters.addEventListener('click', closeFilters);
        ui.applyFilters.addEventListener('click', closeFilters);
        ui.copyView.addEventListener('click', () => copyText(location.href, 'Link to this view copied'));

        ui.showMore.addEventListener('click', () => {
            state.shown += PAGE_SIZE;
            renderResults();
        });
        ui.showAll.addEventListener('click', () => {
            state.shown = filtered.length;
            renderResults();
        });

        // Facet sidebar (event delegation).
        ui.facets.addEventListener('click', e => {
            const opt = e.target.closest('.opt');
            if (opt && !opt.disabled) {
                const id = opt.dataset.facet;
                const key = opt.dataset.key;
                if (!state.sel[id]) state.sel[id] = new Set();
                if (state.sel[id].has(key)) state.sel[id].delete(key);
                else state.sel[id].add(key);
                if (!state.sel[id].size) delete state.sel[id];
                render();
                return;
            }
            const modeBtn = e.target.closest('[data-mode]');
            if (modeBtn) {
                const f = FACETS.find(x => x.id === modeBtn.closest('.facet').dataset.facet);
                state.mode[f.id] = modeBtn.dataset.mode;
                render();
                return;
            }
            const more = e.target.closest('[data-more]');
            if (more) {
                const f = FACETS.find(x => x.id === more.dataset.more);
                f.expanded = !f.expanded;
                updateFacets();
            }
        });
        ui.facets.addEventListener('change', e => {
            if (e.target.matches('[data-secondary]')) {
                state.secondary = e.target.checked;
                render();
            }
        });
        const onRange = debounce(input => {
            const key = input.dataset.range;
            const inputs = RANGE_FACET.el.ranges[key];
            const min = parseNumber(inputs.min.value);
            const max = parseNumber(inputs.max.value);
            if (min == null && max == null) delete state.ranges[key];
            else state.ranges[key] = { min, max };
            render();
        }, 300);
        ui.facets.addEventListener('input', e => {
            if (e.target.matches('[data-range]')) onRange(e.target);
            else if (e.target.matches('[data-facet-search]')) updateFacets();
        });

        // Active filter chips.
        ui.chips.addEventListener('click', e => {
            const chip = e.target.closest('[data-chip]');
            if (chip) {
                const c = currentChips[Number(chip.dataset.chip)];
                if (c) {
                    c.clear();
                    Object.keys(state.sel).forEach(id => { if (!state.sel[id].size) delete state.sel[id]; });
                    render();
                }
            } else if (e.target.closest('[data-action="clear"]')) {
                clearAll();
            }
        });

        // Results: open details, table sorting.
        ui.results.addEventListener('click', e => {
            if (e.target.closest('[data-action="clear"]')) { clearAll(); return; }
            const sortBtn = e.target.closest('[data-sort-field]');
            if (sortBtn) {
                const field = sortBtn.dataset.sortField;
                const cur = SORTS[state.sort] || {};
                const dir = cur.field === field ? (cur.dir > 0 ? 'desc' : 'asc') : (field === 'name' ? 'asc' : 'desc');
                state.sort = `${field}-${dir}`;
                ui.sort.value = state.sort;
                render({ keepShown: true });
                return;
            }
            if (e.target.closest('a')) return;
            const opener = e.target.closest('[data-open]') || e.target.closest('.card');
            if (!opener) return;
            if (window.getSelection && String(window.getSelection()).length > 0 && !e.target.closest('button')) return;
            openDetail(opener.dataset.open || opener.dataset.id);
        });
        ui.results.addEventListener('keydown', e => {
            if (e.key === 'Enter' && e.target.matches('tr[data-open]')) openDetail(e.target.dataset.open);
        });

        // Drawer.
        ui.closeDrawer.addEventListener('click', closeDetail);
        ui.prev.addEventListener('click', () => stepDetail(-1));
        ui.next.addEventListener('click', () => stepDetail(1));
        ui.copyDataset.addEventListener('click', () => copyText(location.href, 'Link to this dataset copied'));
        ui.backdrop.addEventListener('click', () => {
            if (ui.drawer.classList.contains('is-open')) closeDetail();
            else closeFilters();
        });

        document.addEventListener('keydown', e => {
            const drawerOpen = ui.drawer.classList.contains('is-open');
            if (e.key === 'Escape') {
                if (drawerOpen) closeDetail();
                else closeFilters();
                return;
            }
            if (!drawerOpen) return;
            const typing = e.target.matches('input, select, textarea');
            if (!typing && e.key === 'ArrowLeft') { stepDetail(-1); e.preventDefault(); }
            if (!typing && e.key === 'ArrowRight') { stepDetail(1); e.preventDefault(); }
            if (e.key === 'Tab') trapFocus(e, ui.drawer);
        });

        window.addEventListener('hashchange', () => {
            readHash();
            syncControls();
            openActiveFacets();
            render();
            if (state.detail) openDetail(state.detail);
            else closeDetail();
        });
    }

    function trapFocus(e, container) {
        const focusables = Array.from(container.querySelectorAll(
            'a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])'))
            .filter(el => el.offsetParent !== null);
        if (!focusables.length) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (e.shiftKey && document.activeElement === first) { last.focus(); e.preventDefault(); }
        else if (!e.shiftKey && document.activeElement === last) { first.focus(); e.preventDefault(); }
    }

    // ---------------------------------------------------------------------------------
    // Init
    // ---------------------------------------------------------------------------------

    function cacheElements() {
        const byIdEl = id => document.getElementById(id);
        ui.search = byIdEl('searchInput');
        ui.sort = byIdEl('sortSelect');
        ui.viewButtons = Array.from(document.querySelectorAll('.view-toggle [data-view]'));
        ui.exportBtn = byIdEl('exportCSV');
        ui.clear = byIdEl('clearFilters');
        ui.openFilters = byIdEl('openFilters');
        ui.closeFilters = byIdEl('closeFilters');
        ui.applyFilters = byIdEl('applyFilters');
        ui.filterPanel = byIdEl('filterPanel');
        ui.filterBadge = byIdEl('filterCountBadge');
        ui.facets = byIdEl('facets');
        ui.count = byIdEl('datasetCount');
        ui.copyView = byIdEl('copyViewLink');
        ui.chips = byIdEl('activeChips');
        ui.results = byIdEl('results');
        ui.showMoreWrap = byIdEl('showMoreWrap');
        ui.showMore = byIdEl('showMore');
        ui.showAll = byIdEl('showAll');
        ui.backdrop = byIdEl('backdrop');
        ui.drawer = byIdEl('detailDrawer');
        ui.drawerBody = byIdEl('drawerBody');
        ui.drawerPos = byIdEl('drawerPos');
        ui.prev = byIdEl('prevDataset');
        ui.next = byIdEl('nextDataset');
        ui.closeDrawer = byIdEl('closeDrawer');
        ui.copyDataset = byIdEl('copyDatasetLink');
        ui.toast = byIdEl('toast');
    }

    document.addEventListener('DOMContentLoaded', () => {
        cacheElements();
        if (typeof datasetsData === 'undefined' || !Array.isArray(datasetsData)) {
            ui.count.textContent = '';
            ui.results.innerHTML = '<p class="empty-state">Dataset not loaded. Please run the update script.</p>';
            return;
        }
        allColumns = datasetsData.length ? Object.keys(datasetsData[0]) : [];
        prepareRecords(datasetsData);
        FACETS.forEach(prepareFacet);
        buildFacets();
        ui.sort.innerHTML = Object.keys(SORTS).map(k => `<option value="${k}">${escapeHTML(SORTS[k].label)}</option>`).join('');
        readHash();
        syncControls();
        openActiveFacets();
        bindEvents();
        render();
        if (state.detail) openDetail(state.detail);
    });
})();
