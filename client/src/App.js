import React from 'react';

import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
} from 'react-router-dom';

import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';

import PrivateLayout from './components/PrivateLayout';

import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Finance from './pages/Finance';
import FocusTimer from './pages/FocusTimer';
import Activities from './pages/Activities';
import Achievements from './pages/Achievements';
import ProductivityAnalytics from './pages/ProductivityAnalytics';
import Settings from './pages/Settings';

import TodaysPlan from './pages/TodaysPlan';
import DailyGoals from './pages/DailyGoals';

function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <BrowserRouter>

          <Routes>

            {/* PUBLIC ROUTES */}

            <Route
              path="/login"
              element={<Login />}
            />

            <Route
              path="/register"
              element={<Register />}
            />

            {/* PRIVATE ROUTES */}

            <Route element={<PrivateLayout />}>

              <Route
                path="/"
                element={
                  <Navigate
                    to="/dashboard"
                    replace
                  />
                }
              />

              <Route
                path="/dashboard"
                element={<Dashboard />}
              />

              <Route
                path="/finance"
                element={<Finance />}
              />

              <Route
                path="/focus"
                element={<FocusTimer />}
              />

              <Route
                path="/activities"
                element={<Activities />}
              />

              <Route
                path="/achievements"
                element={<Achievements />}
              />

              <Route
                path="/analytics"
                element={<ProductivityAnalytics />}
              />

              <Route
                path="/settings"
                element={<Settings />}
              />

              {/* TODAY'S PLAN */}

              <Route
                path="/todays-plan"
                element={<TodaysPlan />}
              />

              {/* DAILY GOALS */}

              <Route
                path="/daily-goals"
                element={<DailyGoals />}
              />

            </Route>

            {/* UNKNOWN ROUTES */}

            <Route
              path="*"
              element={
                <Navigate
                  to="/dashboard"
                  replace
                />
              }
            />

          </Routes>

        </BrowserRouter>
      </ToastProvider>
    </AuthProvider>
  );
}

export default App;


