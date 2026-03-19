import { AppIcon } from '@/components/ui/app-icon';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useRecipeCostSettings } from '@/hooks/useRecipeCostSettings';
import { PackagingTemplatesSettings } from './PackagingTemplatesSettings';
import { formatCurrency } from '@/lib/format';

export function RecipeCostSettings() {
  const {
    settings,
    isLoading,
    saveSettings,
    isSaving,
  } = useRecipeCostSettings();

  const [monthlyRevenue, setMonthlyRevenue] = useState('50000');
  const [monthlyFixedCost, setMonthlyFixedCost] = useState('0');
  const [taxPercentage, setTaxPercentage] = useState('0');
  const [cardFeePercentage, setCardFeePercentage] = useState('0');
  const [packagingCostPerUnit, setPackagingCostPerUnit] = useState('0');

  useEffect(() => {
    if (settings && 'id' in settings) {
      setMonthlyRevenue(String((settings as any).monthly_revenue || 50000));
      setMonthlyFixedCost(String((settings as any).monthly_fixed_cost_manual || 0));
      setTaxPercentage(String(settings.tax_percentage || 0));
      setCardFeePercentage(String(settings.card_fee_percentage || 0));
      setPackagingCostPerUnit(String(settings.packaging_cost_per_unit || 0));
    }
  }, [settings]);

  const handleSave = () => {
    saveSettings({
      monthly_revenue: parseFloat(monthlyRevenue) || 50000,
      monthly_fixed_cost_manual: parseFloat(monthlyFixedCost) || 0,
      tax_percentage: parseFloat(taxPercentage) || 0,
      card_fee_percentage: parseFloat(cardFeePercentage) || 0,
      packaging_cost_per_unit: parseFloat(packagingCostPerUnit) || 0,
    });
  };

  const examplePrice = 30;
  const revenue = parseFloat(monthlyRevenue) || 50000;
  const fixedCost = parseFloat(monthlyFixedCost) || 0;
  const costPerProduct = revenue > 0
    ? (examplePrice / revenue) * fixedCost
    : 0;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold">Configurações de Custos</h3>
          <p className="text-sm text-muted-foreground">
            Defina como os custos operacionais são calculados nas fichas técnicas
          </p>
        </div>

        {/* Rateio de Custos Fixos */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <AppIcon name="Calculator" className="h-4 w-4" />
              Rateio de Custos Fixos
            </CardTitle>
            <CardDescription>
              Informe seus custos fixos e faturamento. O sistema distribui proporcionalmente ao preço de venda de cada produto.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="monthly-fixed-cost" className="flex items-center gap-2">
                  Custo Fixo Mensal Total
                  <Tooltip>
                    <TooltipTrigger>
                      <AppIcon name="HelpCircle" className="h-4 w-4 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs">
                      Soma de todos os custos fixos mensais: aluguel, energia, água, salários, impostos fixos, etc.
                    </TooltipContent>
                  </Tooltip>
                </Label>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">R$</span>
                  <Input
                    id="monthly-fixed-cost"
                    type="number"
                    value={monthlyFixedCost}
                    onChange={(e) => setMonthlyFixedCost(e.target.value)}
                    min="0"
                    step="100"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="monthly-revenue" className="flex items-center gap-2">
                  Faturamento Mensal Estimado
                  <Tooltip>
                    <TooltipTrigger>
                      <AppIcon name="HelpCircle" className="h-4 w-4 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs">
                      Sua receita bruta mensal estimada. O custo fixo de cada produto será proporcional ao seu preço de venda em relação a esse faturamento.
                    </TooltipContent>
                  </Tooltip>
                </Label>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">R$</span>
                  <Input
                    id="monthly-revenue"
                    type="number"
                    value={monthlyRevenue}
                    onChange={(e) => setMonthlyRevenue(e.target.value)}
                    min="1"
                  />
                </div>
              </div>
            </div>

            {/* Preview do Rateio */}
            <div className="bg-muted/50 rounded-lg p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Custo Fixo Mensal:</span>
                <span className="font-medium">{formatCurrency(fixedCost)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Faturamento Estimado:</span>
                <span className="font-medium">{formatCurrency(revenue)}</span>
              </div>
              <div className="border-t pt-2 mt-2">
                <p className="text-xs text-muted-foreground mb-1">Exemplo de rateio proporcional:</p>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Produto de R$ {examplePrice}:</span>
                  <span className="font-bold text-primary">{formatCurrency(costPerProduct)}</span>
                </div>
              </div>
              <p className="text-xs text-muted-foreground italic">
                Fórmula: (Preço do Produto ÷ Faturamento Mensal) × Custo Fixo
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Taxas Adicionais */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Taxas Adicionais</CardTitle>
            <CardDescription>
              Percentuais e valores fixos a serem incluídos no custo do produto
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="tax" className="flex items-center gap-2">
                  Impostos sobre venda
                  <Tooltip>
                    <TooltipTrigger>
                      <AppIcon name="HelpCircle" className="h-4 w-4 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent>
                      Percentual de impostos (ex: DAS, ISS)
                    </TooltipContent>
                  </Tooltip>
                </Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="tax"
                    type="number"
                    value={taxPercentage}
                    onChange={(e) => setTaxPercentage(e.target.value)}
                    min="0"
                    max="100"
                    step="0.1"
                  />
                  <span className="text-sm text-muted-foreground">%</span>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="card-fee" className="flex items-center gap-2">
                  Taxa de maquininha
                  <Tooltip>
                    <TooltipTrigger>
                      <AppIcon name="HelpCircle" className="h-4 w-4 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent>
                      Taxa média cobrada pela máquina de cartão
                    </TooltipContent>
                  </Tooltip>
                </Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="card-fee"
                    type="number"
                    value={cardFeePercentage}
                    onChange={(e) => setCardFeePercentage(e.target.value)}
                    min="0"
                    max="100"
                    step="0.1"
                  />
                  <span className="text-sm text-muted-foreground">%</span>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="packaging" className="flex items-center gap-2">
                  Custo de embalagem padrão
                  <Tooltip>
                    <TooltipTrigger>
                      <AppIcon name="HelpCircle" className="h-4 w-4 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs">
                      Valor padrão usado para receitas sem template de embalagem vinculado.
                      Use os Templates de Embalagem abaixo para definir custos específicos por produto.
                    </TooltipContent>
                  </Tooltip>
                </Label>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">R$</span>
                  <Input
                    id="packaging"
                    type="number"
                    value={packagingCostPerUnit}
                    onChange={(e) => setPackagingCostPerUnit(e.target.value)}
                    min="0"
                    step="0.01"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Templates de Embalagem */}
        <PackagingTemplatesSettings />

        {/* Botão Salvar */}
        <Button onClick={handleSave} disabled={isSaving} className="w-full sm:w-auto">
          <AppIcon name="Save" className="h-4 w-4 mr-2" />
          {isSaving ? 'Salvando...' : 'Salvar Configurações'}
        </Button>
      </div>
    </TooltipProvider>
  );
}
