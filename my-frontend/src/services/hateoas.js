/**
 * HATEOAS Navigation Helper
 *
 * Makes it easier to work with the navigation links our API returns.
 * These links help tell the frontend what actions are possible for each resource.
 */

import API_BASE_URL from "../config/api";

/**
 * Pull out all navigation links from an API response
 */
export const extractLinks = (response) => {
  if (!response) return {};

  const links = response._links || {};

  return links;
};

/**
 * Get the full URL for a specific link by its name
 * Handles both relative and absolute URLs
 */
export const getLink = (links, rel) => {
  if (!links || !links[rel]) return null;

  const link = links[rel];

  // API might return links in different formats
  const href = typeof link === "string" ? link : link.href;

  // Add the base URL if we got a relative path
  if (href.startsWith("http")) {
    return href;
  }

  return `${API_BASE_URL}${href}`;
};

/**
 * Quick check if a particular action is available
 * Useful for showing/hiding UI elements based on permissions
 */
export const hasLink = (links, rel) => {
  if (!links) return false;
  return !!links[rel];
};

/**
 * Get a complete list of everything the user can do with this resource
 */
export const getAvailableActions = (links) => {
  if (!links) return [];

  return Object.entries(links).map(([rel, link]) => {
    const linkObj = typeof link === "string" ? { href: link } : link;
    return {
      rel,
      href: linkObj.href,
      title: linkObj.title || rel,
      method: linkObj.method || "GET",
    };
  });
};

/**
 * Add full URLs to all the links in a resource
 * Makes it easier to use them without having to build the URLs each time
 */
export const enhanceResourceWithLinks = (resource) => {
  if (!resource || !resource._links) return resource;

  const enhancedLinks = {};

  Object.entries(resource._links).forEach(([rel, link]) => {
    const linkObj = typeof link === "string" ? { href: link } : link;
    enhancedLinks[rel] = {
      ...linkObj,
      fullUrl: linkObj.href.startsWith("http")
        ? linkObj.href
        : `${API_BASE_URL}${linkObj.href}`,
    };
  });

  return {
    ...resource,
    _links: enhancedLinks,
  };
};
