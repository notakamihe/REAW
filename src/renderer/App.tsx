import { MemoryRouter as Router, Switch, Route } from 'react-router-dom';
import './App.css';
import { WorkstationProvider } from './context/WorkstationContext';
import Workstation from './pages/Workstation';

export default function App() {
  return (
    <WorkstationProvider>
      <Router>
        <Switch>
          <Route path="/" component={Workstation} />
        </Switch>
      </Router>
    </WorkstationProvider>
  );
}
