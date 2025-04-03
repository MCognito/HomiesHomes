const Router = require("koa-router");
const router = new Router({ prefix: "/bookings" });
const pool = require("../config/db");
const { authMiddleware } = require("../middlewares/auth");
const {
  validateBooking,
  validateBookingUpdate,
  validateBookingStatusUpdate,
  sanitizeString,
} = require("../controllers/validation");

// Handle OPTIONS request for CORS preflight
router.options("/", async (ctx) => {
  ctx.set(
    "Access-Control-Allow-Origin",
    "https://gammacairo-deltareward-9000.codio-box.uk"
  );
  ctx.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  ctx.set(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization, Accept"
  );
  ctx.set("Access-Control-Allow-Credentials", "true");
  ctx.set("Access-Control-Max-Age", "86400"); // 24 hours
  ctx.status = 204; // No content for OPTIONS

  console.log("Bookings OPTIONS request handled with CORS headers");
});

// Get all bookings
router.get("/", authMiddleware, async (ctx) => {
  // Set CORS headers
  ctx.set(
    "Access-Control-Allow-Origin",
    "https://gammacairo-deltareward-9000.codio-box.uk"
  );
  ctx.set("Access-Control-Allow-Credentials", "true");

  try {
    const userId = ctx.state.user.user_id;
    const userLevel = ctx.state.user.user_levels;
    const { status, date_from, date_to, sort } = ctx.query;

    console.log("Bookings query parameters:", ctx.query);

    // Different queries based on user role
    let query;
    let queryParams = [];

    // Base query with property and user details
    const baseJoinQuery = `
      SELECT b.*, 
        p.title as property_title, 
        p.location as property_location,
        p.image_url as property_image,
        u.username as user_username,
        u.user_firstName as user_firstName,
        u.user_lastName as user_lastName,
        u.user_email as user_email,
        u.user_phone as user_phone,
        a.username as agent_username,
        a.user_firstName as agent_firstName,
        a.user_lastName as agent_lastName,
        a.user_email as agent_email,
        a.user_phone as agent_phone
      FROM bookings b
      JOIN properties p ON b.property_id = p.id
      JOIN users u ON b.user_id = u.user_id
      JOIN users a ON b.agent_id = a.user_id
      WHERE 
    `;

    // Filter based on role
    if (userLevel >= 2) {
      // Admin can see all bookings
      query = baseJoinQuery + " 1=1";
    } else if (userLevel === 1) {
      // Agent can see bookings for their properties
      query = baseJoinQuery + " b.agent_id = ?";
      queryParams.push(userId);
    } else {
      // Regular user can only see their own bookings
      query = baseJoinQuery + " b.user_id = ?";
      queryParams.push(userId);
    }

    // Filter by status if specified
    if (status) {
      query += " AND b.booking_status = ?";
      queryParams.push(status);
    }

    // Filter by date range if specified
    if (date_from) {
      query += " AND b.scheduled_date >= ?";
      queryParams.push(date_from);
    }

    if (date_to) {
      query += " AND b.scheduled_date <= ?";
      queryParams.push(date_to);
    }

    // Add sorting
    if (sort === "date_asc") {
      query += " ORDER BY b.scheduled_date ASC, b.scheduled_time ASC";
    } else if (sort === "date_desc") {
      query += " ORDER BY b.scheduled_date DESC, b.scheduled_time DESC";
    } else {
      // Default sort by newest booking first
      query += " ORDER BY b.booking_id DESC";
    }

    const [bookings] = await pool.query(query, queryParams);

    // Create HATEOAS links for collection and bookings
    const responseData = bookings.map((booking) => {
      const links = {
        self: { href: `/bookings/${booking.booking_id}`, method: "GET" },
      };

      // Add update and cancel links based on permission
      const isOwnBooking = booking.user_id === userId;
      const isOwnProperty = booking.agent_id === userId;
      const isPending = booking.booking_status === "pending";
      const isConfirmed = booking.booking_status === "confirmed";

      if (isOwnBooking && isPending) {
        links.cancel = {
          href: `/bookings/${booking.booking_id}/status`,
          method: "PUT",
          description: "Cancel this booking",
        };
      }

      if ((isOwnProperty || userLevel >= 2) && (isPending || isConfirmed)) {
        links.update = {
          href: `/bookings/${booking.booking_id}`,
          method: "PUT",
          description: "Update booking details",
        };

        if (isPending) {
          links.confirm = {
            href: `/bookings/${booking.booking_id}/status`,
            method: "PUT",
            description: "Confirm this booking",
          };

          links.cancel = {
            href: `/bookings/${booking.booking_id}/status`,
            method: "PUT",
            description: "Cancel this booking",
          };
        }

        if (isConfirmed) {
          links.attended = {
            href: `/bookings/${booking.booking_id}/status`,
            method: "PUT",
            description: "Mark this booking as attended",
          };
        }
      }

      return {
        ...booking,
        _links: links,
      };
    });

    // Collection links
    const collectionLinks = {
      self: { href: "/bookings", method: "GET" },
    };

    // Add create link for authenticated users
    if (userLevel >= 0) {
      collectionLinks.create = {
        href: "/bookings",
        method: "POST",
        description: "Create a new booking",
      };
    }

    ctx.body = {
      data: responseData,
      _links: collectionLinks,
    };
  } catch (err) {
    console.error("Error fetching bookings:", err);
    ctx.status = 500;
    ctx.body = { error: "Failed to fetch bookings" };
  }
});

