import { Button } from '@/components/ui/button';
import { LogOut } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export function LogoutButton() {
  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      toast.success('Você foi desconectado com sucesso.');
    } catch (error) {
      console.error('Logout Error:', error);
      toast.error('Erro ao desconectar. Tente novamente.');
    }
  };

  return (
    <Button 
      variant="ghost" 
      size="icon" 
      onClick={handleLogout}
      title="Sair"
    >
      <LogOut className="w-5 h-5" />
    </Button>
  );
}