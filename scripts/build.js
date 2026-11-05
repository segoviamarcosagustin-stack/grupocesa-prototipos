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

let built = 0;
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
    console.log(`  ✓ ${config.id}`);
    built++;
  } catch (err) {
    console.error(`  ✗ ${file}: ${err.message}`);
  }
}

console.log(`\nBuild complete: ${built}/${files.length} prototypes.`);
