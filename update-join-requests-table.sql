-- Add department_id column to join_requests table
-- This allows storing the department assignment when inviting users

-- First, check if the join_requests table exists, if not create it
CREATE TABLE IF NOT EXISTS public.join_requests (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  department_id uuid NULL REFERENCES public.departments(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Add department_id column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'join_requests' 
    AND column_name = 'department_id'
    AND table_schema = 'public'
  ) THEN
    ALTER TABLE public.join_requests ADD COLUMN department_id uuid NULL REFERENCES public.departments(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Enable RLS on join_requests table
ALTER TABLE public.join_requests ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own join requests" ON public.join_requests;
DROP POLICY IF EXISTS "Admins can view organization join requests" ON public.join_requests;
DROP POLICY IF EXISTS "Users can create join requests" ON public.join_requests;
DROP POLICY IF EXISTS "Users can update own join requests" ON public.join_requests;

-- Create RLS policies
CREATE POLICY "Users can view own join requests" ON public.join_requests
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can view organization join requests" ON public.join_requests
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND role = 'admin' 
      AND organization_id = join_requests.organization_id
    )
  );

CREATE POLICY "Users can create join requests" ON public.join_requests
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own join requests" ON public.join_requests
  FOR UPDATE USING (auth.uid() = user_id);

-- Grant necessary permissions
GRANT ALL ON public.join_requests TO postgres, anon, authenticated, service_role;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_join_requests_user_id ON public.join_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_join_requests_organization_id ON public.join_requests(organization_id);
CREATE INDEX IF NOT EXISTS idx_join_requests_department_id ON public.join_requests(department_id);
CREATE INDEX IF NOT EXISTS idx_join_requests_status ON public.join_requests(status);
