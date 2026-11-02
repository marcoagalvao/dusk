/** Fundo fixo de todas as telas depois do login. Os estilos estão em `app-backdrop.css`. */
export function AppBackdrop() {
  return (
    <div className="app-backdrop" aria-hidden="true">
      <div className="app-backdrop-glow" />
      <div className="app-backdrop-stars" />
      <div className="app-backdrop-stars app-backdrop-stars-late" />
      <div className="app-backdrop-sun" />
      <div className="app-backdrop-grain" />
    </div>
  );
}
