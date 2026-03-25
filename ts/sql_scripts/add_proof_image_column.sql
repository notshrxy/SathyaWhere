-- Add proof_image_path column to the claims table
ALTER TABLE claims 
ADD COLUMN IF NOT EXISTS proof_image_path TEXT;

-- Update column comment for clarity
COMMENT ON COLUMN claims.proof_image_path IS 'Path to the photo uploaded by the user proving ownership (selfie, receipt, etc.)';
