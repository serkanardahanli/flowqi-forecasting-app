-- Drop existing table if it exists
DROP TABLE IF EXISTS products;

-- Create products table
CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    gl_account_id UUID NOT NULL REFERENCES gl_accounts(id),
    type TEXT NOT NULL CHECK (type IN ('saas', 'consultancy')),
    organization_id UUID NOT NULL REFERENCES organizations(id),
    CONSTRAINT fk_organization
        FOREIGN KEY(organization_id)
        REFERENCES organizations(id)
        ON DELETE CASCADE
);

-- Insert some default products
INSERT INTO products (name, description, price, gl_account_id, type, organization_id)
VALUES 
    ('FlowQi Basic', 'Basis SaaS pakket', 49.99, 
     (SELECT id FROM gl_accounts WHERE code = '8000' LIMIT 1),
     'saas',
     (SELECT id FROM organizations WHERE name = 'FlowQi' LIMIT 1)),
    
    ('FlowQi Pro', 'Professioneel SaaS pakket', 99.99,
     (SELECT id FROM gl_accounts WHERE code = '8000' LIMIT 1),
     'saas',
     (SELECT id FROM organizations WHERE name = 'FlowQi' LIMIT 1)),
    
    ('Consultancy Basis', 'Basis consultancy uur', 95.00,
     (SELECT id FROM gl_accounts WHERE code = '8100' LIMIT 1),
     'consultancy',
     (SELECT id FROM organizations WHERE name = 'FlowQi' LIMIT 1)),
    
    ('Consultancy Pro', 'Professioneel consultancy uur', 150.00,
     (SELECT id FROM gl_accounts WHERE code = '8100' LIMIT 1),
     'consultancy',
     (SELECT id FROM organizations WHERE name = 'FlowQi' LIMIT 1)); 