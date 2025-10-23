-- Create monthly_hours table for tracking allocated hours per user per task per month
CREATE TABLE IF NOT EXISTS public.monthly_hours (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  task_id uuid NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  allocated_hours decimal(5,2) NOT NULL DEFAULT 0,
  logged_hours decimal(5,2) NOT NULL DEFAULT 0,
  month varchar(7) NOT NULL, -- Format: YYYY-MM
  year integer NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT monthly_hours_unique_user_task_month UNIQUE (user_id, task_id, month)
);

-- Enable RLS on monthly_hours table
ALTER TABLE public.monthly_hours ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own monthly hours" ON public.monthly_hours;
DROP POLICY IF EXISTS "Admins can view organization monthly hours" ON public.monthly_hours;
DROP POLICY IF EXISTS "Users can update own monthly hours" ON public.monthly_hours;
DROP POLICY IF EXISTS "Admins can manage organization monthly hours" ON public.monthly_hours;

-- Create RLS policies
CREATE POLICY "Users can view own monthly hours" ON public.monthly_hours
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can view organization monthly hours" ON public.monthly_hours
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND role = 'admin' 
      AND organization_id = monthly_hours.organization_id
    )
  );

CREATE POLICY "Users can update own monthly hours" ON public.monthly_hours
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage organization monthly hours" ON public.monthly_hours
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND role = 'admin' 
      AND organization_id = monthly_hours.organization_id
    )
  );

-- Grant necessary permissions
GRANT ALL ON public.monthly_hours TO postgres, anon, authenticated, service_role;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_monthly_hours_user_id ON public.monthly_hours(user_id);
CREATE INDEX IF NOT EXISTS idx_monthly_hours_task_id ON public.monthly_hours(task_id);
CREATE INDEX IF NOT EXISTS idx_monthly_hours_organization_id ON public.monthly_hours(organization_id);
CREATE INDEX IF NOT EXISTS idx_monthly_hours_month_year ON public.monthly_hours(month, year);

-- Create function to update logged_hours when daily_logs are inserted/updated
CREATE OR REPLACE FUNCTION public.update_monthly_logged_hours()
RETURNS trigger AS $$
BEGIN
  -- Update logged hours for the user and task in the current month
  UPDATE public.monthly_hours 
  SET logged_hours = (
    SELECT COALESCE(SUM(hours_spent), 0)
    FROM public.daily_logs 
    WHERE user_id = NEW.user_id 
    AND task_id = NEW.task_id
    AND DATE_TRUNC('month', log_date) = DATE_TRUNC('month', NEW.log_date)
  ),
  updated_at = now()
  WHERE user_id = NEW.user_id 
  AND task_id = NEW.task_id
  AND month = TO_CHAR(NEW.log_date, 'YYYY-MM');
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically update logged hours
DROP TRIGGER IF EXISTS update_monthly_hours_on_daily_log ON public.daily_logs;
CREATE TRIGGER update_monthly_hours_on_daily_log
  AFTER INSERT OR UPDATE OR DELETE ON public.daily_logs
  FOR EACH ROW EXECUTE PROCEDURE public.update_monthly_logged_hours();

-- Grant execute permissions on function
GRANT EXECUTE ON FUNCTION public.update_monthly_logged_hours() TO postgres, anon, authenticated, service_role;
