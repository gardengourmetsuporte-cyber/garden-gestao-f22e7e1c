import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { AppIcon } from '@/components/ui/app-icon';
import ReactMarkdown from 'react-markdown';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';

interface PostData {
  title: string;
  caption: string;
  tags: string[];
  image_prompt: string;
  best_time?: string;
  media_urls?: string[];
}

type MessageContent = string | Array<{ type: 'text'; text: string } | { type: 'image_url'; image_url: { url: string } }>;

interface ChatMessage {
  role: 'user' | 'assistant';
  content: MessageContent;
  imagePreviews?: string[];
  postData?: PostData;
}

interface PostAIChatProps {
  unitId: string;
  onApplyPost: (data: PostData) => void;
}

type FlowType = 'lancamento' | 'promocao' | 'post-dia' | 'chat';
type Step = 'select' | 'details' | 'generating' | 'preview' | 'chat';

const FLOWS = [
  { id: 'lancamento' as FlowType, icon: 'Rocket', label: 'Lançamento', desc: 'Novo produto no cardápio', gradient: 'linear-gradient(135deg, #F97316, #EF4444)', color: 'text-orange-400', bg: 'bg-orange-500/10' },
  { id: 'promocao' as FlowType, icon: 'Flame', label: 'Promoção', desc: 'Oferta ou desconto especial', gradient: 'linear-gradient(135deg, #EAB308, #F59E0B)', color: 'text-amber-400', bg: 'bg-amber-500/10' },
  { id: 'post-dia' as FlowType, icon: 'Calendar', label: 'Post do Dia', desc: 'Conteúdo automático', gradient: 'linear-gradient(135deg, #8B5CF6, #EC4899)', color: 'text-violet-400', bg: 'bg-violet-500/10' },
  { id: 'chat' as FlowType, icon: 'Sparkles', label: 'Chat Livre', desc: 'Peça qualquer coisa', gradient: 'linear-gradient(135deg, hsl(142, 71%, 45%), #06B6D4)', color: 'text-primary', bg: 'bg-primary/10' },
];

