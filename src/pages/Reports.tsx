import { useState, useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { Download, Calendar, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { CRMLayout } from '@/components/crm/CRMLayout';
import { useLeads } from '@/hooks/useLeads';
import { useLeadStatuses } from '@/hooks/useLeadStatuses';
import { useLeadSources } from '@/hooks/useLeadSources';
import { useAuth } from '@/hooks/useAuth';
import { useUsers } from '@/hooks/useUsers';
import { format, subDays, startOfDay, isAfter } from 'date-fns';

export default function Reports() {
  const [dateRange, setDateRange] = useState('30d');
  const { leads } = useLeads();
  const { statuses } = useLeadStatuses();
  const { sources } = useLeadSources();
  const { role, user, profile } = useAuth();
  const { users } = useUsers();

  // Role-based access
  const isSuperAdmin = role === 'super_admin';
  const isAdmin = role === 'admin' || isSuperAdmin;
  const isManager = role === 'manager' || isAdmin;
  const isAgent = role === 'agent';

  // Filter leads based on role
  const accessibleLeads = useMemo(() => {
    if (isSuperAdmin || isAdmin) {
      // Super Admin and Admin see all leads
      return leads;
    } else if (role === 'manager' && profile?.group_id) {
      // Manager sees only leads in their group
      return leads.filter(l => l.group_id === profile.group_id);
    } else if (isAgent && user?.id) {
      // Agent sees only leads assigned to them
      return leads.filter(l => l.assigned_user_id === user.id);
    }
    return [];
  }, [leads, role, profile, user, isSuperAdmin, isAdmin, isAgent]);

  // Filter users based on role (for team performance)
  const accessibleUsers = useMemo(() => {
    if (isSuperAdmin || isAdmin) {
      return users;
    } else if (role === 'manager' && profile?.group_id) {
      return users.filter(u => u.group_id === profile.group_id);
    }
    return [];
  }, [users, role, profile, isSuperAdmin, isAdmin]);

  // Calculate date filter
  const dateThreshold = useMemo(() => {
    const days = parseInt(dateRange.replace('d', '').replace('m', ''));
    if (dateRange.includes('m')) {
      return subDays(new Date(), days * 30);
    }
    return subDays(new Date(), days);
  }, [dateRange]);

  const filteredLeads = useMemo(() => {
    return accessibleLeads.filter(lead => 
      isAfter(new Date(lead.created_at), startOfDay(dateThreshold))
    );
  }, [accessibleLeads, dateThreshold]);

  // Leads by status chart data
  const leadsByStatusData = useMemo(() => {
    return statuses.map(status => ({
      name: status.label,
      value: filteredLeads.filter(l => l.status === status.name).length,
      color: status.color,
    }));
  }, [filteredLeads, statuses]);

  // Leads by source chart data
  const leadsBySourceData = useMemo(() => {
    return sources.map(source => ({
      name: source.label,
      value: filteredLeads.filter(l => l.source === source.name).length,
      color: source.color,
    }));
  }, [filteredLeads, sources]);

  // Daily leads trend
  const dailyTrendData = useMemo(() => {
    const days = parseInt(dateRange.replace('d', '').replace('m', ''));
    const numDays = dateRange.includes('m') ? Math.min(days * 30, 30) : Math.min(days, 30);
    
    const data = [];
    for (let i = numDays - 1; i >= 0; i--) {
      const date = subDays(new Date(), i);
      const dayStart = startOfDay(date);
      const dayEnd = new Date(dayStart);
      dayEnd.setDate(dayEnd.getDate() + 1);
      
      const dayLeads = filteredLeads.filter(l => {
        const created = new Date(l.created_at);
        return created >= dayStart && created < dayEnd;
      });
      
      const converted = dayLeads.filter(l => l.status === 'converted').length;
      
      data.push({
        name: format(date, 'MMM d'),
        leads: dayLeads.length,
        converted,
      });
    }
    return data;
  }, [filteredLeads, dateRange]);

  // User performance data
  const userPerformanceData = useMemo(() => {
    return accessibleUsers.map(u => {
      const userLeads = filteredLeads.filter(l => l.assigned_user_id === u.id);
      const converted = userLeads.filter(l => l.status === 'converted').length;
      return {
        name: u.full_name || u.email,
        leads: userLeads.length,
        converted,
        rate: userLeads.length > 0 ? ((converted / userLeads.length) * 100).toFixed(1) : '0',
        value: userLeads.reduce((sum, l) => sum + (l.value || 0), 0),
      };
    }).sort((a, b) => b.leads - a.leads);
  }, [filteredLeads, accessibleUsers]);

  // Summary stats
  const stats = useMemo(() => {
    const total = filteredLeads.length;
    const converted = filteredLeads.filter(l => l.status === 'converted').length;
    const totalValue = filteredLeads.reduce((sum, l) => sum + (l.value || 0), 0);
    const avgValue = total > 0 ? totalValue / total : 0;
    
    return {
      total,
      converted,
      conversionRate: total > 0 ? ((converted / total) * 100).toFixed(1) : '0',
      totalValue,
      avgValue: avgValue.toFixed(0),
    };
  }, [filteredLeads]);

  const getRoleLabel = () => {
    if (isSuperAdmin) return 'System-wide';
    if (isAdmin) return 'All Groups';
    if (role === 'manager') return 'Group';
    return 'Personal';
  };

  return (
    <CRMLayout>
      <div className="p-6 lg:p-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Reports</h1>
            <p className="text-muted-foreground mt-1 flex items-center gap-2">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-medium">
                {getRoleLabel()} Reports
              </span>
              {isAgent && (
                <span className="text-xs text-muted-foreground">
                  You can only see your own lead performance
                </span>
              )}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger className="w-[160px]">
                <Calendar className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Select range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7d">Last 7 days</SelectItem>
                <SelectItem value="30d">Last 30 days</SelectItem>
                <SelectItem value="90d">Last 90 days</SelectItem>
                <SelectItem value="12m">Last 12 months</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">Total Leads</p>
              <p className="text-2xl font-bold">{stats.total}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">Converted</p>
              <p className="text-2xl font-bold text-status-converted">{stats.converted}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">Conversion Rate</p>
              <p className="text-2xl font-bold">{stats.conversionRate}%</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">Total Value</p>
              <p className="text-2xl font-bold">${stats.totalValue.toLocaleString()}</p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="leads">Leads</TabsTrigger>
            {isManager && <TabsTrigger value="team">Team Performance</TabsTrigger>}
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Leads by Status */}
              <Card>
                <CardHeader>
                  <CardTitle>Leads by Status</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={leadsByStatusData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={100}
                          paddingAngle={2}
                          dataKey="value"
                          label={({ name, value }) => value > 0 ? `${name}: ${value}` : ''}
                        >
                          {leadsByStatusData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Leads by Source */}
              <Card>
                <CardHeader>
                  <CardTitle>Leads by Source</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={leadsBySourceData} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                        <YAxis 
                          type="category" 
                          dataKey="name" 
                          stroke="hsl(var(--muted-foreground))" 
                          fontSize={12}
                          width={100}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: 'hsl(var(--card))',
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '8px',
                          }}
                        />
                        <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                          {leadsBySourceData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Trend Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Lead Activity Trend</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={dailyTrendData}>
                      <defs>
                        <linearGradient id="colorLeads" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="colorConverted" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(var(--status-converted))" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="hsl(var(--status-converted))" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                      <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px',
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey="leads"
                        stroke="hsl(var(--primary))"
                        fillOpacity={1}
                        fill="url(#colorLeads)"
                        strokeWidth={2}
                        name="Total Leads"
                      />
                      <Area
                        type="monotone"
                        dataKey="converted"
                        stroke="hsl(var(--status-converted))"
                        fillOpacity={1}
                        fill="url(#colorConverted)"
                        strokeWidth={2}
                        name="Converted"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Leads Tab */}
          <TabsContent value="leads" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Lead Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[350px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={dailyTrendData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                      <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px',
                        }}
                      />
                      <Bar dataKey="leads" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} name="Total Leads" />
                      <Bar dataKey="converted" fill="hsl(var(--status-converted))" radius={[4, 4, 0, 0]} name="Converted" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Team Performance Tab (Manager+ only) */}
          {isManager && (
            <TabsContent value="team" className="space-y-6">
              {isAgent ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <Lock className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <CardTitle className="mb-2">Access Restricted</CardTitle>
                    <CardDescription>
                      Team performance reports are only available to Managers and Admins.
                    </CardDescription>
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardHeader>
                    <CardTitle>Team Performance</CardTitle>
                    <CardDescription>
                      {role === 'manager' ? 'Performance of team members in your group' : 'Performance across all team members'}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <table className="crm-table">
                        <thead>
                          <tr>
                            <th>Team Member</th>
                            <th className="text-right">Leads Handled</th>
                            <th className="text-right">Converted</th>
                            <th className="text-right">Conversion Rate</th>
                            <th className="text-right">Total Value</th>
                          </tr>
                        </thead>
                        <tbody>
                          {userPerformanceData.length === 0 ? (
                            <tr>
                              <td colSpan={5} className="text-center py-8 text-muted-foreground">
                                No team members found
                              </td>
                            </tr>
                          ) : (
                            userPerformanceData.map((u) => (
                              <tr key={u.name}>
                                <td className="font-medium">{u.name}</td>
                                <td className="text-right">{u.leads}</td>
                                <td className="text-right">{u.converted}</td>
                                <td className="text-right">
                                  <span className="text-status-converted font-medium">
                                    {u.rate}%
                                  </span>
                                </td>
                                <td className="text-right">${u.value.toLocaleString()}</td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          )}
        </Tabs>
      </div>
    </CRMLayout>
  );
}
