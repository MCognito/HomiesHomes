-- Insert test users (regular users, agents, and admin)
INSERT INTO users (username, password, user_email, user_phone, user_firstName, user_lastName, user_levels) VALUES
-- Test user
('test', '$2b$10$k10Xi.6yF21xQVypwCxNsuKpWhVHIi1Kee/LBzbc1.r/3ZYRZNlo6', 'test@example.com', '+44123456795', 'Test', 'User', 0),
-- Regular users
('john_doe', '$2b$10$kCgCmQIsuop1YAGyhec73.IIhRQaW96LVYlSTy0k4tFOBkipCpQxi', 'john@example.com', '+44123456789', 'John', 'Doe', 0),
('jane_smith', '$2b$10$kCgCmQIsuop1YAGyhec73.IIhRQaW96LVYlSTy0k4tFOBkipCpQxi', 'jane@example.com', '+44123456790', 'Jane', 'Smith', 0),
('bob_wilson', '$2b$10$kCgCmQIsuop1YAGyhec73.IIhRQaW96LVYlSTy0k4tFOBkipCpQxi', 'bob@example.com', '+44123456791', 'Bob', 'Wilson', 0),
-- Agents
('agent_sarah', '$2b$10$kCgCmQIsuop1YAGyhec73.IIhRQaW96LVYlSTy0k4tFOBkipCpQxi', 'sarah@agency.com', '+44123456792', 'Sarah', 'Johnson', 1),
('agent_mike', '$2b$10$kCgCmQIsuop1YAGyhec73.IIhRQaW96LVYlSTy0k4tFOBkipCpQxi', 'mike@agency.com', '+44123456793', 'Mike', 'Brown', 1),
-- Admin
('admin_alex', '$2b$10$kCgCmQIsuop1YAGyhec73.IIhRQaW96LVYlSTy0k4tFOBkipCpQxi', 'alex@admin.com', '+44123456794', 'Alex', 'Admin', 2);

-- Insert test properties
INSERT INTO properties (title, description, price, location, bedrooms, bathrooms, property_type, image_url, agent_id) VALUES
('Luxury Apartment', 'Beautiful modern apartment in city center', 250000.00, 'London, UK', 2, 2, 'Apartment', 'prop1.jpg', 5),
('Family House', 'Spacious family home with garden', 450000.00, 'Manchester, UK', 4, 3, 'House', 'prop1.jpg', 6),
('Studio Flat', 'Cozy studio in trendy area', 180000.00, 'Birmingham, UK', 1, 1, 'Studio', 'prop1.jpg', 5),
('Penthouse Suite', 'Luxurious penthouse with city views', 750000.00, 'London, UK', 3, 2, 'Penthouse', 'prop1.jpg', 5);

-- Insert test favourites
INSERT INTO favourites (user_id, property_id) VALUES
(1, 1), -- John likes Luxury Apartment
(1, 2), -- John also likes Family House
(2, 3), -- Jane likes Studio Flat
(3, 4); -- Bob likes Penthouse Suite

-- Insert test bookings with different statuses
INSERT INTO bookings (user_id, property_id, agent_id, booking_status, scheduled_date, scheduled_time) VALUES
-- Pending bookings
(1, 1, 5, 'pending', '2024-04-01', '10:00:00'), -- John viewing Luxury Apartment
(2, 3, 5, 'pending', '2024-04-02', '14:00:00'), -- Jane viewing Studio Flat

-- Confirmed bookings
(3, 4, 5, 'confirmed', '2024-04-03', '11:00:00'), -- Bob viewing Penthouse Suite
(1, 2, 6, 'confirmed', '2024-04-04', '15:00:00'), -- John viewing Family House

-- Cancelled bookings
(2, 1, 5, 'cancelled', '2024-03-30', '09:00:00'), -- Jane cancelled viewing Luxury Apartment
(3, 3, 5, 'cancelled', '2024-03-31', '13:00:00'); -- Bob cancelled viewing Studio Flat

-- Test queries to verify relationships
-- 1. Get all properties with their agents
SELECT p.title, p.location, CONCAT(u.user_firstName, ' ', u.user_lastName) as agent_name
FROM properties p
LEFT JOIN users u ON p.agent_id = u.user_id;

-- 2. Get all favourites with user and property details
SELECT 
    CONCAT(u.user_firstName, ' ', u.user_lastName) as user_name,
    p.title as property_title,
    f.favourited_at
FROM favourites f
JOIN users u ON f.user_id = u.user_id
JOIN properties p ON f.property_id = p.id;

-- 3. Get all bookings with complete details
SELECT 
    CONCAT(u.user_firstName, ' ', u.user_lastName) as user_name,
    p.title as property_title,
    CONCAT(a.user_firstName, ' ', a.user_lastName) as agent_name,
    b.booking_status,
    b.scheduled_date,
    b.scheduled_time
FROM bookings b
JOIN users u ON b.user_id = u.user_id
JOIN properties p ON b.property_id = p.id
LEFT JOIN users a ON b.agent_id = a.user_id;

-- 4. Get properties with their booking counts
SELECT 
    p.title,
    COUNT(b.booking_id) as total_bookings,
    SUM(CASE WHEN b.booking_status = 'confirmed' THEN 1 ELSE 0 END) as confirmed_bookings
FROM properties p
LEFT JOIN bookings b ON p.id = b.property_id
GROUP BY p.id, p.title;

-- 5. Get user's favourite properties with their details
SELECT 
    CONCAT(u.user_firstName, ' ', u.user_lastName) as user_name,
    p.title,
    p.price,
    p.location
FROM users u
JOIN favourites f ON u.user_id = f.user_id
JOIN properties p ON f.property_id = p.id
WHERE u.user_id = 1; -- Example for user John 