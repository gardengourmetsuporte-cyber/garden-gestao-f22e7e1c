import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useUnit } from '@/contexts/UnitContext';
import { useToast } from '@/hooks/use-toast';

export interface MenuCategory {
  id: string;
  unit_id: string;
  name: string;
  icon: string | null;
  color: string;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface MenuGroup {
  id: string;
  unit_id: string;
  category_id: string;
  name: string;
  description: string | null;
  availability: { tablet: boolean; delivery: boolean };
  schedule: any | null;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  product_count?: number;
}

export interface MenuProduct {
  id: string;
  unit_id: string;
  name: string;
  codigo_pdv: string | null;
  price: number;
  category: string;
  image_url: string | null;
  description: string | null;
  sort_order: number;
  is_active: boolean;
  group_id: string | null;
  is_highlighted: boolean;
  is_18_plus: boolean;
  availability: any;
  schedule: any | null;
  price_type: string;
  custom_prices: any[] | null;
  created_at: string;
  option_group_count?: number;
}

export interface MenuOptionGroup {
  id: string;
  unit_id: string;
  title: string;
  min_selections: number;
  max_selections: number;
  allow_repeat: boolean;
  availability: { tablet: boolean; delivery: boolean };
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  options?: MenuOption[];
  linked_product_count?: number;
}

export interface MenuOption {
  id: string;
  option_group_id: string;
  name: string;
  price: number;
  codigo_pdv: string | null;
  availability: any;
  image_url: string | null;
  sort_order: number;
  is_active: boolean;
}

export interface ProductOptionLink {
  id: string;
  product_id: string;
  option_group_id: string;
  sort_order: number;
}

export function useMenuAdmin() {
  const { activeUnitId } = useUnit();
  const { toast } = useToast();
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [groups, setGroups] = useState<MenuGroup[]>([]);
  const [products, setProducts] = useState<MenuProduct[]>([]);
  const [optionGroups, setOptionGroups] = useState<MenuOptionGroup[]>([]);
  const [productOptionLinks, setProductOptionLinksState] = useState<ProductOptionLink[]>([]);
  const [loading, setLoading] = useState(false);

  // ===== FETCH =====
  const fetchCategories = useCallback(async () => {
    if (!activeUnitId) return;
    const { data } = await supabase
      .from('menu_categories')
      .select('*')
      .eq('unit_id', activeUnitId)
      .order('sort_order');
    setCategories((data as MenuCategory[]) || []);
  }, [activeUnitId]);

  const fetchGroups = useCallback(async () => {
    if (!activeUnitId) return;
    const { data } = await supabase
      .from('menu_groups')
      .select('*')
      .eq('unit_id', activeUnitId)
      .order('sort_order');
    setGroups((data as MenuGroup[]) || []);
  }, [activeUnitId]);

  const fetchProducts = useCallback(async () => {
    if (!activeUnitId) return;
    const { data } = await supabase
      .from('tablet_products')
      .select('*')
      .eq('unit_id', activeUnitId)
      .order('sort_order');
    setProducts((data as MenuProduct[]) || []);
  }, [activeUnitId]);

  const fetchOptionGroups = useCallback(async () => {
    if (!activeUnitId) return;
    const { data: ogData } = await supabase
      .from('menu_option_groups')
      .select('*')
      .eq('unit_id', activeUnitId)
      .order('sort_order');
    
    const ogs = (ogData as MenuOptionGroup[]) || [];
    
    // Fetch options for each group
    if (ogs.length > 0) {
      const { data: optData } = await supabase
        .from('menu_options')
        .select('*')
        .in('option_group_id', ogs.map(o => o.id))
        .order('sort_order');
      
      const opts = (optData as MenuOption[]) || [];
      ogs.forEach(og => {
        og.options = opts.filter(o => o.option_group_id === og.id);
      });
    }

    // Fetch link counts
    const { data: linkData } = await supabase
      .from('menu_product_option_groups')
      .select('option_group_id');
    
    const linkCounts: Record<string, number> = {};
    (linkData || []).forEach((l: any) => {
      linkCounts[l.option_group_id] = (linkCounts[l.option_group_id] || 0) + 1;
    });
    ogs.forEach(og => {
      og.linked_product_count = linkCounts[og.id] || 0;
    });

    setOptionGroups(ogs);
  }, [activeUnitId]);

  const fetchProductOptionLinks = useCallback(async () => {
    const { data } = await supabase
      .from('menu_product_option_groups')
      .select('*')
      .order('sort_order');
    setProductOptionLinksState((data as ProductOptionLink[]) || []);
  }, []);

  useEffect(() => {
    if (activeUnitId) {
      fetchCategories();
      fetchGroups();
      fetchProducts();
      fetchOptionGroups();
      fetchProductOptionLinks();
    }
  }, [activeUnitId, fetchCategories, fetchGroups, fetchProducts, fetchOptionGroups, fetchProductOptionLinks]);

  // ===== CATEGORY CRUD =====
  const saveCategory = async (cat: Partial<MenuCategory> & { name: string }) => {
    if (!activeUnitId) return;
    setLoading(true);
    try {
      if (cat.id) {
        const { error } = await supabase.from('menu_categories').update({
          name: cat.name, icon: cat.icon, color: cat.color || '#6366f1',
          sort_order: cat.sort_order ?? 0, is_active: cat.is_active ?? true,
        }).eq('id', cat.id);
        if (error) throw error;
      } else {
        const maxOrder = categories.length > 0 ? Math.max(...categories.map(c => c.sort_order)) + 1 : 0;
        const { error } = await supabase.from('menu_categories').insert({
          unit_id: activeUnitId, name: cat.name, icon: cat.icon || 'UtensilsCrossed',
          color: cat.color || '#6366f1', sort_order: cat.sort_order ?? maxOrder,
          is_active: cat.is_active ?? true,
        });
        if (error) throw error;
      }
      toast({ title: 'Categoria salva' });
      fetchCategories();
    } catch (err: any) {
      toast({ title: 'Erro', description: err.message, variant: 'destructive' });
    } finally { setLoading(false); }
  };

  const deleteCategory = async (id: string) => {
    const { error } = await supabase.from('menu_categories').delete().eq('id', id);
    if (error) toast({ title: 'Erro', description: error.message, variant: 'destructive' });
    else { toast({ title: 'Categoria excluída' }); fetchCategories(); fetchGroups(); }
  };

  // ===== GROUP CRUD =====
  const saveGroup = async (grp: Partial<MenuGroup> & { name: string; category_id: string }) => {
    if (!activeUnitId) return;
    setLoading(true);
    try {
      if (grp.id) {
        const { error } = await supabase.from('menu_groups').update({
          name: grp.name, category_id: grp.category_id, description: grp.description,
          availability: grp.availability || { tablet: true, delivery: true },
          schedule: grp.schedule, sort_order: grp.sort_order ?? 0, is_active: grp.is_active ?? true,
        }).eq('id', grp.id);
        if (error) throw error;
      } else {
        const groupsInCat = groups.filter(g => g.category_id === grp.category_id);
        const maxOrder = groupsInCat.length > 0 ? Math.max(...groupsInCat.map(g => g.sort_order)) + 1 : 0;
        const { error } = await supabase.from('menu_groups').insert({
          unit_id: activeUnitId, name: grp.name, category_id: grp.category_id,
          description: grp.description, availability: grp.availability || { tablet: true, delivery: true },
          schedule: grp.schedule, sort_order: grp.sort_order ?? maxOrder, is_active: grp.is_active ?? true,
        });
        if (error) throw error;
      }
      toast({ title: 'Grupo salvo' });
      fetchGroups();
    } catch (err: any) {
      toast({ title: 'Erro', description: err.message, variant: 'destructive' });
    } finally { setLoading(false); }
  };

  const deleteGroup = async (id: string) => {
    const { error } = await supabase.from('menu_groups').delete().eq('id', id);
    if (error) toast({ title: 'Erro', description: error.message, variant: 'destructive' });
    else { toast({ title: 'Grupo excluído' }); fetchGroups(); }
  };

  // ===== PRODUCT CRUD =====
  const saveProduct = async (prod: Partial<MenuProduct> & { name: string; price: number }) => {
    if (!activeUnitId) return;
    setLoading(true);
    try {
      const payload = {
        name: prod.name, price: prod.price, codigo_pdv: prod.codigo_pdv,
        category: prod.category || 'Geral', description: prod.description,
        is_active: prod.is_active ?? true, sort_order: prod.sort_order ?? 0,
        group_id: prod.group_id || null, is_highlighted: prod.is_highlighted ?? false,
        is_18_plus: prod.is_18_plus ?? false,
        availability: prod.availability || { tablet: true, delivery: true },
        schedule: prod.schedule, price_type: prod.price_type || 'fixed',
        custom_prices: prod.custom_prices,
      };

      if (prod.id) {
        const { error } = await supabase.from('tablet_products').update(payload).eq('id', prod.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('tablet_products').insert({ ...payload, unit_id: activeUnitId });
        if (error) throw error;
      }
      toast({ title: 'Produto salvo' });
      fetchProducts();
    } catch (err: any) {
      toast({ title: 'Erro', description: err.message, variant: 'destructive' });
    } finally { setLoading(false); }
  };

  const deleteProduct = async (id: string) => {
    const { error } = await supabase.from('tablet_products').delete().eq('id', id);
    if (error) toast({ title: 'Erro', description: error.message, variant: 'destructive' });
    else { toast({ title: 'Produto excluído' }); fetchProducts(); }
  };

  // ===== OPTION GROUP CRUD =====
  const saveOptionGroup = async (og: Partial<MenuOptionGroup> & { title: string }, options: Omit<MenuOption, 'id' | 'option_group_id'>[]) => {
    if (!activeUnitId) return;
    setLoading(true);
    try {
      let ogId = og.id;
      if (ogId) {
        const { error } = await supabase.from('menu_option_groups').update({
          title: og.title, min_selections: og.min_selections ?? 0,
          max_selections: og.max_selections ?? 1, allow_repeat: og.allow_repeat ?? false,
          availability: og.availability || { tablet: true, delivery: true },
          sort_order: og.sort_order ?? 0, is_active: og.is_active ?? true,
        }).eq('id', ogId);
        if (error) throw error;

        // Delete existing options and re-insert
        await supabase.from('menu_options').delete().eq('option_group_id', ogId);
      } else {
        const { data, error } = await supabase.from('menu_option_groups').insert({
          unit_id: activeUnitId, title: og.title,
          min_selections: og.min_selections ?? 0, max_selections: og.max_selections ?? 1,
          allow_repeat: og.allow_repeat ?? false,
          availability: og.availability || { tablet: true, delivery: true },
          sort_order: og.sort_order ?? 0, is_active: og.is_active ?? true,
        }).select('id').single();
        if (error) throw error;
        ogId = (data as any).id;
      }

      // Insert options
      if (options.length > 0 && ogId) {
        const optRows = options.map((o, i) => ({
          option_group_id: ogId!,
          name: o.name, price: o.price || 0,
          codigo_pdv: o.codigo_pdv || null,
          availability: o.availability || { tablet: true, delivery: true },
          sort_order: i, is_active: o.is_active ?? true,
        }));
        const { error } = await supabase.from('menu_options').insert(optRows);
        if (error) throw error;
      }

      toast({ title: 'Grupo de opcionais salvo' });
      fetchOptionGroups();
    } catch (err: any) {
      toast({ title: 'Erro', description: err.message, variant: 'destructive' });
    } finally { setLoading(false); }
  };

  const deleteOptionGroup = async (id: string) => {
    const { error } = await supabase.from('menu_option_groups').delete().eq('id', id);
    if (error) toast({ title: 'Erro', description: error.message, variant: 'destructive' });
    else { toast({ title: 'Grupo excluído' }); fetchOptionGroups(); }
  };

  // ===== PRODUCT-OPTION LINKS =====
  const linkOptionToProduct = async (productId: string, optionGroupId: string) => {
    const { error } = await supabase.from('menu_product_option_groups').insert({
      product_id: productId, option_group_id: optionGroupId, sort_order: 0,
    });
    if (error && !error.message.includes('duplicate')) {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' });
    }
    fetchProductOptionLinks();
    fetchOptionGroups();
  };

  const unlinkOptionFromProduct = async (productId: string, optionGroupId: string) => {
    await supabase.from('menu_product_option_groups')
      .delete().eq('product_id', productId).eq('option_group_id', optionGroupId);
    fetchProductOptionLinks();
    fetchOptionGroups();
  };

  const setProductOptionLinks = async (optionGroupId: string, productIds: string[]) => {
    // Remove all existing links for this option group
    await supabase.from('menu_product_option_groups').delete().eq('option_group_id', optionGroupId);
    // Insert new links
    if (productIds.length > 0) {
      const rows = productIds.map((pid, i) => ({
        product_id: pid, option_group_id: optionGroupId, sort_order: i,
      }));
      await supabase.from('menu_product_option_groups').insert(rows);
    }
    fetchProductOptionLinks();
    fetchOptionGroups();
    toast({ title: 'Vínculos atualizados' });
  };

  // Helper: products in a group
  const getProductsByGroup = (groupId: string) => products.filter(p => p.group_id === groupId);
  const getGroupsByCategory = (categoryId: string) => groups.filter(g => g.category_id === categoryId);
  const getLinkedProductIds = (optionGroupId: string) =>
    productOptionLinks.filter(l => l.option_group_id === optionGroupId).map(l => l.product_id);
  const getLinkedOptionGroupIds = (productId: string) =>
    productOptionLinks.filter(l => l.product_id === productId).map(l => l.option_group_id);

  return {
    categories, groups, products, optionGroups, productOptionLinks, loading,
    saveCategory, deleteCategory,
    saveGroup, deleteGroup,
    saveProduct, deleteProduct,
    saveOptionGroup, deleteOptionGroup,
    linkOptionToProduct, unlinkOptionFromProduct, setProductOptionLinks,
    getProductsByGroup, getGroupsByCategory, getLinkedProductIds, getLinkedOptionGroupIds,
    fetchCategories, fetchGroups, fetchProducts, fetchOptionGroups,
  };
}
