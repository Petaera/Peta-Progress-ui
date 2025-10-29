import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, CheckCircle2, Target, TrendingUp, BarChart3 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import supabase from '@/utils/supabase';

interface PerformanceMetrics {
  totalTasks: number;
  completedTasks: number;
  inProgressTasks: number;
  todoTasks: number;
  totalHoursLogged: number;
  averageHoursPerDay: number;
  completionRate: number;
  productivityScore: number;
  monthlyHours: {
    current: number;
    target: number;
    percentage: number;
  };
  weeklyStats: {
    hours: number;
    tasksCompleted: number;
  };
  monthlyStats: {
    hours: number;
    tasksCompleted: number;
  };
}

interface PerformanceReportProps {
  userId: string;
  organizationId?: string;
}

const PerformanceReport = ({ userId, organizationId }: PerformanceReportProps) => {
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'quarter'>('month');
  const { toast } = useToast();

  useEffect(() => {
    fetchPerformanceMetrics();
  }, [userId, selectedPeriod]);

  const fetchPerformanceMetrics = async () => {
    setLoading(true);
    try {
      const now = new Date();
      const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const startOfQuarter = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);

      // Fetch tasks
      const { data: tasks, error: tasksError } = await supabase
        .from('tasks')
        .select('id, status, created_at')
        .eq('user_id', userId);

      if (tasksError) throw tasksError;

      // Fetch daily logs
      const { data: logs, error: logsError } = await supabase
        .from('daily_logs')
        .select('hours_spent, log_date, task_id')
        .eq('user_id', userId);

      if (logsError) throw logsError;

      // Fetch monthly hours allocations
      const { data: monthlyHours, error: hoursError } = await supabase
        .from('monthly_hours')
        .select('allocated_hours, logged_hours, month')
        .eq('user_id', userId)
        .eq('month', now.toISOString().slice(0, 7)); // Current month
      // Fetch user's profile to get working_hours as fallback target
      const { data: profile } = await supabase
        .from('profiles')
        .select('working_hours')
        .eq('id', userId)
        .maybeSingle();

      if (hoursError) {
        console.warn('Monthly hours not found:', hoursError);
      }

      // Calculate metrics
      const totalTasks = tasks?.length || 0;
      const completedTasks = tasks?.filter(t => t.status === 'done').length || 0;
      const inProgressTasks = tasks?.filter(t => t.status === 'in_progress').length || 0;
      const todoTasks = tasks?.filter(t => t.status === 'todo').length || 0;

      const totalHoursLogged = logs?.reduce((sum, log) => sum + Number(log.hours_spent), 0) || 0;
      
      // Calculate period-specific stats
      const periodStart = selectedPeriod === 'week' ? startOfWeek : 
                         selectedPeriod === 'month' ? startOfMonth : startOfQuarter;

      const periodLogs = logs?.filter(log => 
        new Date(log.log_date) >= periodStart
      ) || [];

      const periodTasks = tasks?.filter(task => 
        new Date(task.created_at) >= periodStart
      ) || [];

      const periodHours = periodLogs.reduce((sum, log) => sum + Number(log.hours_spent), 0);
      const periodTasksCompleted = periodTasks.filter(t => t.status === 'done').length;

      // Calculate averages
      const daysSinceStart = Math.max(1, Math.ceil((now.getTime() - periodStart.getTime()) / (1000 * 60 * 60 * 24)));
      const averageHoursPerDay = periodHours / daysSinceStart;

      // Calculate completion rate
      const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

      const fallbackTarget = Number(profile?.working_hours) || 40;
      // Calculate productivity score (combination of completion rate and hours logged)
      const productivityScore = Math.min(100, (completionRate * 0.6) + (Math.min(totalHoursLogged / fallbackTarget, 1) * 40));

      // Monthly hours data
      // Prefer monthly_hours.logged_hours when available, otherwise compute from this month's daily_logs
      const monthStart = startOfMonth;
      const nextMonthStart = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 1);
      const currentMonthLogs = (logs || []).filter(l => {
        const d = new Date(l.log_date);
        return d >= monthStart && d < nextMonthStart;
      });
      const computedMonthHours = currentMonthLogs.reduce((sum, l) => sum + Number(l.hours_spent), 0);
      const currentMonthHours = (monthlyHours && monthlyHours[0] && typeof monthlyHours[0].logged_hours === 'number')
        ? monthlyHours[0].logged_hours
        : computedMonthHours;
      const targetMonthHours = (monthlyHours && monthlyHours[0] && typeof monthlyHours[0].allocated_hours === 'number')
        ? monthlyHours[0].allocated_hours
        : fallbackTarget;
      const monthlyPercentage = targetMonthHours > 0 ? (currentMonthHours / targetMonthHours) * 100 : 0;

      setMetrics({
        totalTasks,
        completedTasks,
        inProgressTasks,
        todoTasks,
        totalHoursLogged,
        averageHoursPerDay,
        completionRate,
        productivityScore,
        monthlyHours: {
          current: currentMonthHours,
          target: targetMonthHours,
          percentage: monthlyPercentage
        },
        weeklyStats: {
          hours: selectedPeriod === 'week' ? periodHours : 0,
          tasksCompleted: selectedPeriod === 'week' ? periodTasksCompleted : 0
        },
        monthlyStats: {
          hours: selectedPeriod === 'month' ? periodHours : 0,
          tasksCompleted: selectedPeriod === 'month' ? periodTasksCompleted : 0
        }
      });

    } catch (error: any) {
      console.error('Error fetching performance metrics:', error);
      toast({
        title: "Error loading performance data",
        description: error.message || "Failed to load performance metrics.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse">
          <div className="h-4 bg-muted rounded w-1/4 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-muted rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!metrics) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">Unable to load performance data.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Period Selector */}
      <div className="flex gap-2">
        <Button
          variant={selectedPeriod === 'week' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setSelectedPeriod('week')}
        >
          This Week
        </Button>
        <Button
          variant={selectedPeriod === 'month' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setSelectedPeriod('month')}
        >
          This Month
        </Button>
        <Button
          variant={selectedPeriod === 'quarter' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setSelectedPeriod('quarter')}
        >
          This Quarter
        </Button>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Tasks</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.totalTasks}</div>
            <div className="flex gap-2 mt-1">
              <Badge variant="outline" className="text-xs">
                {metrics.completedTasks} Done
              </Badge>
              <Badge variant="secondary" className="text-xs">
                {metrics.inProgressTasks} Active
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.completionRate.toFixed(1)}%</div>
            <Progress value={metrics.completionRate} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Hours Logged</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.totalHoursLogged.toFixed(1)}h</div>
            <p className="text-xs text-muted-foreground mt-1">
              {metrics.averageHoursPerDay.toFixed(1)}h/day avg
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Productivity Score</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.productivityScore.toFixed(0)}</div>
            <Progress value={metrics.productivityScore} className="mt-2" />
          </CardContent>
        </Card>
      </div>

      {/* Monthly Hours Progress */}
      <Card>
        <CardHeader>
          <CardTitle>Monthly Hours Progress</CardTitle>
          <CardDescription>Track your monthly hour allocation</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Hours Logged</span>
              <span className="text-sm text-muted-foreground">
                {metrics.monthlyHours.current.toFixed(1)} / {metrics.monthlyHours.target}h
              </span>
            </div>
            <Progress value={metrics.monthlyHours.percentage} className="h-2" />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{metrics.monthlyHours.percentage.toFixed(1)}% of target</span>
              <span>
                {metrics.monthlyHours.target - metrics.monthlyHours.current > 0 
                  ? `${(metrics.monthlyHours.target - metrics.monthlyHours.current).toFixed(1)}h remaining`
                  : 'Target exceeded!'
                }
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Period Performance */}
      <Card>
        <CardHeader>
          <CardTitle>{selectedPeriod === 'week' ? 'This Week' : selectedPeriod === 'month' ? 'This Month' : 'This Quarter'} Performance</CardTitle>
          <CardDescription>Your performance for the selected period</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Hours Worked</span>
              </div>
              <div className="text-2xl font-bold">
                {selectedPeriod === 'week' ? metrics.weeklyStats.hours.toFixed(1) :
                 selectedPeriod === 'month' ? metrics.monthlyStats.hours.toFixed(1) :
                 metrics.totalHoursLogged.toFixed(1)}h
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Tasks Completed</span>
              </div>
              <div className="text-2xl font-bold">
                {selectedPeriod === 'week' ? metrics.weeklyStats.tasksCompleted :
                 selectedPeriod === 'month' ? metrics.monthlyStats.tasksCompleted :
                 metrics.completedTasks}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Performance Insights */}
      <Card>
        <CardHeader>
          <CardTitle>Performance Insights</CardTitle>
          <CardDescription>Tips to improve your productivity</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {metrics.completionRate < 50 && (
              <div className="flex items-start gap-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <BarChart3 className="h-5 w-5 text-yellow-600 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-yellow-800">Focus on Completion</p>
                  <p className="text-xs text-yellow-700">Your completion rate is below 50%. Consider focusing on finishing existing tasks before taking on new ones.</p>
                </div>
              </div>
            )}
            
            {metrics.monthlyHours.percentage < 80 && (
              <div className="flex items-start gap-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <Clock className="h-5 w-5 text-blue-600 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-blue-800">Increase Activity</p>
                  <p className="text-xs text-blue-700">You're below 80% of your monthly hour target. Consider logging more hours or taking on additional tasks.</p>
                </div>
              </div>
            )}

            {metrics.productivityScore > 80 && (
              <div className="flex items-start gap-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                <TrendingUp className="h-5 w-5 text-green-600 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-green-800">Great Performance!</p>
                  <p className="text-xs text-green-700">You're maintaining excellent productivity. Keep up the great work!</p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PerformanceReport;
