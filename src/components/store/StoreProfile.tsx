export default function StoreProfile() {
  return (
    <div className="px-4 py-3 border-b">
      <div className="flex items-center gap-3">
        <img src="https://i.imgur.com/lrjMPw6.png" alt="Trend Loja" className="w-12 h-12 rounded-full object-cover shrink-0" />
        <div className="flex-1 min-w-0">
          <h1 className="font-bold text-base">Trend Loja</h1>
          <p className="text-xs text-muted-foreground">37.857 vendido(s)</p>
        </div>
        <div className="flex flex-col gap-1.5 shrink-0">
          <button className="bg-primary text-primary-foreground text-xs font-semibold px-5 py-1.5 rounded-md">
            Seguir
          </button>
          <button className="border text-xs font-medium px-5 py-1.5 rounded-md">
            Mensaje
          </button>
        </div>
      </div>
    </div>
  );
}
