#!/usr/bin/env node
/* eslint-disable no-undef */

/**
 * Validate pilot pack export schema
 * Usage: node test-fixtures/validate-pilot-pack-schema.js <export-file.json>
 */

const fs = require('fs');
const path = require('path');

const REQUIRED_FIELDS = {
  root: ['exportType', 'exportedAt', 'specVersion', 'surface', 'context', 'executiveSummary', 'killCriteria', 'activationMetrics'],
  context: ['facilitatorMode', 'sessionUrl'],
  executiveSummary: ['totalSessions', 'recommendation', 'reason', 'toplineMetrics'],
  toplineMetrics: ['veryInterested', 'pilotWilling', 'activationRate', 'receiptActionsPerSession'],
  killCriteria: ['sessionsCompleted', 'sessionsTarget', 'veryInterested', 'veryTarget', 'decision'],
  activationMetrics: ['sessionsWithActivation', 'totalSessions', 'activationRate', 'canvasToCodeRoundTrips', 'codeToCanvasRoundTrips']
};

function validateSchema(data) {
  const errors = [];
  
  // Check root fields
  for (const field of REQUIRED_FIELDS.root) {
    if (!(field in data)) {
      errors.push(`Missing root field: ${field}`);
    }
  }
  
  // Check exportType
  if (data.exportType !== 'pilot-pack' && data.exportType !== 'validation-session') {
    errors.push(`Invalid exportType: ${data.exportType} (expected 'pilot-pack' or 'validation-session')`);
  }
  
  // Check context fields
  if (data.context) {
    for (const field of REQUIRED_FIELDS.context) {
      if (!(field in data.context)) {
        errors.push(`Missing context.${field}`);
      }
    }
  }
  
  // Check executiveSummary fields (pilot-pack only)
  if (data.exportType === 'pilot-pack' && data.executiveSummary) {
    for (const field of REQUIRED_FIELDS.executiveSummary) {
      if (!(field in data.executiveSummary)) {
        errors.push(`Missing executiveSummary.${field}`);
      }
    }
    
    if (data.executiveSummary.toplineMetrics) {
      for (const field of REQUIRED_FIELDS.toplineMetrics) {
        if (!(field in data.executiveSummary.toplineMetrics)) {
          errors.push(`Missing executiveSummary.toplineMetrics.${field}`);
        }
      }
    }
  }
  
  // Check killCriteria fields
  if (data.killCriteria) {
    for (const field of REQUIRED_FIELDS.killCriteria) {
      if (!(field in data.killCriteria)) {
        errors.push(`Missing killCriteria.${field}`);
      }
    }
    
    // Validate decision values
    const validDecisions = ['GO', 'CONTINUE', 'NO-GO'];
    if (data.killCriteria.decision && !validDecisions.includes(data.killCriteria.decision)) {
      errors.push(`Invalid killCriteria.decision: ${data.killCriteria.decision} (expected GO, CONTINUE, or NO-GO)`);
    }
  }
  
  // Check activationMetrics fields
  if (data.activationMetrics) {
    for (const field of REQUIRED_FIELDS.activationMetrics) {
      if (!(field in data.activationMetrics)) {
        errors.push(`Missing activationMetrics.${field}`);
      }
    }
  }
  
  return errors;
}

function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.error('Usage: node validate-pilot-pack-schema.js <export-file.json>');
    process.exit(1);
  }
  
  const filePath = path.resolve(args[0]);
  
  if (!fs.existsSync(filePath)) {
    console.error(`File not found: ${filePath}`);
    process.exit(1);
  }
  
  let data;
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    data = JSON.parse(content);
  } catch (err) {
    console.error(`Failed to parse JSON: ${err.message}`);
    process.exit(1);
  }
  
  const errors = validateSchema(data);
  
  if (errors.length === 0) {
    console.log('✓ Schema validation passed');
    console.log(`  Export type: ${data.exportType}`);
    console.log(`  Surface: ${data.surface}`);
    console.log(`  Sessions: ${data.killCriteria?.sessionsCompleted || data.feedback?.summary?.total || 0}`);
    if (data.executiveSummary) {
      console.log(`  Recommendation: ${data.executiveSummary.recommendation}`);
      console.log(`  Activation rate: ${data.executiveSummary.toplineMetrics?.activationRate || 'N/A'}`);
    }
    process.exit(0);
  } else {
    console.error('✗ Schema validation failed:');
    errors.forEach(err => console.error(`  - ${err}`));
    process.exit(1);
  }
}

main();
