-- Script to create the agent_requests table
-- Drop existing table first to ensure a clean slate
DROP TABLE IF EXISTS agent_requests;

CREATE TABLE agent_requests (
  request_id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  request_date DATETIME NOT NULL,
  response_date DATETIME,
  status ENUM('pending', 'approved', 'rejected') NOT NULL DEFAULT 'pending',
  request_reason TEXT,
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Create indexes
CREATE INDEX idx_user_id ON agent_requests(user_id);
CREATE INDEX idx_status ON agent_requests(status); 