# Switches CRA entry to the modern dashboard for this session folder.
# Restores classic App.js when you run: .\start-dashboard-modern.ps1 -Restore

param([switch]$Restore)

$indexPath = Join-Path $PSScriptRoot "src\index.js"
$backupPath = Join-Path $PSScriptRoot "src\index.js.classic.bak"

if ($Restore) {
  if (Test-Path $backupPath) {
    Copy-Item $backupPath $indexPath -Force
    Write-Host "Restored classic index.js from backup."
  } else {
    Write-Host "No backup found at $backupPath"
  }
  exit 0
}

if (-not (Test-Path $backupPath)) {
  Copy-Item $indexPath $backupPath -Force
  Write-Host "Backed up index.js -> index.js.classic.bak"
}

@'
import React from 'react';
import { createRoot } from 'react-dom/client';
import AppDashboardModern from './src/AppDashboardModern';
import reportWebVitals from './src/reportWebVitals';

import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min';
import './src/index.css';

const container = document.getElementById('root');
const root = createRoot(container);
root.render(<AppDashboardModern />);

reportWebVitals();
'@ | Set-Content -Path $indexPath -Encoding UTF8

Write-Host "Modern dashboard enabled. Run: cd src; npm start"
Write-Host "Open http://localhost:3000/dashboard"
Write-Host "Restore classic UI: .\start-dashboard-modern.ps1 -Restore"
