import { PageContainer } from "@/components/layout/page";
import { ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/misc";

export default function NotFound() {
  return (
    <PageContainer>
      <EmptyState
        title="Página não encontrada."
        description="O endereço pode estar errado ou o conteúdo foi removido."
        action={
          <ButtonLink href="/" variant="secondary" size="sm">
            Ir para a visão geral
          </ButtonLink>
        }
      />
    </PageContainer>
  );
}
