import { useLeads } from '@/hooks/useLeads';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from 'recharts';

const COLORS = ['#4F46E5', '#10B981', '#0077B5', '#F59E0B', '#8B5CF6', '#EC4899'];

const sourceLabels: Record<string, string> = {
  website: 'Website',
  referral: 'Referral',
  social_media: 'Social Media',
  email_campaign: 'Email Campaign',
  cold_call: 'Cold Call',
  trade_show: 'Trade Show',
  other: 'Other',
};

export function LeadsBySourceChart() {
  const { leads } = useLeads();

  const sourceCounts = leads.reduce((acc, lead) => {
    acc[lead.source] = (acc[lead.source] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const data = Object.entries(sourceCounts).map(([source, value]) => ({
    name: sourceLabels[source] || source,
    value,
  }));

  if (data.length === 0) {
    return (
      <div className="crm-card">
        <div className="crm-card-header">
          <h3 className="font-semibold text-foreground">Leads by Source</h3>
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
        <h3 className="font-semibold text-foreground">Leads by Source</h3>
      </div>
      <div className="p-4">
        <div className="h-[250px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={90}
                paddingAngle={2}
                dataKey="value"
              >
                {data.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[index % COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                }}
              />
              <Legend
                layout="horizontal"
                verticalAlign="bottom"
                align="center"
                formatter={(value) => (
                  <span className="text-sm text-muted-foreground">{value}</span>
                )}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
