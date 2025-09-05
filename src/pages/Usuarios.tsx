
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Plus, Edit, UserCheck, UserX, Trash2, Eye, EyeOff } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import Layout from "@/components/Layout";
import { useUserRole } from "@/hooks/useUserRole";
import type { Database } from "@/integrations/supabase/types";

type UserRole = Database['public']['Enums']['user_role'];

interface Profile {
  id: string;
  nome: string;
  email: string;
  role: UserRole;
  isActive: boolean;
  created_at: string;
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
  [UserRoleEnum.ADMIN]: 'text-red-600 bg-red-50 dark:text-red-400 dark:bg-red-900/30',
  [UserRoleEnum.EDITOR]: 'text-blue-600 bg-blue-50 dark:text-blue-400 dark:bg-blue-900/30',
  [UserRoleEnum.VISUALIZADOR]: 'text-green-600 bg-green-50 dark:text-green-400 dark:bg-green-900/30',
};

const Usuarios = () => {
  const [users, setUsers] = useState<Profile[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<Profile | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const { userRole, userId, loading: userRoleLoading } = useUserRole();

  const [formData, setFormData] = useState({
    nome: "",
    email: "",
    password: "",
    role: "visualizador" as UserRole,
    isActive: true
  });

  useEffect(() => {
    if (userId) {
      setCurrentUserId(userId);
    }

    if (userRole === 'admin') {
      fetchUsers();
    } else {
      setLoading(false);
    }
  }, [userRole, userId]);

  useEffect(() => {
    let filtered = users;

    // Filtrar por termo de busca (nome ou email)
    if (searchTerm.trim() !== "") {
      filtered = filtered.filter(user =>
        user.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filtrar por status
    if (statusFilter !== "all") {
      filtered = filtered.filter(user => {
        if (statusFilter === "active") return user.isActive;
        if (statusFilter === "inactive") return !user.isActive;
        return true;
      });
    }

    setFilteredUsers(filtered);
  }, [users, searchTerm, statusFilter]);

  const fetchUsers = async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, nome, email, role, isActive, created_at')
      .order('nome', { ascending: true });

    if (error) {
      toast.error("Erro ao carregar usuários");
      console.error(error);
    } else {
      setUsers(data || []);
    }
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (editingUser) {
        // Atualizar apenas o perfil (não pode atualizar auth.users diretamente)
        const { error } = await supabase
          .from('profiles')
          .update({
            nome: formData.nome,
            role: formData.role,
            isActive: formData.isActive
          })
          .eq('id', editingUser.id);

        if (error) {
          toast.error("Erro ao atualizar usuário");
        } else {
          toast.success("Usuário atualizado com sucesso!");
          fetchUsers();
          resetForm();
        }
      } else {
        // Criar novo usuário
        console.log("Criando usuário:", { email: formData.email, nome: formData.nome, role: formData.role });
        
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: formData.email,
          password: formData.password,
          options: {
            data: {
              nome: formData.nome
            }
          }
        });

        if (authError) {
          console.error("Erro no signUp:", authError);
          toast.error("Erro ao criar usuário: " + authError.message);
        } else if (authData.user) {
          console.log("Usuário criado com sucesso:", authData.user.id);
          
          // Criar o perfil diretamente (não dependemos do trigger)
          const { error: createProfileError } = await supabase
            .from('profiles')
            .upsert({
              id: authData.user.id,
              nome: formData.nome,
              email: formData.email,
              role: formData.role,
              isActive: true
            });

          if (createProfileError) {
            console.error("Erro ao criar perfil:", createProfileError);
            toast.error("Erro ao criar perfil do usuário: " + createProfileError.message);
          } else {
            console.log("Perfil criado com sucesso");
            toast.success("Usuário criado com sucesso!");
            fetchUsers();
            resetForm();
          }
        } else {
          toast.error("Erro inesperado ao criar usuário");
        }
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      nome: "",
      email: "",
      password: "",
      role: "visualizador" as UserRole,
      isActive: true
    });
    setEditingUser(null);
    setShowPassword(false);
    setDialogOpen(false);
  };

  const startEdit = (user: Profile) => {
    // Não permitir editar o próprio usuário
    if (user.id === currentUserId) {
      toast.error("Você não pode editar seu próprio perfil aqui. Use a página 'Meu Perfil'.");
      return;
    }

    setFormData({
      nome: user.nome,
      email: user.email,
      password: "",
      role: user.role,
      isActive: user.isActive
    });
    setEditingUser(user);
    setDialogOpen(true);
  };

  const handleDeleteUser = async (user: Profile) => {
    if (user.id === currentUserId) {
      toast.error("Você não pode deletar seu próprio usuário.");
      return;
    }

    if (window.confirm(`Tem certeza que deseja deletar o usuário "${user.nome}"? Esta ação não pode ser desfeita.`)) {
      try {
        // Deletar o perfil
        const { data, error } = await supabase
          .from('profiles')
          .delete()
          .eq('id', user.id)
          .select();

        if (error) {
          // Verificar se é erro de permissão RLS
          if (error.code === '42501' || error.message.includes('policy')) {
            toast.error("Você não tem permissão para deletar usuários. Apenas administradores podem realizar esta ação.");
          } else {
            toast.error("Erro ao deletar usuário: " + error.message);
          }
        } else if (data && data.length > 0) {
          toast.success("Usuário deletado com sucesso!");
          fetchUsers(); // Recarregar a lista
        } else {
          toast.error("Usuário não foi encontrado ou você não tem permissão para deletá-lo. Verifique se você é um administrador.");
        }
      } catch (error) {
        toast.error("Erro inesperado ao deletar usuário");
      }
    }
  };

  const getRoleLabel = (role: UserRole) => UserRoleLabel[role] || role;
  const getRoleColor = (role: UserRole) => UserRoleColor[role] || 'text-muted-foreground bg-muted';

  if (loading || userRoleLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[400px]">
          <img src="/Logo%20CMU.png" alt="Logo CMU" className="h-32 w-auto animate-pulse" />
        </div>
      </Layout>
    );
  }

  if (userRole === 'visualizador' || userRole === 'editor') {
    return (
      <Layout>
        <div className="text-center py-12">
          <UserX className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-2 text-sm font-semibold text-foreground">Acesso restrito</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Apenas administradores podem gerenciar usuários.
          </p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Usuários</h1>
          </div>

          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => resetForm()}>
                <Plus className="w-4 h-4 mr-2" />
                Novo Usuário
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editingUser ? "Editar Usuário" : "Novo Usuário"}
                </DialogTitle>
                <DialogDescription>
                  {editingUser ? "Edite os dados do usuário" : "Adicione um novo usuário ao sistema"}
                </DialogDescription>
              </DialogHeader>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="nome">Nome</Label>
                  <Input
                    id="nome"
                    value={formData.nome}
                    onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                    disabled={!!editingUser}
                  />
                </div>

                {!editingUser && (
                  <div>
                    <Label htmlFor="password">Senha</Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        required
                        minLength={6}
                        className="pr-10"
                      />
                      <button
                        type="button"
                        className="absolute inset-y-0 right-0 pr-3 flex items-center"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                        ) : (
                          <Eye className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                        )}
                      </button>
                    </div>
                  </div>
                )}

                <div>
                  <Label htmlFor="role">Função</Label>
                  <Select
                    value={formData.role}
                    onValueChange={(value: UserRole) => setFormData({ ...formData, role: value })}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione uma função" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="visualizador">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium text-green-600 bg-green-50 dark:text-green-400 dark:bg-green-900/30">
                          Visualizador
                        </span>
                      </SelectItem>
                      <SelectItem value="editor">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium text-blue-600 bg-blue-50 dark:text-blue-400 dark:bg-blue-900/30">
                          Editor
                        </span>
                      </SelectItem>
                      <SelectItem value="admin">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium text-red-600 bg-red-50 dark:text-red-400 dark:bg-red-900/30">
                          Administrador
                        </span>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {editingUser && (
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="isActive"
                      checked={formData.isActive}
                      onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                    />
                    <Label htmlFor="isActive" className="text-sm font-medium">
                      Usuário ativo
                    </Label>
                  </div>
                )}

                <div className="flex justify-end space-x-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={resetForm}
                    disabled={isSubmitting}
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        {editingUser ? "Atualizando..." : "Criando..."}
                      </>
                    ) : (
                      editingUser ? "Atualizar" : "Criar"
                    )}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="flex justify-between items-center gap-4">
          <div className="flex-1 max-w-sm">
            <Input
              placeholder="Buscar por nome ou email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <Select value={statusFilter} onValueChange={(value: "all" | "active" | "inactive") => setStatusFilter(value)}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="active">
                  <div className="flex items-center space-x-2">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium text-green-600 bg-green-50 dark:text-green-400 dark:bg-green-900/30">
                      Ativo
                    </span>
                  </div>
                </SelectItem>
                <SelectItem value="inactive">
                  <div className="flex items-center space-x-2">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium text-red-600 bg-red-50 dark:text-red-400 dark:bg-red-900/30">
                      Inativo
                    </span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <Card>
          {filteredUsers.length === 0 ? (
            <CardContent className="p-6 text-center">
              <UserCheck className="mx-auto h-12 w-12 text-muted-foreground" />
              <p className="mt-2 text-muted-foreground">
                {searchTerm || statusFilter !== "all" ? "Nenhum usuário encontrado para os filtros aplicados" : "Nenhum usuário encontrado"}
              </p>
            </CardContent>
          ) : (
            <CardContent className="p-0">
              <div className="divide-y">
                {filteredUsers.map((user) => (
                  <div
                    key={user.id}
                    className={`p-4 flex justify-between items-center hover:bg-muted/50 ${user.id === currentUserId ? "bg-primary/10" : ""}`}
                  >
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <h3 className={`text-lg font-medium ${user.id === currentUserId ? "text-primary" : "text-foreground"}`}>
                          {user.nome}
                        </h3>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${user.isActive ? "text-green-600 bg-green-50 dark:text-green-400 dark:bg-green-900/30" : "text-red-600 bg-red-50 dark:text-red-400 dark:bg-red-900/30"}`}>
                          {user.isActive ? "Ativo" : "Inativo"}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">{user.email}</p>
                      <div className="flex items-center space-x-2">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleColor(user.role)}`}>
                          {getRoleLabel(user.role)}
                        </span>
                        {user.id === currentUserId && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium text-primary bg-primary/10">
                            Você
                          </span>
                        )}
                        <span className="text-xs text-muted-foreground">
                          Desde {new Date(user.created_at).toLocaleDateString('pt-BR')}
                        </span>
                      </div>
                    </div>

                  {user.id !== currentUserId && (
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => startEdit(user)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteUser(user)}
                        className="text-destructive hover:text-destructive/80 hover:bg-destructive/10"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                  </div>
                ))}
              </div>
            </CardContent>
          )}
        </Card>
      </div>
    </Layout>
  );
};

export default Usuarios;
