-- Delete old property records with incorrect image URLs
DELETE FROM properties WHERE image_url LIKE 'https://%';

-- Update any remaining records to use consistent image filename
UPDATE properties SET image_url = 'prop1.jpg' WHERE image_url IS NULL OR image_url NOT LIKE '%.jpg';

-- Optional: Add a check to ensure bookings and favorites related to deleted properties are also removed
DELETE FROM bookings WHERE property_id NOT IN (SELECT id FROM properties);
DELETE FROM favourites WHERE property_id NOT IN (SELECT id FROM properties);

-- Verify the result
SELECT * FROM properties; 