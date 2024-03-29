// Navbar.js

import React from 'react';
import "./NavBar.css"

const Navbar = () => {
  return (
    <div className="navbar">
      <ul>
        <li><a href="#home">Home</a></li>
        <li><a href="#about">About Me</a></li>
        <li><a href="#portfolio">Portfolio</a></li>
        <li><a href="#contact">Contact</a></li>
      </ul>
    </div>
  );
};

export default Navbar;
