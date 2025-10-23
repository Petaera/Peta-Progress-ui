import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LogOut, Users, Briefcase, Clock, CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import supabase from "@/utils/supabase";
import TaskCard from "@/components/TaskCard";
import AvailabilityToggle from "@/components/AvailabilityToggle";
import DailyLogForm from "@/components/DailyLogForm";
import PerformanceReport from "@/components/PerformanceReport";
import ErrorBoundary from "@/components/ErrorBoundary";

const Dashboard = () => {
  const [isAvailable, setIsAvailable] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [tasks, setTasks] = useState<any[]>([]);
  const [joinRequests, setJoinRequests] = useState<any[]>([]);
  const [stats, setStats] = useState({
    totalTasks: 0,
    completedTasks: 0,
    hoursLogged: 0,
    hoursTarget: 0,
  });
  const [loading, setLoading] = useState(true);
  
  const { user: authUser, signOut } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    let isMounted = true;
    let timeoutId: NodeJS.Timeout;

    const loadData = async () => {
      if (authUser && isMounted) {
        await fetchUserData();
      }
    };

    // Add a small delay to prevent rapid re-renders
    timeoutId = setTimeout(loadData, 100);

    return () => {
      isMounted = false;
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [authUser?.id]); // Only depend on user ID, not the entire user object

  // Redirect admins to admin dashboard
  useEffect(() => {
    if (user && user.role === 'admin') {
      navigate('/admin');
    }
  }, [user, navigate]);

  const fetchAdditionalData = async (profile: any) => {
    if (!authUser) return;

    try {
      // Fetch additional data only if profile exists
      const promises = [];

      // Fetch organization if organization_id exists
      if (profile.organization_id) {
        promises.push(
          supabase
            .from('organizations')
            .select('name')
            .eq('id', profile.organization_id)
            .maybeSingle()
        );
      } else {
        promises.push(Promise.resolve({ data: null }));
      }

      // Fetch department if department_id exists
      if (profile.department_id) {
        promises.push(
          supabase
            .from('departments')
            .select('name')
            .eq('id', profile.department_id)
            .maybeSingle()
        );
      } else {
        promises.push(Promise.resolve({ data: null }));
      }

      // Fetch tasks with work allotment information
      promises.push(
        supabase
          .from('tasks')
          .select(`
            id, 
            title, 
            description, 
            status, 
            allotment_id,
            created_at,
            work_allotments (
              id,
              title,
              description
            )
          `)
          .eq('user_id', authUser.id)
          .limit(10)
          .order('created_at', { ascending: false })
      );

      // Fetch daily logs
      promises.push(
        supabase
          .from('daily_logs')
          .select('hours_spent')
          .eq('user_id', authUser.id)
          .limit(50)
      );

      // Fetch join requests for this user
      promises.push(
        supabase
          .from('join_requests')
          .select('*')
          .eq('user_id', authUser.id)
      );

      const results = await Promise.all(promises);
      const [orgResult, deptResult, tasksResult, logsResult, requestsResult] = results;

      // Update user with organization and department data
      const updatedUser = {
        ...profile,
        organizations: orgResult.data,
        departments: deptResult.data
      };
      setUser(updatedUser);

      // Set tasks and logs
      const userTasks = tasksResult.data || [];
      const logs = logsResult.data || [];
      const requests = requestsResult.data || [];
      setTasks(userTasks);
      setJoinRequests(requests);

      // Calculate stats
      const totalHours = logs.reduce((sum, log) => sum + Number(log.hours_spent), 0);
      const completedTasks = userTasks.filter(task => task.status === 'done').length;
      
      setStats({
        totalTasks: userTasks.length,
        completedTasks,
        hoursLogged: totalHours,
        hoursTarget: 40,
      });

    } catch (error: any) {
      console.error('Error fetching additional data:', error);
    }
  };

  const fetchUserData = async () => {
    if (!authUser) return;

    try {
      // First, fetch user profile only
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id, email, full_name, role, availability_status, organization_id, department_id')
        .eq('id', authUser.id)
        .maybeSingle(); // Use maybeSingle to handle no rows gracefully

      if (profileError) {
        console.error('Error fetching profile:', profileError);
        toast({
          title: "Error loading profile",
          description: "Failed to load your profile data.",
          variant: "destructive",
        });
        return;
      }

      if (!profile) {
        // Profile doesn't exist, try to create one
        console.log('Profile not found, attempting to create one...');
        
        const { data: newProfile, error: createError } = await supabase
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

        if (createError) {
          console.error('Error creating profile:', createError);
          toast({
            title: "Profile creation failed",
            description: "Failed to create your profile. Please contact support.",
            variant: "destructive",
          });
          return;
        }

        // Use the newly created profile
        setUser(newProfile);
        setIsAvailable(newProfile.availability_status === 'available');
        
        toast({
          title: "Profile created",
          description: "Your profile has been created successfully.",
        });
        
        // Continue with the rest of the data fetching
        await fetchAdditionalData(newProfile);
        return;
      }

      // Set basic user data first
      setUser(profile);
      setIsAvailable(profile.availability_status === 'available');

      // Fetch additional data
      await fetchAdditionalData(profile);

    } catch (error: any) {
      console.error('Error fetching user data:', error);
      toast({
        title: "Error loading dashboard",
        description: error.message || "Failed to load your data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAvailabilityToggle = async (available: boolean) => {
    if (!authUser) return;

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ 
          availability_status: available ? 'available' : 'unavailable',
          last_seen: new Date().toISOString()
        })
        .eq('id', authUser.id);

      if (error) {
        throw error;
      }

      setIsAvailable(available);
      toast({
        title: available ? "You're now available" : "You're now unavailable",
        description: "Your status has been updated.",
      });
    } catch (error: any) {
      toast({
        title: "Failed to update status",
        description: error.message || "Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/auth');
      toast({
        title: "Signed out successfully",
        description: "You have been signed out.",
      });
    } catch (error: any) {
      toast({
        title: "Sign out failed",
        description: error.message || "Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleJoinRequest = async (requestId: string, action: 'approved' | 'rejected') => {
    try {
      const { error } = await supabase
        .from('join_requests')
        .update({ status: action })
        .eq('id', requestId);

      if (error) {
        throw error;
      }

      if (action === 'approved') {
        // Update user's organization and department
        const request = joinRequests.find(req => req.id === requestId);
        if (request) {
          const { error: updateError } = await supabase
            .from('profiles')
            .update({ 
              organization_id: request.organization_id,
              department_id: request.department_id
            })
            .eq('id', authUser?.id);

          if (updateError) {
            console.error('Error updating user organization:', updateError);
          }
        }

        toast({
          title: "Request approved",
          description: "You have successfully joined the organization!",
        });
      } else {
        toast({
          title: "Request declined",
          description: "You have declined the organization invitation.",
        });
      }

      // Refresh data
      await fetchUserData();
    } catch (error: any) {
      toast({
        title: "Failed to update request",
        description: error.message || "Please try again.",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Profile Setup Required</CardTitle>
            <CardDescription>
              Your profile needs to be set up before you can access the dashboard.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              This usually happens when your account was created but the profile wasn't properly initialized.
            </p>
            <div className="flex gap-2">
              <Button onClick={() => window.location.reload()} className="flex-1">
                Retry
              </Button>
              <Button variant="outline" onClick={() => navigate('/auth')}>
                Sign Out
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <ErrorBoundary>
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card shadow-soft">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="h-10 w-10 rounded-xl gradient-primary flex items-center justify-center">
                <span className="text-xl font-bold text-white">P</span>
              </div>
              <div>
                <h1 className="text-xl font-bold">PetaProgress</h1>
                <p className="text-sm text-muted-foreground">
                  {user.organizations?.name || user.departments?.name || 'No Organization'}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <AvailabilityToggle 
                isAvailable={isAvailable} 
                onToggle={handleAvailabilityToggle} 
              />
              <Avatar className="h-10 w-10">
                <AvatarFallback className="bg-primary text-primary-foreground">
                  {user.full_name?.split(' ').map(n => n[0]).join('') || 'U'}
                </AvatarFallback>
              </Avatar>
              <Button variant="ghost" size="icon" onClick={handleSignOut}>
                <LogOut className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-2">
            Welcome back, {user.full_name?.split(' ')[0] || 'User'}!
          </h2>
          <p className="text-muted-foreground">
            {user.departments?.name || 'No Department'} · {user.role === 'admin' ? 'Administrator' : 'Team Member'}
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card className="shadow-soft">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Tasks</CardTitle>
              <Briefcase className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalTasks}</div>
              <p className="text-xs text-muted-foreground mt-1">Across all projects</p>
            </CardContent>
          </Card>

          <Card className="shadow-soft">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Completed</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-success" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.completedTasks}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {Math.round((stats.completedTasks / stats.totalTasks) * 100)}% completion rate
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-soft">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Hours Logged</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.hoursLogged}h</div>
              <Progress 
                value={(stats.hoursLogged / stats.hoursTarget) * 100} 
                className="mt-2" 
              />
            </CardContent>
          </Card>

          <Card className="shadow-soft">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Team Status</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">8/12</div>
              <p className="text-xs text-muted-foreground mt-1">Members available</p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs Section */}
        <Tabs defaultValue="tasks" className="space-y-4">
          <TabsList>
            <TabsTrigger value="tasks">My Tasks</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
            <TabsTrigger value="log">Daily Log</TabsTrigger>
            <TabsTrigger value="requests">Join Requests</TabsTrigger>
          </TabsList>

          <TabsContent value="tasks" className="space-y-4">
            <Card className="shadow-soft">
              <CardHeader>
                <CardTitle>Active Tasks</CardTitle>
                <CardDescription>Tasks assigned to you</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {tasks.length > 0 ? (
                  tasks.map((task) => (
                    <TaskCard 
                      key={task.id} 
                      task={{
                        id: task.id,
                        title: task.title,
                        description: task.description || '',
                        status: task.status,
                        allotment: task.work_allotments?.title || 'No Allotment'
                      }}
                      onTaskUpdated={fetchUserData}
                    />
                  ))
                ) : (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground mb-2">No tasks assigned yet.</p>
                    <p className="text-sm text-muted-foreground">
                      Tasks will appear here once your admin assigns them to you.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="performance" className="space-y-4">
            <Card className="shadow-soft">
              <CardHeader>
                <CardTitle>Performance Evaluation</CardTitle>
                <CardDescription>Track your productivity and performance metrics</CardDescription>
              </CardHeader>
              <CardContent>
                <PerformanceReport 
                  userId={authUser?.id || ''}
                  organizationId={user?.organization_id}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="log">
            <Card className="shadow-soft">
              <CardHeader>
                <CardTitle>Submit Daily Log</CardTitle>
                <CardDescription>Record your work hours and progress</CardDescription>
              </CardHeader>
              <CardContent>
                <DailyLogForm 
                  tasks={tasks.map(task => ({
                    id: task.id,
                    title: task.title,
                    description: task.description,
                    status: task.status,
                    allotment: task.work_allotments?.title || 'No Allotment'
                  }))} 
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="requests">
              <Card className="shadow-soft">
                <CardHeader>
                <CardTitle>Join Requests</CardTitle>
                <CardDescription>Manage your organization join requests</CardDescription>
                </CardHeader>
                <CardContent>
                {joinRequests.length > 0 ? (
                  <div className="space-y-4">
                    {joinRequests.map((request) => (
                      <div key={request.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                          <p className="font-medium">Request to join organization</p>
                          <p className="text-sm text-muted-foreground">
                            Status: {request.status} • Requested: {new Date(request.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          {request.status === 'pending' && (
                            <>
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => handleJoinRequest(request.id, 'approved')}
                              >
                                Accept
                              </Button>
                              <Button 
                                size="sm" 
                                variant="destructive"
                                onClick={() => handleJoinRequest(request.id, 'rejected')}
                              >
                                Decline
                              </Button>
                            </>
                          )}
                          {request.status === 'approved' && (
                            <Badge variant="default">Approved</Badge>
                          )}
                          {request.status === 'rejected' && (
                            <Badge variant="destructive">Rejected</Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">No join requests found.</p>
                    <p className="text-sm text-muted-foreground mt-2">
                      You haven't received any requests to join organizations.
                    </p>
                  </div>
                )}
                </CardContent>
              </Card>
            </TabsContent>
        </Tabs>
      </main>
    </div>
    </ErrorBoundary>
  );
};

export default Dashboard;
