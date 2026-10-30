# Painel da visão geral

Tela inicial do Dusk (`/`). O objetivo é entender o dia de relance, sem precisar ler tudo.

Código em `src/components/dashboard/`. Cálculos em `src/domain/dashboard-metrics.ts`, funções puras com testes.

## Regras de leitura

Valem para qualquer bloco novo:

1. **Título em linguagem comum.** Diz do que se trata, como uma pergunta respondida: "Onde está a urgência", não "Matriz".
2. **No máximo uma frase de explicação**, dizendo como ler o bloco. Use `TileHeading` (`tile.tsx`).
3. **O mais importante vem primeiro:** a situação do dia, depois o que fazer, depois o quadro geral e por fim o relatório.
4. **Zero fica apagado**, para o olho ir ao que importa.
5. **Número clicável:** todo contador abre a lista com o filtro correspondente (`FilterLink`).
6. **Nada depende só de cor ou de hover:** cada cor tem legenda, cada valor aparece escrito e o tooltip só complementa.
7. **Comparações por extenso:** "2 a mais que nos 7 dias anteriores", nunca "+2 vs" ou "p.p.".
8. **Sem jargão:** "Aguardando resposta de quem", não "Dependências".
9. **Contraste:** texto explicativo usa `ink-muted`. `ink-subtle` fica só para o que pode sumir, como zeros e ícones.
10. **Funciona em 375 px** sem rolagem horizontal. Títulos do calendário quebram em até duas linhas.

## Blocos, de cima para baixo

| Bloco | Pergunta que responde | Componente | Métrica |
| --- | --- | --- | --- |
| Frase de situação | Como está o dia? | `today-hero.tsx` | `todayPulse` |
| Anel e número grande | Quanto falta hoje? | `today-hero.tsx`, `ProgressRing` | `todayPulse` |
| Seis contadores | O que exige ação? Atrasadas, Urgentes, Bloqueadas, Aguardando, Para revisar, Feitas hoje | `today-hero.tsx` | `todayPulse` |
| Para fazer hoje | O que faço agora? | `dashboard-view.tsx` | `getTodayAgenda` + `isTodayRelevant` |
| Também pedem atenção | O que mais não pode esquecer? | `dashboard-view.tsx` | `getTodayAgenda` |
| Onde está a urgência | Onde se concentra o risco? | `pending-map.tsx` | `priorityMatrix` |
| Em que pé estão as abertas | Quanto está parado ou andando? | `pending-map.tsx` | `statusBreakdown` |
| O que vem nas próximas duas semanas | O que está chegando? | `upcoming-calendar.tsx` | `upcomingDays` |
| Como foi sua semana, quinzena ou mês | Estou dando conta? | `period-report-section.tsx` | `periodReport`, `completionStreak` |
| Concluídas e criadas por dia | A fila cresce ou diminui? | `DailyBars` | `periodReport` |
| Concluídas por projeto | Onde foi meu esforço? | `LabeledBar` | `periodReport` |
| Seus dias de atividade | Tenho constância? | `Heatmap` | `activityHeatmap` |
| Há quanto tempo estão abertas | O que foi esquecido? | `LabeledBar` | `agingBuckets` |
| Aguardando resposta de quem | Quem devo cobrar? | `period-report-section.tsx` | `waitingByPerson` |
| Aguardando resposta, Para revisar em breve, Projetos recentes | Detalhe de cada grupo | `dashboard-view.tsx` | consultas de `task-queries.ts` |

## Definições

- **Tarefas para hoje:** abertas que batem com `isTodayRelevant`, o mesmo recorte de `/tasks/today`. O número do resumo e a lista precisam sempre coincidir.
- **Percentual do dia:** feitas hoje ÷ (feitas hoje + tarefas para hoje).
- **Baldes de prazo:** `overdue`, `today`, `soon` (até 7 dias, `SOON_DAYS`), `later`, `none`. Os filtros `soon` e `later` de `DueFilter` são os mesmos.
- **Períodos:** Semana = 7 dias, Quinzena = 15, Mês = 30, sempre móveis e terminando hoje. A comparação usa os N dias imediatamente anteriores.
- **Entregues no prazo:** concluídas no período que tinham prazo e terminaram até ele. Sem esse tipo de tarefa, mostra `–`.
- **Tempo até concluir:** média de dias entre `createdAt` e `completedAt`.
- **Atividade:** criações, conclusões e atualizações do histórico por dia, nas últimas 12 semanas.
- **Sequência:** dias seguidos com ao menos uma conclusão. Só aparece a partir de 2.

## Cores dos gráficos

Tokens em `src/app/globals.css`:

| Token | Uso |
| --- | --- |
| `--color-chart-todo` `#a48bdc` | A fazer |
| `--color-chart-waiting` `#e0a066` | Aguardando |
| `--color-chart-progress` `#6f9fdc` | Em andamento |
| `--color-chart-blocked` `#d9788c` | Bloqueado, prazo vencido, tarefas antigas |
| `--color-primary` | Concluídas, atividade, prazo em dia |
| `--color-ink-subtle` | Criadas e categorias neutras |

As cores pastel de status não têm contraste suficiente para gráficos, então os tokens acima foram ajustados e validados com o script da skill `dataviz`: passam em daltonismo, visão normal, croma e contraste. A faixa de luminosidade falha de propósito neste tema escuro, e os rótulos compensam isso. Os gráficos são HTML e SVG, sem biblioteca, em `charts.tsx`.

## Brainstorm

Ideias levantadas para o painel e o que aconteceu com cada uma.

### Implementado

- Frase única com a situação do dia.
- Anel do dia e número grande de tarefas pendentes.
- Contadores clicáveis para alertas.
- Mapa de prioridade × prazo.
- Barra de status.
- Calendário de duas semanas com títulos visíveis.
- Relatório de semana, quinzena e mês com comparação.
- Colunas diárias de concluídas e criadas.
- Entrega no prazo e tempo médio até concluir.
- Mapa de atividade, sequência de dias e idade das tarefas abertas.
- Ranking de quem você está aguardando.
- Concluídas por projeto.

### Ideias para depois

**Previsão e carga**
- Previsão de fim da fila, a partir do ritmo de conclusão.
- Carga por dia no calendário, com alerta para dia sobrecarregado.
- Sugestão de foco do dia a partir de prazo e prioridade.

**Qualidade da lista**
- Tarefas abertas sem próxima ação.
- Tarefas sem atualização há muito tempo.
- Aguardando sem data de revisão.
- Tempo médio em cada status, para mostrar onde as tarefas travam.

**Projetos**
- Saúde por projeto: em dia, em risco ou parado.
- Progresso do projeto com data-alvo.
- Comparação de entregas entre projetos no tempo.

**Metas e hábitos**
- Meta semanal de conclusões.
- Melhor dia e horário de produtividade.
- Marcos pessoais, como recorde de sequência.

**Relatórios**
- Resumo semanal escrito e enviado por e-mail.
- Relatório exportável em PDF, por período e projeto.
- Período personalizado, guardado na URL.

**Personalização**
- Reordenar e esconder blocos.
- Modo compacto, só com o resumo do dia.
- Visão mensal do calendário e arrastar tarefas para mudar o prazo.
