#!/usr/bin/env node
/**
 * Script to inject environment variables into app.json for Expo builds
 * This ensures EXPO_PUBLIC_* variables are available at build time
 */

const fs = require('fs');
const path = require('path');

const appJsonPath = path.join(__dirname, '..', 'app.json');
const appJson = JSON.parse(fs.readFileSync(appJsonPath, 'utf8'));

// Get EXPO_PUBLIC_* environment variables
const envVars = {};
Object.keys(process.env).forEach(key => {
  if (key.startsWith('EXPO_PUBLIC_')) {
    envVars[key] = process.env[key];
  }
});

// Inject into app.json extra field
if (!appJson.expo.extra) {
  appJson.expo.extra = {};
}

// Merge with existing extra (don't overwrite)
appJson.expo.extra = {
  ...appJson.expo.extra,
  ...envVars,
};

// Write back to app.json
fs.writeFileSync(appJsonPath, JSON.stringify(appJson, null, 2), 'utf8');

console.log('✅ Injected environment variables into app.json:', Object.keys(envVars).join(', '));

