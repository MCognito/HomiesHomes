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
} from "@fortawesome/free-solid-svg-icons";
import logoImage from "../assets/logo.jpg";

const Header = ({ userInfo, onLogout }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const toggleProfileMenu = () => {
    setProfileOpen(!profileOpen);
  };

  const closeMenus = () => {
    setMenuOpen(false);
    setProfileOpen(false);
  };

  return (
    <header className="top-nav">
      <div className="logo">
        <Link to="/" className="logo-link" onClick={closeMenus}>
          <img src={logoImage} alt="HomiesHomes Logo" className="logo-img" />
          <span className="logo-text">HomiesHomes</span>
        </Link>
      </div>

      <nav className={`nav-links ${menuOpen ? "open" : ""}`}>
        <Link to="/" onClick={closeMenus}>
          Home
        </Link>
        <Link to="/properties" onClick={closeMenus}>
          Properties
        </Link>

        {userInfo && userInfo.user_level >= 1 && (
          <Link to="/AddProperty" onClick={closeMenus}>
            <FontAwesomeIcon icon={faPlus} /> Add Property
          </Link>
        )}

        {userInfo && (
          <Link to="/favourites" onClick={closeMenus}>
            <FontAwesomeIcon icon={faHeart} /> Favorites
          </Link>
        )}

        {userInfo && (
          <Link to="/dashboard" onClick={closeMenus}>
            <FontAwesomeIcon icon={faTachometerAlt} /> Dashboard
          </Link>
        )}
      </nav>

      <div className="nav-actions">
        {userInfo ? (
          <div className="profile-wrapper">
            <div className={`profile-hover ${profileOpen ? "active" : ""}`}>
              <button className="profile-button" onClick={toggleProfileMenu}>
                <span className="profile-icon">
                  <FontAwesomeIcon icon={faUser} />
                </span>
                <span className="profile-name">{userInfo.username}</span>
              </button>

              <div className={`dropdown-menu ${profileOpen ? "show" : ""}`}>
                <div className="dropdown-user-info">
                  <strong>
                    {userInfo.user_firstName} {userInfo.user_lastName}
                  </strong>
                  <span className="user-role">
                    {userInfo.user_level === 2
                      ? "Administrator"
                      : userInfo.user_level === 1
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

        <button className="burger" onClick={() => setMenuOpen((prev) => !prev)}>
          <FontAwesomeIcon icon={faBars} />
        </button>
      </div>
    </header>
  );
};

export default Header;
