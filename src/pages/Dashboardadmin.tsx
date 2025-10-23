import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  LogOut, 
  Users, 
  Briefcase, 
  Clock, 
  CheckCircle2, 
  Plus, 
  Settings, 
  Building2,
  UserPlus,
  Calendar,
  Target,
  BarChart3
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import supabase from "@/utils/supabase";
import ErrorBoundary from "@/components/ErrorBoundary";
import InviteUserForm from "@/components/InviteUserForm";
import CreateDepartmentForm from "@/components/CreateDepartmentForm";
import EditUserForm from "@/components/EditUserForm";
import EditOrganizationForm from "@/components/EditOrganizationForm";
import TaskAssignmentForm from "@/components/TaskAssignmentForm";
import CreateWorkAllotmentForm from "@/components/CreateWorkAllotmentForm";
import PerformanceReport from "@/components/PerformanceReport";

interface Organization {
  id: string;
  name: string;
  description?: string;
  created_at: string;
}

interface Department {
  id: string;
  name: string;
  organization_id: string;
  created_at: string;
}

interface WorkAllotment {
  id: string;
  title: string;
  description?: string;
  organization_id: string;
  department_id?: string;
  target_hours: number;
  start_date: string;
  end_date?: string;
  created_at: string;
}

interface Task {
  id: string;
  title: string;
  description?: string;
  status: string;
  allotment_id: string;
  user_id: string;
  organization_id: string;
  created_at: string;
}

interface User {
  id: string;
  email: string;
  full_name: string;
  role: string;
  organization_id?: string;
  department_id?: string;
  availability_status: string;
  last_seen: string;
}


const AdminDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [workAllotments, setWorkAllotments] = useState<WorkAllotment[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  
  const { user: authUser, signOut } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (authUser) {
      fetchAdminData();
    }
  }, [authUser]);

  const fetchAdminData = async () => {
    if (!authUser) return;

    try {
      // Fetch admin profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authUser.id)
        .single();

      if (profileError || !profile) {
        throw new Error('Admin profile not found');
      }

      if (profile.role !== 'admin') {
        navigate('/dashboard');
        return;
      }

      setUser(profile);

      // Fetch organization data
      if (profile.organization_id) {
        const { data: org } = await supabase
          .from('organizations')
          .select('*')
          .eq('id', profile.organization_id)
          .single();
        setOrganization(org);

        // Fetch all related data in parallel
        const [
          departmentsResult,
          workAllotmentsResult,
          tasksResult,
          usersResult
        ] = await Promise.all([
          supabase.from('departments').select('*').eq('organization_id', profile.organization_id),
          supabase.from('work_allotments').select('*').eq('organization_id', profile.organization_id),
          supabase.from('tasks').select('*').eq('organization_id', profile.organization_id),
          supabase.from('profiles').select('*').eq('organization_id', profile.organization_id)
        ]);

        setDepartments(departmentsResult.data || []);
        setWorkAllotments(workAllotmentsResult.data || []);
        setTasks(tasksResult.data || []);
        setUsers(usersResult.data || []);
      }

    } catch (error: any) {
      console.error('Error fetching admin data:', error);
      toast({
        title: "Error loading admin dashboard",
        description: error.message || "Failed to load admin data.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
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

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  if (!user || user.role !== 'admin') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">Access denied. Admin privileges required.</p>
          <Button onClick={() => navigate('/dashboard')}>Go to Dashboard</Button>
        </div>
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
                  <span className="text-xl font-bold text-white">A</span>
                </div>
                <div>
                  <h1 className="text-xl font-bold">Admin Dashboard</h1>
                  <p className="text-sm text-muted-foreground">{organization?.name}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                <Badge variant="secondary" className="bg-green-100 text-green-800">
                  Admin
                </Badge>
                <Avatar className="h-10 w-10">
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    {user.full_name?.split(' ').map(n => n[0]).join('') || 'A'}
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
            <h2 className="text-3xl font-bold mb-2">Organization Management</h2>
            <p className="text-muted-foreground">
              Manage your organization, departments, work allotments, and team members
            </p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <Card className="shadow-soft">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{users.length}</div>
                <p className="text-xs text-muted-foreground mt-1">Team members</p>
              </CardContent>
            </Card>

            <Card className="shadow-soft">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Departments</CardTitle>
                <Building2 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{departments.length}</div>
                <p className="text-xs text-muted-foreground mt-1">Active departments</p>
              </CardContent>
            </Card>

            <Card className="shadow-soft">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Work Allotments</CardTitle>
                <Target className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{workAllotments.length}</div>
                <p className="text-xs text-muted-foreground mt-1">Active projects</p>
              </CardContent>
            </Card>

          </div>

          {/* Management Tabs */}
          <Tabs defaultValue="overview" className="space-y-4">
            <TabsList className="grid w-full grid-cols-6">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="organizations">Organizations</TabsTrigger>
              <TabsTrigger value="users">Users</TabsTrigger>
              <TabsTrigger value="departments">Departments</TabsTrigger>
              <TabsTrigger value="allotments">Work Allotments</TabsTrigger>
              <TabsTrigger value="tasks">Tasks</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Recent Activity</CardTitle>
                    <CardDescription>Latest updates in your organization</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                        <div className="flex-1">
                          <p className="text-sm font-medium">New user joined</p>
                          <p className="text-xs text-muted-foreground">2 hours ago</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="h-2 w-2 bg-blue-500 rounded-full"></div>
                        <div className="flex-1">
                          <p className="text-sm font-medium">Work allotment created</p>
                          <p className="text-xs text-muted-foreground">5 hours ago</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="h-2 w-2 bg-orange-500 rounded-full"></div>
                        <div className="flex-1">
                          <p className="text-sm font-medium">Task completed</p>
                          <p className="text-xs text-muted-foreground">1 day ago</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Quick Actions</CardTitle>
                    <CardDescription>Common administrative tasks</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button className="w-full justify-start" variant="outline">
                          <Plus className="h-4 w-4 mr-2" />
                          Create Work Allotment
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Create New Work Allotment</DialogTitle>
                          <DialogDescription>
                            Create a new project or work allocation
                          </DialogDescription>
                        </DialogHeader>
                        <CreateWorkAllotmentForm 
                          organizationId={organization?.id || ''}
                          departments={departments}
                          onWorkAllotmentCreated={fetchAdminData}
                        />
                      </DialogContent>
                    </Dialog>

                    <Dialog>
                      <DialogTrigger asChild>
                        <Button className="w-full justify-start" variant="outline">
                          <Building2 className="h-4 w-4 mr-2" />
                          Add Department
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Create New Department</DialogTitle>
                          <DialogDescription>
                            Add a new department to your organization
                          </DialogDescription>
                        </DialogHeader>
                        <CreateDepartmentForm 
                          organizationId={organization?.id || ''}
                          onDepartmentCreated={fetchAdminData}
                        />
                      </DialogContent>
                    </Dialog>

                    <Dialog>
                      <DialogTrigger asChild>
                        <Button className="w-full justify-start" variant="outline">
                          <UserPlus className="h-4 w-4 mr-2" />
                          Invite User
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Invite User to Organization</DialogTitle>
                          <DialogDescription>
                            Send an invitation to a user to join your organization
                          </DialogDescription>
                        </DialogHeader>
                        <InviteUserForm 
                          organizationId={organization?.id} 
                          departments={departments}
                          onInviteSent={() => {
                            toast({
                              title: "Invitation sent",
                              description: "The user has been invited to join your organization.",
                            });
                          }}
                        />
                      </DialogContent>
                    </Dialog>

                    <Button 
                      className="w-full justify-start" 
                      variant="outline"
                      onClick={() => {
                        // Navigate to users tab to show performance overview
                        const usersTab = document.querySelector('[value="users"]') as HTMLElement;
                        if (usersTab) {
                          usersTab.click();
                        }
                      }}
                    >
                      <BarChart3 className="h-4 w-4 mr-2" />
                      View Reports
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="organizations" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Organization Settings</CardTitle>
                  <CardDescription>Manage your organization details</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {organization ? (
                      <div className="space-y-4">
                        <div className="p-4 border rounded-lg bg-muted/50">
                          <h4 className="font-medium mb-2">Current Organization:</h4>
                          <p className="text-sm text-muted-foreground">
                            <strong>Name:</strong> {organization.name}<br/>
                            <strong>Description:</strong> {organization.description || 'No description'}<br/>
                            <strong>Created:</strong> {new Date(organization.created_at).toLocaleDateString()}<br/>
                            <strong>ID:</strong> {organization.id}
                          </p>
                        </div>
                        
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button className="w-full">
                              <Settings className="h-4 w-4 mr-2" />
                              Edit Organization
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Edit Organization</DialogTitle>
                              <DialogDescription>
                                Update your organization's name and description
                              </DialogDescription>
                            </DialogHeader>
                            <EditOrganizationForm 
                              organization={organization}
                              onOrganizationUpdated={fetchAdminData}
                            />
                          </DialogContent>
                        </Dialog>
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <p className="text-muted-foreground">No organization found.</p>
                        <p className="text-sm text-muted-foreground mt-2">
                          Please contact your system administrator to assign you to an organization.
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="users" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Team Members</CardTitle>
                  <CardDescription>Manage your organization's users</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Performance Overview */}
                    <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <BarChart3 className="h-5 w-5 text-blue-600" />
                          Team Performance Overview
                        </CardTitle>
                        <CardDescription>Quick overview of your team's performance metrics</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="text-center p-4 bg-white rounded-lg border">
                            <div className="text-2xl font-bold text-green-600">
                              {users.filter(u => u.availability_status === 'available').length}
                            </div>
                            <div className="text-sm text-muted-foreground">Active Users</div>
                          </div>
                          <div className="text-center p-4 bg-white rounded-lg border">
                            <div className="text-2xl font-bold text-blue-600">
                              {Math.round((users.filter(u => u.availability_status === 'available').length / users.length) * 100) || 0}%
                            </div>
                            <div className="text-sm text-muted-foreground">Availability Rate</div>
                          </div>
                          <div className="text-center p-4 bg-white rounded-lg border">
                            <div className="text-2xl font-bold text-purple-600">
                              {departments.length}
                            </div>
                            <div className="text-sm text-muted-foreground">Departments</div>
                          </div>
                        </div>
                        <div className="mt-4 text-xs text-muted-foreground">
                          <p>💡 Click "Performance" next to any user to view detailed metrics and analytics</p>
                        </div>
                      </CardContent>
                    </Card>

                    <div className="flex justify-end gap-2">
                      <Button 
                        variant="outline"
                        onClick={async () => {
                          console.log('Testing database connection...');
                          try {
                            const { data, error } = await supabase
                              .from('join_requests')
                              .select('*')
                              .limit(1);
                            console.log('Database test result:', { data, error });
                            toast({
                              title: "Database test",
                              description: error ? `Error: ${error.message}` : `Success: Found ${data?.length || 0} records`,
                            });
                          } catch (err) {
                            console.error('Database test error:', err);
                          }
                        }}
                      >
                        Test DB
                      </Button>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button>
                            <Plus className="h-4 w-4 mr-2" />
                            Invite User
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Invite User to Organization</DialogTitle>
                            <DialogDescription>
                              Send an invitation to a user to join your organization
                            </DialogDescription>
                          </DialogHeader>
                          <InviteUserForm 
                            organizationId={organization?.id} 
                            departments={departments}
                            onInviteSent={() => {
                              toast({
                                title: "Invitation sent",
                                description: "The user has been invited to join your organization.",
                              });
                            }}
                          />
                        </DialogContent>
                      </Dialog>
                    </div>
                    <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Department</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Last Seen</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {users.map((user) => (
                        <TableRow key={user.id}>
                          <TableCell className="font-medium">{user.full_name}</TableCell>
                          <TableCell>{user.email}</TableCell>
                          <TableCell>
                            <Badge variant={user.role === 'admin' ? 'default' : 'secondary'}>
                              {user.role}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {departments.find(d => d.id === user.department_id)?.name || 'No Department'}
                          </TableCell>
                          <TableCell>
                            <Badge variant={user.availability_status === 'available' ? 'default' : 'secondary'}>
                              {user.availability_status}
                            </Badge>
                          </TableCell>
                          <TableCell>{new Date(user.last_seen).toLocaleDateString()}</TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button size="sm" variant="outline">Edit</Button>
                                </DialogTrigger>
                                <DialogContent>
                                  <DialogHeader>
                                    <DialogTitle>Edit User Department</DialogTitle>
                                    <DialogDescription>
                                      Update user's department assignment
                                    </DialogDescription>
                                  </DialogHeader>
                                  <EditUserForm 
                                    user={user}
                                    departments={departments}
                                    onUserUpdated={fetchAdminData}
                                  />
                                </DialogContent>
                              </Dialog>
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button size="sm" variant="secondary">
                                    <BarChart3 className="h-4 w-4 mr-1" />
                                    Performance
                                  </Button>
                                </DialogTrigger>
                                <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
                                  <DialogHeader>
                                    <DialogTitle>Performance Report - {user.full_name}</DialogTitle>
                                    <DialogDescription>
                                      View detailed performance metrics and analytics for {user.full_name}
                                    </DialogDescription>
                                  </DialogHeader>
                                  <PerformanceReport 
                                    userId={user.id}
                                    organizationId={organization?.id}
                                  />
                                </DialogContent>
                              </Dialog>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="departments" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Departments</CardTitle>
                  <CardDescription>Manage your organization's departments</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-end">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button>
                            <Plus className="h-4 w-4 mr-2" />
                            Add Department
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Create New Department</DialogTitle>
                            <DialogDescription>
                              Add a new department to your organization
                            </DialogDescription>
                          </DialogHeader>
                          <CreateDepartmentForm 
                            organizationId={organization?.id || ''}
                            onDepartmentCreated={fetchAdminData}
                          />
                        </DialogContent>
                      </Dialog>
                    </div>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead>Created</TableHead>
                          <TableHead>Members</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {departments.map((dept) => (
                          <TableRow key={dept.id}>
                            <TableCell className="font-medium">{dept.name}</TableCell>
                            <TableCell>{new Date(dept.created_at).toLocaleDateString()}</TableCell>
                            <TableCell>
                              {users.filter(u => u.department_id === dept.id).length} members
                            </TableCell>
                            <TableCell>
                              <Button size="sm" variant="outline">Edit</Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="allotments" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Work Allotments</CardTitle>
                  <CardDescription>Manage projects and work allocations</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-end">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button>
                            <Plus className="h-4 w-4 mr-2" />
                            Create Work Allotment
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Create New Work Allotment</DialogTitle>
                            <DialogDescription>
                              Create a new project or work allocation
                            </DialogDescription>
                          </DialogHeader>
                          <CreateWorkAllotmentForm 
                            organizationId={organization?.id || ''}
                            departments={departments}
                            onWorkAllotmentCreated={fetchAdminData}
                          />
                        </DialogContent>
                      </Dialog>
                    </div>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Title</TableHead>
                          <TableHead>Department</TableHead>
                          <TableHead>Target Hours</TableHead>
                          <TableHead>Duration</TableHead>
                          <TableHead>Tasks</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {workAllotments.map((allotment) => (
                          <TableRow key={allotment.id}>
                            <TableCell className="font-medium">{allotment.title}</TableCell>
                            <TableCell>
                              {departments.find(d => d.id === allotment.department_id)?.name || 'No Department'}
                            </TableCell>
                            <TableCell>{allotment.target_hours}h</TableCell>
                            <TableCell>
                              {allotment.start_date} - {allotment.end_date || 'Ongoing'}
                            </TableCell>
                            <TableCell>
                              {tasks.filter(t => t.allotment_id === allotment.id).length} tasks
                            </TableCell>
                            <TableCell>
                              <Button size="sm" variant="outline">Edit</Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="tasks" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Tasks</CardTitle>
                  <CardDescription>Manage all tasks across your organization</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-end">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button>
                            <Plus className="h-4 w-4 mr-2" />
                            Create Task
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                          <DialogHeader>
                            <DialogTitle>Create and Assign Task</DialogTitle>
                            <DialogDescription>
                              Create a new task and assign it to users with monthly hour allocations
                            </DialogDescription>
                          </DialogHeader>
                          <TaskAssignmentForm 
                            organizationId={organization?.id || ''}
                            workAllotments={workAllotments}
                            departments={departments}
                            users={users}
                            onTaskCreated={fetchAdminData}
                          />
                        </DialogContent>
                      </Dialog>
                    </div>
                    
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Title</TableHead>
                          <TableHead>Assigned To</TableHead>
                          <TableHead>Work Allotment</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Created</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {tasks.map((task) => (
                          <TableRow key={task.id}>
                            <TableCell className="font-medium">{task.title}</TableCell>
                            <TableCell>
                              {users.find(u => u.id === task.user_id)?.full_name || 'Unknown'}
                            </TableCell>
                            <TableCell>
                              {workAllotments.find(w => w.id === task.allotment_id)?.title || 'Unknown'}
                            </TableCell>
                            <TableCell>
                              <Badge variant={
                                task.status === 'done' ? 'default' : 
                                task.status === 'in_progress' ? 'secondary' : 'outline'
                              }>
                                {task.status}
                              </Badge>
                            </TableCell>
                            <TableCell>{new Date(task.created_at).toLocaleDateString()}</TableCell>
                            <TableCell>
                              <Button size="sm" variant="outline">Edit</Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

          </Tabs>
        </main>
      </div>
    </ErrorBoundary>
  );
};

export default AdminDashboard;
