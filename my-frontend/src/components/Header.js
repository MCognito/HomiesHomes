import React, { useState } from "react";
import { Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBars,
  faUser,
  faHouseChimney,
  faTachometerAlt,
  faSignOutAlt,
  faHeart,
  faPlus,
  faCode,
} from "@fortawesome/free-solid-svg-icons";
import logoImage from "../assets/logo.jpg";

/**
 * Site header with navigation and user menu
 * Shows different options based on user's role
 */
const Header = ({ userInfo, onLogout }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("home");

  // Toggle the profile dropdown open/closed
  const toggleProfileMenu = () => {
    setProfileOpen(!profileOpen);
  };

  // Close all menus when navigating
  const closeMenus = () => {
    setMenuOpen(false);
    setProfileOpen(false);
  };

  // Handle different ways the API might return user role
  const getUserLevel = () => {
    if (!userInfo) return -1;
    return userInfo.user_levels !== undefined
      ? userInfo.user_levels
      : userInfo.user_level;
  };

  const userLevel = getUserLevel();

  return (
    <header className="top-nav">
      <div className="logo">
        <Link to="/" className="logo-link" onClick={closeMenus}>
          <img src={logoImage} alt="HomiesHomes Logo" className="logo-img" />
          <span className="logo-text">HomiesHomes</span>
        </Link>
      </div>

      {/* Main navigation links */}
      <nav className={`nav-links ${menuOpen ? "open" : ""}`}>
        <Link to="/" onClick={closeMenus}>
          Home
        </Link>
        <Link to="/properties" onClick={closeMenus}>
          Properties
        </Link>

        {/* Agent-only option to add new properties */}
        {userInfo && userInfo.user_levels >= 1 && (
          <>
            <Link
              to="/AddProperty"
              className={
                activeTab === "add-property" ? "menu-item active" : "menu-item"
              }
              onClick={() => setActiveTab("add-property")}
            >
              Add Property
            </Link>
          </>
        )}

        {/* Only show favorites link when logged in */}
        {userInfo && (
          <Link to="/favourites" onClick={closeMenus}>
            <FontAwesomeIcon icon={faHeart} /> Favorites
          </Link>
        )}

        {/* Show dashboard for all logged-in users */}
        {userInfo && (
          <Link to="/dashboard" onClick={closeMenus}>
            <FontAwesomeIcon icon={faTachometerAlt} /> Dashboard
          </Link>
        )}
      </nav>

      <div className="nav-actions">
        {userInfo ? (
          <div className="profile-wrapper">
            {/* User profile dropdown trigger */}
            <div className={`profile-hover ${profileOpen ? "active" : ""}`}>
              <button className="profile-button" onClick={toggleProfileMenu}>
                <span className="profile-icon">
                  <FontAwesomeIcon icon={faUser} />
                </span>
                <span className="profile-name">{userInfo.username}</span>
              </button>

              {/* Profile dropdown menu */}
              <div className={`dropdown-menu ${profileOpen ? "show" : ""}`}>
                <div className="dropdown-user-info">
                  <strong>
                    {userInfo.user_firstName} {userInfo.user_lastName}
                  </strong>
                  <span className="user-role">
                    {userLevel === 2
                      ? "Administrator"
                      : userLevel === 1
                      ? "Agent"
                      : "User"}
                  </span>
                </div>

                <Link
                  to="/dashboard"
                  onClick={closeMenus}
                  className="dropdown-item"
                >
                  <FontAwesomeIcon icon={faTachometerAlt} /> Dashboard
                </Link>

                <button onClick={onLogout} className="dropdown-item logout-btn">
                  <FontAwesomeIcon icon={faSignOutAlt} /> Logout
                </button>
              </div>
            </div>
          </div>
        ) : (
          <button className="btn-outline">Sign in</button>
        )}

        {/* Mobile menu toggle */}
        <button className="burger" onClick={() => setMenuOpen((prev) => !prev)}>
          <FontAwesomeIcon icon={faBars} />
        </button>
      </div>
    </header>
  );
};

export default Header;
