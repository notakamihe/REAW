import { MemoryRouter as Router, Routes, Route } from 'react-router-dom';
import './styles/colors.css';
import './styles/App.css';
import { ClipboardProvider } from './context/ClipboardContext';
import { WorkstationProvider } from './context/WorkstationContext';
import Workstation from './pages/Workstation';
import { PreferencesProvider } from './context/PreferencesContext';
import PreferencesComponent from './components/PreferencesComponent';

export default function App() {
  return (
    <ClipboardProvider>
      <PreferencesProvider>
        <WorkstationProvider>
            <Router>
              <Routes>
                <Route path="/" element={<Workstation />} />
              </Routes>
            </Router>
            <PreferencesComponent />
        </WorkstationProvider>
      </PreferencesProvider>
    </ClipboardProvider>
  );
}
