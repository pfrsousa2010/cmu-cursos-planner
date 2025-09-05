
import { ReactNode, useState } from "react";
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
  User
} from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useUser } from "@/contexts/UserContext";
import { ThemeToggle } from "@/components/ThemeToggle";

interface LayoutProps {
  children: ReactNode;
}

// Enum para papéis de usuário
const UserRoleEnum = {
  ADMIN: 'admin',
  EDITOR: 'editor',
  VISUALIZADOR: 'visualizador',
} as const;

const UserRoleLabel: Record<string, string> = {
  [UserRoleEnum.ADMIN]: 'Administrador',
  [UserRoleEnum.EDITOR]: 'Editor',
  [UserRoleEnum.VISUALIZADOR]: 'Visualizador',
};

const UserRoleColor: Record<string, string> = {
  [UserRoleEnum.ADMIN]: 'text-destructive bg-destructive/10',
  [UserRoleEnum.EDITOR]: 'text-primary bg-primary/10',
  [UserRoleEnum.VISUALIZADOR]: 'text-green-600 bg-green-50',
};

const Layout = ({ children }: LayoutProps) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { profile, loading: userLoading, canManageUnidades, canManageCursos, signOut } = useUser();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    try {
      await signOut();
      toast.success("Logout realizado com sucesso!");
      navigate("/login");
    } catch (error) {
      toast.error("Erro ao fazer logout");
    }
  };

  const menuItems = [
    { icon: Home, label: "Dashboard", path: "/dashboard" },
    { icon: Calendar, label: "Calendário", path: "/calendario" },
    { icon: BookOpen, label: "Cursos", path: "/cursos" },
    { icon: Building2, label: "Unidades / Salas", path: "/unidades-salas", editorAccess: true },
    { icon: FileText, label: "Matérias", path: "/materias", editorAccess: true },
    { icon: Package, label: "Insumos", path: "/insumos", editorAccess: true },
    { icon: Users, label: "Usuários", path: "/usuarios", adminOnly: true },

    { icon: User, label: "Meu Perfil", path: "/meu-perfil" }, // Adicionado menu Meu Perfil
  ];

  const filteredMenuItems = menuItems.filter(item => {
    if (item.adminOnly && profile?.role !== 'admin') return false;
    if (item.editorAccess && profile?.role === 'visualizador') return false;
    return true;
  });

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-card shadow-lg transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} transition-transform duration-200 ease-in-out`}>
        <div className="flex items-center justify-between h-16 px-4 border-b">
          <h1 className="text-l font-bold text-primary">Menu</h1>
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

      {/* Main content */}
      <div className="w-full">
        {/* Top bar */}
        <div className="bg-card shadow-sm border-b">
          <div className="flex items-center justify-between h-16 px-4">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSidebarOpen(true)}
              >
                <Menu className="h-5 w-5" />
              </Button>
                             <div className="flex items-center gap-2">
                 <img src="/Logo%20CMU.png" alt="Logo CMU" className="h-8 md:h-12 w-auto" />
                 <h1 className="hidden md:block text-xl font-bold text-primary">Gestor de Cursos CMU</h1>
               </div>
            </div>
            
            <div className="flex items-center space-x-4">
                           {userLoading || !profile ? (
               <div className="flex items-center gap-2">
                 <Skeleton className="h-5 w-32 rounded" />
                 <Skeleton className="h-5 w-20 rounded" />
               </div>
             ) : (
               <span className="text-sm text-muted-foreground flex items-center gap-2">
                 <span className="font-medium">{profile.nome || profile.email}</span>
                 <Badge className={UserRoleColor[profile.role] || 'text-muted-foreground bg-muted'}>
                   {UserRoleLabel[profile.role] || profile.role}
                 </Badge>
               </span>
             )}
              <ThemeToggle />
              <Button
                variant="outline"
                size="sm"
                onClick={handleLogout}
                className="flex items-center gap-2"
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

      {/* Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
};

export default Layout;
