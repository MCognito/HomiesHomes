/**
 * Login and registration tests
 *
 * Makes sure users can sign up, log in, and access their account
 */

const { request, pool } = require("./setupTests");

describe("Authentication", () => {
  // Basic user info we'll use in tests
  const baseTestUser = {
    password: "TestPassword123!",
    user_phone: "1234567890",
    user_firstName: "Test",
    user_lastName: "User",
    user_levels: 0, // Regular user permission level
  };

  let userId;
  let userToken;

  // Clean up the test users after we're done
  afterAll(async () => {
    if (userId) {
      try {
        await pool.query("DELETE FROM users WHERE user_id = ?", [userId]);
        console.log(`Test user with ID ${userId} deleted`);
      } catch (error) {
        console.error("Error cleaning up test user:", error);
      }
    }

    // The pool gets closed in setupTests.js
  });

  describe("User Registration", () => {
    test("should register a new user with valid data", async () => {
      // Add unique username/email using current timestamp
      const timestamp = Date.now();
      const testUser = {
        ...baseTestUser,
        username: `testuser_${timestamp}`,
        user_email: `testuser_${timestamp}@example.com`,
      };

      const response = await request
        .post("/register")
        .send(testUser)
        .expect(201);

      expect(response.body).toHaveProperty(
        "message",
        "User registered successfully"
      );
      expect(response.body).toHaveProperty("token");

      // Save the user's info for later tests
      const tokenData = JSON.parse(
        Buffer.from(response.body.token.split(".")[1], "base64").toString()
      );
      userId = tokenData.user_id;
      userToken = response.body.token;

      // Store user data for other tests
      global.testUsername = testUser.username;
      global.testUserEmail = testUser.user_email;
      global.testUserPassword = testUser.password;

      // Make sure the user was actually created in the DB
      const [users] = await pool.query(
        "SELECT * FROM users WHERE user_id = ?",
        [userId]
      );
      expect(users.length).toBe(1);
      expect(users[0].username).toBe(testUser.username);
      expect(users[0].user_email).toBe(testUser.user_email);
    });

    test("should not register user with existing username", async () => {
      // Try to use the same username (should fail)
      const timestamp = Date.now();
      const testUser = {
        ...baseTestUser,
        username: global.testUsername, // Reuse the already registered username
        user_email: `new_${timestamp}@example.com`,
      };

      const response = await request
        .post("/register")
        .send(testUser)
        .expect(400);

      expect(response.body).toHaveProperty(
        "message",
        "Username already exists"
      );
    });

    test("should not register user with existing email", async () => {
      // Try to use the same email (should fail)
      const timestamp = Date.now();
      const testUser = {
        ...baseTestUser,
        username: `new_${timestamp}`,
        user_email: global.testUserEmail, // Reuse the already registered email
      };

      const response = await request
        .post("/register")
        .send(testUser)
        .expect(400);

      expect(response.body).toHaveProperty("message", "Email already in use");
    });
  });

  describe("User Login", () => {
    test("should login with valid credentials", async () => {
      // Log in with the account taht was created earlier
      const response = await request
        .post("/login")
        .send({
          username: global.testUsername,
          password: global.testUserPassword,
        })
        .expect(200);

      expect(response.body).toHaveProperty("message", "Login successful");
      expect(response.body).toHaveProperty("token");
      expect(response.body.user).toHaveProperty("user_id");
      expect(response.body.user).toHaveProperty(
        "username",
        global.testUsername
      );
      expect(response.body.user).not.toHaveProperty("password");
    });

    test("should not login with invalid password", async () => {
      // Right username, wrong password
      const response = await request
        .post("/login")
        .send({
          username: global.testUsername,
          password: "WrongPassword123!",
        })
        .expect(401);

      expect(response.body).toHaveProperty("message", "Invalid credentials");
    });

    test("should not login with non-existent username", async () => {
      // Made-up username that doesn't exist
      const timestamp = Date.now();
      const response = await request
        .post("/login")
        .send({
          username: `nonexistent_${timestamp}`,
          password: global.testUserPassword,
        })
        .expect(401);

      expect(response.body).toHaveProperty("message", "Invalid credentials");
    });
  });

  describe("Protected Routes", () => {
    test("should access user profile with valid token", async () => {
      // Use the token to access protected data
      const response = await request
        .get(`/users/${userId}`)
        .set("Authorization", `Bearer ${userToken}`)
        .expect(200);

      expect(response.body).toHaveProperty("user_id", userId);
      expect(response.body).toHaveProperty("username", global.testUsername);
    });

    test("should not access protected route without token", async () => {
      // Try to access without providing a token
      const response = await request.get(`/users/${userId || 1}`).expect(401);

      expect(response.body).toHaveProperty(
        "message",
        "Authentication token required"
      );
    });

    test("should not access protected route with invalid token", async () => {
      // Try with a made-up token
      const response = await request
        .get(`/users/${userId || 1}`)
        .set("Authorization", "Bearer invalid_token")
        .expect(401);

      expect(response.body).toHaveProperty("message", "Invalid token");
    });
  });
});
