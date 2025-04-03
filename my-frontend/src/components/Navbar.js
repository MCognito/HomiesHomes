import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faPlus,
  faHome,
  faUserCircle,
  faUserShield,
  faSignOutAlt,
} from "@fortawesome/free-solid-svg-icons";

/**
 * Navigation bar component
 * Shows different options based on user's role
 */
const Navbar = () => {
  const [token, setToken] = useState(null);
  const [userInfo, setUserInfo] = useState(null);

  useEffect(() => {
    setToken(true);
  }, []);

  useEffect(() => {
    setUserInfo({ user_levels: 1 });
  }, []);

  const handleLogout = () => {
    console.log("User logged out");
  };

  return (
    <nav className="navbar">
      {token && userInfo && (
        <>
          {/* Agent and admin options */}
          {userInfo.user_levels >= 1 && (
            <>
              <Link to="/addProperty" className="nav-link">
                <FontAwesomeIcon icon={faPlus} /> Add Property
              </Link>
              <Link to="/agent-dashboard/properties" className="nav-link">
                <FontAwesomeIcon icon={faHome} /> My Properties
              </Link>
            </>
          )}

          {/* Everyone has access to their dashboard */}
          <Link to="/dashboard" className="nav-link">
            <FontAwesomeIcon icon={faUserCircle} /> Dashboard
          </Link>

          {/* Special admin section */}
          {userInfo.user_levels === 2 && (
            <Link to="/admin" className="nav-link">
              <FontAwesomeIcon icon={faUserShield} /> Admin
            </Link>
          )}

          <button className="nav-link logout-btn" onClick={handleLogout}>
            <FontAwesomeIcon icon={faSignOutAlt} /> Logout
          </button>
        </>
      )}
    </nav>
  );
};

export default Navbar;
