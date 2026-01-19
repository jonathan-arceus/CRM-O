import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  UserPlus,
  Upload,
  BarChart3,
  Settings,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Building2,
  Kanban,
  UserCheck,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/hooks/useAuth';
import { useOrganization } from '@/hooks/useOrganization';

const mainNavItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
  { icon: Users, label: 'Leads', path: '/leads' },
  { icon: Kanban, label: 'Pipeline', path: '/pipeline' },
  { icon: UserCheck, label: 'Contacts', path: '/contacts' },
  { icon: Upload, label: 'Import Leads', path: '/import' },
  { icon: BarChart3, label: 'Reports', path: '/reports' },
];

const adminNavItems = [
  { icon: UserPlus, label: 'Users', path: '/users' },
  { icon: Building2, label: 'Groups', path: '/groups' },
  { icon: Settings, label: 'Settings', path: '/settings' },
];

export function CRMSidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();

  const { profile, role, signOut } = useAuth();
  const { organization, settings } = useOrganization();

  const isActive = (path: string) => location.pathname === path;

  return (
    <aside
      className={cn(
        'flex flex-col h-screen bg-sidebar border-r border-sidebar-border transition-all duration-300',
        collapsed ? 'w-16' : 'w-64'
      )}
    >
      {/* Logo */}
      <div className="flex items-center h-16 px-4 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-sidebar-primary flex items-center justify-center overflow-hidden">
            {organization?.logo_url ? (
              <img src={organization.logo_url} alt="Logo" className="w-full h-full object-cover" />
            ) : (
              <span className="text-sidebar-primary-foreground font-bold text-xs">
                {settings?.crm_name?.substring(0, 2).toUpperCase() || 'CRM'}
              </span>
            )}
          </div>
          {!collapsed && (
            <span className="text-sidebar-foreground font-semibold text-lg truncate max-w-[140px]">
              {settings?.crm_name || 'LeadFlow'}
            </span>
          )}
        </div>
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        <div className="space-y-1">
          {mainNavItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200',
                'hover:bg-sidebar-accent',
                isActive(item.path)
                  ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                  : 'text-sidebar-foreground'
              )}
            >
              <item.icon className="w-5 h-5 shrink-0" />
              {!collapsed && <span className="font-medium">{item.label}</span>}
            </NavLink>
          ))}
        </div>

        <Separator className="my-4 bg-sidebar-border" />

        <div className="space-y-1">
          {!collapsed && (
            <span className="px-3 text-xs font-semibold text-sidebar-muted uppercase tracking-wider">
              Administration
            </span>
          )}
          {adminNavItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 mt-1',
                'hover:bg-sidebar-accent',
                isActive(item.path)
                  ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                  : 'text-sidebar-foreground'
              )}
            >
              <item.icon className="w-5 h-5 shrink-0" />
              {!collapsed && <span className="font-medium">{item.label}</span>}
            </NavLink>
          ))}
        </div>
      </nav>

      {/* User Section */}
      <div className="p-3 border-t border-sidebar-border">
        <div
          className={cn(
            'flex items-center gap-3 p-2 rounded-lg',
            collapsed ? 'justify-center' : ''
          )}
        >
          <Avatar className="w-9 h-9">
            <AvatarImage src={profile?.avatar_url || ''} />
            <AvatarFallback className="bg-sidebar-primary text-sidebar-primary-foreground text-sm">
              {profile?.full_name?.split(' ').map(n => n[0]).join('') || 'U'}
            </AvatarFallback>
          </Avatar>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-sidebar-foreground truncate">
                {profile?.full_name || 'User'}
              </p>
              <p className="text-xs text-sidebar-muted truncate">
                {role ? role.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()) : 'Loading...'}
              </p>
            </div>
          )}
          {!collapsed && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => signOut()}
              className="shrink-0 text-sidebar-muted hover:text-sidebar-foreground hover:bg-sidebar-accent"
            >
              <LogOut className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Collapse Toggle */}
      <div className="p-3 border-t border-sidebar-border">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setCollapsed(!collapsed)}
          className={cn(
            'w-full text-sidebar-muted hover:text-sidebar-foreground hover:bg-sidebar-accent',
            collapsed ? 'justify-center' : 'justify-between'
          )}
        >
          {!collapsed && <span className="text-sm">Collapse</span>}
          {collapsed ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <ChevronLeft className="w-4 h-4" />
          )}
        </Button>
      </div>
    </aside>
  );
}
