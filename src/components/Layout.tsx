
import { ReactNode, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { 
  Calendar, 
  BookOpen, 
  Building2, 
  Users, 
  FileText, 
  Home,
  Menu,
  X,
  LogOut,
  Package,
  Lightbulb,
  DoorOpen
} from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface LayoutProps {
  children: ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const getUserProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single();
        
        if (profile) {
          setUserRole(profile.role);
        }
      }
    };

    getUserProfile();
  }, []);

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast.error("Erro ao fazer logout");
    } else {
      toast.success("Logout realizado com sucesso!");
      navigate("/login");
    }
  };

  const menuItems = [
    { icon: Home, label: "Dashboard", path: "/dashboard" },
    { icon: Calendar, label: "Calendário", path: "/calendario" },
    { icon: BookOpen, label: "Cursos", path: "/cursos" },
    { icon: Building2, label: "Unidades", path: "/unidades", adminOnly: true },
    { icon: DoorOpen, label: "Salas", path: "/salas", editorAccess: true },
    { icon: FileText, label: "Matérias", path: "/materias", editorAccess: true },
    { icon: Package, label: "Insumos", path: "/insumos", editorAccess: true },
    { icon: Users, label: "Usuários", path: "/usuarios", adminOnly: true },
    { icon: Lightbulb, label: "Relatórios", path: "/relatorios" },
  ];

  const filteredMenuItems = menuItems.filter(item => {
    if (item.adminOnly && userRole !== 'admin') return false;
    if (item.editorAccess && userRole === 'visualizador') return false;
    return true;
  });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} transition-transform duration-200 ease-in-out md:hidden`}>
        <div className="flex items-center justify-between h-16 px-4 border-b">
          <h1 className="text-xl font-bold text-blue-600">Sistema CMU</h1>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>
        
        <nav className="mt-4 px-2">
          {filteredMenuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            
            return (
              <Button
                key={item.path}
                variant={isActive ? "secondary" : "ghost"}
                className="w-full justify-start mb-1"
                onClick={() => {
                  navigate(item.path);
                  setSidebarOpen(false);
                }}
              >
                <Icon className="mr-2 h-4 w-4" />
                {item.label}
              </Button>
            );
          })}
        </nav>

        <div className="absolute bottom-4 w-full px-2">
          <Button
            variant="outline"
            className="w-full justify-start"
            onClick={handleLogout}
          >
            <LogOut className="mr-2 h-4 w-4" />
            Sair
          </Button>
        </div>
      </div>

      {/* Main content - no sidebar for desktop */}
      <div className="w-full">
        {/* Top bar */}
        <div className="bg-white shadow-sm border-b">
          <div className="flex items-center justify-between h-16 px-4">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                className="md:hidden"
                onClick={() => setSidebarOpen(true)}
              >
                <Menu className="h-5 w-5" />
              </Button>

              {/* Desktop Navigation */}
              <div className="hidden md:flex items-center space-x-1">
                <h1 className="text-xl font-bold text-blue-600 mr-6">Sistema CMU</h1>
                {filteredMenuItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = location.pathname === item.path;
                  
                  return (
                    <Button
                      key={item.path}
                      variant={isActive ? "secondary" : "ghost"}
                      size="sm"
                      onClick={() => navigate(item.path)}
                      className="flex items-center gap-2"
                    >
                      <Icon className="h-4 w-4" />
                      {item.label}
                    </Button>
                  );
                })}
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">
                Função: <span className="font-medium">{userRole}</span>
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={handleLogout}
                className="hidden md:flex items-center gap-2"
              >
                <LogOut className="h-4 w-4" />
                Sair
              </Button>
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="p-6">
          {children}
        </main>
      </div>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
};

export default Layout;
