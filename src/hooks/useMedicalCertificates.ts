import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useUnit } from '@/contexts/UnitContext';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { format, eachDayOfInterval, parseISO } from 'date-fns';

export interface MedicalCertificate {
  id: string;
  user_id: string;
  unit_id: string;
  date_start: string;
  date_end: string;
  days_count: number;
  document_url: string | null;
  notes: string | null;
  status: 'pending' | 'approved' | 'rejected';
  reviewed_by: string | null;
  created_at: string;
  profile?: { full_name: string; avatar_url: string | null };
}

export function useMedicalCertificates() {
  const { user, isAdmin } = useAuth();
  const { activeUnitId } = useUnit();
  const queryClient = useQueryClient();

  const queryKey = ['medical-certificates', activeUnitId];

  const { data: certificates = [], isLoading } = useQuery({
    queryKey,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('medical_certificates' as any)
        .select('*')
        .eq('unit_id', activeUnitId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      const rows = (data || []) as any[];

      // Batch profile fetch
      const userIds = new Set<string>();
      rows.forEach(r => userIds.add(r.user_id));
      const profileMap = new Map<string, { full_name: string; avatar_url: string | null }>();
      if (userIds.size > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('user_id, full_name, avatar_url')
          .in('user_id', [...userIds]);
        (profiles || []).forEach(p => profileMap.set(p.user_id, { full_name: p.full_name, avatar_url: p.avatar_url }));
      }

      return rows.map(r => ({
        ...r,
        profile: profileMap.get(r.user_id) || null,
      })) as MedicalCertificate[];
    },
    enabled: !!user && !!activeUnitId,
  });

  const invalidate = useCallback(() => {
    queryClient.invalidateQueries({ queryKey });
    queryClient.invalidateQueries({ queryKey: ['time-records', activeUnitId] });
  }, [queryClient, queryKey, activeUnitId]);

  // Upload photo and create certificate
  const submitCertificate = async (data: {
    date_start: string;
    date_end: string;
    notes?: string;
    photo?: File;
  }) => {
    if (!user || !activeUnitId) return false;

    try {
      let documentUrl: string | null = null;

      // Upload photo if provided
      if (data.photo) {
        const ext = data.photo.name.split('.').pop() || 'jpg';
        const filePath = `${user.id}/${crypto.randomUUID()}.${ext}`;
        const { error: uploadErr } = await supabase.storage
          .from('medical-certificates')
          .upload(filePath, data.photo, { contentType: data.photo.type });

        if (uploadErr) throw uploadErr;

        const { data: urlData } = supabase.storage
          .from('medical-certificates')
          .getPublicUrl(filePath);
        documentUrl = urlData.publicUrl;
      }

      // Calculate days
      const days = eachDayOfInterval({
        start: parseISO(data.date_start),
        end: parseISO(data.date_end),
      });

      // Create certificate record
      const { data: cert, error: certErr } = await supabase
        .from('medical_certificates' as any)
        .insert({
          user_id: user.id,
          unit_id: activeUnitId,
          date_start: data.date_start,
          date_end: data.date_end,
          days_count: days.length,
          document_url: documentUrl,
          notes: data.notes || null,
          status: 'pending',
        } as any)
        .select('id')
        .single();

      if (certErr) throw certErr;

      // Create day_off records in time_records for each day
      const timeRecords = days.map(day => ({
        user_id: user.id,
        unit_id: activeUnitId,
        date: format(day, 'yyyy-MM-dd'),
        expected_start: '00:00',
        expected_end: '00:00',
        status: 'day_off',
        manual_entry: true,
        notes: 'Atestado médico',
        certificate_id: (cert as any).id,
      }));

      for (const rec of timeRecords) {
        await supabase.from('time_records' as any).upsert(rec as any, { onConflict: 'user_id,date,unit_id' });
      }

      invalidate();
      toast.success(`Atestado enviado (${days.length} dia${days.length > 1 ? 's' : ''})`);
      return true;
    } catch (err: any) {
      console.error('Certificate submit error:', err);
      toast.error('Erro ao enviar atestado');
      return false;
    }
  };

  // Admin: approve/reject
  const reviewCertificate = async (certId: string, status: 'approved' | 'rejected') => {
    if (!user || !isAdmin) return false;
    try {
      const { error } = await supabase
        .from('medical_certificates' as any)
        .update({ status, reviewed_by: user.id } as any)
        .eq('id', certId);
      if (error) throw error;
      invalidate();
      toast.success(status === 'approved' ? 'Atestado aprovado' : 'Atestado rejeitado');
      return true;
    } catch {
      toast.error('Erro ao revisar atestado');
      return false;
    }
  };

  return {
    certificates,
    isLoading,
    submitCertificate,
    reviewCertificate,
    refetch: invalidate,
  };
}
