import { ThemeProvider } from '@emotion/react';
import { MemoryRouter as Router, Switch, Route } from 'react-router-dom';
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
              <Switch>
                <Route path="/" component={Workstation} />
              </Switch>
            </Router>
        </WorkstationProvider>
      </ClipboardProvider>
    </ThemeProvider>
  );
}
