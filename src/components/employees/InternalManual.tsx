import { useState } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { AppIcon } from '@/components/ui/app-icon';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useManualAcknowledgments } from '@/hooks/useManualAcknowledgments';
import { useEmployees } from '@/hooks/useEmployees';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

const MANUAL_SECTIONS = [
  {
    title: '1. Pontualidade e Assiduidade',
    icon: 'schedule',
    color: 'text-amber-400',
    bg: 'bg-amber-500/10',
    rules: [
      'O funcionário deve comparecer ao trabalho no horário estipulado em seu contrato.',
      'Atrasos superiores a 10 minutos serão registrados e comunicados.',
      'Faltas devem ser comunicadas com antecedência mínima de 2 horas ao gestor direto.',
      'Faltas injustificadas serão objeto de advertência verbal na 1ª ocorrência.',
      'A partir de 3 faltas injustificadas no mês, haverá aplicação de advertência escrita.',
    ],
    penalty: 'Advertência verbal → escrita → suspensão. 3+ faltas injustificadas = perda da cesta básica do mês.',
  },
  {
    title: '2. Higiene Pessoal e Segurança Alimentar',
    icon: 'clean_hands',
    color: 'text-cyan-400',
    bg: 'bg-cyan-500/10',
    rules: [
      'Uso obrigatório de uniforme limpo, touca/rede de cabelo e sapato fechado antiderrapante.',
      'Lavar as mãos com frequência, especialmente ao trocar de tarefa.',
      'Unhas curtas, limpas e sem esmalte. Proibido uso de adornos (anéis, pulseiras, relógios).',
      'Proibido manusear alimentos quando apresentar sintomas de doença (gripe, diarreia, ferimentos abertos).',
      'Seguir rigorosamente os procedimentos de APPCC e Boas Práticas de Fabricação (BPF).',
      'Manter bancadas, equipamentos e utensílios sempre higienizados conforme protocolo.',
    ],
    penalty: 'Advertência escrita imediata. Ocorrência grave (contaminação) = suspensão + perda da cesta básica.',
  },
  {
    title: '3. Conduta e Disciplina',
    icon: 'gavel',
    color: 'text-red-400',
    bg: 'bg-red-500/10',
    rules: [
      'Tratar colegas, superiores e clientes com respeito e cordialidade.',
      'Proibido uso de linguagem ofensiva, gritos ou qualquer forma de assédio.',
      'Obedecer às orientações e ordens de serviço dos superiores hierárquicos.',
      'Recusa injustificada de ordens diretas constitui insubordinação (Art. 482, h da CLT).',
      'Proibido brigas, agressões físicas ou verbais no ambiente de trabalho.',
      'Conflitos devem ser reportados ao gestor para mediação.',
    ],
    penalty: 'Advertência escrita → suspensão → justa causa (Art. 482, h/j). Suspensão = perda da cesta básica.',
  },
  {
    title: '4. Uso de Celular e Distrações',
    icon: 'phone_android',
    color: 'text-violet-400',
    bg: 'bg-violet-500/10',
    rules: [
      'O uso de celular durante o expediente é PROIBIDO, exceto em horário de intervalo.',
      'Celulares devem permanecer desligados ou no modo silencioso, guardados no vestiário/armário.',
      'Em caso de emergência, o funcionário deve solicitar autorização ao gestor para atender ligações.',
      'Uso de fones de ouvido durante o trabalho é proibido.',
    ],
    penalty: 'Advertência verbal na 1ª vez → escrita na 2ª → suspensão na 3ª. 3 advertências verbais = perda da cesta básica.',
  },
  {
    title: '5. Cuidado com Patrimônio e Estoque',
    icon: 'inventory_2',
    color: 'text-primary',
    bg: 'bg-primary/10',
    rules: [
      'Zelar pelos equipamentos, utensílios e instalações da empresa.',
      'Danos causados por negligência ou mau uso serão de responsabilidade do funcionário.',
      'Proibido retirar qualquer produto, alimento ou material da empresa sem autorização.',
      'Consumo de produtos da loja somente com autorização expressa do gestor.',
      'Desperdício intencional de alimentos e insumos será tratado como falta grave.',
      'Registrar corretamente todas as movimentações de estoque no sistema.',
    ],
    penalty: 'Advertência escrita. Furto ou retirada sem autorização = justa causa (Art. 482, a). Perda imediata da cesta básica.',
  },
  {
    title: '6. Substâncias Proibidas',
    icon: 'local_bar',
    color: 'text-rose-400',
    bg: 'bg-rose-500/10',
    rules: [
      'É terminantemente proibido comparecer ao trabalho sob efeito de álcool ou drogas.',
      'Proibido consumir bebidas alcoólicas durante o expediente, inclusive no intervalo.',
      'Proibido fumar nas dependências internas do estabelecimento.',
      'Fumo permitido somente em área externa designada, durante o intervalo.',
    ],
    penalty: 'Suspensão imediata → justa causa na reincidência (Art. 482, f). Perda imediata da cesta básica.',
  },
];

