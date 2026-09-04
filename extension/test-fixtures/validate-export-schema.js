/**
 * Schema validation for learning loop exports
 * Ensures Studio and Extension exports have matching structure for pilot analysis
 */

const fs = require('fs');
const path = require('path');

const REQUIRED_FIELDS = [
  'version',
  'exportedAt',
  'surface',
  'context',
  'stats',
  'events'
];

const REQUIRED_CONTEXT_FIELDS = [
  'userId',
  'userName',
  'teamId',
  'repoUrl',
  'branch',
  'commitSha',
  'filePath'
];

const REQUIRED_STATS_FIELDS = [
  'total',
  'byType',
  'mostAppliedFixes',
  'mostDismissedRules',
  'policyChanges',
  'roundTrips'
];

function validateExport(data, source) {
  const errors = [];
  
  // Check top-level fields
  for (const field of REQUIRED_FIELDS) {
    if (!(field in data)) {
      errors.push(`${source}: Missing required field '${field}'`);
    }
  }
  
  // Check context fields
  if (data.context) {
    for (const field of REQUIRED_CONTEXT_FIELDS) {
      if (!(field in data.context)) {
        errors.push(`${source}: Missing context field '${field}'`);
      }
    }
  } else {
    errors.push(`${source}: Missing 'context' object`);
  }
  
  // Check stats fields
  if (data.stats) {
    for (const field of REQUIRED_STATS_FIELDS) {
      if (!(field in data.stats)) {
        errors.push(`${source}: Missing stats field '${field}'`);
      }
    }
  } else {
    errors.push(`${source}: Missing 'stats' object`);
  }
  
  // Check events is an array
  if (!Array.isArray(data.events)) {
    errors.push(`${source}: 'events' must be an array`);
  }
  
  // Check surface value
  if (data.surface && !['web-studio', 'vscode-extension'].includes(data.surface)) {
    errors.push(`${source}: 'surface' must be 'web-studio' or 'vscode-extension'`);
  }
  
  return errors;
}

// Validate both fixtures
const extensionFixture = JSON.parse(
  fs.readFileSync(path.join(__dirname, 'learning-loop-export.json'), 'utf-8')
);

const studioFixture = JSON.parse(
  fs.readFileSync(path.join(__dirname, '../../test-fixtures/learning-loop-export-studio.json'), 'utf-8')
);

const extensionErrors = validateExport(extensionFixture, 'Extension');
const studioErrors = validateExport(studioFixture, 'Studio');

const allErrors = [...extensionErrors, ...studioErrors];

if (allErrors.length > 0) {
  console.error('❌ Schema validation failed:\n');
  allErrors.forEach(error => console.error(`  - ${error}`));
  process.exit(1);
} else {
  console.log('✓ Schema validation passed');
  console.log(`  - Extension fixture: ${extensionFixture.stats.total} events`);
  console.log(`  - Studio fixture: ${studioFixture.stats.total} events`);
  console.log(`  - Both exports have matching schema fields`);
}
