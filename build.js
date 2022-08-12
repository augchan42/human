const fs = require('fs');
const path = require('path');
const log = require('@vladmandic/pilogger');
const Build = require('@vladmandic/build').Build;
const APIExtractor = require('@microsoft/api-extractor');
const tf = require('@tensorflow/tfjs-node');
const package = require('./package.json');

const modelsOut = 'models/models.json';
const modelsFolders = [
  './models',
  '../human-models/models',
  '../blazepose/model/',
  '../anti-spoofing/model',
  '../efficientpose/models',
  '../insightface/models',
  '../movenet/models',
  '../nanodet/models',
];

const apiExtractorIgnoreList = [ // eslint-disable-line @typescript-eslint/no-unused-vars
  'ae-missing-release-tag',
  'tsdoc-param-tag-missing-hyphen',
  'tsdoc-escape-right-brace',
  'tsdoc-undefined-tag',
  'tsdoc-escape-greater-than',
  'ae-unresolved-link',
  'ae-forgotten-export',
  'tsdoc-malformed-inline-tag',
  'tsdoc-unnecessary-backslash',
];

function copy(src, dst) {
  if (!fs.existsSync(src)) return;
  const buffer = fs.readFileSync(src);
  fs.writeFileSync(dst, buffer);
}

async function analyzeModels() {
  log.info('Analyze models:', { folders: modelsFolders.length, result: modelsOut });
  let totalSize = 0;
  const models = {};
  const allModels = [];
  for (const folder of modelsFolders) {
    try {
      if (!fs.existsSync(folder)) continue;
      const stat = fs.statSync(folder);
      if (!stat.isDirectory) continue;
      const dir = fs.readdirSync(folder);
      const found = dir.map((f) => `file://${folder}/${f}`).filter((f) => f.endsWith('json'));
      log.state('Models', { folder, models: found.length });
      allModels.push(...found);
    } catch {
      // log.warn('Cannot enumerate:', modelFolder);
    }
  }
  for (const url of allModels) {
    // if (!f.endsWith('.json')) continue;
    // const url = `file://${modelsDir}/${f}`;
    const model = new tf.GraphModel(url); // create model prototype and decide if load from cache or from original modelurl
    model.findIOHandler();
    const artifacts = await model.handler.load();
    const size = artifacts?.weightData?.byteLength || 0;
    totalSize += size;
    const name = path.basename(url).replace('.json', '');
    if (!models[name]) models[name] = size;
  }
  const json = JSON.stringify(models, null, 2);
  fs.writeFileSync(modelsOut, json);
  log.state('Models:', { count: Object.keys(models).length, totalSize });
}

async function main() {
  log.data('Build', { name: package.name, version: package.version });
  // generate model signature
  await analyzeModels();
  // run production build
  const build = new Build();
  await build.run('production');
  // patch tfjs typedefs
  log.state('Copy:', { input: 'tfjs/tfjs.esm.d.ts' });
  copy('tfjs/tfjs.esm.d.ts', 'types/lib/dist/tfjs.esm.d.ts');
  // run api-extractor to create typedef rollup
  const extractorConfig = APIExtractor.ExtractorConfig.loadFileAndPrepare('api-extractor.json');
  const extractorResult = APIExtractor.Extractor.invoke(extractorConfig, {
    localBuild: true,
    showVerboseMessages: false,
    messageCallback: (msg) => {
      msg.handled = true;
      if (msg.logLevel === 'none' || msg.logLevel === 'verbose' || msg.logLevel === 'info') return;
      if (msg.sourceFilePath?.includes('/node_modules/')) return;
      // if (apiExtractorIgnoreList.reduce((prev, curr) => prev || msg.messageId.includes(curr), false)) return; // those are external issues outside of human control
      log.data('API', { level: msg.logLevel, category: msg.category, id: msg.messageId, file: msg.sourceFilePath, line: msg.sourceFileLine, text: msg.text });
    },
  });
  log.state('API-Extractor:', { succeeeded: extractorResult.succeeded, errors: extractorResult.errorCount, warnings: extractorResult.warningCount });
  // distribute typedefs
  log.state('Copy:', { input: 'types/human.d.ts' });
  copy('types/human.d.ts', 'dist/human.esm-nobundle.d.ts');
  copy('types/human.d.ts', 'dist/human.esm.d.ts');
  copy('types/human.d.ts', 'dist/human.d.ts');
  copy('types/human.d.ts', 'dist/human.node-gpu.d.ts');
  copy('types/human.d.ts', 'dist/human.node.d.ts');
  copy('types/human.d.ts', 'dist/human.node-wasm.d.ts');
  log.info('Human Build complete...');
}

main();
