import { useState, useRef } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Plus, Pencil, Trash2, Check, X, Star, Package, Upload, ImageIcon } from 'lucide-react';
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
import { supabase } from '@/integrations/supabase/client';

export function RewardSettings() {
  const { products, allRedemptions, createProduct, updateProduct, deleteProduct, updateRedemptionStatus, deleteRedemption } = useRewards();
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
  const [isUploading, setIsUploading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    setImagePreview(null);
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
    setImagePreview(product.image_url || null);
    setIsDialogOpen(true);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Erro',
        description: 'Por favor, selecione uma imagem.',
        variant: 'destructive',
      });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: 'Erro',
        description: 'A imagem deve ter no máximo 5MB.',
        variant: 'destructive',
      });
      return;
    }

    setIsUploading(true);

    try {
      // Generate unique file name
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `products/${fileName}`;

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('reward-products')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data } = supabase.storage
        .from('reward-products')
        .getPublicUrl(filePath);

      setFormData({ ...formData, image_url: data.publicUrl });
      setImagePreview(data.publicUrl);
      toast({ title: 'Imagem carregada!' });
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar a imagem.',
        variant: 'destructive',
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveImage = () => {
    setFormData({ ...formData, image_url: '' });
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
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

  const handleDeleteRedemption = async (redemption: RewardRedemption) => {
    if (!confirm(`Tem certeza que deseja excluir este resgate de ${redemption.profile?.full_name || 'Usuário'}?`)) return;
    
    try {
      await deleteRedemption(redemption.id);
      toast({ title: 'Resgate excluído!' });
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Não foi possível excluir o resgate.',
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
                  <TableHead className="text-center">Status</TableHead>
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
                    <TableCell className="text-center">
                      <Badge 
                        variant={
                          redemption.status === 'pending' ? 'outline' :
                          redemption.status === 'approved' ? 'default' :
                          redemption.status === 'delivered' ? 'default' :
                          'secondary'
                        }
                        className={
                          redemption.status === 'pending' ? 'border-warning text-warning' :
                          redemption.status === 'approved' ? 'bg-success' :
                          redemption.status === 'delivered' ? 'bg-primary' :
                          ''
                        }
                      >
                        {redemption.status === 'pending' ? 'Pendente' :
                         redemption.status === 'approved' ? 'Aprovado' :
                         redemption.status === 'delivered' ? 'Entregue' :
                         'Cancelado'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        {redemption.status === 'pending' && (
                          <>
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
                          </>
                        )}
                        {redemption.status === 'approved' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeliver(redemption)}
                          >
                            Entregar
                          </Button>
                        )}
                        {/* Delete button - always visible for admin */}
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteRedemption(redemption)}
                          className="text-muted-foreground hover:text-destructive"
                          title="Excluir resgate"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {allRedemptions.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
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
              <Label>Imagem do Produto</Label>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
              
              {imagePreview ? (
                <div className="relative">
                  <img 
                    src={imagePreview} 
                    alt="Preview" 
                    className="w-full h-40 object-cover rounded-lg border"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    onClick={handleRemoveImage}
                    className="absolute top-2 right-2"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  className="w-full h-40 border-2 border-dashed border-muted-foreground/30 rounded-lg flex flex-col items-center justify-center gap-2 hover:border-primary/50 hover:bg-muted/50 transition-colors"
                >
                  {isUploading ? (
                    <>
                      <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                      <span className="text-sm text-muted-foreground">Carregando...</span>
                    </>
                  ) : (
                    <>
                      <Upload className="w-8 h-8 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">Clique para adicionar imagem</span>
                      <span className="text-xs text-muted-foreground/70">PNG, JPG até 5MB</span>
                    </>
                  )}
                </button>
              )}
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
