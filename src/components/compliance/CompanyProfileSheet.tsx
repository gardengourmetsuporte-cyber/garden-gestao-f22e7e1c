import { useState, useEffect } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { AppIcon } from '@/components/ui/app-icon';
import { CompanyDocumentUpload } from './CompanyDocumentUpload';
import { useCompanyProfile, type CompanyProfileData } from '@/hooks/useCompanyProfile';
import { toast } from 'sonner';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const FIELDS: { key: keyof CompanyProfileData; label: string; mask?: string; placeholder?: string }[] = [
  { key: 'razao_social', label: 'Razão Social', placeholder: 'Razão Social da empresa' },
  { key: 'nome_fantasia', label: 'Nome Fantasia', placeholder: 'Nome Fantasia' },
  { key: 'cnpj', label: 'CNPJ', placeholder: '00.000.000/0000-00' },
  { key: 'inscricao_estadual', label: 'Inscrição Estadual', placeholder: 'Inscrição Estadual' },
  { key: 'inscricao_municipal', label: 'Inscrição Municipal', placeholder: 'Inscrição Municipal' },
  { key: 'company_address', label: 'Endereço Completo', placeholder: 'Rua, número, bairro, cidade - UF' },
  { key: 'company_email', label: 'E-mail da Empresa', placeholder: 'empresa@email.com' },
  { key: 'company_phone', label: 'Telefone', placeholder: '(00) 00000-0000' },
  { key: 'responsavel_legal', label: 'Responsável Legal', placeholder: 'Nome completo do sócio' },
  { key: 'cpf_responsavel', label: 'CPF do Responsável', placeholder: '000.000.000-00' },
];

export function CompanyProfileSheet({ open, onOpenChange }: Props) {
  const {
    profile, profileLoading, saveProfile,
    documents, docsLoading, uploadDocument, deleteDocument,
    generateShareText,
  } = useCompanyProfile();

  const [form, setForm] = useState<CompanyProfileData>(profile);

  useEffect(() => {
    if (profile) setForm(profile);
  }, [profile]);

  function handleChange(key: keyof CompanyProfileData, value: string) {
    setForm(prev => ({ ...prev, [key]: value }));
  }

  async function handleSave() {
    await saveProfile.mutateAsync(form);
  }

  function handleCopy() {
    const text = generateShareText(form);
    navigator.clipboard.writeText(text);
    toast.success('Ficha copiada!');
  }

  function handleWhatsApp() {
    const text = generateShareText(form);
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[95vh] rounded-t-3xl overflow-y-auto pb-safe">
        <SheetHeader className="mb-4">
          <SheetTitle className="flex items-center gap-2">
            <AppIcon name="Building2" size={20} className="text-primary" />
            Ficha Cadastral
          </SheetTitle>
        </SheetHeader>

        {profileLoading ? (
          <div className="flex justify-center py-8">
            <AppIcon name="Loader2" size={24} className="animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-6 pb-8">
            {/* Data fields */}
            <div>
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Dados da Empresa</h3>
              <div className="space-y-3">
                {FIELDS.map(f => (
                  <div key={f.key}>
                    <label className="text-xs font-medium text-muted-foreground mb-1 block">{f.label}</label>
                    <Input
                      value={form[f.key]}
                      onChange={e => handleChange(f.key, e.target.value)}
                      placeholder={f.placeholder}
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Save */}
            <Button onClick={handleSave} disabled={saveProfile.isPending} className="w-full">
              {saveProfile.isPending ? <AppIcon name="Loader2" size={16} className="animate-spin" /> : <AppIcon name="Save" size={16} />}
              Salvar Dados
            </Button>

            {/* Share buttons */}
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={handleCopy}>
                <AppIcon name="Copy" size={14} />
                Copiar Ficha
              </Button>
              <Button variant="outline" className="flex-1" onClick={handleWhatsApp}>
                <AppIcon name="MessageCircle" size={14} />
                WhatsApp
              </Button>
            </div>

            {/* Documents */}
            <div>
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Documentos</h3>
              <CompanyDocumentUpload
                documents={documents}
                onUpload={(file, name) => uploadDocument.mutate({ file, name })}
                onDelete={doc => deleteDocument.mutate(doc)}
                isUploading={uploadDocument.isPending}
              />
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
