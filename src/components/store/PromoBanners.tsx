export default function PromoBanners() {
  return (
    <div className="px-4 py-2.5 flex gap-2 border-b overflow-x-auto">
      <div className="flex items-center gap-2 border border-primary/20 rounded-lg px-3 py-1.5 shrink-0 bg-primary/5">
        <div>
          <p className="text-xs font-bold text-foreground">Envío gratis</p>
          <p className="text-[10px] text-muted-foreground">Sin importe mínimo</p>
        </div>
        <button className="bg-primary text-primary-foreground text-[10px] font-semibold px-2.5 py-1 rounded">
          Canjear
        </button>
      </div>
      <div className="flex items-center gap-2 border border-primary/20 rounded-lg px-3 py-1.5 shrink-0 bg-primary/5">
        <div>
          <p className="text-xs font-bold text-primary">Hasta 85% OFF</p>
          <p className="text-[10px] text-muted-foreground">En productos seleccionados</p>
        </div>
        <button className="bg-primary text-primary-foreground text-[10px] font-semibold px-2.5 py-1 rounded">
          Canjear
        </button>
      </div>
    </div>
  );
}
