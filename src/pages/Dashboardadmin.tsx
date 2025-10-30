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
import EditDepartmentForm from "@/components/EditDepartmentForm";
import EditUserForm from "@/components/EditUserForm";
import EditOrganizationForm from "@/components/EditOrganizationForm";
import TaskAssignmentForm from "@/components/TaskAssignmentForm";
import CreateWorkAllotmentForm from "@/components/CreateWorkAllotmentForm";
import PerformanceReport from "@/components/PerformanceReport";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Progress } from "@/components/ui/progress";

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

type ActivityType = 'login' | 'logout' | 'task_created' | 'work_log';
interface ActivityItem {
  id: string;
  type: ActivityType;
  at: string; // ISO timestamp
  message: string;
}

// Lightweight task detail card used in the View dialog per row
function TaskDetailCard({ task, users, workAllotments }: { task: Task; users: User[]; workAllotments: WorkAllotment[] }) {
  const [loading, setLoading] = useState(true);
  const [logs, setLogs] = useState<any[]>([]);
  const assignee = users.find(u => u.id === task.user_id);
  const allotment = workAllotments.find(w => w.id === task.allotment_id);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const { data, error } = await supabase
          .from('daily_logs')
          .select('log_date, tasks_completed, hours_spent')
          .eq('task_id', task.id)
          .order('log_date', { ascending: false })
          .limit(5);
        if (error) throw error;
        if (active) setLogs(data || []);
      } catch (_) {
        if (active) setLogs([]);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, [task.id]);

  return (
    <div className="space-y-4">
      <div className="border rounded-lg p-4 bg-muted/50">
        <div className="flex items-center justify-between">
          <div className="font-semibold text-lg">{task.title}</div>
          <Badge variant={task.status === 'done' ? 'default' : task.status === 'in_progress' ? 'secondary' : 'outline'}>
            {task.status}
          </Badge>
        </div>
        <div className="text-sm text-muted-foreground mt-1">
          {task.description || 'No description'}
        </div>
        <div className="text-xs text-muted-foreground mt-2 space-y-1">
          <div>Allotment: <span className="font-medium">{allotment?.title || 'Unknown'}</span></div>
          <div>Assignee: <span className="font-medium">{assignee?.full_name || assignee?.email || 'Unknown'}</span></div>
          <div>Created: {new Date(task.created_at).toLocaleString()}</div>
        </div>
      </div>
      <div>
        <div className="font-semibold mb-2">Recent Logs</div>
        {loading ? (
          <div className="text-center py-4 text-sm text-muted-foreground">Loading logs...</div>
        ) : logs.length > 0 ? (
          <ul className="text-sm space-y-1">
            {logs.map((l: any, i: number) => (
              <li key={l.log_date + '-' + i}>
                <strong>{l.log_date}:</strong> {l.tasks_completed} ({l.hours_spent} hrs)
              </li>
            ))}
          </ul>
        ) : (
          <div className="text-sm text-muted-foreground italic">No recent logs for this task.</div>
        )}
      </div>
    </div>
  );
}


const AdminDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [workAllotments, setWorkAllotments] = useState<WorkAllotment[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [allotmentMonthlyHours, setAllotmentMonthlyHours] = useState<Record<string, number>>({});
  const [recentActivity, setRecentActivity] = useState<ActivityItem[]>([]);
  const [recentActivityLimit, setRecentActivityLimit] = useState<number>(5);
  const [onlineUsers, setOnlineUsers] = useState<Array<{ id: string; name: string }>>([]);
  const [showUserDetail, setShowUserDetail] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [userDetail, setUserDetail] = useState<any>(null);
  const [userDetailLoading, setUserDetailLoading] = useState(false);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [editFullName, setEditFullName] = useState<string>("");
  
  // state for attendance expand/collapse in admin detail modal
  const [showAllSess, setShowAllSess] = useState(false);
  const [allSessLoading, setAllSessLoading] = useState(false);
  const [allSessions, setAllSessions] = useState<any[] | null>(null);

  const { user: authUser, signOut } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (authUser) {
      fetchAdminData();
    } else {
      setLoading(false);
    }
  }, [authUser]);

  // Realtime: reflect invites and acceptances instantly
  useEffect(() => {
    if (!organization?.id) return;
    const channel = supabase
      .channel(`realtime-admin-${organization.id}`)
      // Join requests for this org (new invites, status changes)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'join_requests', filter: `organization_id=eq.${organization.id}` },
        () => fetchAdminData()
      )
      // User sessions in this org (logins/logouts)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'user_sessions' },
        () => { fetchRecentActivity(); fetchOnlineUsers(); }
      )
      // Profiles updates where user joins/leaves this org
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'profiles', filter: `organization_id=eq.${organization.id}` },
        () => fetchAdminData()
      )
      // Tasks created/updated/deleted within this org
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'tasks', filter: `organization_id=eq.${organization.id}` },
        () => fetchAdminData()
      )
      // Work allotments changed within this org
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'work_allotments', filter: `organization_id=eq.${organization.id}` },
        () => fetchAdminData()
      )
      // Any daily log change should recompute monthly stats; query itself filters by org
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'daily_logs' },
        () => fetchAllotmentMonthlyStats()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [organization?.id]);

  // Load monthly hours stats per work allotment
  useEffect(() => {
    if (!organization?.id) return;
    fetchAllotmentMonthlyStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [organization?.id, workAllotments.length]);

  // Load recent activity and online users as soon as org is known
  useEffect(() => {
    if (!organization?.id) return;
    fetchRecentActivity();
    fetchOnlineUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [organization?.id]);

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
      setEditFullName(profile.full_name || "");

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

        // After fetching allotments, refresh monthly stats
        await fetchAllotmentMonthlyStats();
        // Kick off activity/online refresh without delaying the main load
        fetchRecentActivity();
        fetchOnlineUsers();
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

  const fetchAllotmentMonthlyStats = async () => {
    if (!organization?.id) return;
    try {
      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

      const startStr = monthStart.toISOString().slice(0, 10);
      const endStr = monthEnd.toISOString().slice(0, 10);

      const { data, error } = await supabase
        .from('daily_logs')
        .select('hours_spent, tasks!inner(id, allotment_id, organization_id)')
        .gte('log_date', startStr)
        .lte('log_date', endStr)
        .eq('tasks.organization_id', organization.id);

      if (error) throw error;

      const totals: Record<string, number> = {};
      for (const row of (data as any[]) || []) {
        const aid = row?.tasks?.allotment_id as string | undefined;
        const hrs = Number(row?.hours_spent) || 0;
        if (aid) totals[aid] = (totals[aid] || 0) + hrs;
      }
      setAllotmentMonthlyHours(totals);
    } catch (e) {
      console.error('Failed to load allotment monthly stats', e);
      setAllotmentMonthlyHours({});
    }
  };

  const fetchRecentActivity = async () => {
    if (!organization?.id) return;
    try {
      // Fetch recent sessions (logins/logouts)
      const sessionsPromise = supabase
        .from('user_sessions')
        .select('id, user_id, login_time, logout_time, profiles!inner(organization_id)')
        .eq('profiles.organization_id', organization.id)
        .order('login_time', { ascending: false })
        .limit(20);

      // Fetch recent task creations
      const tasksPromise = supabase
        .from('tasks')
        .select('id, title, created_at, organization_id')
        .eq('organization_id', organization.id)
        .order('created_at', { ascending: false })
        .limit(20);

      // Fetch recent work logs submissions
      const logsPromise = supabase
        .from('daily_logs')
        .select('id, created_at, hours_spent, user_id, task_id, tasks(title, organization_id)')
        .eq('tasks.organization_id', organization.id)
        .order('created_at', { ascending: false })
        .limit(20);

      const [{ data: ses = [] }, { data: tks = [] }, { data: lgs = [] }] = await Promise.all([
        sessionsPromise,
        tasksPromise,
        logsPromise,
      ] as any);

      const userName = (uid: string) => users.find(u => u.id === uid)?.full_name || users.find(u => u.id === uid)?.email || 'User';

      const sessionEvents: ActivityItem[] = ([] as any[]).concat(ses || []).flatMap((s: any) => {
        const events: ActivityItem[] = [];
        if (s.login_time) {
          events.push({
            id: `${s.id}-login`,
            type: 'login',
            at: s.login_time,
            message: `${userName(s.user_id)} logged in`,
          });
        }
        if (s.logout_time) {
          events.push({
            id: `${s.id}-logout`,
            type: 'logout',
            at: s.logout_time,
            message: `${userName(s.user_id)} logged out`,
          });
        }
        return events;
      });

      const taskEvents: ActivityItem[] = ([] as any[]).concat(tks || []).map((t: any) => ({
        id: `task-${t.id}`,
        type: 'task_created',
        at: t.created_at,
        message: `Task created: ${t.title}`,
      }));

      const logEvents: ActivityItem[] = ([] as any[]).concat(lgs || []).map((l: any) => ({
        id: `log-${l.id}`,
        type: 'work_log',
        at: l.created_at,
        message: `${userName(l.user_id)} submitted ${Number(l.hours_spent) || 0}h on ${l.tasks?.title || 'a task'}`,
      }));

      const merged = [...sessionEvents, ...taskEvents, ...logEvents]
        .filter(e => !!e.at)
        .sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime())
        .slice(0, 20);

      setRecentActivity(merged);
      setRecentActivityLimit(5);
    } catch (e) {
      console.error('Failed to fetch recent activity', e);
      setRecentActivity([]);
    }
  };

  const fetchOnlineUsers = async () => {
    if (!organization?.id) return;
    try {
      const { data, error } = await supabase
        .from('user_sessions')
        .select('user_id, logout_time, profiles!inner(id, full_name, email, organization_id)')
        .eq('profiles.organization_id', organization.id)
        .is('logout_time', null);
      if (error) throw error;
      const ids = Array.from(new Set((data || []).map((s: any) => s.user_id)));
      const list = ids
        .map((id: string) => {
          const u = users.find(us => us.id === id);
          const name = u?.full_name || u?.email || 'User';
          return { id, name };
        })
        .filter(Boolean);
      setOnlineUsers(list);
    } catch (e) {
      console.error('Failed to fetch online users', e);
      setOnlineUsers([]);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/');
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

  const handleOpenEditProfile = () => {
    setEditFullName(user?.full_name || "");
    setShowEditProfile(true);
  };

  const handleSaveProfile = async () => {
    if (!authUser) return;
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ full_name: editFullName.trim() })
        .eq('id', authUser.id);
      if (error) throw error;
      await fetchAdminData();
      setShowEditProfile(false);
      toast({ title: 'Profile updated', description: 'Your profile has been updated.' });
    } catch (e: any) {
      toast({ title: 'Failed to update profile', description: e.message || 'Please try again.', variant: 'destructive' });
    }
  };

  async function fetchUserDetail(user) {
    setSelectedUser(user);
    setShowUserDetail(true);
    setUserDetailLoading(true);
    try {
      const [tasksRes, logsRes, sessionsRes] = await Promise.all([
        supabase
          .from('tasks')
          .select('title, description, status, work_allotments(title)')
          .eq('user_id', user.id),
        supabase
          .from('daily_logs')
          .select('log_date, tasks_completed, hours_spent, tasks(title)')
          .eq('user_id', user.id)
          .order('log_date', { ascending: false })
          .limit(5),
        supabase
          .from('user_sessions')
          .select('login_time, logout_time, duration_seconds')
          .eq('user_id', user.id)
          .order('login_time', { ascending: false })
          .limit(5),
      ]);
      setUserDetail({
        profile: user,
        tasks: tasksRes.data || [],
        logs: logsRes.data || [],
        sessions: sessionsRes.data || [],
      });
    } catch (err) {
      toast({ title: 'Failed to load detail', description: err.message, variant: 'destructive' });
      setUserDetail(null);
    } finally {
      setUserDetailLoading(false);
    }
  }

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

  let userDetailContent;
  if (userDetailLoading) {
    userDetailContent = (
      <div className="text-center py-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>Loading...</div>
    );
  } else if (userDetail) {
    userDetailContent = (
      <div className="space-y-4">
        {/* Profile quick info */}
        <div className="border-b pb-2">
          <div className="font-bold text-lg">{userDetail.profile.full_name || userDetail.profile.email}</div>
          <div className="text-xs mb-1">
            <span>Status: <span className={`inline-block rounded px-2 py-0.5 ${userDetail.profile.availability_status === 'available' ? 'bg-green-200 text-green-800' : 'bg-red-200 text-red-800'}`}>{userDetail.profile.availability_status}</span></span>
            {' | Last Seen: ' + (userDetail.profile.last_seen ? new Date(userDetail.profile.last_seen).toLocaleString() : '--')}
            {' | Department: ' + (departments.find(d => d.id === userDetail.profile.department_id)?.name || '--')}
          </div>
        </div>
        {/* Assigned Tasks */}
        <div>
          <h4 className="font-semibold mb-2">Assigned Tasks</h4>
          <ul className="text-sm space-y-1">
            {userDetail.tasks.length > 0 ? userDetail.tasks.map((task, i) => (
              <li key={task.title + i}>
                <span className="capitalize">({task.status})</span> <span className="font-medium">{task.title}</span>
                {task.work_allotments?.title && <span className="ml-1 italic">[{task.work_allotments.title}]</span>}
              </li>
            )) : <li className="text-muted-foreground italic">No tasks assigned.</li>}
          </ul>
        </div>
        {/* Recent Logs */}
        <div>
          <h4 className="font-semibold mb-2">Recent Work Logs</h4>
          <ul className="text-sm space-y-1">
            {userDetail.logs.length > 0 ? userDetail.logs.map((log, i) => (
              <li key={log.log_date + '-' + i}>
                <strong>{log.log_date}:</strong> {log.tasks_completed} ({log.hours_spent} hrs)
                {log.tasks?.title && <span className="ml-1 italic">on {log.tasks.title}</span>}
              </li>
            )) : <li className="text-muted-foreground italic">No recent logs found.</li>}
          </ul>
        </div>
        {/* Attendance */}
        <div>
          <h4 className="font-semibold mb-2">Recent Attendance</h4>
          <ul className="text-sm space-y-1">
            {userDetail.sessions.length > 0 ? userDetail.sessions.slice(0,5).map((session, i) => (
              <li key={session.login_time + '-' + i} className="flex flex-col md:flex-row md:items-center md:gap-2">
                <span className="font-semibold mr-2">
                  {session.login_time ? new Date(session.login_time).toLocaleDateString(undefined, { month: 'short', day: '2-digit', year: 'numeric' }) : '--'}
                </span>
                <span className="">
                  {session.login_time ? new Date(session.login_time).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' }) : '--'}
                  <span> – </span>
                  {session.logout_time 
                    ? new Date(session.logout_time).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
                    : <span className="italic text-muted-foreground">Ongoing</span>
                  }
                  <span className="ml-2">
                    (
                    {session.duration_seconds !== undefined && session.logout_time
                      ? `${Math.floor(session.duration_seconds/3600)}h ${Math.round((session.duration_seconds%3600)/60)}m`
                      : <span className="italic text-muted-foreground">In progress</span>
                    }
                    )
                  </span>
                </span>
              </li>
            )) : <li className="text-muted-foreground italic">No recent attendance found.</li>}
          </ul>
          {/* Show more link if more than 5 or always show for better discoverability */}
          {userDetail.sessions.length >= 5 && (
            <div className="mt-2">
              <button
                className="text-xs underline text-primary hover:text-primary-dark focus:outline-none" 
                type="button" 
                onClick={async () => {
                  if (showAllSess) { setShowAllSess(false); return; }
                  setAllSessLoading(true); setShowAllSess(true);
                  // Fetch all sessions for the month for this user
                  try {
                    const now = new Date();
                    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
                    const { data, error } = await supabase
                      .from('user_sessions')
                      .select('*')
                      .eq('user_id', userDetail.profile.id)
                      .gte('login_time', monthStart.toISOString())
                      .order('login_time', { ascending: false });
                    if (error) throw error;
                    setAllSessions(data || []);
                  } catch(e) {
                    toast({ title: 'Error loading sessions', description: e.message, variant: 'destructive' });
                    setAllSessions([]);
                  } finally {
                    setAllSessLoading(false);
                  }
                }}
              >
                {showAllSess ? 'Hide All This Month' : 'Show All This Month'}
              </button>
            </div>
          )}
          {showAllSess && (
            <div className="mt-2 pb-1 max-h-48 overflow-y-auto border-t">
              {allSessLoading
                ? (<div className="text-xs py-2 text-center">Loading all sessions...</div>)
                : (allSessions?.length > 0
                    ? <ul className="text-sm space-y-1">
                        {allSessions.map((session, i) => (
                          <li key={session.login_time + '-' + i} className="flex flex-col md:flex-row md:items-center md:gap-2">
                            <span className="font-semibold mr-2">
                              {session.login_time ? new Date(session.login_time).toLocaleDateString(undefined, { month: 'short', day: '2-digit', year: 'numeric' }) : '--'}
                            </span>
                            <span>
                              {session.login_time ? new Date(session.login_time).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' }) : '--'}
                              <span> – </span>
                              {session.logout_time 
                                ? new Date(session.logout_time).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
                                : <span className="italic text-muted-foreground">Ongoing</span>
                              }
                              <span className="ml-2">
                                (
                                {session.duration_seconds !== undefined && session.logout_time
                                  ? `${Math.floor(session.duration_seconds/3600)}h ${Math.round((session.duration_seconds%3600)/60)}m`
                                  : <span className="italic text-muted-foreground">In progress</span>
                                }
                                )
                              </span>
                            </span>
                          </li>
                        ))}
                      </ul>
                    : <div className="text-xs italic text-muted-foreground py-2">No attendance found for this month.</div>)
              }
            </div>
          )}
        </div>

        {/* Worked Time by Day (from login sessions) */}
        <div>
          <h4 className="font-semibold mb-2">Worked Time by Day</h4>
          {(() => {
            const src = showAllSess && allSessions ? allSessions : userDetail.sessions;
            if (!src || src.length === 0) return <div className="text-sm text-muted-foreground italic">No session data.</div>;
            const daily: Record<string, number> = {};
            for (const s of src) {
              const start = s.login_time ? new Date(s.login_time) : null;
              const end = s.logout_time ? new Date(s.logout_time) : null;
              const sec = typeof s.duration_seconds === 'number'
                ? s.duration_seconds
                : (start ? Math.max(0, Math.floor(((end ? end : new Date()).getTime() - start.getTime())/1000)) : 0);
              if (!start) continue;
              const key = start.toISOString().slice(0,10);
              daily[key] = (daily[key] || 0) + sec;
            }
            const items = Object.entries(daily)
              .map(([date, sec]) => ({ date, hours: Math.round((sec/3600)*10)/10 }))
              .sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime())
              .slice(0, 7);
            if (items.length === 0) return <div className="text-sm text-muted-foreground italic">No worked time recorded.</div>;
            return (
              <ul className="text-sm space-y-1">
                {items.map(it => (
                  <li key={it.date} className="flex justify-between">
                    <span className="text-muted-foreground">{new Date(it.date).toLocaleDateString(undefined, { month: 'short', day: '2-digit', year: 'numeric' })}</span>
                    <span className="font-medium">{it.hours}h</span>
                  </li>
                ))}
              </ul>
            );
          })()}
        </div>
      </div>
    );
  } else {
    userDetailContent = (
      <div className="text-muted-foreground">Failed to load user detail.</div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-background">
        {/* Header */}
        <header className="border-b bg-card shadow-soft">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between gap-3 flex-nowrap min-w-0">
              <div className="flex items-center gap-2 min-w-0">
                <div className="h-8 w-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-semibold">
                  A
                </div>
                <div className="leading-tight truncate max-w-[40vw]">
                  <div className="font-semibold truncate">Admin Dashboard</div>
                  <div className="text-xs text-muted-foreground truncate">{organization?.name || 'No Organization'}</div>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-shrink-0 flex-nowrap">
                <span className="hidden sm:flex flex-col items-end leading-tight mr-1">
                  <span className="text-sm font-medium truncate max-w-[140px]">{user.full_name || user.email}</span>
                  <span className="text-xs text-muted-foreground">Administrator</span>
                </span>
                <Badge variant="secondary" className="bg-green-100 text-green-800 hidden sm:inline-block">Admin</Badge>
                <Button
                  variant="outline"
                  className="hidden md:inline-flex"
                  onClick={() => navigate('/')}
                >
                  Home
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <div>
                      <Avatar className="h-9 w-9 cursor-pointer">
                        <AvatarFallback className="bg-primary/10 text-primary">
                          {user.full_name?.split(' ')[0]?.[0] || 'A'}
                        </AvatarFallback>
                      </Avatar>
                    </div>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel>Profile</DropdownMenuLabel>
                    <DropdownMenuItem disabled>{user.full_name || user.email}</DropdownMenuItem>
                  <DropdownMenuItem onClick={(e) => { e.preventDefault(); handleOpenEditProfile(); }}>Edit Profile</DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={(e) => { e.preventDefault(); handleSignOut(); }}>
                      <LogOut className="h-4 w-4 mr-2" /> Sign out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
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

            <Card className="shadow-soft">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Online Now</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{onlineUsers.length}</div>
                <p className="text-xs text-muted-foreground mt-1">Currently logged-in users</p>
                {onlineUsers.length > 0 && (
                  <div className="mt-2 text-xs text-foreground/90 space-y-1 max-h-24 overflow-y-auto">
                    {onlineUsers.slice(0,6).map(u => (
                      <div key={u.id} className="truncate">{u.name}</div>
                    ))}
                    {onlineUsers.length > 6 && (
                      <div className="text-muted-foreground">+{onlineUsers.length - 6} more</div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

          </div>

          {/* Management Tabs */}
          <Tabs defaultValue="overview" className="space-y-4">
            <div className="w-full overflow-x-auto">
              <TabsList className="flex flex-nowrap gap-2 w-max sm:grid sm:grid-cols-6 sm:w-full sm:min-w-0">
                <TabsTrigger value="overview" className="min-w-[120px] py-2 px-4 sm:min-w-0">Overview</TabsTrigger>
                <TabsTrigger value="organizations" className="min-w-[120px] py-2 px-4 sm:min-w-0">Organizations</TabsTrigger>
                <TabsTrigger value="users" className="min-w-[120px] py-2 px-4 sm:min-w-0">Users</TabsTrigger>
                <TabsTrigger value="departments" className="min-w-[120px] py-2 px-4 sm:min-w-0">Departments</TabsTrigger>
                <TabsTrigger value="allotments" className="min-w-[120px] py-2 px-4 sm:min-w-0">Work Allotments</TabsTrigger>
                <TabsTrigger value="tasks" className="min-w-[120px] py-2 px-4 sm:min-w-0">Tasks</TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="overview" className="space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Recent Activity</CardTitle>
                    <CardDescription>Latest updates in your organization</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {recentActivity.length === 0 && (
                        <div className="text-sm text-muted-foreground">No recent activity.</div>
                      )}
                      {recentActivity.slice(0, recentActivityLimit).map((evt) => {
                        const color = evt.type === 'login'
                          ? 'bg-green-500'
                          : evt.type === 'logout'
                          ? 'bg-gray-400'
                          : evt.type === 'task_created'
                          ? 'bg-blue-500'
                          : 'bg-orange-500';
                        return (
                          <div key={evt.id} className="flex items-center gap-3">
                            <div className={`h-2 w-2 rounded-full ${color}`}></div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">{evt.message}</p>
                              <p className="text-xs text-muted-foreground">{new Date(evt.at).toLocaleString()}</p>
                            </div>
                          </div>
                        );
                      })}
                      {recentActivity.length > 0 && (
                        <div className="pt-1">
                          {recentActivityLimit < recentActivity.length ? (
                            <button
                              type="button"
                              className="text-xs underline text-primary hover:text-primary/80"
                              onClick={() => setRecentActivityLimit(Math.min(recentActivityLimit + 5, recentActivity.length))}
                            >
                              Show more
                            </button>
                          ) : recentActivity.length > 5 ? (
                            <button
                              type="button"
                              className="text-xs underline text-primary hover:text-primary/80"
                              onClick={() => setRecentActivityLimit(5)}
                            >
                              Show less
                            </button>
                          ) : null}
                        </div>
                      )}
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

                    {/* Reports quick action removed */}
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
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
                              fetchAdminData();
                            }}
                          />
                        </DialogContent>
                      </Dialog>
                    </div>
                    <div className="overflow-x-auto -mx-4 sm:mx-0">
                    <Table className="min-w-[720px] sm:min-w-0">
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead className="hidden md:table-cell">Role</TableHead>
                        <TableHead className="hidden lg:table-cell">Department</TableHead>
                        <TableHead className="hidden lg:table-cell">Status</TableHead>
                        <TableHead className="hidden xl:table-cell">Last Seen</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {users.map((user) => (
                        <TableRow key={user.id}>
                          <TableCell className="font-medium">{user.full_name}</TableCell>
                          <TableCell>{user.email}</TableCell>
                          <TableCell className="hidden md:table-cell">
                            <Badge variant={user.role === 'admin' ? 'default' : 'secondary'}>
                              {user.role}
                            </Badge>
                          </TableCell>
                          <TableCell className="hidden lg:table-cell">
                            {departments.find(d => d.id === user.department_id)?.name || 'No Department'}
                          </TableCell>
                          <TableCell className="hidden lg:table-cell">
                            <Badge variant={user.availability_status === 'available' ? 'default' : 'secondary'}>
                              {user.availability_status}
                            </Badge>
                          </TableCell>
                          <TableCell className="hidden xl:table-cell">{new Date(user.last_seen).toLocaleDateString()}</TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button size="sm" variant="outline">Edit</Button>
                                </DialogTrigger>
                                <DialogContent>
                                  <DialogHeader>
                                    <DialogTitle>Edit User Department</DialogTitle>
                                    <DialogDescription>Update user's department assignment</DialogDescription>
                                  </DialogHeader>
                                  <EditUserForm 
                                    user={user}
                                    departments={departments}
                                    onUserUpdated={fetchAdminData}
                                    currentUserId={authUser?.id}
                                    onUserRemoved={async () => {
                                      await fetchAdminData();
                                    }}
                                  />
                                </DialogContent>
                              </Dialog>
                              <Button size="sm" variant="secondary" onClick={() => fetchUserDetail(user)}>View Details</Button>
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
                              {/* Removal action moved into Edit dialog */}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  </div>
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
                    <div className="overflow-x-auto -mx-4 sm:mx-0">
                    <Table className="min-w-[640px] sm:min-w-0">
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead className="hidden md:table-cell">Created</TableHead>
                          <TableHead className="hidden md:table-cell">Members</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {departments.map((dept) => (
                          <TableRow key={dept.id}>
                            <TableCell className="font-medium">{dept.name}</TableCell>
                            <TableCell className="hidden md:table-cell">{new Date(dept.created_at).toLocaleDateString()}</TableCell>
                            <TableCell className="hidden md:table-cell">
                              {users.filter(u => u.department_id === dept.id).length} members
                            </TableCell>
                            <TableCell>
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button size="sm" variant="outline">Edit</Button>
                                </DialogTrigger>
                                <DialogContent>
                                  <DialogHeader>
                                    <DialogTitle>Edit Department</DialogTitle>
                                    <DialogDescription>Rename this department</DialogDescription>
                                  </DialogHeader>
                                  <EditDepartmentForm 
                                    department={dept}
                                    onDepartmentUpdated={fetchAdminData}
                                  />
                                </DialogContent>
                              </Dialog>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                    </div>
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
                    {/* Summary statistics for this month */}
                    <Card className="bg-gradient-to-r from-emerald-50 to-green-50 border-emerald-200">
                      <CardHeader>
                        <CardTitle>Monthly Progress</CardTitle>
                        <CardDescription>Progress against this month's targets across all allotments</CardDescription>
                      </CardHeader>
                      <CardContent>
                        {(() => {
                          const totalTarget = workAllotments.reduce((sum, a) => sum + (Number(a.target_hours) || 0), 0);
                          const totalLogged = Object.values(allotmentMonthlyHours).reduce((sum, n) => sum + (Number(n) || 0), 0);
                          const pct = totalTarget > 0 ? Math.min(100, Math.round((totalLogged / totalTarget) * 100)) : 0;
                          return (
                            <div>
                              <div className="flex justify-between text-sm mb-2">
                                <div className="font-medium">{totalLogged}h logged</div>
                                <div className="text-muted-foreground">{pct}% of {totalTarget}h target</div>
                              </div>
                              <Progress value={pct} className="h-2" />
                            </div>
                          );
                        })()}
                      </CardContent>
                    </Card>
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
                    <div className="overflow-x-auto -mx-4 sm:mx-0">
                    <Table className="min-w-[760px] sm:min-w-0">
                      <TableHeader>
                        <TableRow>
                          <TableHead>Title</TableHead>
                          <TableHead className="hidden md:table-cell">Department</TableHead>
                          <TableHead className="hidden md:table-cell">Target Hours</TableHead>
                          <TableHead className="hidden md:table-cell">This Month</TableHead>
                          <TableHead className="hidden lg:table-cell">Duration</TableHead>
                          <TableHead className="hidden lg:table-cell">Tasks</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {workAllotments.map((allotment) => (
                          <TableRow key={allotment.id}>
                            <TableCell className="font-medium">{allotment.title}</TableCell>
                            <TableCell className="hidden md:table-cell">
                              {departments.find(d => d.id === allotment.department_id)?.name || 'No Department'}
                            </TableCell>
                            <TableCell className="hidden md:table-cell">{allotment.target_hours}h</TableCell>
                            <TableCell className="hidden md:table-cell">
                              {(() => {
                                const logged = Number(allotmentMonthlyHours[allotment.id] || 0);
                                const target = Number(allotment.target_hours || 0);
                                const pct = target > 0 ? Math.min(100, Math.round((logged / target) * 100)) : 0;
                                const remaining = Math.max(target - logged, 0);
                                return (
                                  <div className="min-w-[200px]">
                                    <div className="flex justify-between text-xs mb-1">
                                      <span>{logged}h</span>
                                      <span>{pct}%</span>
                                    </div>
                                    <Progress value={pct} className="h-2" />
                                    <div className="text-xs text-muted-foreground mt-1">{remaining}h remaining</div>
                                  </div>
                                );
                              })()}
                            </TableCell>
                            <TableCell className="hidden lg:table-cell">
                              {allotment.start_date} - {allotment.end_date || 'Ongoing'}
                            </TableCell>
                            <TableCell className="hidden lg:table-cell">
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
                    
                    <div className="overflow-x-auto -mx-4 sm:mx-0">
                    <Table className="min-w-[820px] sm:min-w-0">
                      <TableHeader>
                        <TableRow>
                          <TableHead>Title</TableHead>
                          <TableHead className="hidden md:table-cell">Assigned To</TableHead>
                          <TableHead className="hidden lg:table-cell">Work Allotment</TableHead>
                          <TableHead className="hidden md:table-cell">Status</TableHead>
                          <TableHead className="hidden xl:table-cell">Created</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {tasks.map((task) => (
                          <TableRow key={task.id}>
                            <TableCell className="font-medium">{task.title}</TableCell>
                            <TableCell className="hidden md:table-cell">
                              {users.find(u => u.id === task.user_id)?.full_name || 'Unknown'}
                            </TableCell>
                            <TableCell className="hidden lg:table-cell">
                              {workAllotments.find(w => w.id === task.allotment_id)?.title || 'Unknown'}
                            </TableCell>
                            <TableCell className="hidden md:table-cell">
                              <Badge variant={
                                task.status === 'done' ? 'default' : 
                                task.status === 'in_progress' ? 'secondary' : 'outline'
                              }>
                                {task.status}
                              </Badge>
                            </TableCell>
                            <TableCell className="hidden xl:table-cell">{new Date(task.created_at).toLocaleDateString()}</TableCell>
                            <TableCell>
                              <div className="flex gap-2">
                                <Button size="sm" variant="outline">Edit</Button>
                                <Dialog>
                                  <DialogTrigger asChild>
                                    <Button size="sm" variant="secondary">View</Button>
                                  </DialogTrigger>
                                  <DialogContent className="max-w-2xl w-full">
                                    <DialogHeader>
                                      <DialogTitle>Task Details</DialogTitle>
                                      <DialogDescription>Overview and recent logs</DialogDescription>
                                    </DialogHeader>
                                    <TaskDetailCard task={task} users={users} workAllotments={workAllotments} />
                                  </DialogContent>
                                </Dialog>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

          </Tabs>
        </main>
      </div>
      <Dialog open={showUserDetail} onOpenChange={setShowUserDetail}>
        <DialogContent className="max-w-2xl w-full">
          <DialogHeader>
            <DialogTitle>User Detail</DialogTitle>
          </DialogHeader>
          {userDetailContent}
        </DialogContent>
      </Dialog>
      {/* Edit Profile Dialog */}
      <Dialog open={showEditProfile} onOpenChange={setShowEditProfile}>
        <DialogContent className="max-w-md w-full">
          <DialogHeader>
            <DialogTitle>Edit Profile</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="admin-full-name">Full Name</Label>
              <Input id="admin-full-name" value={editFullName} onChange={(e) => setEditFullName(e.target.value)} placeholder="Your full name" />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowEditProfile(false)}>Cancel</Button>
              <Button onClick={handleSaveProfile} disabled={!editFullName.trim()}>Save</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </ErrorBoundary>
  );
};

export default AdminDashboard;
