import React, { useEffect } from 'react';
import { Provider } from 'react-redux';
import { store } from './store/store';
import './styles/App.css';
import './styles/mobile.css';
import AppContainer from './components/AppContainer';

/**
 * Main Application Component
 * 
 * This component serves as the root of the HTML to PPTX converter application.
 * It provides the Redux store context to all child components.
 * 
 * Requirements:
 * - 5.1: Clear visual feedback on the current state of the process
 */
const App: React.FC = () => {
  return (
    <Provider store={store}>
      <AppContainer />
    </Provider>
  );
};

export default App;
