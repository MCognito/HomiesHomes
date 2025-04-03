/**
 * Adds navigation links to API responses
 * Helps clients discover what they can do next
 */

const addHateoasLinks = async (ctx, next) => {
  // Let the route handler execute first
  await next();

  if (!ctx.body || typeof ctx.body !== "object") {
    return;
  }

  // Identify the user
  const user = ctx.state.user;

  // Permission levels:
  // -1 = not logged in
  // 0 = regular user
  // 1 = agent
  // 2 = admin
  const userLevel = user ? user.user_levels : -1;

  // Log who's accessing what
  if (userLevel === -1) {
    console.log(
      `HATEOAS: Unauthenticated request to ${ctx.request.URL.pathname}`
    );
    if (ctx.headers.authorization) {
      console.log(
        "HATEOAS: Authorization header is present but user not authenticated - token might be invalid"
      );
      // Check if token looks valid
      try {
        const jwt = require("jsonwebtoken");
        const { jwtSecret } = require("../config/env");
        const token = ctx.headers.authorization.split(" ")[1];
        const decoded = jwt.verify(token, jwtSecret);
        console.log("HATEOAS: Token seems valid:", decoded.username);
        // This helps spot auth pipeline bugs
      } catch (err) {
        console.log("HATEOAS: Failed to manually validate token:", err.message);
      }
    }
  } else {
    console.log(
      `HATEOAS: User ${user.username} (ID: ${user.user_id}) with level ${userLevel} accessed ${ctx.request.URL.pathname}`
    );
  }

  // Add special headers for agents and admins
  if (userLevel >= 1) {
    ctx.set("X-Agent-Access", "true");
  }
  if (userLevel >= 2) {
    ctx.set("X-Admin-Access", "true");
  }

  // Basic links anyone can use
  const publicLinks = {
    self: { href: ctx.request.URL.pathname, method: "GET" },
    properties: { href: "/properties", method: "GET", title: "All Properties" },
    login: { href: "/login", method: "POST", title: "Login" },
    register: { href: "/register", method: "POST", title: "Register" },
    documentation: {
      href: "/docs/openapi",
      method: "GET",
      title: "API Documentation",
    },
    schemas: { href: "/schemas", method: "GET", title: "API Schemas" },
    home: { href: "/", method: "GET", title: "API Root" },
  };

  // Links available to logged-in users
  const userLinks =
    userLevel >= 0
      ? {
          ...publicLinks,
          account: {
            href: `/users/${user.user_id}`,
            method: "GET",
            title: "My Account",
          },
          bookings: { href: "/bookings", method: "GET", title: "My Bookings" },
          create_booking: {
            href: "/bookings",
            method: "POST",
            title: "Create Booking",
          },
          favourites: {
            href: "/favourites",
            method: "GET",
            title: "My Favourites",
          },
          add_favourite: {
            href: "/favourites",
            method: "POST",
            title: "Add to Favourites",
          },
          logout: { href: "/logout", method: "POST", title: "Logout" },
        }
      : publicLinks;

  // Links available to agents
  const agentLinks =
    userLevel >= 1
      ? {
          ...userLinks,
          my_properties: {
            href: "/properties?agent_id=" + user.user_id,
            method: "GET",
            title: "My Properties",
          },
          add_property: {
            href: "/properties",
            method: "POST",
            title: "Add Property",
          },
          agent_bookings: {
            href: "/bookings?agent_id=" + user.user_id,
            method: "GET",
            title: "Property Bookings",
          },
        }
      : userLinks;

  // Links available to admins
  const adminLinks =
    userLevel >= 2
      ? {
          ...agentLinks,
          all_users: { href: "/users", method: "GET", title: "All Users" },
          agent_requests: {
            href: "/agent-requests",
            method: "GET",
            title: "Agent Requests",
          },
          system_stats: {
            href: "/stats",
            method: "GET",
            title: "System Statistics",
          },
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
      ([rel, link]) =>
        `<${link.href}>; rel="${rel}"; title="${link.title}"; method="${link.method}"`
    )
    .join(", ");

  ctx.set("Link", linkHeaderValue);

  // Format error responses nicely with links
  if (ctx.status >= 400) {
    if (typeof ctx.body === "object") {
      ctx.body = {
        error: {
          status: ctx.status,
          message: ctx.body.message || ctx.body.error || "An error occurred",
          details: ctx.body.details || null,
        },
        _links: links,
      };
    }
    return;
  }

  // Figure out what type of resource we're dealing with
  let resourceType = null;
  const path = ctx.request.URL.pathname;

  if (path.startsWith("/properties")) {
    resourceType = "property";
  } else if (path.startsWith("/bookings")) {
    resourceType = "booking";
  } else if (path.startsWith("/users")) {
    resourceType = "user";
  } else if (path.startsWith("/favourites")) {
    resourceType = "favourite";
  }

  // Wrap the response with metadata
  if (Array.isArray(ctx.body)) {
    ctx.body = {
      data: ctx.body,
      _links: links,
      _resource: resourceType,
      _timestamp: new Date().toISOString(),
      _count: ctx.body.length,
    };
  } else if (ctx.body.data) {
    // Keep existing structure but add links
    ctx.body = {
      ...ctx.body,
      _links: { ...(ctx.body._links || {}), ...links },
      _resource: resourceType,
      _timestamp: new Date().toISOString(),
      _count: Array.isArray(ctx.body.data) ? ctx.body.data.length : undefined,
    };
  } else {
    // add links to the response
    ctx.body = {
      ...ctx.body,
      _links: links,
      _resource: resourceType,
      _timestamp: new Date().toISOString(),
    };
  }

  // Log the result
  console.log(
    `HATEOAS links added for user level: ${userLevel} and path: ${path}`
  );
};

module.exports = { addHateoasLinks };
