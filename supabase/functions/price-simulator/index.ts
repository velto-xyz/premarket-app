import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.86.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('📈 Price simulator started...');

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch all startups
    const { data: startups, error: fetchError } = await supabase
      .from('startups')
      .select('id, name, current_price, price_change_24h');

    if (fetchError) {
      console.error('❌ Error fetching startups:', fetchError);
      throw fetchError;
    }

    if (!startups || startups.length === 0) {
      return new Response(
        JSON.stringify({ success: true, message: 'No startups to update' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`📊 Updating prices for ${startups.length} startups...`);

    const updates: Array<{ id: string; name: string; oldPrice: number; newPrice: number; change: number }> = [];

    // Update each startup's price with realistic volatility
    for (const startup of startups) {
      const volatility = 0.02; // 2% base volatility
      const randomChange = (Math.random() - 0.5) * 2 * volatility;
      const trendFactor = (startup.price_change_24h || 0) * 0.001; // Continue trend slightly
      
      const priceChangePercent = randomChange + trendFactor;
      const newPrice = startup.current_price * (1 + priceChangePercent);
      const new24hChange = priceChangePercent * 100;

      // Update the startup price
      const { error: updateError } = await supabase
        .from('startups')
        .update({
          current_price: parseFloat(newPrice.toFixed(2)),
          price_change_24h: parseFloat(new24hChange.toFixed(4)),
          updated_at: new Date().toISOString(),
        })
        .eq('id', startup.id);

      if (updateError) {
        console.error(`❌ Error updating ${startup.name}:`, updateError);
      } else {
        updates.push({
          id: startup.id,
          name: startup.name,
          oldPrice: startup.current_price,
          newPrice: parseFloat(newPrice.toFixed(2)),
          change: parseFloat((priceChangePercent * 100).toFixed(2)),
        });

        console.log(
          `✅ ${startup.name}: $${startup.current_price.toFixed(2)} → $${newPrice.toFixed(2)} (${priceChangePercent > 0 ? '+' : ''}${(priceChangePercent * 100).toFixed(2)}%)`
        );
      }
    }

    const result = {
      success: true,
      timestamp: new Date().toISOString(),
      startupsUpdated: updates.length,
      updates,
    };

    console.log(`✅ Price simulation complete. Updated ${updates.length} startups.`);

    return new Response(
      JSON.stringify(result),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('❌ Fatal error in price simulator:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: errorMessage 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});
