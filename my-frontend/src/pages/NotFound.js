/**
 * 404 Page
 * error page when users hit a URL that doesn't exist
 */
import React from "react";
import { Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faHome,
  faSearch,
  faExclamationTriangle,
} from "@fortawesome/free-solid-svg-icons";

/**
 * Displays a 404 error with helpful navigation options
 * to guide users back to working parts of the site
 */
const NotFound = () => {
  return (
    <div className="not-found-container">
      <div className="not-found-content">
        {/* Warning icon */}
        <FontAwesomeIcon
          icon={faExclamationTriangle}
          className="not-found-icon"
        />
        <h1>404</h1>
        <h2>Page Not Found</h2>
        <p>We couldn't find the page you're looking for.</p>

        {/* Give the user some helpful navigation options */}
        <div className="not-found-actions">
          <Link to="/" className="primary-btn">
            <FontAwesomeIcon icon={faHome} /> Return to Home
          </Link>
          <Link to="/properties" className="secondary-btn">
            <FontAwesomeIcon icon={faSearch} /> Browse Properties
          </Link>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
