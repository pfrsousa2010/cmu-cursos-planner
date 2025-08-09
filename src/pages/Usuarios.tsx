
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Edit, UserCheck, UserX, Trash2 } from "lucide-react";
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
  [UserRoleEnum.ADMIN]: 'text-red-600 bg-red-50',
  [UserRoleEnum.EDITOR]: 'text-blue-600 bg-blue-50',
  [UserRoleEnum.VISUALIZADOR]: 'text-green-600 bg-green-50',
};

const Usuarios = () => {
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<Profile | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const { userRole, canManageUnidades } = useUserRole();

  const [formData, setFormData] = useState({
    nome: "",
    email: "",
    password: "",
    role: "visualizador" as UserRole
  });

  useEffect(() => {
    const getCurrentUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setCurrentUserId(user.id);
      }
    };
    
    getCurrentUser();
    
    if (canManageUnidades) {
      fetchUsers();
    } else {
      setLoading(false);
    }
  }, [canManageUnidades]);

  const fetchUsers = async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

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
    
    if (editingUser) {
      // Atualizar apenas o perfil (não pode atualizar auth.users diretamente)
      const { error } = await supabase
        .from('profiles')
        .update({
          nome: formData.nome,
          role: formData.role
        })
        .eq('id', editingUser.id);

      if (error) {
        toast.error("Erro ao atualizar usuário");
        console.error(error);
      } else {
        toast.success("Usuário atualizado com sucesso!");
        fetchUsers();
        resetForm();
      }
    } else {
      // Criar novo usuário
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
        toast.error("Erro ao criar usuário: " + authError.message);
        console.error(authError);
      } else {
        // Atualizar o role no perfil
        if (authData.user) {
          const { error: profileError } = await supabase
            .from('profiles')
            .update({ role: formData.role })
            .eq('id', authData.user.id);

          if (profileError) {
            console.error("Erro ao atualizar role:", profileError);
          }
        }
        
        toast.success("Usuário criado com sucesso!");
        fetchUsers();
        resetForm();
      }
    }
  };

  const resetForm = () => {
    setFormData({
      nome: "",
      email: "",
      password: "",
      role: "visualizador" as UserRole
    });
    setEditingUser(null);
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
      role: user.role
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
  const getRoleColor = (role: UserRole) => UserRoleColor[role] || 'text-gray-600 bg-gray-50';

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[400px]">
          <img src="/Logo%20CMU.png" alt="Logo CMU" className="h-32 w-auto animate-pulse" />
        </div>
      </Layout>
    );
  }

  if (!canManageUnidades) {
    return (
      <Layout>
        <div className="text-center py-12">
          <UserX className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-semibold text-gray-900">Acesso restrito</h3>
          <p className="mt-1 text-sm text-gray-500">
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
            <h1 className="text-3xl font-bold text-gray-900">Usuários</h1>
            <p className="text-gray-600">Gerencie os usuários do sistema</p>
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
                    <Input
                      id="password"
                      type="password"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      required
                      minLength={6}
                    />
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
                      <SelectItem value="visualizador">Visualizador</SelectItem>
                      <SelectItem value="editor">Editor</SelectItem>
                      <SelectItem value="admin">Administrador</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="outline" onClick={resetForm}>
                    Cancelar
                  </Button>
                  <Button type="submit">
                    {editingUser ? "Atualizar" : "Criar"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {users.length === 0 ? (
            <Card>
              <CardContent className="p-6 text-center">
                <UserCheck className="mx-auto h-12 w-12 text-gray-400" />
                <p className="mt-2 text-gray-500">Nenhum usuário encontrado</p>
              </CardContent>
            </Card>
          ) : (
            users.map((user) => (
              <Card 
                key={user.id} 
                className={user.id === currentUserId ? "border-blue-300 bg-blue-50/30 shadow-md ring-1 ring-blue-200" : ""}
              >
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <CardTitle className={user.id === currentUserId ? "text-blue-800" : ""}>
                        {user.nome}
                      </CardTitle>
                      <CardDescription className="mt-1">
                        {user.email}
                      </CardDescription>
                      <div className="mt-2 flex items-center space-x-2">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleColor(user.role)}`}>
                          {getRoleLabel(user.role)}
                        </span>
                        {user.id === currentUserId && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium text-blue-600 bg-blue-100">
                            Você
                          </span>
                        )}
                        <span className="text-xs text-gray-500">
                          Desde {new Date(user.created_at).toLocaleDateString('pt-BR')}
                        </span>
                      </div>
                    </div>
                    
                    {user.id !== currentUserId && (
                      <div className="flex gap-2">
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
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                </CardHeader>
              </Card>
            ))
          )}
        </div>
      </div>
    </Layout>
  );
};

export default Usuarios;
