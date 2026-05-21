/**
 * Modern dashboard entry point for Create React App.
 *
 * To run: temporarily replace src/index.js with this file's contents,
 * or copy this file to src/index.js (see RUN_DASHBOARD.md).
 */
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
