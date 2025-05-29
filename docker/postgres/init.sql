-- PostgreSQL initialization script for Social Media Manager
-- This script runs when the PostgreSQL container starts for the first time

-- Create extensions that might be useful
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "unaccent";

-- Create additional indexes for better performance (these will be created by Prisma migrations)
-- This is just a placeholder for any custom database setup

-- Log the initialization
\echo 'Social Media Manager database initialized successfully!'
