import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { toast } from '@/hooks/use-toast';
import { Eye, Save, Plus, Trash2 } from 'lucide-react';

interface PixelConfig {
  id?: string;
  pixel_id: string;
  access_token: string;
  enabled: boolean;
  isNew?: boolean;
}

export default function AdminPixel() {
  const [pixels, setPixels] = useState<PixelConfig[]>([]);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => { loadConfig(); }, []);

  const loadConfig = async () => {
    const { data } = await supabase
      .from('pixel_settings')
      .select('*')
      .eq('platform', 'tiktok')
      .order('created_at', { ascending: true });

    if (data && data.length > 0) {
      setPixels(data.map(d => ({
        id: d.id,
        pixel_id: d.pixel_id,
        access_token: d.access_token,
        enabled: d.enabled,
      })));
    }
    setLoaded(true);
  };

  const updatePixel = (index: number, patch: Partial<PixelConfig>) => {
    setPixels(prev => prev.map((p, i) => i === index ? { ...p, ...patch } : p));
  };

  const handleAddPixel = () => {
    setPixels(prev => [...prev, { pixel_id: '', access_token: '', enabled: true, isNew: true }]);
  };

  const handleSave = async (index: number) => {
    const pixel = pixels[index];
    if (!pixel.pixel_id.trim()) {
      toast({ title: 'El Pixel ID es obligatorio', variant: 'destructive' });
      return;
    }
    const tempId = pixel.id || `new-${index}`;
    setSavingId(tempId);
    try {
      if (pixel.id) {
        const { error } = await supabase
          .from('pixel_settings')
          .update({
            pixel_id: pixel.pixel_id,
            access_token: pixel.access_token,
            enabled: pixel.enabled,
          })
          .eq('id', pixel.id);
        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from('pixel_settings')
          .insert({
            platform: 'tiktok',
            pixel_id: pixel.pixel_id,
            access_token: pixel.access_token,
            enabled: pixel.enabled,
          })
          .select()
          .single();
        if (error) throw error;
        if (data) updatePixel(index, { id: data.id, isNew: false });
      }
      toast({ title: 'Píxel guardado correctamente' });
    } catch {
      toast({ title: 'Error al guardar el píxel', variant: 'destructive' });
    }
    setSavingId(null);
  };

  const handleDelete = async (index: number) => {
    const pixel = pixels[index];
    if (!confirm('¿Estás seguro de que quieres eliminar este píxel?')) return;
    if (!pixel.id) {
      // Just remove from local state
      setPixels(prev => prev.filter((_, i) => i !== index));
      return;
    }
    try {
      const { error } = await supabase.from('pixel_settings').delete().eq('id', pixel.id);
      if (error) throw error;
      setPixels(prev => prev.filter((_, i) => i !== index));
      toast({ title: 'Píxel eliminado' });
    } catch {
      toast({ title: 'Error al eliminar el píxel', variant: 'destructive' });
    }
  };

  if (!loaded) return <p className="text-muted-foreground">Cargando...</p>;

  return (
    <div className="space-y-6 max-w-xl">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="font-semibold text-lg flex items-center gap-2"><Eye className="h-5 w-5" /> Píxeles de TikTok</h2>
          <p className="text-sm text-muted-foreground mt-1">Configura uno o más píxeles de TikTok. Los eventos se enviarán a todos los píxeles activos.</p>
        </div>
        <Button onClick={handleAddPixel} variant="outline" size="sm">
          <Plus className="h-4 w-4 mr-1" /> Añadir
        </Button>
      </div>

      {pixels.length === 0 && (
        <div className="border border-dashed rounded-xl p-8 text-center text-sm text-muted-foreground">
          Ningún píxel configurado. Haz clic en "Añadir" para empezar.
        </div>
      )}

      {pixels.map((pixel, index) => {
        const tempId = pixel.id || `new-${index}`;
        const isSaving = savingId === tempId;
        return (
          <div key={tempId} className="border rounded-xl p-4 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Pixel {index + 1} {pixel.isNew && <span className="text-xs text-muted-foreground">(nuevo)</span>}</p>
                <p className="text-xs text-muted-foreground">{pixel.enabled ? 'Activo' : 'Inactivo'}</p>
              </div>
              <div className="flex items-center gap-3">
                <Switch checked={pixel.enabled} onCheckedChange={v => updatePixel(index, { enabled: v })} />
                <Button onClick={() => handleDelete(index)} variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div>
              <Label>Pixel ID</Label>
              <Input
                placeholder="Ex: CXXXXXXXXXXXXXXXXX"
                value={pixel.pixel_id}
                onChange={e => updatePixel(index, { pixel_id: e.target.value })}
              />
              <p className="text-xs text-muted-foreground mt-1">TikTok Ads Manager → Herramientas → Eventos</p>
            </div>

            <div>
              <Label>Access Token (API)</Label>
              <Input
                type="password"
                placeholder="Token de acesso para Events API"
                value={pixel.access_token}
                onChange={e => updatePixel(index, { access_token: e.target.value })}
              />
              <p className="text-xs text-muted-foreground mt-1">Necesario para eventos server-side.</p>
            </div>

            <Button onClick={() => handleSave(index)} disabled={isSaving} className="w-full">
              <Save className="h-4 w-4 mr-1" />
              {isSaving ? 'Guardando...' : 'Guardar'}
            </Button>
          </div>
        );
      })}

      <div className="border rounded-xl p-4">
        <h3 className="font-semibold mb-2">Eventos rastreados</h3>
        <div className="space-y-2 text-sm">
          <div className="flex items-center justify-between"><span>PageView</span><span className="text-xs bg-secondary px-2 py-0.5 rounded">Automático</span></div>
          <div className="flex items-center justify-between"><span>ViewContent</span><span className="text-xs bg-secondary px-2 py-0.5 rounded">Página del producto</span></div>
          <div className="flex items-center justify-between"><span>AddToCart</span><span className="text-xs bg-secondary px-2 py-0.5 rounded">Añadir al carrito</span></div>
          <div className="flex items-center justify-between"><span>InitiateCheckout</span><span className="text-xs bg-secondary px-2 py-0.5 rounded">Inicio de pago</span></div>
          <div className="flex items-center justify-between"><span>CompletePayment</span><span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">Server-side</span></div>
        </div>
      </div>
    </div>
  );
}
