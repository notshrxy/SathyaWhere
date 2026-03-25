-- Drop the existing policy to recreate it cleanly
DROP POLICY IF EXISTS "Users can view their own lost item verifications" ON public.lost_item_verifications;

-- Create a more robust and efficient policy for viewing lost item verifications
CREATE POLICY "Users involved in verification can view it" ON public.lost_item_verifications
    FOR SELECT USING (
        -- Option 1: You are the finder
        auth.uid() = finder_id 
        OR 
        -- Option 2: You are the reporter of the associated item
        EXISTS (
            SELECT 1 FROM public.lost_items 
            WHERE public.lost_items.id = public.lost_item_verifications.lost_item_id 
            AND public.lost_items.reporter_id = auth.uid()
        )
    );

-- Also ensure RLS is enabled (it should be already, but better safe)
ALTER TABLE public.lost_item_verifications ENABLE ROW LEVEL SECURITY;
