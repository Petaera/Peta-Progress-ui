-- Manual profile creation for existing users
-- Run this if you have existing users without profiles

-- Function to create missing profiles for existing users
CREATE OR REPLACE FUNCTION public.create_missing_profiles()
RETURNS TABLE(user_id UUID, email TEXT, created BOOLEAN) AS $$
BEGIN
  RETURN QUERY
  INSERT INTO public.profiles (id, email, full_name, role, availability_status)
  SELECT 
    au.id,
    au.email,
    COALESCE(au.raw_user_meta_data->>'full_name', ''),
    'user',
    'unavailable'
  FROM auth.users au
  LEFT JOIN public.profiles p ON au.id = p.id
  WHERE p.id IS NULL
  ON CONFLICT (id) DO NOTHING
  RETURNING profiles.id, profiles.email, true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.create_missing_profiles() TO postgres, anon, authenticated, service_role;

-- To use this function, run:
-- SELECT * FROM public.create_missing_profiles();