// Create a new booking
router.post("/", authMiddleware, async (ctx) => {
  console.log("Booking POST request received:", ctx.request.body);

  // Set CORS headers
  ctx.set(
    "Access-Control-Allow-Origin",
    "https://gammacairo-deltareward-9000.codio-box.uk"
  );
  ctx.set("Access-Control-Allow-Credentials", "true");

  try {
    const { property_id, scheduled_date, scheduled_time } = ctx.request.body;
    const user_id = ctx.state.user.user_id;

    // Custom validation
    if (!property_id || !scheduled_date || !scheduled_time) {
      ctx.status = 400;
      ctx.body = {
        error: "Missing required fields",
        success: false,
        message: "Property ID, date and time are required",
      };
      return;
    }

    // Sanitize and convert inputs
    const sanitizedPropertyId = parseInt(property_id, 10);

    // Validate that property_id is a valid number after conversion
    if (isNaN(sanitizedPropertyId) || sanitizedPropertyId <= 0) {
      ctx.status = 400;
      ctx.body = { error: "Invalid property ID", success: false };
      return;
    }

    const sanitizedScheduledDate = sanitizeString(scheduled_date);
    const sanitizedScheduledTime = sanitizeString(scheduled_time);

    // Validate that the scheduled date and time are in the future
    const now = new Date();
    const [hours, minutes] = sanitizedScheduledTime
      .split(":")
      .map((num) => parseInt(num, 10));
    const scheduledDateTime = new Date(sanitizedScheduledDate);
    scheduledDateTime.setHours(hours, minutes, 0, 0);

    if (scheduledDateTime <= now) {
      ctx.status = 400;
      ctx.body = {
        error: "Cannot book a viewing for a time that has already passed",
        success: false,
      };
      return;
    }

    // First get the agent_id from the property
    const [property] = await pool.query(
      "SELECT agent_id FROM properties WHERE id = ?",
      [sanitizedPropertyId]
    );

    if (property.length === 0) {
      ctx.status = 404;
      ctx.body = { error: "Property not found", success: false };
      return;
    }

    const agent_id = property[0].agent_id;

    // Now create the booking with all needed information
    const [result] = await pool.query(
      "INSERT INTO bookings (property_id, user_id, agent_id, scheduled_date, scheduled_time, booking_status) VALUES (?, ?, ?, ?, ?, ?)",
      [
        sanitizedPropertyId,
        user_id,
        agent_id,
        sanitizedScheduledDate,
        sanitizedScheduledTime,
        "pending",
      ]
    );

    console.log(`Created booking with ID ${result.insertId}`);

    // Generate HATEOAS links for the new booking
    const links = {
      self: { href: `/bookings/${result.insertId}`, method: "GET" },
      update: { href: `/bookings/${result.insertId}`, method: "PUT" },
      delete: { href: `/bookings/${result.insertId}`, method: "DELETE" },
      collection: { href: "/bookings", method: "GET" },
    };

    ctx.status = 201;
    ctx.body = {
      message: "Booking created successfully",
      booking_id: result.insertId,
      _links: links,
      success: true,
    };
  } catch (error) {
    console.error("Booking creation error:", error);
    ctx.status = 500;
    ctx.body = {
      error: "Failed to create booking",
      details: error.message,
      success: false,
    };
  }
});

