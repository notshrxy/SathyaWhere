-- Final Secure RLS Policy for Lost Item Verifications
DROP POLICY IF EXISTS "Temp Diagnostic Policy" ON public.lost_item_verifications;
DROP POLICY IF EXISTS "Users can view their own lost item verifications" ON public.lost_item_verifications;
DROP POLICY IF EXISTS "Users involved in verification can view it" ON public.lost_item_verifications;

CREATE POLICY "Allow involved users to view verification" ON public.lost_item_verifications
    FOR SELECT USING (
        -- 1. You are the finder (user who scanned the QR)
        auth.uid() = finder_id 
        OR 
        -- 2. You are the reporter of the lost item
        auth.uid() IN (
            SELECT reporter_id 
            FROM public.lost_items 
            WHERE id = lost_item_id
        )
    );

-- Also ensure RLS is enabled
ALTER TABLE public.lost_item_verifications ENABLE ROW LEVEL SECURITY;
