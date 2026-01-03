import React from 'react';
import ApplicationForm from './components/ApplicationForm';
import './App.css';

function App() {
  return (
    <div className="app">
      <header>
        <h1>Welcome to Our Job Application Portal</h1>
        <p>Join our team and apply for exciting opportunities!</p>
      </header>
      <main>
        <ApplicationForm />
      </main>
      <footer>
        <p>&copy; 2023 Company Name. All rights reserved.</p>
      </footer>
    </div>
  );
}

export default App;