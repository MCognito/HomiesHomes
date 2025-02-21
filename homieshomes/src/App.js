import React from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import PropertyList from "./components/PropertyList";
import PropertyDetails from "./components/PropertyDetails";
import "./App.css"; // Import custom CSS for styling

const App = () => {
  return (
    <Router>
      <div className="app-container">
        {/* Navbar Section */}
        <nav className="navbar">
          <div className="logo">
            <img src="/path-to-your-logo.png" alt="HomiesHomes Logo" className="logo-img" />
          </div>
          <ul className="navbar-links">
            <li><a href="/" className="navbar-link">Home</a></li>
            <li><a href="/about" className="navbar-link">About</a></li>
            <li><a href="/contact" className="navbar-link">Contact</a></li>
          </ul>
        </nav>

        {/* Hero Section */}
        <section className="hero">
          <div className="hero-content">
            <h1 className="hero-title">Find Your Dream Home with HomiesHomes</h1>
            <p className="hero-subtitle">Explore properties for sale or rent in your area.</p>
            <button className="cta-button">Browse Properties</button>
          </div>
        </section>

        {/* Property Listings Section */}
        <main className="content">
          <Routes>
            <Route path="/" element={<PropertyList />} />
            <Route path="/property/:id" element={<PropertyDetails />} />
          </Routes>
        </main>

        {/* Footer Section */}
        <footer className="footer">
          <p>&copy; 2025 HomiesHomes Estate Agency</p>
        </footer>
      </div>
    </Router>
  );
};

export default App;
