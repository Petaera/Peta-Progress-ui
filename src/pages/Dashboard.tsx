import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LogOut, Users, Briefcase, Clock, CheckCircle2 } from "lucide-react";
import TaskCard from "@/components/TaskCard";
import AvailabilityToggle from "@/components/AvailabilityToggle";
import DailyLogForm from "@/components/DailyLogForm";

const Dashboard = () => {
  const [isAvailable, setIsAvailable] = useState(false);

  // Mock data
  const user = {
    name: "Alex Johnson",
    email: "alex@example.com",
    role: "user",
    organization: "TechCorp",
    department: "Engineering",
  };

  const tasks = [
    {
      id: "1",
      title: "Design homepage wireframes",
      description: "Create initial wireframes for the new landing page",
      status: "in_progress" as const,
      allotment: "Q4 Website Redesign",
    },
    {
      id: "2",
      title: "Write API documentation",
      description: "Document all REST endpoints",
      status: "todo" as const,
      allotment: "Documentation Sprint",
    },
    {
      id: "3",
      title: "Review pull requests",
      description: "Review 3 pending PRs from team",
      status: "done" as const,
      allotment: "Code Review",
    },
  ];

  const stats = {
    totalTasks: 12,
    completedTasks: 7,
    hoursLogged: 32.5,
    hoursTarget: 40,
  };

  return (
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
                <p className="text-sm text-muted-foreground">{user.organization}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <AvailabilityToggle 
                isAvailable={isAvailable} 
                onToggle={setIsAvailable} 
              />
              <Avatar className="h-10 w-10">
                <AvatarFallback className="bg-primary text-primary-foreground">
                  {user.name.split(' ').map(n => n[0]).join('')}
                </AvatarFallback>
              </Avatar>
              <Button variant="ghost" size="icon">
                <LogOut className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-2">Welcome back, {user.name.split(' ')[0]}!</h2>
          <p className="text-muted-foreground">
            {user.department} · {user.role === 'admin' ? 'Administrator' : 'Team Member'}
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
            <TabsTrigger value="log">Daily Log</TabsTrigger>
            {user.role === 'admin' && <TabsTrigger value="team">Team</TabsTrigger>}
          </TabsList>

          <TabsContent value="tasks" className="space-y-4">
            <Card className="shadow-soft">
              <CardHeader>
                <CardTitle>Active Tasks</CardTitle>
                <CardDescription>Tasks assigned to you</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {tasks.map((task) => (
                  <TaskCard key={task.id} task={task} />
                ))}
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
                <DailyLogForm tasks={tasks} />
              </CardContent>
            </Card>
          </TabsContent>

          {user.role === 'admin' && (
            <TabsContent value="team">
              <Card className="shadow-soft">
                <CardHeader>
                  <CardTitle>Team Overview</CardTitle>
                  <CardDescription>Monitor your team's availability and progress</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">Team management features coming soon...</p>
                </CardContent>
              </Card>
            </TabsContent>
          )}
        </Tabs>
      </main>
    </div>
  );
};

export default Dashboard;
