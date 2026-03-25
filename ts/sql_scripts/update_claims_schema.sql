-- Add new verification columns to the claims table
ALTER TABLE claims 
ADD COLUMN IF NOT EXISTS hidden_feature_description TEXT,
ADD COLUMN IF NOT EXISTS brand TEXT;

-- Update column comments for clarity
COMMENT ON COLUMN claims.hidden_feature_description IS 'User description of a feature not visible in public photos (8-word limit enforced on frontend)';
COMMENT ON COLUMN claims.brand IS 'The brand of the claimed item (8-word limit enforced on frontend)';
