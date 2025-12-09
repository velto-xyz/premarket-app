import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.86.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface Position {
  id: string;
  user_id: string;
  startup_id: string;
  position_type: 'long' | 'short';
  entry_price: number;
  quantity: number;
  leverage: number;
  liquidation_price: number;
  status: string;
  created_at: string;
}

interface Startup {
  id: string;
  current_price: number;
  name: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🔍 Liquidation engine started...');

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch all open positions
    const { data: positions, error: positionsError } = await supabase
      .from('user_positions')
      .select('*')
      .eq('status', 'open');

    if (positionsError) {
      console.error('❌ Error fetching positions:', positionsError);
      throw positionsError;
    }

    if (!positions || positions.length === 0) {
      console.log('✅ No open positions to check');
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'No open positions',
          liquidated: 0 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`📊 Checking ${positions.length} open positions...`);

    // Get unique startup IDs
    const startupIds = [...new Set(positions.map(p => p.startup_id))];

    // Fetch current prices for all startups
    const { data: startups, error: startupsError } = await supabase
      .from('startups')
      .select('id, current_price, name')
      .in('id', startupIds);

    if (startupsError) {
      console.error('❌ Error fetching startups:', startupsError);
      throw startupsError;
    }

    // Create a map of startup prices
    const priceMap = new Map<string, { price: number; name: string }>();
    startups?.forEach(s => priceMap.set(s.id, { price: s.current_price, name: s.name }));

    // Check each position for liquidation
    const liquidations: string[] = [];
    const warnings: Array<{ userId: string; startupName: string; distance: number }> = [];

    for (const position of positions as Position[]) {
      const startupData = priceMap.get(position.startup_id);
      if (!startupData) {
        console.warn(`⚠️ Startup not found for position ${position.id}`);
        continue;
      }

      const currentPrice = startupData.price;
      const isLong = position.position_type === 'long';

      // Check if position should be liquidated
      let shouldLiquidate = false;
      if (isLong) {
        // Long position liquidates when price drops below liquidation price
        shouldLiquidate = currentPrice <= position.liquidation_price;
      } else {
        // Short position liquidates when price rises above liquidation price
        shouldLiquidate = currentPrice >= position.liquidation_price;
      }

      if (shouldLiquidate) {
        console.log(`💥 LIQUIDATING position ${position.id} for user ${position.user_id}`);
        console.log(`   ${startupData.name} - ${isLong ? 'LONG' : 'SHORT'} ${position.leverage}x`);
        console.log(`   Current: $${currentPrice} | Liquidation: $${position.liquidation_price}`);

        // Liquidate the position
        const { error: updateError } = await supabase
          .from('user_positions')
          .update({ status: 'liquidated' })
          .eq('id', position.id);

        if (updateError) {
          console.error(`❌ Error liquidating position ${position.id}:`, updateError);
        } else {
          liquidations.push(position.id);
        }
      } else {
        // Calculate distance to liquidation
        const distancePercent = isLong
          ? ((currentPrice - position.liquidation_price) / position.liquidation_price) * 100
          : ((position.liquidation_price - currentPrice) / currentPrice) * 100;

        // Warn if within 10% of liquidation
        if (distancePercent < 10) {
          console.log(`⚠️ WARNING: Position ${position.id} is ${distancePercent.toFixed(2)}% from liquidation`);
          warnings.push({
            userId: position.user_id,
            startupName: startupData.name,
            distance: distancePercent,
          });
        }
      }
    }

    const result = {
      success: true,
      timestamp: new Date().toISOString(),
      positionsChecked: positions.length,
      liquidated: liquidations.length,
      warnings: warnings.length,
      liquidatedPositions: liquidations,
    };

    console.log(`✅ Liquidation check complete:`);
    console.log(`   Positions checked: ${result.positionsChecked}`);
    console.log(`   Liquidated: ${result.liquidated}`);
    console.log(`   Warnings: ${result.warnings}`);

    return new Response(
      JSON.stringify(result),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('❌ Fatal error in liquidation engine:', error);
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
