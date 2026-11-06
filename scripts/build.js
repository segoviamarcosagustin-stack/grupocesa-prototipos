const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const TEMPLATE = path.join(ROOT, 'template', 'base.html');
const CONFIGS = path.join(ROOT, 'configs');
const OUTPUT = path.join(ROOT, 'prototipos');
const SHARED_SRC = path.join(ROOT, 'prototipos', 'shared');

if (!fs.existsSync(TEMPLATE)) {
  console.error('Template not found:', TEMPLATE);
  process.exit(1);
}

const template = fs.readFileSync(TEMPLATE, 'utf8');

const files = fs.readdirSync(CONFIGS).filter(f => f.endsWith('.json'));
if (files.length === 0) {
  console.warn('No configs found in', CONFIGS);
  process.exit(0);
}

const INDEX_TEMPLATE = path.join(ROOT, 'template', 'index.html');

let built = 0;
const catalog = [];
for (const file of files) {
  try {
    const raw = fs.readFileSync(path.join(CONFIGS, file), 'utf8');
    const config = JSON.parse(raw);

    if (!config.id) {
      console.warn(`Skipping ${file}: missing "id"`);
      continue;
    }

    let prompt = config.ai.systemPrompt || '';
    if (config.ai.mockData) {
      prompt = prompt.replace(
        '{{MOCK_DATA}}',
        JSON.stringify(config.ai.mockData, null, 0)
      );
    }
    if (config.ai.multimediaPrompt) {
      prompt = prompt.replace('{{MULTIMEDIA}}', config.ai.multimediaPrompt);
    }

    const buildConfig = { ...config, ai: { ...config.ai, systemPrompt: prompt } };
    delete buildConfig.ai.mockData;
    delete buildConfig.ai.multimediaPrompt;

    const html = template.replace(
      'const CONFIG=null;/*__BUILD__*/',
      'const CONFIG=' + JSON.stringify(buildConfig) + ';'
    );

    const dir = path.join(OUTPUT, config.id);
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, 'index.html'), html, 'utf8');
    catalog.push({
      id: config.id,
      name: config.brand.name,
      subtitle: config.brand.subtitle || '',
      avatar: config.brand.avatar,
      theme: config.theme
    });
    console.log(`  ✓ ${config.id}`);
    built++;
  } catch (err) {
    console.error(`  ✗ ${file}: ${err.message}`);
  }
}

// Generate index page
if (fs.existsSync(INDEX_TEMPLATE) && catalog.length > 0) {
  let idx = fs.readFileSync(INDEX_TEMPLATE, 'utf8');
  const cards = catalog.map(p => {
    const av = p.avatar || {};
    const colors = av.colors || [p.theme?.primary || '#25d366', p.theme?.primaryDark || '#128c7e'];
    const bg = `linear-gradient(145deg,${colors[0]},${colors[1]})`;
    let inner = '';
    if (av.type === 'emoji') inner = av.value;
    else if (av.type === 'initials') inner = `<span class="card-avatar-initials">${av.value}</span>`;
    else inner = '💬';
    const desc = p.subtitle ? p.subtitle.replace(/&/g,'&amp;').replace(/</g,'&lt;') : '';
    const name = (p.name || p.id).replace(/&/g,'&amp;').replace(/</g,'&lt;');
    return `<a class="card" href="/${p.id}/">`
      + `<div class="card-avatar" style="background:${bg}">${inner}</div>`
      + `<div class="card-info"><div class="card-name">${name}</div><div class="card-desc">${desc}</div></div>`
      + `<div class="card-arrow">›</div></a>`;
  }).join('\n    ');
  idx = idx.replace('<!--__CARDS__-->', cards);
  idx = idx.replace('<!--__COUNT__-->', `${catalog.length} prototipo${catalog.length === 1 ? '' : 's'} disponible${catalog.length === 1 ? '' : 's'}`);
  fs.writeFileSync(path.join(OUTPUT, 'index.html'), idx, 'utf8');
  console.log('  ✓ index (catalog)');
}

console.log(`\nBuild complete: ${built}/${files.length} prototypes.`);