const CESTA_RULES = [
  { rule: '3 ou mais faltas injustificadas no mês', icon: 'event_busy' },
  { rule: 'Qualquer suspensão disciplinar aplicada', icon: 'gavel' },
  { rule: 'Ocorrência grave de higiene/segurança alimentar', icon: 'health_and_safety' },
  { rule: '3 advertências verbais acumuladas no mês', icon: 'warning' },
  { rule: 'Furto ou retirada não autorizada de produtos', icon: 'no_backpack' },
  { rule: 'Trabalhar sob efeito de álcool ou drogas', icon: 'local_bar' },
];

export function InternalManual() {
  const { isAdmin } = useAuth();
  const { employees, myEmployee } = useEmployees();
  const { acknowledgments, acknowledge, hasAcknowledged, currentVersion } = useManualAcknowledgments();
  const [manualOpen, setManualOpen] = useState(false);
  const [signaturesOpen, setSignaturesOpen] = useState(false);
  const [signing, setSigning] = useState(false);

  const myAcknowledged = myEmployee ? hasAcknowledged(myEmployee.id) : false;
  const totalEmployees = employees.filter(e => e.is_active).length;
  const totalSigned = acknowledgments.length;

  const handleSign = async () => {
    if (!myEmployee) return;
    setSigning(true);
    try {
      await acknowledge(myEmployee.id);
    } finally {
      setSigning(false);
    }
  };

  return (
    <>
      {/* Manual Card */}
      <div className="bg-card border border-border/40 rounded-2xl overflow-hidden">
        <div className="p-4 space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <AppIcon name="menu_book" size={24} className="text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-bold">Manual de Boas Práticas e Regras</h3>
              <p className="text-[11px] text-muted-foreground">Versão {currentVersion} — Base CLT & Acordo Coletivo</p>
            </div>
          </div>

          {/* Progress bar */}
          {isAdmin && (
            <div className="space-y-1">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-muted-foreground">{totalSigned}/{totalEmployees} assinaram</span>
                <span className="text-primary font-semibold">
                  {totalEmployees > 0 ? Math.round((totalSigned / totalEmployees) * 100) : 0}%
                </span>
              </div>
              <div className="h-1.5 bg-muted/30 rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full transition-all"
                  style={{ width: `${totalEmployees > 0 ? (totalSigned / totalEmployees) * 100 : 0}%` }}
                />
              </div>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="flex-1 gap-1.5 text-xs"
              onClick={() => setManualOpen(true)}
            >
              <AppIcon name="visibility" size={16} />
              Ler Manual
            </Button>
            {isAdmin && (
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 text-xs"
                onClick={() => setSignaturesOpen(true)}
              >
                <AppIcon name="groups" size={16} />
                Assinaturas
              </Button>
            )}
          </div>

          {/* Sign status for employee */}
          {!isAdmin && myEmployee && (
            myAcknowledged ? (
              <div className="flex items-center gap-2 p-2 rounded-xl bg-success/10 border border-success/20">
                <AppIcon name="check_circle" size={16} className="text-success" />
                <span className="text-xs text-success font-medium">Você já assinou este manual</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 p-2 rounded-xl bg-amber-500/10 border border-amber-500/20">
                <AppIcon name="warning" size={16} className="text-amber-400" />
                <span className="text-xs text-amber-400 font-medium">Leia o manual e assine abaixo</span>
              </div>
            )
          )}
        </div>
      </div>

      {/* Full Manual Sheet */}
      <Sheet open={manualOpen} onOpenChange={setManualOpen}>
        <SheetContent side="bottom" className="h-[95vh] p-0 flex flex-col">
          <SheetHeader className="px-4 pt-4 pb-2 shrink-0">
            <SheetTitle className="text-base">Manual de Boas Práticas e Regras</SheetTitle>
            <p className="text-[11px] text-muted-foreground">Versão {currentVersion} — Leia com atenção todas as regras abaixo</p>
          </SheetHeader>

          <ScrollArea className="flex-1 px-4">
            <div className="space-y-4 pb-32">
              {/* Intro */}
              <div className="bg-primary/5 border border-primary/20 rounded-xl p-3">
                <p className="text-xs text-foreground leading-relaxed">
                  Este manual estabelece as normas internas de conduta, higiene e segurança da empresa,
                  em conformidade com a <strong>Consolidação das Leis do Trabalho (CLT)</strong> e o
                  <strong> Acordo Coletivo de Trabalho</strong> vigente da categoria. O descumprimento
                  destas normas resultará nas penalidades aqui descritas, podendo inclusive acarretar
                  a <strong>perda do benefício da cesta básica</strong> e demissão por justa causa.
                </p>
              </div>

              {/* Sections */}
              {MANUAL_SECTIONS.map((section, i) => (
                <div key={i} className="border border-border/30 rounded-xl overflow-hidden">
                  <div className={cn('flex items-center gap-2.5 p-3 border-b border-border/20', section.bg)}>
                    <AppIcon name={section.icon} size={20} className={section.color} />
                    <h4 className="text-sm font-bold">{section.title}</h4>
                  </div>
                  <div className="p-3 space-y-2">
                    {section.rules.map((rule, j) => (
                      <div key={j} className="flex gap-2 items-start">
                        <span className="text-[10px] text-muted-foreground mt-0.5 shrink-0 w-4 text-right">{j + 1}.</span>
                        <p className="text-xs text-foreground/90 leading-relaxed">{rule}</p>
                      </div>
                    ))}
                    <div className="mt-2 pt-2 border-t border-border/20">
                      <p className="text-[11px] leading-relaxed">
                        <span className="font-bold text-red-400">⚖️ Penalidade: </span>
                        <span className="text-muted-foreground">{section.penalty}</span>
                      </p>
                    </div>
                  </div>
                </div>
              ))}

              {/* Cesta Básica summary */}
              <div className="border border-red-500/30 rounded-xl overflow-hidden">
                <div className="flex items-center gap-2.5 p-3 bg-red-500/10 border-b border-red-500/20">
                  <AppIcon name="shopping_basket" size={20} className="text-red-400" />
                  <h4 className="text-sm font-bold text-red-400">Situações que Causam Perda da Cesta Básica</h4>
                </div>
                <div className="p-3 space-y-2">
                  {CESTA_RULES.map((item, i) => (
                    <div key={i} className="flex items-center gap-2.5 p-2 rounded-lg bg-red-500/5">
                      <AppIcon name={item.icon} size={16} className="text-red-400/70 shrink-0" />
                      <p className="text-xs text-foreground/80">{item.rule}</p>
                    </div>
                  ))}
                  <p className="text-[10px] text-muted-foreground/70 mt-2 leading-relaxed">
                    * Conforme Acordo Coletivo de Trabalho vigente. A cesta básica é um benefício
                    condicionado ao cumprimento das normas internas e frequência. A empresa reserva-se
                    o direito de suspender o benefício nas situações acima descritas.
                  </p>
                </div>
              </div>

              {/* Progressão disciplinar */}
              <div className="border border-border/30 rounded-xl overflow-hidden">
                <div className="flex items-center gap-2.5 p-3 bg-amber-500/10 border-b border-border/20">
                  <AppIcon name="trending_up" size={20} className="text-amber-400" />
                  <h4 className="text-sm font-bold">Progressão Disciplinar (CLT)</h4>
                </div>
                <div className="p-3 space-y-1.5">
                  {[
                    { step: '1ª Ocorrência', action: 'Advertência Verbal', desc: 'Registro no sistema, ciência do funcionário', color: 'text-amber-400', bg: 'bg-amber-500/10' },
                    { step: '2ª Ocorrência', action: 'Advertência Escrita', desc: 'Documento formal com assinatura e testemunhas', color: 'text-orange-400', bg: 'bg-orange-500/10' },
                    { step: '3ª Ocorrência', action: 'Suspensão (1 a 30 dias)', desc: 'Afastamento sem remuneração + perda da cesta', color: 'text-red-400', bg: 'bg-red-500/10' },
                    { step: 'Reincidência / Falta Grave', action: 'Justa Causa (Art. 482)', desc: 'Rescisão do contrato sem verbas rescisórias', color: 'text-rose-400', bg: 'bg-rose-500/10' },
                  ].map((item, i) => (
                    <div key={i} className={cn('flex items-center gap-3 p-2.5 rounded-lg', item.bg)}>
                      <div className="w-6 h-6 rounded-full bg-background/50 flex items-center justify-center shrink-0">
                        <span className="text-[10px] font-bold">{i + 1}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={cn('text-xs font-bold', item.color)}>{item.action}</p>
                        <p className="text-[10px] text-muted-foreground">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Legal disclaimer */}
              <div className="bg-muted/10 rounded-xl p-3">
                <p className="text-[10px] text-muted-foreground leading-relaxed">
                  <strong>Base Legal:</strong> Este manual fundamenta-se nos artigos 2º, 474 e 482 da CLT,
                  na NR-6 (Equipamentos de Proteção Individual), na RDC 216/2004 da ANVISA (Boas Práticas
                  para Serviços de Alimentação) e no Acordo Coletivo de Trabalho vigente. O funcionário declara
                  ter lido e compreendido todas as regras aqui dispostas ao assinar este documento.
                </p>
              </div>
            </div>
          </ScrollArea>

          {/* Sign button (sticky bottom) */}
          {myEmployee && !myAcknowledged && (
            <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-background via-background to-transparent pt-8">
              <Button
                onClick={handleSign}
                disabled={signing}
                className="w-full gap-2"
                size="lg"
              >
                <AppIcon name="draw" size={18} />
                {signing ? 'Assinando...' : 'Li e concordo — Assinar Manual'}
              </Button>
            </div>
          )}

          {myEmployee && myAcknowledged && (
            <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-background via-background to-transparent pt-8">
              <div className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                <AppIcon name="check_circle" size={18} className="text-emerald-400" />
                <span className="text-sm text-emerald-400 font-semibold">Manual assinado</span>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Signatures Sheet (admin) */}
      <Sheet open={signaturesOpen} onOpenChange={setSignaturesOpen}>
        <SheetContent side="bottom" className="h-[80vh] overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Assinaturas do Manual</SheetTitle>
          </SheetHeader>
          <div className="space-y-3 mt-4 pb-8">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Badge variant="secondary">{totalSigned}/{totalEmployees}</Badge>
              <span>funcionários assinaram a versão {currentVersion}</span>
            </div>

            {/* Signed */}
            {acknowledgments.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">✅ Assinaram</p>
                {acknowledgments.map((a: any) => (
                  <div key={a.id} className="flex items-center gap-3 p-2.5 rounded-xl bg-emerald-500/5 border border-emerald-500/15">
                    <AppIcon name="check_circle" size={16} className="text-emerald-400 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{a.employee?.full_name || 'Funcionário'}</p>
                      <p className="text-[10px] text-muted-foreground">
                        {format(new Date(a.acknowledged_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Pending */}
            {(() => {
              const signedIds = new Set(acknowledgments.map((a: any) => a.employee_id));
              const pending = employees.filter(e => e.is_active && !signedIds.has(e.id));
              if (pending.length === 0) return null;
              return (
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-amber-400 uppercase tracking-wider">⏳ Pendentes</p>
                  {pending.map(e => (
                    <div key={e.id} className="flex items-center gap-3 p-2.5 rounded-xl bg-amber-500/5 border border-amber-500/15">
                      <AppIcon name="pending" size={16} className="text-amber-400 shrink-0" />
                      <p className="text-sm font-medium truncate">{e.full_name}</p>
                    </div>
                  ))}
                </div>
              );
            })()}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