function getTextContent(content: MessageContent): string {
  if (typeof content === 'string') return content;
  const textPart = content.find(p => p.type === 'text');
  return textPart && 'text' in textPart ? textPart.text : '';
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function PostAIChat({ unitId, onApplyPost }: PostAIChatProps) {
  // Wizard state
  const [step, setStep] = useState<Step>('select');
  const [flowType, setFlowType] = useState<FlowType | null>(null);
  const [productPhoto, setProductPhoto] = useState<string>('');
  const [productName, setProductName] = useState('');
  const [productDescription, setProductDescription] = useState('');
  const [generatedImage, setGeneratedImage] = useState<string>('');
  const [generatedPost, setGeneratedPost] = useState<PostData | null>(null);
  const [generatingStatus, setGeneratingStatus] = useState('');

  // Chat state
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [pendingImages, setPendingImages] = useState<string[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const wizardImageRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // --- Wizard Flow ---
  const handleSelectFlow = (flow: FlowType) => {
    setFlowType(flow);
    if (flow === 'chat') {
      setStep('chat');
    } else if (flow === 'post-dia') {
      // Auto-generate post of the day
      setStep('generating');
      generateArt('post-dia', '', '', '');
    } else {
      setStep('details');
    }
  };

  const handleWizardPhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { toast.error('Selecione uma imagem'); return; }
    if (file.size > 10 * 1024 * 1024) { toast.error('Imagem muito grande (máx 10MB)'); return; }
    const base64 = await fileToBase64(file);
    setProductPhoto(base64);
    if (wizardImageRef.current) wizardImageRef.current.value = '';
  };

  const generateArt = async (flow: FlowType, photo: string, name: string, description: string) => {
    setStep('generating');
    setGeneratingStatus('Analisando sua marca...');

    try {
      setTimeout(() => setGeneratingStatus('Criando a legenda...'), 1500);
      setTimeout(() => setGeneratingStatus('Gerando a arte...'), 4000);
      setTimeout(() => setGeneratingStatus('Aplicando identidade visual...'), 7000);

      const { data, error } = await supabase.functions.invoke('marketing-post-chat', {
        body: {
          mode: 'generate-art',
          unit_id: unitId,
          flow_type: flow,
          product_photo: photo || undefined,
          product_name: name || undefined,
          product_description: description || undefined,
        },
      });

      if (error) throw new Error(error.message);

      const postData = data?.postData;
      const imageUrl = data?.generatedImageUrl;

      if (postData) {
        if (imageUrl) {
          postData.media_urls = [imageUrl];
        }
        setGeneratedPost(postData);
        setGeneratedImage(imageUrl || '');
        setStep('preview');
      } else {
        toast.error('Não foi possível gerar o post. Tente novamente.');
        setStep('details');
      }
    } catch (e: any) {
      console.error('Generate art error:', e);
      toast.error(e.message || 'Erro ao gerar arte');
      setStep(flow === 'post-dia' ? 'select' : 'details');
    }
  };

  const handleGenerateClick = () => {
    if (!flowType) return;
    generateArt(flowType, productPhoto, productName, productDescription);
  };

  const handleApplyGenerated = () => {
    if (generatedPost) {
      onApplyPost(generatedPost);
    }
  };

  const handleRegenerate = () => {
    if (!flowType) return;
    generateArt(flowType, productPhoto, productName, productDescription);
  };

  const resetWizard = () => {
    setStep('select');
    setFlowType(null);
    setProductPhoto('');
    setProductName('');
    setProductDescription('');
    setGeneratedImage('');
    setGeneratedPost(null);
    setGeneratingStatus('');
  };

  // --- Chat Flow (existing) ---
  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const newImages: string[] = [];
    for (const file of Array.from(files)) {
      if (!file.type.startsWith('image/')) { toast.error('Selecione apenas imagens'); continue; }
      if (file.size > 10 * 1024 * 1024) { toast.error(`${file.name} muito grande (máx 10MB)`); continue; }
      const base64 = await fileToBase64(file);
      newImages.push(base64);
    }
    setPendingImages(prev => [...prev, ...newImages]);
    inputRef.current?.focus();
    if (imageInputRef.current) imageInputRef.current.value = '';
  };

  const removePendingImage = (index: number) => {
    setPendingImages(prev => prev.filter((_, i) => i !== index));
  };

  const sendMessage = async (text: string) => {
    if ((!text.trim() && pendingImages.length === 0) || isLoading) return;

    const hasImages = pendingImages.length > 0;
    const messageText = text.trim() || (hasImages ? 'Analise este(s) criativo(s) e reproduza um post similar usando os dados da minha marca.' : '');

    let content: MessageContent;
    if (hasImages) {
      content = [
        { type: 'text', text: messageText },
        ...pendingImages.map(img => ({ type: 'image_url' as const, image_url: { url: img } })),
      ];
    } else {
      content = messageText;
    }

    const userMsg: ChatMessage = { role: 'user', content, imagePreviews: hasImages ? [...pendingImages] : undefined };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput('');
    setPendingImages([]);
    setIsLoading(true);

    try {
      const apiMessages = newMessages.map(m => ({ role: m.role, content: m.content }));
      const { data, error: fnError } = await supabase.functions.invoke('marketing-post-chat', {
        body: { messages: apiMessages, unit_id: unitId },
      });
      if (fnError) throw new Error(fnError.message || 'Erro ao chamar IA');
      const responseText = data?.text || 'Desculpe, não consegui gerar uma resposta.';
      const postData = data?.postData || undefined;
      setMessages(prev => [...prev, { role: 'assistant', content: responseText, postData }]);
    } catch (e: any) {
      console.error('Chat error:', e);
      toast.error(e.message || 'Erro ao conversar com a IA');
      setMessages(prev => prev.filter(m => m !== userMsg));
    } finally {
      setIsLoading(false);
    }
  };

  // --- Render ---

  // Step: Select Flow
  if (step === 'select') {
    return (
      <div className="flex flex-col flex-1 min-h-0 items-center justify-center px-2 gap-6">
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-3 shadow-lg" style={{ background: 'linear-gradient(135deg, #8B5CF6, #EC4899)' }}>
            <AppIcon name="Sparkles" size={28} className="text-white" />
          </div>
          <h3 className="text-base font-semibold">O que vamos criar?</h3>
          <p className="text-sm text-muted-foreground max-w-[280px]">
            Escolha o tipo de post e a IA guia o processo
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 w-full max-w-sm">
          {FLOWS.map((flow) => (
            <button
              key={flow.id}
              onClick={() => handleSelectFlow(flow.id)}
              className="flex flex-col items-center gap-2.5 p-4 rounded-2xl border border-border/40 bg-card hover:bg-secondary/60 transition-all text-center active:scale-[0.97]"
            >
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-lg" style={{ background: flow.gradient }}>
                <AppIcon name={flow.icon} size={22} className="text-white" />
              </div>
              <div>
                <p className="text-sm font-semibold">{flow.label}</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">{flow.desc}</p>
              </div>
            </button>
          ))}
        </div>
      </div>
    );
  }

  // Step: Details (Lançamento / Promoção)
  if (step === 'details') {
    return (
      <div className="flex flex-col flex-1 min-h-0">
        <div className="flex-1 overflow-y-auto space-y-4 pb-4">
          {/* Back button */}
          <button onClick={resetWizard} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <AppIcon name="ArrowLeft" size={16} />
            Voltar
          </button>

          <div className="text-center space-y-1">
            <h3 className="text-base font-semibold">
              {flowType === 'lancamento' ? '🚀 Lançamento de Produto' : '🔥 Promoção Especial'}
            </h3>
            <p className="text-xs text-muted-foreground">
              {flowType === 'lancamento' ? 'Envie a foto e os detalhes do produto' : 'Detalhes da promoção'}
            </p>
          </div>

          {/* Photo upload */}
          <div>
            <Label className="text-xs text-muted-foreground mb-1.5 block">Foto do Produto</Label>
            <input
              ref={wizardImageRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleWizardPhoto}
            />
            {productPhoto ? (
              <div className="relative">
                <img
                  src={productPhoto}
                  alt="Produto"
                  className="w-full aspect-square object-cover rounded-2xl border border-border/40"
                />
                <button
                  onClick={() => setProductPhoto('')}
                  className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/60 flex items-center justify-center"
                >
                  <AppIcon name="X" size={14} style={{ color: 'white' }} />
                </button>
                <button
                  onClick={() => wizardImageRef.current?.click()}
                  className="absolute bottom-2 right-2 px-3 py-1.5 rounded-full bg-black/60 text-white text-xs flex items-center gap-1.5"
                >
                  <AppIcon name="Camera" size={12} /> Trocar
                </button>
              </div>
            ) : (
              <button
                onClick={() => wizardImageRef.current?.click()}
                className="w-full aspect-[4/3] rounded-2xl border-2 border-dashed border-border/50 flex flex-col items-center justify-center gap-3 hover:bg-secondary/40 transition-colors active:scale-[0.98]"
              >
                <div className="w-14 h-14 rounded-full bg-secondary/60 flex items-center justify-center">
                  <AppIcon name="Camera" size={24} className="text-muted-foreground" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium text-muted-foreground">Toque para enviar foto</p>
                  <p className="text-[11px] text-muted-foreground/60">A IA vai melhorar e criar a arte</p>
                </div>
              </button>
            )}
          </div>

          {/* Product name */}
          <div>
            <Label className="text-xs text-muted-foreground">Nome do Produto</Label>
            <Input
              value={productName}
              onChange={e => setProductName(e.target.value)}
              placeholder={flowType === 'lancamento' ? 'Ex: Smash Burger Especial' : 'Ex: Combo Família'}
              className="h-11 rounded-xl mt-1.5"
            />
          </div>

          {/* Description */}
          <div>
            <Label className="text-xs text-muted-foreground">
              {flowType === 'lancamento' ? 'Ingredientes / Descrição' : 'Detalhes da Promoção'}
            </Label>
            <Textarea
              value={productDescription}
              onChange={e => setProductDescription(e.target.value)}
              placeholder={flowType === 'lancamento' ? 'Ex: Pão brioche, blend 180g, cheddar, bacon crocante...' : 'Ex: 2 lanches + batata + refrigerante por R$49,90'}
              rows={3}
              className="rounded-xl mt-1.5"
            />
          </div>
        </div>

        {/* Generate button */}
        <div className="pt-3 mt-auto">
          <Button
            onClick={handleGenerateClick}
            disabled={!productName.trim()}
            className="w-full h-12 rounded-2xl gap-2 text-base font-semibold"
          >
            <AppIcon name="Sparkles" size={18} />
            Gerar Arte + Legenda
          </Button>
        </div>
      </div>
    );
  }

  // Step: Generating
  if (step === 'generating') {
    return (
      <div className="flex flex-col flex-1 min-h-0 items-center justify-center gap-6">
        <div className="relative">
          <div className="w-20 h-20 rounded-full flex items-center justify-center shadow-xl animate-pulse" style={{ background: 'linear-gradient(135deg, #8B5CF6, #EC4899)' }}>
            <AppIcon name="Sparkles" size={36} className="text-white" />
          </div>
          <div className="absolute inset-0 rounded-full animate-ping opacity-20" style={{ background: 'linear-gradient(135deg, #8B5CF6, #EC4899)' }} />
        </div>
        <div className="text-center space-y-2">
          <p className="text-sm font-semibold animate-pulse">{generatingStatus || 'Preparando...'}</p>
          <p className="text-xs text-muted-foreground">Isso pode levar alguns segundos</p>
        </div>
      </div>
    );
  }

  // Step: Preview
  if (step === 'preview' && generatedPost) {
    return (
      <div className="flex flex-col flex-1 min-h-0">
        <div className="flex-1 overflow-y-auto space-y-4 pb-4">
          {/* Back button */}
          <button onClick={() => setStep(flowType === 'post-dia' ? 'select' : 'details')} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <AppIcon name="ArrowLeft" size={16} />
            Voltar
          </button>

          <div className="text-center space-y-1">
            <h3 className="text-base font-semibold">✨ Sua arte ficou pronta!</h3>
            <p className="text-xs text-muted-foreground">Confira o preview e aplique ao post</p>
          </div>

          {/* Preview Card - Phone-like */}
          <div className="rounded-2xl border border-border/40 bg-card overflow-hidden shadow-lg">
            {/* Generated Image */}
            {generatedImage && (
              <div className="aspect-square overflow-hidden">
                <img
                  src={generatedImage}
                  alt="Arte gerada"
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            {/* Post info */}
            <div className="p-4 space-y-3">
              <p className="font-semibold text-sm">{generatedPost.title}</p>
              <p className="text-xs text-muted-foreground whitespace-pre-wrap leading-relaxed">
                {generatedPost.caption}
              </p>
              {generatedPost.tags && generatedPost.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {generatedPost.tags.map((tag, i) => (
                    <span key={i} className="px-2 py-0.5 text-[10px] rounded-full bg-primary/10 text-primary font-medium">
                      #{tag}
                    </span>
                  ))}
                </div>
              )}
              {generatedPost.best_time && (
                <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                  <AppIcon name="Clock" size={12} />
                  Melhor horário: {generatedPost.best_time}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="pt-3 mt-auto space-y-2">
          <Button
            onClick={handleApplyGenerated}
            className="w-full h-12 rounded-2xl gap-2 text-base font-semibold"
          >
            <AppIcon name="Check" size={18} />
            Usar este post
          </Button>
          <Button
            variant="outline"
            onClick={handleRegenerate}
            className="w-full h-11 rounded-2xl gap-2"
          >
            <AppIcon name="RefreshCw" size={16} />
            Refazer
          </Button>
        </div>
      </div>
    );
  }

  // Step: Chat (existing chat mode)
  return (
    <div className="flex flex-col flex-1 min-h-0">
      {/* Back to wizard */}
      <button onClick={resetWizard} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-3">
        <AppIcon name="ArrowLeft" size={16} />
        Voltar
      </button>

      {messages.length === 0 && pendingImages.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center px-4 gap-4">
          <div className="w-12 h-12 rounded-full flex items-center justify-center shadow-lg" style={{ background: 'linear-gradient(135deg, hsl(142, 71%, 45%), #06B6D4)' }}>
            <AppIcon name="Sparkles" size={24} className="text-white" />
          </div>
          <div className="text-center space-y-1">
            <h3 className="text-sm font-semibold">Chat Livre</h3>
            <p className="text-xs text-muted-foreground max-w-[250px]">
              Descreva o post, envie referências ou peça sugestões
            </p>
          </div>
        </div>
      ) : (
        <div ref={scrollRef} className="flex-1 overflow-y-auto px-1 space-y-3 pb-2 min-h-0">
          {messages.map((msg, i) => (
            <div key={i} className={cn("flex", msg.role === 'user' ? 'justify-end' : 'justify-start')}>
              <div className={cn(
                "max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm",
                msg.role === 'user'
                  ? 'bg-primary text-primary-foreground rounded-br-md'
                  : 'bg-card border border-border/40 rounded-bl-md'
              )}>
                {msg.imagePreviews && msg.imagePreviews.length > 0 && (
                  <div className={cn("mb-2 -mx-1 -mt-1 gap-1", msg.imagePreviews.length > 1 ? "grid grid-cols-2" : "")}>
                    {msg.imagePreviews.map((img, idx) => (
                      <div key={idx} className="rounded-xl overflow-hidden">
                        <img src={img} alt={`Referência ${idx + 1}`} className="w-full max-h-40 object-cover" />
                      </div>
                    ))}
                  </div>
                )}
                {msg.role === 'assistant' ? (
                  <div className="prose prose-sm dark:prose-invert max-w-none [&>p]:mb-1.5 [&>p:last-child]:mb-0">
                    <ReactMarkdown>{getTextContent(msg.content)}</ReactMarkdown>
                  </div>
                ) : (
                  <p>{getTextContent(msg.content)}</p>
                )}
                {msg.postData && (
                  <Button
                    size="sm"
                    className="mt-3 w-full gap-2 rounded-xl h-9"
                    onClick={() => onApplyPost(msg.postData!)}
                  >
                    <AppIcon name="Check" size={14} />
                    Usar este post
                  </Button>
                )}
              </div>
            </div>
          ))}
          {isLoading && messages[messages.length - 1]?.role !== 'assistant' && (
            <div className="flex justify-start">
              <div className="bg-card border border-border/40 rounded-2xl rounded-bl-md px-4 py-3">
                <div className="flex gap-1.5">
                  <span className="w-2 h-2 bg-primary/40 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-2 h-2 bg-primary/40 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-2 h-2 bg-primary/40 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Pending images preview */}
      {pendingImages.length > 0 && (
        <div className="px-1 pt-2 flex gap-2 flex-wrap">
          {pendingImages.map((img, idx) => (
            <div key={idx} className="relative inline-block">
              <img src={img} alt={`Preview ${idx + 1}`} className="h-16 rounded-xl border border-border/40 object-cover" />
              <button
                onClick={() => removePendingImage(idx)}
                className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center"
              >
                <AppIcon name="X" size={10} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Input bar */}
      <div className="flex items-center gap-2 pt-3 mt-auto">
        <input ref={imageInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleImageSelect} />
        <button
          onClick={() => imageInputRef.current?.click()}
          disabled={isLoading}
          className="w-10 h-10 rounded-xl bg-secondary/60 hover:bg-secondary flex items-center justify-center shrink-0 transition-colors active:scale-95"
        >
          <AppIcon name="Image" size={18} className="text-muted-foreground" />
        </button>
        <div className="flex-1 relative">
          <Input
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder={pendingImages.length > 0 ? "Descreva o que quer reproduzir..." : "Descreva o post que deseja..."}
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage(input)}
            disabled={isLoading}
            className="h-10 rounded-xl pr-12 bg-secondary/40 border-border/30"
          />
          <Button
            size="icon"
            onClick={() => sendMessage(input)}
            disabled={(!input.trim() && pendingImages.length === 0) || isLoading}
            className="absolute right-1 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg"
          >
            <AppIcon name="Send" size={14} />
          </Button>
        </div>
      </div>
    </div>
  );
}
