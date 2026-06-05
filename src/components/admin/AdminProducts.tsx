import { useState, useRef, useEffect } from 'react';
import { useAllProducts, useCreateProduct, useUpdateProduct, useDeleteProduct, uploadProductImage, Product, ProductVariant } from '@/hooks/useProducts';
import { useSetRelatedProducts } from '@/hooks/useRelatedProducts';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Plus, Pencil, Trash2, Upload, X, Package, Image as ImageIcon } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

function formatPrice(price: number) {
  return '€ ' + price.toFixed(2).replace('.', ',');
}

interface VariantForm {
  id: string;
  name: string;
  image: string;
  price: string;
  stock: string;
}

interface ProductForm {
  name: string;
  description: string;
  price: string;
  compare_at_price: string;
  stock: string;
  status: string;
  category: string;
  images: string[];
  variants: VariantForm[];
  relatedProductIds: string[];
}

const emptyForm: ProductForm = {
  name: '', description: '', price: '', compare_at_price: '', stock: '0', status: 'active', category: '', images: [], variants: [], relatedProductIds: [],
};

function genVariantId() {
  return 'v_' + Math.random().toString(36).slice(2, 10);
}

export default function AdminProducts() {
  const { data: products, isLoading } = useAllProducts();
  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();
  const deleteProduct = useDeleteProduct();
  const setRelatedProducts = useSetRelatedProducts();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<ProductForm>(emptyForm);
  const [uploading, setUploading] = useState(false);
  const [variantUploadingId, setVariantUploadingId] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const variantFileRef = useRef<HTMLInputElement>(null);
  const [pendingVariantId, setPendingVariantId] = useState<string | null>(null);

  const openNew = () => { setForm(emptyForm); setEditingId(null); setDialogOpen(true); };

  const openEdit = async (p: Product) => {
    let relatedIds: string[] = [];
    try {
      const { data } = await supabase
        .from('related_products')
        .select('related_product_id')
        .eq('product_id', p.id)
        .order('sort_order', { ascending: true });
      if (data) relatedIds = data.map(r => r.related_product_id);
    } catch {}

    const variants: VariantForm[] = Array.isArray(p.variants)
      ? p.variants.map(v => ({
          id: v.id || genVariantId(),
          name: v.name || '',
          image: v.image || '',
          price: v.price != null ? String(v.price) : '',
          stock: v.stock != null ? String(v.stock) : '',
        }))
      : [];

    setForm({
      name: p.name,
      description: p.description || '',
      price: String(p.price),
      compare_at_price: p.compare_at_price ? String(p.compare_at_price) : '',
      stock: String(p.stock),
      status: p.status,
      category: p.category || '',
      images: p.images || [],
      variants,
      relatedProductIds: relatedIds,
    });
    setEditingId(p.id);
    setDialogOpen(true);
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    setUploading(true);
    try {
      const urls: string[] = [];
      for (const file of Array.from(files)) {
        const url = await uploadProductImage(file);
        urls.push(url);
      }
      setForm(prev => ({ ...prev, images: [...prev.images, ...urls] }));
      toast({ title: `${urls.length} imagen(es) cargada(s)` });
    } catch {
      toast({ title: 'Error al cargar imagen', variant: 'destructive' });
    }
    setUploading(false);
  };

  const removeImage = (index: number) => {
    setForm(prev => ({ ...prev, images: prev.images.filter((_, i) => i !== index) }));
  };

  // Variants
  const addVariant = () => {
    setForm(prev => ({
      ...prev,
      variants: [...prev.variants, { id: genVariantId(), name: '', image: '', price: '', stock: '' }],
    }));
  };

  const updateVariant = (id: string, patch: Partial<VariantForm>) => {
    setForm(prev => ({
      ...prev,
      variants: prev.variants.map(v => v.id === id ? { ...v, ...patch } : v),
    }));
  };

  const removeVariant = (id: string) => {
    setForm(prev => ({ ...prev, variants: prev.variants.filter(v => v.id !== id) }));
  };

  const triggerVariantImageUpload = (variantId: string) => {
    setPendingVariantId(variantId);
    variantFileRef.current?.click();
  };

  const handleVariantImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    const variantId = pendingVariantId;
    e.target.value = '';
    if (!file || !variantId) return;
    setVariantUploadingId(variantId);
    try {
      const url = await uploadProductImage(file);
      updateVariant(variantId, { image: url });
      toast({ title: 'Imagen de variante cargada' });
    } catch {
      toast({ title: 'Error al cargar imagen de variante', variant: 'destructive' });
    }
    setVariantUploadingId(null);
    setPendingVariantId(null);
  };

  const toggleRelated = (productId: string) => {
    setForm(prev => ({
      ...prev,
      relatedProductIds: prev.relatedProductIds.includes(productId)
        ? prev.relatedProductIds.filter(id => id !== productId)
        : [...prev.relatedProductIds, productId],
    }));
  };

  const handleSave = async () => {
    if (!form.name || !form.price) {
      toast({ title: 'Nombre y precio son obligatorios', variant: 'destructive' });
      return;
    }

    // Validate variants: name required when present
    for (const v of form.variants) {
      if (!v.name.trim()) {
        toast({ title: 'Cada variante necesita un nombre', variant: 'destructive' });
        return;
      }
    }

    const variants: ProductVariant[] = form.variants.map(v => ({
      id: v.id,
      name: v.name.trim(),
      image: v.image || null,
      price: v.price ? parseFloat(v.price) : null,
      stock: v.stock !== '' ? parseInt(v.stock) : null,
    }));

    const data = {
      name: form.name,
      description: form.description || null,
      price: parseFloat(form.price),
      compare_at_price: form.compare_at_price ? parseFloat(form.compare_at_price) : null,
      stock: parseInt(form.stock) || 0,
      status: form.status,
      category: form.category || null,
      images: form.images,
      variants,
    };

    try {
      let savedId = editingId;
      if (editingId) {
        await updateProduct.mutateAsync({ id: editingId, ...data });
        toast({ title: 'Producto actualizado' });
      } else {
        const result = await createProduct.mutateAsync(data);
        savedId = result.id;
        toast({ title: 'Producto creado' });
      }

      if (savedId) {
        await setRelatedProducts.mutateAsync({
          productId: savedId,
          relatedIds: form.relatedProductIds,
        });
      }

      setDialogOpen(false);
    } catch {
      toast({ title: 'Error al guardar producto', variant: 'destructive' });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este producto?')) return;
    try {
      await deleteProduct.mutateAsync(id);
      toast({ title: 'Producto eliminado' });
    } catch {
      toast({ title: 'Error al eliminar', variant: 'destructive' });
    }
  };

  const otherProducts = products?.filter(p => p.id !== editingId) || [];

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold">Productos ({products?.length || 0})</h2>
        <Button onClick={openNew} size="sm">
          <Plus className="h-4 w-4 mr-1" /> Nuevo Producto
        </Button>
      </div>

      {isLoading ? (
        <p className="text-muted-foreground">A carregar...</p>
      ) : products?.length === 0 ? (
        <div className="text-center py-20 space-y-3">
          <Package className="h-12 w-12 mx-auto text-muted-foreground" />
          <p className="text-muted-foreground">Ningún producto añadido.</p>
          <Button onClick={openNew}>Añadir primer producto</Button>
        </div>
      ) : (
        <div className="space-y-3">
          {products?.map(p => (
            <div key={p.id} className="border rounded-xl p-4 flex items-center gap-4">
              <div className="w-16 h-16 bg-secondary rounded-lg overflow-hidden shrink-0">
                {p.images?.[0] ? (
                  <img src={p.images[0]} alt={p.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">Sin img</div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{p.name}</p>
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-price font-bold">{formatPrice(p.price)}</span>
                  {p.compare_at_price && <span className="text-price-compare line-through">{formatPrice(p.compare_at_price)}</span>}
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                  <span>Stock: {p.stock}</span>
                  {Array.isArray(p.variants) && p.variants.length > 0 && (
                    <span>{p.variants.length} variante(s)</span>
                  )}
                  <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${p.status === 'active' ? 'bg-success/10 text-success' : 'bg-secondary'}`}>
                    {p.status === 'active' ? 'Activo' : 'Inactivo'}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon" onClick={() => openEdit(p)}>
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => handleDelete(p.id)}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? 'Editar Producto' : 'Nuevo Producto'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Nombre del producto *</Label>
              <Input value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="Ej: Altavoz Bluetooth JBL..." />
            </div>
            <div>
              <Label>Descripción (admite HTML)</Label>
              <Textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})} rows={4} placeholder="<p>Descripción detallada...</p>" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Precio de venta (€) *</Label>
                <Input type="number" step="0.01" value={form.price} onChange={e => setForm({...form, price: e.target.value})} placeholder="59.90" />
              </div>
              <div>
                <Label>Precio de comparación (€)</Label>
                <Input type="number" step="0.01" value={form.compare_at_price} onChange={e => setForm({...form, compare_at_price: e.target.value})} placeholder="149.99" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Stock</Label>
                <Input type="number" value={form.stock} onChange={e => setForm({...form, stock: e.target.value})} />
              </div>
              <div>
                <Label>Estado</Label>
                <Select value={form.status} onValueChange={v => setForm({...form, status: v})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Activo</SelectItem>
                    <SelectItem value="inactive">Inactivo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Categoría</Label>
              <Input value={form.category} onChange={e => setForm({...form, category: e.target.value})} placeholder="Ej: Electrónica, Hogar..." />
            </div>
            <div>
              <Label>Imágenes</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {form.images.map((img, i) => (
                  <div key={i} className="relative w-20 h-20 rounded-lg overflow-hidden border">
                    <img src={img} alt="" className="w-full h-full object-cover" />
                    <button onClick={() => removeImage(i)} className="absolute top-0.5 right-0.5 bg-background/80 rounded-full p-0.5">
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
                <button
                  onClick={() => fileRef.current?.click()}
                  className="w-20 h-20 border-2 border-dashed rounded-lg flex flex-col items-center justify-center text-muted-foreground hover:border-primary hover:text-primary transition-colors"
                  disabled={uploading}
                >
                  <Upload className="h-4 w-4" />
                  <span className="text-[10px] mt-1">{uploading ? 'Cargando...' : 'Añadir'}</span>
                </button>
              </div>
              <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={handleUpload} />
            </div>

            {/* Variants */}
            <div>
              <div className="flex items-center justify-between">
                <Label>Variantes (color, modelo, etc.)</Label>
                <Button type="button" variant="outline" size="sm" onClick={addVariant}>
                  <Plus className="h-3.5 w-3.5 mr-1" /> Añadir
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mb-2 mt-1">
                Opcional. Precio y stock vacíos = usa los del producto principal.
              </p>
              <input ref={variantFileRef} type="file" accept="image/*" className="hidden" onChange={handleVariantImageUpload} />
              {form.variants.length === 0 ? (
                <div className="border-2 border-dashed rounded-lg p-3 text-center text-xs text-muted-foreground">
                  Sin variantes. Haz clic en "Añadir" para crear.
                </div>
              ) : (
                <div className="space-y-2">
                  {form.variants.map((v) => (
                    <div key={v.id} className="border rounded-lg p-2 flex gap-2 items-start">
                      <button
                        type="button"
                        onClick={() => triggerVariantImageUpload(v.id)}
                        disabled={variantUploadingId === v.id}
                        className="w-14 h-14 rounded-lg overflow-hidden bg-secondary border shrink-0 flex items-center justify-center"
                        title="Cargar imagen"
                      >
                        {v.image ? (
                          <img src={v.image} alt={v.name} className="w-full h-full object-cover" />
                        ) : (
                          <ImageIcon className="h-5 w-5 text-muted-foreground" />
                        )}
                      </button>
                      <div className="flex-1 grid grid-cols-3 gap-1.5">
                        <Input
                          className="col-span-3 h-8 text-sm"
                          placeholder="Nombre (ej: Rojo)"
                          value={v.name}
                          onChange={e => updateVariant(v.id, { name: e.target.value })}
                        />
                        <Input
                          className="h-8 text-xs"
                          type="number"
                          step="0.01"
                          placeholder="Precio €"
                          value={v.price}
                          onChange={e => updateVariant(v.id, { price: e.target.value })}
                        />
                        <Input
                          className="h-8 text-xs"
                          type="number"
                          placeholder="Stock"
                          value={v.stock}
                          onChange={e => updateVariant(v.id, { stock: e.target.value })}
                        />
                        <button
                          type="button"
                          onClick={() => removeVariant(v.id)}
                          className="h-8 rounded border text-destructive hover:bg-destructive/5 flex items-center justify-center"
                          title="Eliminar"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Related Products Picker */}
            {otherProducts.length > 0 && (
              <div>
                <Label>Productos Relacionados</Label>
                <p className="text-xs text-muted-foreground mb-2">Selecciona los productos que aparecerán en la sección "Productos Relacionados" de esta página.</p>
                <div className="max-h-48 overflow-y-auto border rounded-lg p-2 space-y-2">
                  {otherProducts.map(p => (
                    <label key={p.id} className="flex items-center gap-3 cursor-pointer hover:bg-secondary/50 rounded-lg p-1.5">
                      <Checkbox
                        checked={form.relatedProductIds.includes(p.id)}
                        onCheckedChange={() => toggleRelated(p.id)}
                      />
                      <div className="w-8 h-8 bg-secondary rounded overflow-hidden shrink-0">
                        {p.images?.[0] ? (
                          <img src={p.images[0]} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-[8px] text-muted-foreground">—</div>
                        )}
                      </div>
                      <span className="text-sm truncate">{p.name}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            <Button onClick={handleSave} className="w-full h-11" disabled={createProduct.isPending || updateProduct.isPending}>
              {createProduct.isPending || updateProduct.isPending ? 'Guardando...' : editingId ? 'Guardar cambios' : 'Crear producto'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
