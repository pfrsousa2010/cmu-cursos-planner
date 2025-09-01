import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';
import Layout from '@/components/Layout';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { Eye, EyeOff } from 'lucide-react';
import { useUser } from '@/contexts/UserContext';

const MeuPerfil = () => {
  const { user, refreshUser } = useUser();
  const [profile, setProfile] = useState<Database['public']['Tables']['profiles']['Row'] | null>(null);
  const [loading, setLoading] = useState(true);
  const [nome, setNome] = useState('');
  const [nomeLoading, setNomeLoading] = useState(false);
  const [senhaAtual, setSenhaAtual] = useState('');
  const [novaSenha, setNovaSenha] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [senhaLoading, setSenhaLoading] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return;
      
      setLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      
      if (data) {
        setProfile(data);
        setNome(data.nome);
      }
      setLoading(false);
    };
    
    fetchProfile();
  }, [user]);

  const handleNomeUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setNomeLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ nome })
        .eq('id', user.id);

      if (error) {
        toast.error('Erro ao atualizar nome');
      } else {
        toast.success('Nome atualizado com sucesso!');
        setProfile(prev => prev ? { ...prev, nome } : null);
        // Atualizar o contexto do usuário
        await refreshUser();
      }
    } catch (error) {
      toast.error('Erro inesperado');
    } finally {
      setNomeLoading(false);
    }
  };

  const handleSenhaUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!novaSenha) return;

    setSenhaLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: novaSenha
      });

      if (error) {
        toast.error('Erro ao atualizar senha: ' + error.message);
      } else {
        toast.success('Senha atualizada com sucesso!');
        setSenhaAtual('');
        setNovaSenha('');
      }
    } catch (error) {
      toast.error('Erro inesperado');
    } finally {
      setSenhaLoading(false);
    }
  };

  return (
    <Layout>
      <div className="max-w-xl mx-auto py-8">
        <h1 className="text-3xl font-bold mb-6">Meu Perfil</h1>
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Dados do Perfil</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-2">
                <Skeleton className="h-8 w-1/2" />
                <Skeleton className="h-8 w-2/3" />
                <Skeleton className="h-8 w-1/3" />
              </div>
            ) : profile ? (
              <form onSubmit={handleNomeUpdate} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Nome</label>
                  <Input
                    value={nome}
                    onChange={e => setNome(e.target.value)}
                    disabled={nomeLoading}
                  />
                </div>
                                 <div>
                   <label className="block text-sm font-medium mb-1">Email</label>
                   <Input value={user?.email || ''} disabled />
                 </div>
                 <div>
                   <label className="block text-sm font-medium mb-1">Papel</label>
                   <Input value={user?.role === 'admin' ? 'Administrador' : 
                           user?.role === 'editor' ? 'Editor' : 'Visualizador'} disabled />
                 </div>
                                 <div className="flex gap-2">
                   <Button type="submit" disabled={nomeLoading || nome === profile?.nome}>
                     {nomeLoading ? 'Salvando...' : 'Salvar Nome'}
                   </Button>
                 </div>
              </form>
            ) : (
              <div>Não foi possível carregar o perfil.</div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Alterar Senha</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSenhaUpdate} className="space-y-4">
              <div className="space-y-2">
                <label className="block text-sm font-medium mb-1">Nova senha</label>
                <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  value={novaSenha}
                  onChange={e => setNovaSenha(e.target.value)}
                  disabled={senhaLoading}
                  minLength={6}
                  required
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
                </div>                
              </div>
              <Button type="submit" disabled={senhaLoading || !novaSenha}>
                {senhaLoading ? 'Salvando...' : 'Alterar Senha'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default MeuPerfil; 