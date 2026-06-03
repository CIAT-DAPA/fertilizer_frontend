import React, { Component } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Provider } from 'react-redux';

import AppShellLayout from './components/layout/AppShellLayout';
import FloatingChatbotIcon from './components/FloatingChatbotIcon';

import Home from './pages/home/Home';
import About from './pages/about/About';
import Fertilization from './pages/fertilization/Fertilization';
import FertilizationUreaNPS from './pages/fertilization/FertilizationUreaNPS';
import ISFM from './pages/isfm/ISFM';
import Agroclimate from './pages/agroclimate/Agroclimate';
import PestDisease from './pages/pest_disease/PestDisease';
import CSA from './pages/csa/CSA';
import Irrigation from './pages/irrigation/Irrigation';
import Mechanization from './pages/mechanization/Mechanization';
import BundledAAS from './pages/bundled_aas/BundledAAS';
import Report from './pages/report/Report';
import ReportWoreda from './pages/report_woreda/ReportWoreda';
import WheatRust from './pages/wheat_rust/WheatRust';
import Lime from './pages/lime/Lime';
import Methodology from './pages/methodology/Methodology';
import CountrySelection from './pages/country_selection/CountrySelection';
import Partners from './pages/partners/Partners';
import Chatbot from './pages/chatbot/Chatbot';
import FertilizerLookup from './pages/fertilizer_lookup/FertilizerLookup';

import DashboardHomeModern from './pages/dashboard/DashboardHomeModern';
import DashboardLocation from './pages/dashboard/DashboardLocation';
import DashboardAdvisories from './pages/dashboard/DashboardAdvisories';
import DashboardInsights from './pages/dashboard/DashboardInsights';
import DashboardMetrics from './pages/dashboard/DashboardMetrics';

import store from './redux/store/store';
import './App.css';

/**
 * Dashboard shell with public access and browser-cached location preferences.
 */
class AppDashboardAuth extends Component {
  render() {
    return (
      <Provider store={store}>
        <Router>
          <Routes>
            <Route element={<AppShellLayout />}>
              <Route path="/dashboard" element={<DashboardHomeModern />} />
              <Route path="/dashboard/location" element={<DashboardLocation />} />
                <Route path="/dashboard/advisories" element={<DashboardAdvisories />} />
                <Route path="/dashboard/metrics" element={<DashboardMetrics />} />
                <Route path="/dashboard/insights" element={<DashboardInsights />} />

                <Route path="/" element={<CountrySelection />} />
                <Route path="/country_selected/:country/:id" element={<Home />} />
                <Route path="/fertilizer_advisories" element={<Fertilization />} />
                <Route path="/fertilizer_advisories_nps_urea" element={<FertilizationUreaNPS />} />
                <Route path="/isfm" element={<ISFM />} />
                <Route path="/agroclimate" element={<Agroclimate />} />
                <Route path="/lime" element={<Lime />} />
                <Route path="/pest_disease" element={<PestDisease />} />
                <Route path="/csa" element={<CSA />} />
                <Route path="/irrigation" element={<Irrigation />} />
                <Route path="/mechanization" element={<Mechanization />} />
                <Route path="/bundled_aas" element={<BundledAAS />} />
                <Route path="/wheat_rust" element={<WheatRust />} />
                <Route path="/report" element={<Report />} />
                <Route path="/report_woreda" element={<ReportWoreda />} />
                <Route path="/methodology" element={<Methodology />} />
                <Route path="/about" element={<About />} />
                <Route path="/partners" element={<Partners />} />
                <Route path="/chatbot" element={<Chatbot />} />
                <Route path="/fertilizer_lookup" element={<FertilizerLookup />} />
              </Route>
            </Routes>

          <FloatingChatbotIcon />
        </Router>
      </Provider>
    );
  }
}

export default AppDashboardAuth;
