-- INTENTIONALLY INSECURE - For DevSecOps testing only
-- Simulated database backup with sensitive data
-- In real scenarios, this file should NEVER be committed to git

CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255),
    password_hash VARCHAR(255),
    role VARCHAR(50)
);

-- INSECURE: Sample data with weak password hashes (MD5)
INSERT INTO users VALUES
    (1, 'admin@company.com', '5f4dcc3b5aa765d61d8327deb882cf99', 'admin'),  -- 'password'
    (2, 'user@company.com', '827ccb0eea8a706c4c34a16891f84e7b', 'user'),     -- '12345'
    (3, 'john@company.com', 'e10adc3949ba59abbe56e057f20f883e', 'user');     -- '123456'

-- INSECURE: API keys table
CREATE TABLE api_keys (
    id SERIAL PRIMARY KEY,
    key VARCHAR(255),
    description TEXT
);

INSERT INTO api_keys VALUES
    (1, 'sk_live_51Hxxxxxxxxxxxxxxxxxx', 'Stripe production key'),
    (2, 'AKIAIOSFODNN7EXAMPLE', 'AWS access key'),
    (3, 'ghp_1234567890abcdefghijklmnopqrstuvwxyz', 'GitHub token');
