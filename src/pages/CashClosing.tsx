 import { useState } from 'react';
import { Plus, List, LayoutDashboard, Receipt } from 'lucide-react';
 import { Button } from '@/components/ui/button';
 import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
 import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
 import { AppLayout } from '@/components/layout/AppLayout';
 import { ArrowLeft } from 'lucide-react';
 import { useNavigate } from 'react-router-dom';
 import { CashClosingForm } from '@/components/cashClosing/CashClosingForm';
 import { CashClosingList } from '@/components/cashClosing/CashClosingList';
 import { useCashClosing } from '@/hooks/useCashClosing';
 import { useAuth } from '@/contexts/AuthContext';
 import { Skeleton } from '@/components/ui/skeleton';
 
 export default function CashClosing() {
   const { isAdmin } = useAuth();
   const { closings, isLoading, refetch } = useCashClosing();
   const [isFormOpen, setIsFormOpen] = useState(false);
   const [activeTab, setActiveTab] = useState<'my' | 'all'>('my');
 const navigate = useNavigate();
 
   // Filter closings based on tab
   const filteredClosings = isAdmin && activeTab === 'all' 
     ? closings 
     : closings;
 
   const pendingCount = closings.filter(c => c.status === 'pending').length;
 
   return (
     <AppLayout 
     >
      <div className="p-4 space-y-4 pb-24">
         {/* Page Header - Unified Style */}
         <div className="flex items-start justify-between">
           <div className="flex items-center gap-3">
             <Button
               variant="ghost"
               size="icon"
               onClick={() => navigate('/')}
               className="shrink-0 rounded-xl"
             >
               <ArrowLeft className="w-5 h-5" />
             </Button>
             <div className="p-2.5 rounded-xl bg-primary/10">
               <Receipt className="w-6 h-6 text-primary" />
             </div>
             <div>
               <h1 className="text-xl font-bold text-foreground">Fechamento de Caixa</h1>
               <p className="text-sm text-muted-foreground">
                 {closings.length} registro{closings.length !== 1 ? 's' : ''}
               </p>
             </div>
           </div>
        </div>

         {/* Admin Tabs */}
         {isAdmin && (
           <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'my' | 'all')}>
             <TabsList className="grid w-full grid-cols-2">
               <TabsTrigger value="my" className="flex items-center gap-2">
                 <LayoutDashboard className="w-4 h-4" />
                 Meus
               </TabsTrigger>
               <TabsTrigger value="all" className="flex items-center gap-2 relative">
                 <List className="w-4 h-4" />
                 Validar
                 {pendingCount > 0 && (
                   <span className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground text-xs w-5 h-5 rounded-full flex items-center justify-center">
                     {pendingCount}
                   </span>
                 )}
               </TabsTrigger>
             </TabsList>
           </Tabs>
         )}
 
         {/* Content */}
         {isLoading ? (
           <div className="space-y-3">
             {[1, 2, 3].map(i => (
               <Skeleton key={i} className="h-20 w-full rounded-2xl" />
             ))}
           </div>
         ) : (
           <CashClosingList 
             closings={filteredClosings} 
             isAdmin={isAdmin}
             onRefresh={refetch}
           />
         )}
 
         {/* FAB for new closing */}
         <Sheet open={isFormOpen} onOpenChange={setIsFormOpen}>
           <SheetTrigger asChild>
             <Button
                size="icon"
                className="fixed bottom-20 right-4 h-14 w-14 rounded-2xl 
                  bg-gradient-to-br from-primary to-primary/80 
                  shadow-lg shadow-primary/30 z-50
                  hover:scale-105 active:scale-95 transition-all"
             >
               <Plus className="w-6 h-6" />
             </Button>
           </SheetTrigger>
           <SheetContent side="bottom" className="h-[90vh] rounded-t-2xl">
             <SheetHeader>
               <SheetTitle>Novo Fechamento de Caixa</SheetTitle>
             </SheetHeader>
             <div className="overflow-y-auto h-[calc(90vh-80px)] pt-4">
               <CashClosingForm 
                 onSuccess={() => {
                   setIsFormOpen(false);
                   refetch();
                 }} 
               />
             </div>
           </SheetContent>
         </Sheet>
       </div>
     </AppLayout>
   );
 }