// Handle OPTIONS request for CORS preflight on single booking
router.options("/:id", async (ctx) => {
  ctx.set(
    "Access-Control-Allow-Origin",
    "https://gammacairo-deltareward-9000.codio-box.uk"
  );
  ctx.set("Access-Control-Allow-Methods", "GET, PUT, DELETE, OPTIONS");
  ctx.set(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization, Accept"
  );
  ctx.set("Access-Control-Allow-Credentials", "true");
  ctx.set("Access-Control-Max-Age", "86400"); // 24 hours
  ctx.status = 204; // No content for OPTIONS

  console.log(
    `Booking ${ctx.params.id} OPTIONS request handled with CORS headers`
  );
});

// Handle OPTIONS request for status endpoint
router.options("/:id/status", async (ctx) => {
  ctx.set(
    "Access-Control-Allow-Origin",
    "https://gammacairo-deltareward-9000.codio-box.uk"
  );
  ctx.set("Access-Control-Allow-Methods", "PUT, OPTIONS");
  ctx.set(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization, Accept"
  );
  ctx.set("Access-Control-Allow-Credentials", "true");
  ctx.set("Access-Control-Max-Age", "86400"); // 24 hours
  ctx.status = 204; // No content for OPTIONS

  console.log(
    `Booking status ${ctx.params.id} OPTIONS request handled with CORS headers`
  );
});

// Get booking by ID
router.get("/:id", authMiddleware, async (ctx) => {
  console.log(`Booking GET request for ID: ${ctx.params.id}`);

  // Set CORS headers
  ctx.set(
    "Access-Control-Allow-Origin",
    "https://gammacairo-deltareward-9000.codio-box.uk"
  );
  ctx.set("Access-Control-Allow-Credentials", "true");

  try {
    // Get user info and role level
    const userLevel = ctx.state.user ? ctx.state.user.user_levels : -1;
    const userId = ctx.state.user ? ctx.state.user.user_id : null;

    // Join with properties and users to get more details
    const query = `
      SELECT b.*, p.title as property_title, u.username as user_username, a.username as agent_username 
      FROM bookings b
      LEFT JOIN properties p ON b.property_id = p.id
      LEFT JOIN users u ON b.user_id = u.user_id
      LEFT JOIN users a ON b.agent_id = a.user_id
      WHERE b.booking_id = ?
    `;

    const [bookings] = await pool.query(query, [ctx.params.id]);

    if (bookings.length === 0) {
      ctx.status = 404;
      ctx.body = { error: "Booking not found" };
      return;
    }

    const booking = bookings[0];

    // Check permission to view this booking
    if (
      userLevel < 2 &&
      userLevel === 1 &&
      booking.agent_id !== userId &&
      userLevel === 0 &&
      booking.user_id !== userId
    ) {
      ctx.status = 403;
      ctx.body = { error: "You don't have permission to view this booking" };
      return;
    }

    // Add HATEOAS links
    const links = {
      self: { href: `/bookings/${booking.booking_id}`, method: "GET" },
      collection: { href: "/bookings", method: "GET" },
    };

    // Add conditional links
    if (userLevel >= 1 || booking.user_id === userId) {
      links.update = { href: `/bookings/${booking.booking_id}`, method: "PUT" };
      links.delete = {
        href: `/bookings/${booking.booking_id}`,
        method: "DELETE",
      };
      links.status = {
        href: `/bookings/${booking.booking_id}/status`,
        method: "PUT",
      };
    }

    // Add property link
    links.property = {
      href: `/properties/${booking.property_id}`,
      method: "GET",
    };

    ctx.body = {
      data: booking,
      _links: links,
    };
  } catch (error) {
    console.error("Error fetching booking:", error);
    ctx.status = 500;
    ctx.body = { error: "Failed to fetch booking", details: error.message };
  }
});

