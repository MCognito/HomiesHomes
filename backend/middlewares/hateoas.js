/**
 * HATEOAS middleware for adding role-based links to API responses
 * This adds links based on the user's role (user, agent, admin)
 */

const addHateoasLinks = async (ctx, next) => {
  // Process the request first
  await next();

  // Skip if response is not an object or is missing
  if (!ctx.body || typeof ctx.body !== "object") {
    return;
  }

  // Get user info from state (if authenticated)
  const user = ctx.state.user;
  const userLevel = user ? user.user_levels : -1;

  // Set role-based custom headers for CORS
  if (userLevel >= 1) {
    ctx.set("X-Agent-Access", "true");
  }
  if (userLevel >= 2) {
    ctx.set("X-Admin-Access", "true");
  }

  // Generate API links based on user level
  // Links available to all (public)
  const publicLinks = {
    self: { href: ctx.request.URL.pathname, method: "GET" },
    properties: { href: "/properties", method: "GET" },
    login: { href: "/login", method: "POST" },
    register: { href: "/register", method: "POST" },
  };

  // Links available to logged-in users
  const userLinks =
    userLevel >= 0
      ? {
          ...publicLinks,
          account: { href: `/users/${user.user_id}`, method: "GET" },
          bookings: { href: "/bookings", method: "GET" },
          favourites: { href: "/favourites", method: "GET" },
          logout: { href: "/logout", method: "POST" },
        }
      : publicLinks;

  // Links available to agents
  const agentLinks =
    userLevel >= 1
      ? {
          ...userLinks,
          manageProperties: { href: "/properties/manage", method: "GET" },
          addProperty: { href: "/properties", method: "POST" },
          agentBookings: { href: "/bookings/agent", method: "GET" },
          agentDashboard: { href: "/agent", method: "GET" },
        }
      : userLinks;

  // Links available to admins
  const adminLinks =
    userLevel >= 2
      ? {
          ...agentLinks,
          allUsers: { href: "/users", method: "GET" },
          manageUsers: { href: "/users/manage", method: "GET" },
          adminDashboard: { href: "/admin", method: "GET" },
          systemStats: { href: "/stats", method: "GET" },
        }
      : agentLinks;

  // Select the appropriate links based on user level
  const links =
    userLevel >= 2
      ? adminLinks
      : userLevel >= 1
      ? agentLinks
      : userLevel >= 0
      ? userLinks
      : publicLinks;

  // Set Link header for HATEOAS (RFC 8288)
  const linkHeaderValue = Object.entries(links)
    .map(
      ([rel, link]) => `<${link.href}>; rel="${rel}"; method="${link.method}"`
    )
    .join(", ");

  ctx.set("Link", linkHeaderValue);

  // Add links to the response body
  if (Array.isArray(ctx.body)) {
    ctx.body = { data: ctx.body, _links: links };
  } else if (ctx.body.data) {
    // If data is already structured
    ctx.body._links = { ...(ctx.body._links || {}), ...links };
  } else {
    // Add links to the response
    ctx.body = { ...ctx.body, _links: links };
  }

  // Log that HATEOAS links were added
  console.log(`HATEOAS links added for user level: ${userLevel}`);
};

module.exports = { addHateoasLinks };
