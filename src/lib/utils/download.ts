/** Dispara o download de um arquivo de texto gerado no navegador. */
export function downloadTextFile(fileName: string, content: string, mimeType = "application/json"): void {
  const blob = new Blob([content], { type: `${mimeType};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  // Adiado para o navegador concluir o download antes de liberar a URL.
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
