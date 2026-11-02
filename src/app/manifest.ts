import type { MetadataRoute } from "next";

/** Permite instalar o app; no iPhone, os avisos só funcionam depois de adicionar à tela de início. */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Dusk",
    short_name: "Dusk",
    description: "Um gerenciador pessoal para saber o que fazer, onde cada tarefa parou e qual é o próximo passo.",
    lang: "pt-BR",
    start_url: "/",
    display: "standalone",
    background_color: "#242329",
    theme_color: "#242329",
    icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml" }],
  };
}
