/**
 * Data Import Script
 * Imports the official Lingshan scenic area data package
 */

const path = require('node:path');
const fs = require('node:fs/promises');

// Import services
const {
  OfficialDataManifestStore,
} = require('../services/scenicGuide/officialDataManifestStore');
const {
  ScenicKnowledgeStore,
} = require('../services/scenicGuide/scenicKnowledgeStore');
const {
  OfficialDataImporter,
} = require('../services/scenicGuide/officialDataImporter');

// Mock Electron app
const mockApp = {
  getPath: (name) => {
    if (name === 'userData') {
      return path.join(process.cwd(), 'eval-data');
    }
    return process.cwd();
  },
};

// Configuration
const DATA_DIR = path.join(process.cwd(), 'eval-data');
const BASE_DIR = process.cwd();

// Official data files
const OFFICIAL_DATA_DIR = BASE_DIR;
const STRUCTURED_DATA_FILE = path.join(OFFICIAL_DATA_DIR, '灵山胜境 景点结构化数据集.docx');
const GUIDE_DATA_FILE = path.join(OFFICIAL_DATA_DIR, '灵山胜境：历史、文化、景点特色与个性化游览指南.docx');
const BEHAVIOR_DATA_FILE = path.join(OFFICIAL_DATA_DIR, '景点景区旅游数据行为分析数据.xlsx');

let manifestStore;
let knowledgeStore;
let officialDataImporter;

async function initialize() {
  console.log('🚀 Initializing data import environment...\n');

  // Create data directory
  await fs.mkdir(DATA_DIR, { recursive: true });

  // Initialize manifest store
  manifestStore = new OfficialDataManifestStore({
    app: mockApp,
    storeFilePath: path.join(DATA_DIR, 'manifest.json'),
  });
  await manifestStore.init();
  console.log('✓ Manifest store initialized');

  // Initialize knowledge store
  knowledgeStore = new ScenicKnowledgeStore({
    app: mockApp,
    storeFilePath: path.join(DATA_DIR, 'knowledge.json'),
  });
  await knowledgeStore.init();
  console.log('✓ Knowledge store initialized');

  // Initialize official data importer
  officialDataImporter = new OfficialDataImporter({
    manifestStore,
    knowledgeStore,
  });
  console.log('✓ Official data importer initialized');

  console.log('\n✅ Initialization complete!\n');
}

async function importOfficialData() {
  console.log('📂 Importing official data package...\n');

  // Check if files exist
  console.log('Checking data files:');
  try {
    await fs.access(STRUCTURED_DATA_FILE);
    console.log(`  ✓ ${STRUCTURED_DATA_FILE}`);
  } catch {
    console.error(`  ✗ ${STRUCTURED_DATA_FILE} - NOT FOUND`);
    process.exit(1);
  }

  try {
    await fs.access(GUIDE_DATA_FILE);
    console.log(`  ✓ ${GUIDE_DATA_FILE}`);
  } catch {
    console.error(`  ✗ ${GUIDE_DATA_FILE} - NOT FOUND`);
    process.exit(1);
  }

  try {
    await fs.access(BEHAVIOR_DATA_FILE);
    console.log(`  ✓ ${BEHAVIOR_DATA_FILE}`);
  } catch {
    console.error(`  ✗ ${BEHAVIOR_DATA_FILE} - NOT FOUND`);
    process.exit(1);
  }

  console.log('\nStarting import...\n');

  // Import all data at once
  const result = await officialDataImporter.importOfficialData({
    directoryPath: OFFICIAL_DATA_DIR,
  });

  if (!result.ok) {
    console.error('\n❌ Import failed:');
    console.error(`  ${result.error?.message || 'Unknown error'}`);
    process.exit(1);
  }

  console.log('✓ Import successful\n');

  // Get summary
  console.log('📊 Import Summary:');
  const summary = knowledgeStore.getSummary();
  console.log(`  - Total Spots: ${summary.totalSpots || 0}`);
  console.log(`  - Total Routes: ${summary.totalRoutes || 0}`);
  console.log(`  - Total Knowledge Blocks: ${summary.totalBlocks || 0}`);

  const manifest = manifestStore.getManifest();
  if (manifest) {
    console.log(`  - Import Date: ${manifest.importSummary?.importDate || new Date().toISOString()}`);
  }

  console.log('\n✅ Data import complete!\n');
}

async function main() {
  try {
    await initialize();
    await importOfficialData();
    console.log('🎉 All data imported successfully!');
    console.log('\nYou can now run the evaluation:');
    console.log('  node desktop/electron/scripts/run-evaluation.js\n');
  } catch (error) {
    console.error('\n❌ Import failed:', error);
    process.exit(1);
  }
}

main();
