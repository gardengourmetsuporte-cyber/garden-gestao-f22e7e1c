import { useState, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { AppIcon } from '@/components/ui/app-icon';

interface CalculatorKeypadProps {
  value: string; // formatted BRL string e.g. "1.500,00"
  onChange: (value: string) => void;
  onConfirm: () => void;
  onCancel: () => void;
}

function vibrate() {
  try { navigator.vibrate?.(10); } catch {}
}

export function CalculatorKeypad({ value, onChange, onConfirm, onCancel }: CalculatorKeypadProps) {
  const [expression, setExpression] = useState('');
  const [hasOperator, setHasOperator] = useState(false);

  // Parse display value to cents integer
  const displayToCents = (v: string): number => {
    if (!v) return 0;
    const clean = v.replace(/\./g, '').replace(',', '.');
    return Math.round((parseFloat(clean) || 0) * 100);
  };

  // Format cents to BRL display
  const centsToDisplay = (cents: number): string => {
    if (cents <= 0) return '';
    const num = cents / 100;
    return num.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const currentCents = displayToCents(value);

  const handleDigit = useCallback((digit: string) => {
    vibrate();
    if (hasOperator) {
      // Building second operand in expression
      setExpression(prev => prev + digit);
      return;
    }
    // Append digit to value (max 12 digits)
    const currentDigits = value.replace(/\D/g, '');
    if (currentDigits.length >= 12) return;
    const newDigits = currentDigits + digit;
    const num = parseInt(newDigits, 10) / 100;
    onChange(num.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
  }, [value, onChange, hasOperator]);

  const handleBackspace = useCallback(() => {
    vibrate();
    if (hasOperator && expression) {
      // Remove last char from expression
      const newExpr = expression.slice(0, -1);
      if (!newExpr || /[+\-*/]$/.test(newExpr)) {
        // Back to just operator or cleared
        setExpression(newExpr);
      } else {
        setExpression(newExpr);
      }
      return;
    }
    if (hasOperator) {
      // Remove operator
      setHasOperator(false);
      setExpression('');
      return;
    }
    const currentDigits = value.replace(/\D/g, '');
    if (currentDigits.length <= 1) {
      onChange('');
      return;
    }
    const newDigits = currentDigits.slice(0, -1);
    const num = parseInt(newDigits, 10) / 100;
    onChange(num.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
  }, [value, onChange, hasOperator, expression]);

  const handleOperator = useCallback((op: string) => {
    vibrate();
    if (!value && !currentCents) return;
    
    // If there's already a pending operation, evaluate first
    if (hasOperator && expression) {
      const result = evaluateExpression(currentCents, expression);
      onChange(centsToDisplay(result));
      setExpression(op);
      setHasOperator(true);
      return;
    }
    
    setExpression(op);
    setHasOperator(true);
  }, [value, currentCents, hasOperator, expression, onChange]);

  const evaluateExpression = (baseCents: number, expr: string): number => {
    if (!expr) return baseCents;
    const op = expr[0];
    const operandStr = expr.slice(1);
    if (!operandStr) return baseCents;
    
    const operandCents = parseInt(operandStr, 10); // raw digits = cents
    const operand = operandCents / 100;
    const base = baseCents / 100;
    
    let result = base;
    switch (op) {
      case '+': result = base + operand; break;
      case '-': result = base - operand; break;
      case '*': result = base * operand; break;
      case '/': result = operand !== 0 ? base / operand : base; break;
    }
    return Math.round(Math.max(0, result) * 100);
  };

  const handleEquals = useCallback(() => {
    vibrate();
    if (!hasOperator || !expression) return;
    const result = evaluateExpression(currentCents, expression);
    onChange(centsToDisplay(result));
    setExpression('');
    setHasOperator(false);
  }, [hasOperator, expression, currentCents, onChange]);

  const handleConfirm = useCallback(() => {
    vibrate();
    // Evaluate pending expression first
    if (hasOperator && expression) {
      const result = evaluateExpression(currentCents, expression);
      onChange(centsToDisplay(result));
      setExpression('');
      setHasOperator(false);
    }
    onConfirm();
  }, [hasOperator, expression, currentCents, onChange, onConfirm]);

  const handleCancel = useCallback(() => {
    vibrate();
    onCancel();
  }, [onCancel]);

  // Build display string
  const getExpressionDisplay = (): string | null => {
    if (!hasOperator || !expression) return null;
    const op = expression[0];
    const digits = expression.slice(1);
    if (!digits) return ` ${op}`;
    const num = parseInt(digits, 10) / 100;
    return ` ${op} ${num.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const exprDisplay = getExpressionDisplay();

  const btnBase = "flex items-center justify-center rounded-xl text-lg font-semibold min-h-[52px] active:scale-95 transition-all duration-100";

  return (
    <div className="bg-background rounded-t-3xl border-t border-border/50 p-4 pb-6 space-y-3">
      {/* Display */}
      <div className="flex items-center justify-between px-2 min-h-[36px]">
        <span className="text-sm text-muted-foreground font-medium">R$</span>
        <div className="flex items-center gap-1">
          <span className="text-xl font-bold text-foreground tabular-nums">
            {value || '0'}
            {exprDisplay && <span className="text-primary">{exprDisplay}</span>}
          </span>
          <button onClick={handleBackspace} className="p-1.5 rounded-lg hover:bg-secondary active:scale-90 transition-all">
            <AppIcon name="Backspace" size={20} className="text-muted-foreground" />
          </button>
        </div>
      </div>

      {/* Keypad grid */}
      <div className="grid grid-cols-4 gap-2">
        {/* Row 1 */}
        <button onClick={() => handleDigit('7')} className={cn(btnBase, "bg-card text-foreground")} >7</button>
        <button onClick={() => handleDigit('8')} className={cn(btnBase, "bg-card text-foreground")} >8</button>
        <button onClick={() => handleDigit('9')} className={cn(btnBase, "bg-card text-foreground")} >9</button>
        <button onClick={() => handleOperator('+')} className={cn(btnBase, "bg-card text-primary font-bold text-xl")} >+</button>

        {/* Row 2 */}
        <button onClick={() => handleDigit('4')} className={cn(btnBase, "bg-card text-foreground")} >4</button>
        <button onClick={() => handleDigit('5')} className={cn(btnBase, "bg-card text-foreground")} >5</button>
        <button onClick={() => handleDigit('6')} className={cn(btnBase, "bg-card text-foreground")} >6</button>
        <button onClick={() => handleOperator('-')} className={cn(btnBase, "bg-card text-primary font-bold text-xl")} >−</button>

        {/* Row 3 */}
        <button onClick={() => handleDigit('1')} className={cn(btnBase, "bg-card text-foreground")} >1</button>
        <button onClick={() => handleDigit('2')} className={cn(btnBase, "bg-card text-foreground")} >2</button>
        <button onClick={() => handleDigit('3')} className={cn(btnBase, "bg-card text-foreground")} >3</button>
        <button onClick={() => handleOperator('*')} className={cn(btnBase, "bg-card text-primary font-bold text-xl")} >×</button>

        {/* Row 4 */}
        <button onClick={() => handleDigit('00')} className={cn(btnBase, "bg-card text-foreground text-base")} >00</button>
        <button onClick={() => handleDigit('0')} className={cn(btnBase, "bg-card text-foreground")} >0</button>
        <button onClick={handleEquals} className={cn(btnBase, "bg-card text-primary font-bold text-xl")} >=</button>
        <button onClick={() => handleOperator('/')} className={cn(btnBase, "bg-card text-primary font-bold text-xl")} >÷</button>
      </div>

      {/* Action buttons */}
      <div className="grid grid-cols-2 gap-3 pt-1">
        <button
          onClick={handleCancel}
          className="h-12 rounded-xl border border-border bg-card text-foreground font-semibold text-sm active:scale-95 transition-all"
        >
          Cancelar
        </button>
        <button
          onClick={handleConfirm}
          className="h-12 rounded-xl gradient-primary font-semibold text-sm active:scale-95 transition-all"
        >
          Pronto
        </button>
      </div>
    </div>
  );
}