// Update booking
router.put("/:id", authMiddleware, validateBookingUpdate, async (ctx) => {
  console.log(`Booking PUT request for ID: ${ctx.params.id}`, ctx.request.body);

  // Set CORS headers
  ctx.set(
    "Access-Control-Allow-Origin",
    "https://gammacairo-deltareward-9000.codio-box.uk"
  );
  ctx.set("Access-Control-Allow-Credentials", "true");

  try {
    // Get user info and role level
    const userLevel = ctx.state.user ? ctx.state.user.user_levels : -1;
    const userId = ctx.state.user ? ctx.state.user.user_id : null;

    // Check if booking exists and if user has permission
    const [bookings] = await pool.query(
      "SELECT * FROM bookings WHERE booking_id = ?",
      [ctx.params.id]
    );

    if (bookings.length === 0) {
      ctx.status = 404;
      ctx.body = { error: "Booking not found" };
      return;
    }

    const booking = bookings[0];

    // Check permission to update
    if (
      userLevel < 2 &&
      booking.user_id !== userId &&
      booking.agent_id !== userId
    ) {
      ctx.status = 403;
      ctx.body = { error: "You don't have permission to update this booking" };
      return;
    }

    const { scheduled_date, scheduled_time, booking_status } = ctx.request.body;

    // Sanitize inputs
    const sanitizedDate = scheduled_date
      ? sanitizeString(scheduled_date)
      : booking.scheduled_date;
    const sanitizedTime = scheduled_time
      ? sanitizeString(scheduled_time)
      : booking.scheduled_time;
    const sanitizedStatus =
      booking_status && userLevel >= 1
        ? sanitizeString(booking_status)
        : booking.booking_status;

    // Different update logic based on user role
    if (userLevel >= 1) {
      // Agents and admins can update status
      await pool.query(
        "UPDATE bookings SET scheduled_date = ?, scheduled_time = ?, booking_status = ? WHERE booking_id = ?",
        [sanitizedDate, sanitizedTime, sanitizedStatus, ctx.params.id]
      );
    } else {
      // Regular users can only update date and time, not status
      await pool.query(
        "UPDATE bookings SET scheduled_date = ?, scheduled_time = ? WHERE booking_id = ?",
        [sanitizedDate, sanitizedTime, ctx.params.id]
      );
    }

    // HATEOAS links for response
    const links = {
      self: { href: `/bookings/${ctx.params.id}`, method: "GET" },
      collection: { href: "/bookings", method: "GET" },
    };

    ctx.body = {
      message: "Booking updated successfully",
      _links: links,
      success: true,
    };
  } catch (error) {
    console.error("Error updating booking:", error);
    ctx.status = 500;
    ctx.body = { error: "Failed to update booking", details: error.message };
  }
});

