import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import supabase from '@/utils/supabase';

const ProfileDebugger = () => {
  const [loading, setLoading] = useState(false);
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const { user: authUser } = useAuth();
  const { toast } = useToast();

  const debugProfile = async () => {
    setLoading(true);
    try {
      const info = {
        authUser: authUser ? {
          id: authUser.id,
          email: authUser.email,
          metadata: authUser.user_metadata
        } : null,
        profileExists: false,
        profileData: null,
        error: null
      };

      if (authUser) {
        // Check if profile exists
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', authUser.id)
          .maybeSingle();

        info.profileExists = !!profile;
        info.profileData = profile;
        info.error = profileError;
      }

      setDebugInfo(info);
    } catch (error: any) {
      setDebugInfo({ error: error.message });
    } finally {
      setLoading(false);
    }
  };

  const createProfileManually = async () => {
    if (!authUser) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .insert({
          id: authUser.id,
          email: authUser.email,
          full_name: authUser.user_metadata?.full_name || '',
          role: 'user',
          availability_status: 'unavailable'
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      toast({
        title: "Profile Created",
        description: "Your profile has been created successfully.",
      });

      setDebugInfo(prev => ({
        ...prev,
        profileExists: true,
        profileData: data
      }));
    } catch (error: any) {
      toast({
        title: "Profile Creation Failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const testDatabaseConnection = async () => {
    setLoading(true);
    try {
      // Test basic connection
      const { data, error } = await supabase
        .from('profiles')
        .select('count')
        .limit(1);

      if (error) {
        throw error;
      }

      toast({
        title: "Database Connected",
        description: "Successfully connected to database.",
      });
    } catch (error: any) {
      toast({
        title: "Database Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle>Profile Debugger</CardTitle>
          <CardDescription>Debug profile creation issues</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2 flex-wrap">
            <Button onClick={debugProfile} disabled={loading}>
              Debug Profile
            </Button>
            <Button onClick={createProfileManually} disabled={loading} variant="outline">
              Create Profile Manually
            </Button>
            <Button onClick={testDatabaseConnection} disabled={loading} variant="secondary">
              Test DB Connection
            </Button>
          </div>

          {debugInfo && (
            <div className="mt-4 p-4 bg-muted rounded-lg">
              <h3 className="font-semibold mb-2">Debug Information:</h3>
              <pre className="text-xs overflow-auto max-h-96">
                {JSON.stringify(debugInfo, null, 2)}
              </pre>
            </div>
          )}

          <div className="mt-4 p-4 bg-blue-50 rounded-lg">
            <h3 className="font-semibold mb-2">Next Steps:</h3>
            <ol className="text-sm space-y-1 list-decimal list-inside">
              <li>Click "Debug Profile" to see current state</li>
              <li>If profile doesn't exist, click "Create Profile Manually"</li>
              <li>If that fails, check the database setup in Supabase</li>
              <li>Run the SQL from database-setup.sql in your Supabase SQL editor</li>
            </ol>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProfileDebugger;
