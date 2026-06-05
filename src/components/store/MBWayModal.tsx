import { useState, useEffect } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Pencil, Check, X } from 'lucide-react';
import mbwayIcon from '@/assets/mbway-icon.png';
import { toast } from '@/hooks/use-toast';

interface MBWayModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  phone: string;
  onPhoneChange?: (newPhone: string) => void;
  loading?: boolean;
}

function isValidPtMobile(digits: string) {
  // 9 dígitos, começa por 9 e segundo dígito 1/2/3/6
  return /^9[1236]\d{7}$/.test(digits);
}

export default function MBWayModal({ open, onClose, onConfirm, phone, onPhoneChange, loading = false }: MBWayModalProps) {
  const [submitting, setSubmitting] = useState(false);

  const handleConfirmClick = () => {
    if (submitting || loading) return;
    setSubmitting(true);
    try {
      onConfirm();
    } finally {
      // libera após pequeno delay para evitar duplo clique imediato
      setTimeout(() => setSubmitting(false), 1500);
    }
  };

  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(phone.replace(/\D/g, ''));

  useEffect(() => {
    setDraft(phone.replace(/\D/g, ''));
    setEditing(false);
  }, [phone, open]);

  const handleSave = () => {
    const digits = draft.replace(/\D/g, '');
    if (!isValidPtMobile(digits)) {
      toast({
        title: 'Número inválido',
        description: 'Insira um número de telemóvel português válido (9 dígitos a começar por 9).',
        variant: 'destructive',
      });
      return;
    }
    // Formata como "9XX XXX XXX"
    const formatted = `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6, 9)}`;
    onPhoneChange?.(formatted);
    setEditing(false);
  };

  const displayDigits = phone.replace(/\D/g, '');
  const valid = isValidPtMobile(displayDigits);

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o && !submitting && !loading) onClose(); }}>
      <DialogContent className="sm:max-w-md">
        <div className="text-center space-y-4">
          <div className="flex items-center gap-3 justify-center">
            <img src={mbwayIcon} alt="MB WAY" className="w-9 h-9 rounded-xl object-contain" />
            <div className="text-left">
              <h3 className="font-semibold">Confirmar MB WAY</h3>
              <p className="text-sm text-muted-foreground">Verifique o número do seu telemóvel</p>
            </div>
          </div>

          <p className="text-sm text-muted-foreground">O pagamento será enviado para o número:</p>

          <div className="bg-secondary rounded-xl py-4 px-3 sm:px-6">
            <p className="text-xs sm:text-sm text-muted-foreground">PT +351</p>
            {editing ? (
              <div className="flex items-center gap-2 mt-2">
                <input
                  type="tel"
                  inputMode="numeric"
                  maxLength={9}
                  autoFocus
                  value={draft}
                  onChange={(e) => setDraft(e.target.value.replace(/\D/g, '').slice(0, 9))}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSave();
                    if (e.key === 'Escape') { setEditing(false); setDraft(displayDigits); }
                  }}
                  placeholder="9XX XXX XXX"
                  className="min-w-0 flex-1 text-lg sm:text-xl font-bold tracking-wider text-center bg-background border rounded-lg py-2 px-2 focus:outline-none focus:ring-2 focus:ring-ring"
                />
                <button
                  onClick={handleSave}
                  className="shrink-0 w-10 h-10 rounded-lg bg-primary text-primary-foreground flex items-center justify-center hover:opacity-90 transition-opacity"
                  aria-label="Guardar"
                >
                  <Check className="h-4 w-4" />
                </button>
                <button
                  onClick={() => { setEditing(false); setDraft(displayDigits); }}
                  className="shrink-0 w-10 h-10 rounded-lg border flex items-center justify-center hover:bg-muted transition-colors"
                  aria-label="Cancelar"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-center gap-2 mt-1">
                <p className="text-xl sm:text-2xl font-bold tracking-wider truncate">{phone}</p>
                <button
                  onClick={() => { setDraft(displayDigits); setEditing(true); }}
                  className="shrink-0 text-muted-foreground hover:text-primary p-1 transition-colors"
                  aria-label="Editar número"
                >
                  <Pencil className="h-4 w-4" />
                </button>
              </div>
            )}
            {!editing && !valid && (
              <p className="text-xs text-destructive mt-2">Número inválido — toque no lápis para corrigir</p>
            )}
          </div>

          <p className="text-sm text-muted-foreground">Este é o seu número MB WAY?</p>

          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => { setDraft(displayDigits); setEditing(true); }}
              className="flex-1"
              disabled={submitting || loading}
            >
              Alterar
            </Button>
            <Button
              onClick={handleConfirmClick}
              disabled={editing || !valid || submitting || loading}
              className="flex-1"
            >
              {submitting || loading ? 'A processar...' : 'Confirmar'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
