import { useLeads } from '@/hooks/useLeads';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';

const statusColors: Record<string, string> = {
  new: 'hsl(210, 100%, 50%)',
  contacted: 'hsl(262, 83%, 58%)',
  follow_up: 'hsl(38, 92%, 50%)',
  converted: 'hsl(142, 71%, 45%)',
  lost: 'hsl(0, 84%, 60%)',
};

const statusLabels: Record<string, string> = {
  new: 'New',
  contacted: 'Contacted',
  follow_up: 'Follow-up',
  converted: 'Converted',
  lost: 'Lost',
};

export function LeadsByStatusChart() {
  const { leads } = useLeads();

  const statusCounts = leads.reduce((acc, lead) => {
    acc[lead.status] = (acc[lead.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const data = Object.entries(statusCounts).map(([status, count]) => ({
    name: statusLabels[status] || status,
    count,
    status,
  }));

  if (data.length === 0) {
    return (
      <div className="crm-card">
        <div className="crm-card-header">
          <h3 className="font-semibold text-foreground">Leads by Status</h3>
        </div>
        <div className="p-4 h-[250px] flex items-center justify-center text-muted-foreground">
          No data yet
        </div>
      </div>
    );
  }

  return (
    <div className="crm-card">
      <div className="crm-card-header">
        <h3 className="font-semibold text-foreground">Leads by Status</h3>
      </div>
      <div className="p-4">
        <div className="h-[250px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={12} />
              <YAxis
                type="category"
                dataKey="name"
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                width={80}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                }}
              />
              <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={statusColors[entry.status] || 'hsl(var(--primary))'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