// Update booking status (special endpoint for cancellation/confirmation)
router.put(
  "/:id/status",
  authMiddleware,
  validateBookingStatusUpdate,
  async (ctx) => {
    console.log(
      `Booking status update request for ID: ${ctx.params.id}`,
      ctx.request.body
    );

    // Set CORS headers
    ctx.set(
      "Access-Control-Allow-Origin",
      "https://gammacairo-deltareward-9000.codio-box.uk"
    );
    ctx.set("Access-Control-Allow-Credentials", "true");

    try {
      // Validate and convert booking ID to integer
      const bookingId = parseInt(ctx.params.id, 10);
      if (isNaN(bookingId) || bookingId <= 0) {
        ctx.status = 400;
        ctx.body = { error: "Invalid booking ID", success: false };
        return;
      }

      // Get user info and role level
      const userLevel = ctx.state.user ? ctx.state.user.user_levels : -1;
      const userId = ctx.state.user ? ctx.state.user.user_id : null;

      // Check if booking exists
      const [bookings] = await pool.query(
        "SELECT * FROM bookings WHERE booking_id = ?",
        [bookingId]
      );

      if (bookings.length === 0) {
        ctx.status = 404;
        ctx.body = { error: "Booking not found", success: false };
        return;
      }

      const booking = bookings[0];

      // Check permission to update status
      const isUser = booking.user_id === userId;
      const isAgent = booking.agent_id === userId;
      const isAdmin = userLevel >= 2;

      if (!isUser && !isAgent && !isAdmin) {
        ctx.status = 403;
        ctx.body = {
          error: "You don't have permission to update this booking's status",
          success: false,
        };
        return;
      }

      const { status } = ctx.request.body;

      // Validate status transitions based on role
      if (isUser && !isAdmin && !isAgent) {
        // Users can only cancel their pending bookings
        if (status !== "cancelled" || booking.booking_status !== "pending") {
          ctx.status = 403;
          ctx.body = {
            error: "Users can only cancel pending bookings",
            success: false,
          };
          return;
        }
      } else if (isAgent || isAdmin) {
        // Agents/admins can handle all status transitions
        const validTransitions = {
          pending: ["confirmed", "cancelled"],
          confirmed: ["cancelled", "attended"],
          cancelled: [], // Cannot transition from cancelled
          attended: [], // Cannot transition from attended
        };

        if (!validTransitions[booking.booking_status]?.includes(status)) {
          ctx.status = 400;
          ctx.body = {
            error: `Cannot transition from '${booking.booking_status}' to '${status}'`,
            success: false,
          };
          return;
        }
      }

      // Sanitize status
      const sanitizedStatus = sanitizeString(status);

      // Update the booking status
      await pool.query(
        "UPDATE bookings SET booking_status = ? WHERE booking_id = ?",
        [sanitizedStatus, bookingId]
      );

      console.log(`Booking ${bookingId} status updated to ${sanitizedStatus}`);

      ctx.body = {
        message: `Booking ${sanitizedStatus} successfully`,
        success: true,
      };
    } catch (error) {
      console.error("Error updating booking status:", error);
      ctx.status = 500;
      ctx.body = {
        error: "Failed to update booking status",
        details: error.message,
        success: false,
      };
    }
  }
);

// Delete booking
router.delete("/:id", authMiddleware, async (ctx) => {
  console.log(`Booking DELETE request for ID: ${ctx.params.id}`);

  // Set CORS headers
  ctx.set(
    "Access-Control-Allow-Origin",
    "https://gammacairo-deltareward-9000.codio-box.uk"
  );
  ctx.set("Access-Control-Allow-Credentials", "true");

  try {
    // Get user info and role level
    const userLevel = ctx.state.user ? ctx.state.user.user_levels : -1;
    const userId = ctx.state.user ? ctx.state.user.user_id : null;

    // Check if booking exists and if user has permission
    const [bookings] = await pool.query(
      "SELECT * FROM bookings WHERE booking_id = ?",
      [ctx.params.id]
    );

    if (bookings.length === 0) {
      ctx.status = 404;
      ctx.body = { error: "Booking not found" };
      return;
    }

    const booking = bookings[0];

    // Check permission to delete
    if (
      userLevel < 2 &&
      booking.user_id !== userId &&
      booking.agent_id !== userId
    ) {
      ctx.status = 403;
      ctx.body = { error: "You don't have permission to delete this booking" };
      return;
    }

    await pool.query("DELETE FROM bookings WHERE booking_id = ?", [
      ctx.params.id,
    ]);

    // HATEOAS links
    const links = {
      collection: { href: "/bookings", method: "GET" },
    };

    ctx.body = {
      message: "Booking deleted successfully",
      _links: links,
      success: true,
    };
  } catch (error) {
    console.error("Error deleting booking:", error);
    ctx.status = 500;
    ctx.body = { error: "Failed to delete booking", details: error.message };
  }
});

module.exports = router;
