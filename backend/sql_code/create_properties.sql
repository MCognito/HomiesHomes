CREATE TABLE properties (
    id INT PRIMARY KEY AUTO_INCREMENT,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    property_type ENUM('house', 'flat', 'studio', 'mansion') NOT NULL,
    bedrooms INT NOT NULL,
    bathrooms INT NOT NULL,
    size_sqft INT NOT NULL,
    property_location VARCHAR(255) NOT NULL,
    agent_id INT NOT NULL,
    property_status ENUM('for_sale', 'for_rent', 'sold') NOT NULL DEFAULT 'for_sale',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (agent_id) REFERENCES users(id) ON DELETE CASCADE
);
