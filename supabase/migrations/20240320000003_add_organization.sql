-- Insert an organization if none exists
INSERT INTO organizations (name)
SELECT 'FlowQi'
WHERE NOT EXISTS (SELECT 1 FROM organizations);

-- Get the organization ID
SELECT id FROM organizations LIMIT 1; 