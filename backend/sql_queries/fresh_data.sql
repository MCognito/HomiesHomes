-- Reset tables (use with caution!)
-- These DELETE statements preserve the table structure but remove all data
DELETE FROM bookings;
DELETE FROM favourites;
DELETE FROM properties;
DELETE FROM users WHERE user_levels < 2; -- Keep admin users

-- Insert test users (regular users, agents, and admin)
INSERT INTO users (username, password, user_email, user_phone, user_firstName, user_lastName, user_levels) VALUES
-- Test user
('test', '$2b$10$kCgCmQIsuop1YAGyhec73.IIhRQaW96LVYlSTy0k4tFOBkipCpQxi', 'test@example.com', '+44123456795', 'Test', 'User', 0),
-- Regular users
('john_doe', '$2b$10$kCgCmQIsuop1YAGyhec73.IIhRQaW96LVYlSTy0k4tFOBkipCpQxi', 'john@example.com', '+44123456789', 'John', 'Doe', 0),
('jane_smith', '$2b$10$kCgCmQIsuop1YAGyhec73.IIhRQaW96LVYlSTy0k4tFOBkipCpQxi', 'jane@example.com', '+44123456790', 'Jane', 'Smith', 0),
('bob_wilson', '$2b$10$kCgCmQIsuop1YAGyhec73.IIhRQaW96LVYlSTy0k4tFOBkipCpQxi', 'bob@example.com', '+44123456791', 'Bob', 'Wilson', 0),
-- Agents
('agent_sarah', '$2b$10$kCgCmQIsuop1YAGyhec73.IIhRQaW96LVYlSTy0k4tFOBkipCpQxi', 'sarah@agency.com', '+44123456792', 'Sarah', 'Johnson', 1),
('agent_mike', '$2b$10$kCgCmQIsuop1YAGyhec73.IIhRQaW96LVYlSTy0k4tFOBkipCpQxi', 'mike@agency.com', '+44123456793', 'Mike', 'Brown', 1),
-- Admin (if not exists)
('admin_alex', '$2b$10$kCgCmQIsuop1YAGyhec73.IIhRQaW96LVYlSTy0k4tFOBkipCpQxi', 'alex@admin.com', '+44123456794', 'Alex', 'Admin', 2);

-- Insert test properties (with correct image filename format)
INSERT INTO properties (title, description, price, location, bedrooms, bathrooms, property_type, image_url, agent_id) VALUES
('Luxury Apartment', 'Beautiful modern apartment in city center', 250000.00, 'London, UK', 2, 2, 'Apartment', 'prop1.jpg', 5),
('Family House', 'Spacious family home with garden', 450000.00, 'Manchester, UK', 4, 3, 'House', 'prop1.jpg', 6),
('Studio Flat', 'Cozy studio in trendy area', 180000.00, 'Birmingham, UK', 1, 1, 'Studio', 'prop1.jpg', 5),
('Penthouse Suite', 'Luxurious penthouse with city views', 750000.00, 'London, UK', 3, 2, 'Penthouse', 'prop1.jpg', 5),
('Modern Villa', 'Contemporary villa with pool', 650000.00, 'Brighton, UK', 5, 4, 'Villa', 'prop1.jpg', 6),
('Cottage Home', 'Charming cottage in quiet village', 375000.00, 'Cotswolds, UK', 3, 2, 'Cottage', 'prop1.jpg', 5);

-- Insert test favourites
INSERT INTO favourites (user_id, property_id) VALUES
(1, 1), -- Test user likes Luxury Apartment
(2, 1), -- John likes Luxury Apartment
(2, 2), -- John also likes Family House
(3, 3), -- Jane likes Studio Flat
(4, 4), -- Bob likes Penthouse Suite
(1, 5); -- Test user also likes Modern Villa

-- Insert test bookings with different statuses
INSERT INTO bookings (user_id, property_id, agent_id, booking_status, scheduled_date, scheduled_time) VALUES
-- Pending bookings
(1, 1, 5, 'pending', DATE_ADD(CURDATE(), INTERVAL 3 DAY), '10:00:00'), -- Test user viewing Luxury Apartment
(2, 3, 5, 'pending', DATE_ADD(CURDATE(), INTERVAL 4 DAY), '14:00:00'), -- John viewing Studio Flat

-- Confirmed bookings
(3, 4, 5, 'confirmed', DATE_ADD(CURDATE(), INTERVAL 5 DAY), '11:00:00'), -- Jane viewing Penthouse Suite
(1, 2, 6, 'confirmed', DATE_ADD(CURDATE(), INTERVAL 6 DAY), '15:00:00'), -- Test user viewing Family House

-- Cancelled bookings
(2, 1, 5, 'cancelled', DATE_ADD(CURDATE(), INTERVAL -1 DAY), '09:00:00'), -- John cancelled viewing Luxury Apartment
(3, 3, 5, 'cancelled', DATE_ADD(CURDATE(), INTERVAL -2 DAY), '13:00:00'); -- Jane cancelled viewing Studio Flat

-- Show the results
SELECT 'Users' AS Table_Name, COUNT(*) AS Record_Count FROM users
UNION
SELECT 'Properties', COUNT(*) FROM properties
UNION
SELECT 'Favourites', COUNT(*) FROM favourites
UNION
SELECT 'Bookings', COUNT(*) FROM bookings; 