import { ThemeProvider } from '@emotion/react';
import { MemoryRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';
import { ClipboardProvider } from './context/ClipboardContext';
import { WorkstationProvider } from './context/WorkstationContext';
import Workstation from './pages/Workstation';
import theme from './theme';

export default function App() {
  return (
    <ThemeProvider theme={theme}>
      <ClipboardProvider>
        <WorkstationProvider>
            <Router>
              <Routes>
                <Route path="/" element={<Workstation />} />
              </Routes>
            </Router>
        </WorkstationProvider>
      </ClipboardProvider>
    </ThemeProvider>
  );
}
