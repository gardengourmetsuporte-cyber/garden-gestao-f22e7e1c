import { useState } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Plus, Pencil, Trash2, Check, X, Star, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useRewards, RewardProduct, RewardRedemption } from '@/hooks/useRewards';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export function RewardSettings() {
  const { products, allRedemptions, createProduct, updateProduct, deleteProduct, updateRedemptionStatus } = useRewards();
  const { toast } = useToast();
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<RewardProduct | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    points_cost: 0,
    image_url: '',
    is_active: true,
    stock: null as number | null,
  });

  const pendingRedemptions = allRedemptions.filter(r => r.status === 'pending');

  const openCreateDialog = () => {
    setEditingProduct(null);
    setFormData({
      name: '',
      description: '',
      points_cost: 0,
      image_url: '',
      is_active: true,
      stock: null,
    });
    setIsDialogOpen(true);
  };

  const openEditDialog = (product: RewardProduct) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      description: product.description || '',
      points_cost: product.points_cost,
      image_url: product.image_url || '',
      is_active: product.is_active,
      stock: product.stock,
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const data = {
        name: formData.name,
        description: formData.description || null,
        points_cost: formData.points_cost,
        image_url: formData.image_url || null,
        is_active: formData.is_active,
        stock: formData.stock,
      };

      if (editingProduct) {
        await updateProduct(editingProduct.id, data);
        toast({ title: 'Produto atualizado!' });
      } else {
        await createProduct(data);
        toast({ title: 'Produto criado!' });
      }
      setIsDialogOpen(false);
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Não foi possível salvar o produto.',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este produto?')) return;
    
    try {
      await deleteProduct(id);
      toast({ title: 'Produto excluído!' });
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Não foi possível excluir o produto.',
        variant: 'destructive',
      });
    }
  };

  const handleApprove = async (redemption: RewardRedemption) => {
    try {
      await updateRedemptionStatus(redemption.id, 'approved');
      toast({ title: 'Resgate aprovado!' });
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Não foi possível aprovar o resgate.',
        variant: 'destructive',
      });
    }
  };

  const handleReject = async (redemption: RewardRedemption) => {
    try {
      await updateRedemptionStatus(redemption.id, 'cancelled');
      toast({ title: 'Resgate cancelado.' });
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Não foi possível cancelar o resgate.',
        variant: 'destructive',
      });
    }
  };

  const handleDeliver = async (redemption: RewardRedemption) => {
    try {
      await updateRedemptionStatus(redemption.id, 'delivered');
      toast({ title: 'Prêmio marcado como entregue!' });
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Não foi possível atualizar o status.',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Loja de Recompensas</h2>
          <p className="text-sm text-muted-foreground">
            Gerencie produtos e resgates
          </p>
        </div>
      </div>

      <Tabs defaultValue="products" className="space-y-4">
        <TabsList>
          <TabsTrigger value="products" className="gap-2">
            <Package className="w-4 h-4" />
            Produtos
          </TabsTrigger>
          <TabsTrigger value="pending" className="gap-2">
            <Star className="w-4 h-4" />
            Pendentes
            {pendingRedemptions.length > 0 && (
              <Badge variant="destructive" className="ml-1 h-5 w-5 p-0 flex items-center justify-center text-xs">
                {pendingRedemptions.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="products" className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={openCreateDialog} className="gap-2">
              <Plus className="w-4 h-4" />
              Novo Produto
            </Button>
          </div>

          <div className="rounded-xl border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Produto</TableHead>
                  <TableHead className="text-center">Pontos</TableHead>
                  <TableHead className="text-center">Estoque</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{product.name}</p>
                        {product.description && (
                          <p className="text-sm text-muted-foreground line-clamp-1">
                            {product.description}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                        {product.points_cost}
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      {product.stock === null ? '∞' : product.stock}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant={product.is_active ? 'default' : 'secondary'}>
                        {product.is_active ? 'Ativo' : 'Inativo'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEditDialog(product)}
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(product.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {products.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      Nenhum produto cadastrado
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="pending" className="space-y-4">
          <div className="rounded-xl border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Usuário</TableHead>
                  <TableHead>Produto</TableHead>
                  <TableHead className="text-center">Pontos</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {allRedemptions.map((redemption) => (
                  <TableRow key={redemption.id}>
                    <TableCell>
                      <p className="font-medium">
                        {redemption.profile?.full_name || 'Usuário'}
                      </p>
                    </TableCell>
                    <TableCell>
                      {redemption.product?.name || 'Produto removido'}
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                        {redemption.points_spent}
                      </div>
                    </TableCell>
                    <TableCell>
                      {format(new Date(redemption.created_at), "dd/MM/yyyy", { locale: ptBR })}
                    </TableCell>
                    <TableCell className="text-right">
                      {redemption.status === 'pending' ? (
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleApprove(redemption)}
                            className="text-green-600 hover:text-green-700 hover:bg-green-50"
                          >
                            <Check className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleReject(redemption)}
                            className="text-destructive hover:text-destructive"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      ) : redemption.status === 'approved' ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeliver(redemption)}
                        >
                          Marcar Entregue
                        </Button>
                      ) : (
                        <Badge variant={redemption.status === 'delivered' ? 'default' : 'secondary'}>
                          {redemption.status === 'delivered' ? 'Entregue' : 'Cancelado'}
                        </Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
                {allRedemptions.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      Nenhum resgate registrado
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
      </Tabs>

      {/* Product Form Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingProduct ? 'Editar Produto' : 'Novo Produto'}
            </DialogTitle>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ex: Rodízio de Sushi"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Descrição do prêmio..."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="points_cost">Custo em Pontos</Label>
                <Input
                  id="points_cost"
                  type="number"
                  min="1"
                  value={formData.points_cost}
                  onChange={(e) => setFormData({ ...formData, points_cost: Number(e.target.value) })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="stock">Estoque (vazio = ilimitado)</Label>
                <Input
                  id="stock"
                  type="number"
                  min="0"
                  value={formData.stock ?? ''}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    stock: e.target.value === '' ? null : Number(e.target.value) 
                  })}
                  placeholder="∞"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="image_url">URL da Imagem</Label>
              <Input
                id="image_url"
                value={formData.image_url}
                onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                placeholder="https://..."
              />
            </div>

            <div className="flex items-center gap-2">
              <Switch
                id="is_active"
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
              />
              <Label htmlFor="is_active">Produto ativo</Label>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit">
                {editingProduct ? 'Salvar' : 'Criar'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
