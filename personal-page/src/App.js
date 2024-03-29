import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import HomePage from './components/HomePage.js';
import Navbar from './components/NavBar.js';

import './App.css';



function App() {
  return (
    
    <Router>
      <div className="App">
        <Navbar />
        <Routes>
          <Route path="/" element={<HomePage />} />
        </Routes>
      
    </div>
    </Router>
  );
}

export default App;
