import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import supabase from '@/utils/supabase';

const DatabaseTest = () => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const { toast } = useToast();

  const testConnection = async () => {
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

      setResult({ success: true, message: 'Database connection successful' });
      toast({
        title: "Connection Test Passed",
        description: "Database is accessible",
      });
    } catch (error: any) {
      setResult({ success: false, message: error.message });
      toast({
        title: "Connection Test Failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const testAuth = async () => {
    setLoading(true);
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      
      if (error) {
        throw error;
      }

      setResult({ 
        success: true, 
        message: `User: ${user?.email || 'No user'}` 
      });
    } catch (error: any) {
      setResult({ success: false, message: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Database Connection Test</CardTitle>
        <CardDescription>Test your Supabase connection</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Button onClick={testConnection} disabled={loading} className="flex-1">
            Test DB
          </Button>
          <Button onClick={testAuth} disabled={loading} variant="outline" className="flex-1">
            Test Auth
          </Button>
        </div>
        
        {result && (
          <div className={`p-3 rounded-md text-sm ${
            result.success ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
          }`}>
            {result.message}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default DatabaseTest;
