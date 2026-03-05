import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { Home, Music, BarChart3, User, LogOut, Settings } from 'lucide-react';
import { useAuthStore } from '../stores/auth';
import { motion } from 'framer-motion';

export default function Layout() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-primary-50/30 font-sans">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex fixed inset-y-0 left-0 w-64 flex-col bg-white border-r border-primary-100 shadow-sm z-30">
        <div className="p-6 border-b border-primary-100">
          <NavLink to="/" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center shadow-md">
              <Music className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-extrabold text-primary-800 tracking-tight">
              PracticePal
            </span>
          </NavLink>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          <SidebarLink to="/" icon={<Home className="w-5 h-5" />} label="Home" />
          <SidebarLink
            to="/profile"
            icon={<User className="w-5 h-5" />}
            label="Profile"
          />
        </nav>

        <div className="p-4 border-t border-primary-100">
          {user && (
            <div className="flex items-center gap-3 mb-3 px-3">
              <div className="w-8 h-8 rounded-full bg-primary-200 flex items-center justify-center text-primary-700 font-bold text-sm">
                {user.displayName.charAt(0).toUpperCase()}
              </div>
              <span className="text-sm font-medium text-gray-700 truncate">
                {user.displayName}
              </span>
            </div>
          )}
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2 w-full text-sm text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Sign out
          </button>
        </div>
      </aside>

      {/* Mobile top bar */}
      <header className="lg:hidden fixed top-0 inset-x-0 h-14 bg-white border-b border-primary-100 flex items-center justify-between px-4 z-30 shadow-sm">
        <NavLink to="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center">
            <Music className="w-4 h-4 text-white" />
          </div>
          <span className="text-lg font-extrabold text-primary-800">PracticePal</span>
        </NavLink>
        <button
          onClick={handleLogout}
          className="p-2 text-gray-400 hover:text-red-500 transition-colors"
          title="Sign out"
        >
          <LogOut className="w-5 h-5" />
        </button>
      </header>

      {/* Main content */}
      <main className="lg:pl-64 pt-14 lg:pt-0 pb-20 lg:pb-0 min-h-screen">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="max-w-6xl mx-auto px-4 py-6 lg:py-8"
        >
          <Outlet />
        </motion.div>
      </main>

      {/* Mobile bottom tab bar */}
      <nav className="lg:hidden fixed bottom-0 inset-x-0 h-16 bg-white border-t border-primary-100 flex items-center justify-around z-30 shadow-[0_-2px_10px_rgba(0,0,0,0.05)]">
        <TabLink to="/" icon={<Home className="w-5 h-5" />} label="Home" />
        <TabLink to="/practice" icon={<Music className="w-5 h-5" />} label="Practice" />
        <TabLink to="/progress" icon={<BarChart3 className="w-5 h-5" />} label="Progress" />
        <TabLink to="/profile" icon={<User className="w-5 h-5" />} label="Profile" />
      </nav>
    </div>
  );
}

function SidebarLink({
  to,
  icon,
  label,
}: {
  to: string;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <NavLink
      to={to}
      end
      className={({ isActive }) =>
        `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
          isActive
            ? 'bg-primary-100 text-primary-700'
            : 'text-gray-600 hover:bg-primary-50 hover:text-primary-600'
        }`
      }
    >
      {icon}
      {label}
    </NavLink>
  );
}

function TabLink({
  to,
  icon,
  label,
}: {
  to: string;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <NavLink
      to={to}
      end={to === '/'}
      className={({ isActive }) =>
        `flex flex-col items-center gap-0.5 min-w-[56px] py-1 transition-colors ${
          isActive ? 'text-primary-600' : 'text-gray-400'
        }`
      }
    >
      {icon}
      <span className="text-[10px] font-semibold">{label}</span>
    </NavLink>
  );
}
