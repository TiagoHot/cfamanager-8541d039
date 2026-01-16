import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Use AwesomeAPI which includes BCB PTAX data - simpler and more reliable
    const response = await fetch(
      "https://economia.awesomeapi.com.br/json/last/USD-BRL,EUR-BRL"
    );

    if (!response.ok) {
      throw new Error(`API responded with status: ${response.status}`);
    }

    const data = await response.json();

    // Extract the bid rates (cotação de compra)
    const usdRate = parseFloat(data.USDBRL?.bid) || 0;
    const eurRate = parseFloat(data.EURBRL?.bid) || 0;

    if (usdRate === 0 || eurRate === 0) {
      throw new Error("Invalid rates received from API");
    }

    const result = {
      success: true,
      rates: {
        USD: usdRate,
        EUR: eurRate,
      },
      timestamp: new Date().toISOString(),
      source: "BCB/AwesomeAPI",
    };

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error: unknown) {
    console.error("Error fetching currency rates:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to fetch currency rates";

    return new Response(
      JSON.stringify({
        success: false,
        error: errorMessage,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
