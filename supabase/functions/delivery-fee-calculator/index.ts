import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { unit_id, customer_address } = await req.json();
    if (!unit_id || !customer_address) {
      return new Response(JSON.stringify({ error: 'unit_id and customer_address are required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const GOOGLE_MAPS_API_KEY = Deno.env.get('GOOGLE_MAPS_API_KEY');
    if (!GOOGLE_MAPS_API_KEY) {
      return new Response(JSON.stringify({ error: 'Google Maps API key not configured' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get unit store_info for origin address
    const { data: unit, error: unitError } = await supabase
      .from('units')
      .select('store_info')
      .eq('id', unit_id)
      .single();

    if (unitError || !unit) {
      return new Response(JSON.stringify({ error: 'Unit not found' }), {
        status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const storeInfo = unit.store_info as any;
    const originAddress = storeInfo?.address;
    if (!originAddress) {
      return new Response(JSON.stringify({ error: 'Store address not configured', code: 'NO_STORE_ADDRESS' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Call Google Maps Distance Matrix API
    const origin = encodeURIComponent(originAddress);
    const destination = encodeURIComponent(customer_address);
    const dmUrl = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${origin}&destinations=${destination}&key=${GOOGLE_MAPS_API_KEY}&language=pt-BR`;

    const dmRes = await fetch(dmUrl);
    const dmData = await dmRes.json();

    if (dmData.status !== 'OK') {
      return new Response(JSON.stringify({ error: 'Google Maps API error', details: dmData.status }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const element = dmData.rows?.[0]?.elements?.[0];
    if (!element || element.status !== 'OK') {
      return new Response(JSON.stringify({ 
        error: 'Endereço não encontrado ou fora de área',
        code: 'ADDRESS_NOT_FOUND',
      }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const distanceMeters = element.distance.value;
    const distanceKm = distanceMeters / 1000;
    const durationText = element.duration.text;
    const destinationFormatted = dmData.destination_addresses?.[0] || customer_address;

    // Get delivery zones for this unit
    const { data: zones, error: zonesError } = await supabase
      .from('delivery_zones')
      .select('*')
      .eq('unit_id', unit_id)
      .eq('is_active', true)
      .order('min_distance_km', { ascending: true });

    if (zonesError) {
      return new Response(JSON.stringify({ error: 'Error fetching zones' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Find matching zone
    let fee: number | null = null;
    let zoneName: string | null = null;
    let outOfRange = false;
    let deliveryTimeMinutes: number | null = null;

    if (zones && zones.length > 0) {
      const matchedZone = zones.find(z => distanceKm >= z.min_distance_km && distanceKm <= z.max_distance_km);
      if (matchedZone) {
        fee = matchedZone.fee;
        zoneName = matchedZone.name;
        deliveryTimeMinutes = matchedZone.delivery_time_minutes;
      } else {
        const maxZone = zones.reduce((max, z) => z.max_distance_km > max.max_distance_km ? z : max, zones[0]);
        if (distanceKm > maxZone.max_distance_km) {
          outOfRange = true;
        }
      }
    }

    return new Response(JSON.stringify({
      success: true,
      distance_km: Math.round(distanceKm * 10) / 10,
      duration: durationText,
      fee,
      zone_name: zoneName,
      delivery_time_minutes: deliveryTimeMinutes,
      out_of_range: outOfRange,
      formatted_address: destinationFormatted,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('delivery-fee-calculator error:', err);
    return new Response(JSON.stringify({ error: err.message || 'Internal error' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
