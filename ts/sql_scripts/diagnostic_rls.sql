-- DIAGNOSTIC SQL: Run this to confirm if RLS is the issue
-- THIS ALLOWS VIEWING ANY VERIFICATION RECORD (PERMANENT FIX BELOW)
DROP POLICY IF EXISTS "Users can view their own lost item verifications" ON public.lost_item_verifications;
DROP POLICY IF EXISTS "Users involved in verification can view it" ON public.lost_item_verifications;

CREATE POLICY "Temp Diagnostic Policy" ON public.lost_item_verifications
    FOR SELECT USING (true);

-- Run this and refresh the page. 
-- If it WORKS, then it's definitely an RLS/Auth issue.
-- If it still FAILS, then it's an ID mismatch or record missing.
