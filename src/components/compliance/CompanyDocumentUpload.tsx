import { useRef } from 'react';
import { AppIcon } from '@/components/ui/app-icon';
import { Button } from '@/components/ui/button';
import type { CompanyDocument } from '@/hooks/useCompanyProfile';

const DOCUMENT_TEMPLATES = [
  'Contrato Social',
  'Cartão CNPJ',
  'Foto da Fachada',
  'Comprovante de Endereço',
  'RG/CPF do Sócio',
  'Alvará de Funcionamento',
];

interface Props {
  documents: CompanyDocument[];
  onUpload: (file: File, name: string) => void;
  onDelete: (doc: CompanyDocument) => void;
  isUploading: boolean;
}

export function CompanyDocumentUpload({ documents, onUpload, onDelete, isUploading }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const pendingName = useRef('');

  function handleTemplateClick(name: string) {
    pendingName.current = name;
    fileRef.current?.click();
  }

  function handleCustomUpload() {
    const name = prompt('Nome do documento:');
    if (!name?.trim()) return;
    pendingName.current = name.trim();
    fileRef.current?.click();
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file && pendingName.current) {
      onUpload(file, pendingName.current);
    }
    e.target.value = '';
  }

  const uploadedNames = new Set(documents.map(d => d.name));

  return (
    <div className="space-y-3">
      <input ref={fileRef} type="file" accept="image/*,.pdf,.doc,.docx" className="hidden" onChange={handleFileChange} />

      {/* Templates */}
      <div className="space-y-2">
        {DOCUMENT_TEMPLATES.map(name => {
          const doc = documents.find(d => d.name === name);
          return (
            <div key={name} className="flex items-center gap-3 p-3 bg-secondary/30 rounded-xl">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${doc ? 'bg-emerald-500/20' : 'bg-muted'}`}>
                <AppIcon name={doc ? 'CheckCircle2' : 'FileText'} size={16} className={doc ? 'text-emerald-500' : 'text-muted-foreground'} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{name}</p>
                {doc && (
                  <a href={doc.file_url} target="_blank" rel="noopener" className="text-xs text-primary truncate block">
                    Ver arquivo
                  </a>
                )}
              </div>
              {doc ? (
                <button onClick={() => onDelete(doc)} className="p-1.5 rounded-lg hover:bg-destructive/10">
                  <AppIcon name="Trash2" size={14} className="text-destructive" />
                </button>
              ) : (
                <button
                  onClick={() => handleTemplateClick(name)}
                  disabled={isUploading}
                  className="px-3 py-1.5 text-xs font-medium bg-primary/10 text-primary rounded-lg hover:bg-primary/20"
                >
                  Enviar
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Custom documents already uploaded */}
      {documents.filter(d => !DOCUMENT_TEMPLATES.includes(d.name)).map(doc => (
        <div key={doc.id} className="flex items-center gap-3 p-3 bg-secondary/30 rounded-xl">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-emerald-500/20">
            <AppIcon name="CheckCircle2" size={16} className="text-emerald-500" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground truncate">{doc.name}</p>
            <a href={doc.file_url} target="_blank" rel="noopener" className="text-xs text-primary truncate block">
              Ver arquivo
            </a>
          </div>
          <button onClick={() => onDelete(doc)} className="p-1.5 rounded-lg hover:bg-destructive/10">
            <AppIcon name="Trash2" size={14} className="text-destructive" />
          </button>
        </div>
      ))}

      {/* Add custom */}
      <Button variant="outline" size="sm" className="w-full" onClick={handleCustomUpload} disabled={isUploading}>
        <AppIcon name="Plus" size={14} />
        Adicionar outro documento
      </Button>
    </div>
  );
}
