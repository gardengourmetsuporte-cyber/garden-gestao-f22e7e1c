import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const todayTemplates = [
  (n: number, valor: string) => `Opa! Você tem ${n} conta(s) pra pagar hoje 💰 Total: R$ ${valor}. Bora resolver?`,
  (n: number, valor: string) => `Ei, não esquece! ${n} conta(s) vencendo hoje — R$ ${valor}. Já pagou? 👀`,
  (n: number, valor: string) => `Alerta de boleto! 🚨 ${n} pendência(s) no valor de R$ ${valor}. Melhor não atrasar!`,
  (n: number, valor: string) => `Fala, chefe! Tem R$ ${valor} em ${n} conta(s) esperando pagamento hoje. Bora quitar? 💪`,
  (n: number, valor: string) => `📋 Lembrete: ${n} conta(s) vencem hoje, totalizando R$ ${valor}. Dá uma olhada!`,
  (n: number, valor: string) => `Atenção! Hoje vence${n > 1 ? 'm' : ''} ${n} conta(s) — R$ ${valor}. Não deixa acumular! 🔔`,
]

const overdueTemplates = [
  (n: number, valor: string) => `⚠️ Atenção! ${n} conta(s) vencida(s) — R$ ${valor}. Quanto antes pagar, melhor!`,
  (n: number, valor: string) => `🚨 Conta(s) atrasada(s)! ${n} pendência(s) vencida(s) no valor de R$ ${valor}. Regularize já!`,
  (n: number, valor: string) => `Eita, ${n} conta(s) vencida(s) no total de R$ ${valor}. Bora resolver isso? 😬`,
  (n: number, valor: string) => `Fala, chefe! Tem R$ ${valor} em ${n} conta(s) vencida(s). Cuidado com juros! ⏰`,
]

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

function formatBRL(value: number): string {
  return value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, serviceRoleKey)

    // Get today's date in BRT (UTC-3)
    const now = new Date()
    const brt = new Date(now.getTime() - 3 * 60 * 60 * 1000)
    const today = brt.toISOString().split('T')[0]

    // Get all admin user IDs
    const { data: adminRoles } = await supabase
      .from('user_roles')
      .select('user_id')
      .in('role', ['admin', 'super_admin'])

    if (!adminRoles || adminRoles.length === 0) {
      return new Response(JSON.stringify({ message: 'No admins found' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const adminIds = adminRoles.map((r: any) => r.user_id)
    let totalNotifications = 0

    for (const userId of adminIds) {
      // Dedup check: skip if we sent a bill reminder to this user in the last 3 hours
      const threeHoursAgo = new Date(now.getTime() - 3 * 60 * 60 * 1000).toISOString()
      const { data: recentNotifs } = await supabase
        .from('notifications')
        .select('id')
        .eq('user_id', userId)
        .eq('origin', 'financeiro')
        .like('title', '%conta%')
        .gte('created_at', threeHoursAgo)
        .limit(1)

      if (recentNotifs && recentNotifs.length > 0) {
        continue // Already notified recently
      }

      // Get user's unit IDs
      const { data: userUnits } = await supabase
        .from('user_units')
        .select('unit_id')
        .eq('user_id', userId)

      if (!userUnits || userUnits.length === 0) continue

      const unitIds = userUnits.map((u: any) => u.unit_id)

      // Get unpaid expenses due today or overdue
      const { data: pendingBills } = await supabase
        .from('finance_transactions')
        .select('id, amount, date, description')
        .eq('type', 'expense')
        .eq('is_paid', false)
        .lte('date', today)
        .in('unit_id', unitIds)

      if (!pendingBills || pendingBills.length === 0) continue

      // Split into today vs overdue
      const dueToday = pendingBills.filter((b: any) => b.date === today)
      const overdue = pendingBills.filter((b: any) => b.date < today)

      const notifications: { title: string; description: string; type: string }[] = []

      if (dueToday.length > 0) {
        const total = dueToday.reduce((sum: number, b: any) => sum + (b.amount || 0), 0)
        const msg = pickRandom(todayTemplates)(dueToday.length, formatBRL(total))
        notifications.push({
          title: `💰 ${dueToday.length} conta(s) vencem hoje`,
          description: msg,
          type: 'alert',
        })
      }

      if (overdue.length > 0) {
        const total = overdue.reduce((sum: number, b: any) => sum + (b.amount || 0), 0)
        const msg = pickRandom(overdueTemplates)(overdue.length, formatBRL(total))
        notifications.push({
          title: `🚨 ${overdue.length} conta(s) vencida(s)`,
          description: msg,
          type: 'alert',
        })
      }

      // Insert notifications
      for (const notif of notifications) {
        // Get the first unit_id for the notification
        const unitId = unitIds[0]
        await supabase.from('notifications').insert({
          user_id: userId,
          type: notif.type,
          title: notif.title,
          description: notif.description,
          origin: 'financeiro',
          unit_id: unitId,
        } as any)
        totalNotifications++
      }
    }

    return new Response(
      JSON.stringify({ success: true, notifications_sent: totalNotifications }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('bill-reminders error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
