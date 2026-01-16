import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Format date as MM-DD-YYYY for BCB API
const formatDateForBCB = (date: Date): string => {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const year = date.getFullYear();
  return `${month}-${day}-${year}`;
};

// Fetch rate from BCB PTAX API
const fetchBCBRate = async (currency: string, date: Date): Promise<number | null> => {
  const formattedDate = formatDateForBCB(date);
  const url = `https://olinda.bcb.gov.br/olinda/servico/PTAX/versao/v1/odata/CotacaoMoedaDia(moeda=@moeda,dataCotacao=@dataCotacao)?@moeda='${currency}'&@dataCotacao='${formattedDate}'&$format=json`;
  
  console.log(`Fetching ${currency} rate for date ${formattedDate}`);
  
  const response = await fetch(url);
  
  if (!response.ok) {
    console.error(`BCB API error for ${currency}: ${response.status}`);
    return null;
  }
  
  const data = await response.json();
  
  if (data.value && data.value.length > 0) {
    // Get the last cotation of the day (cotacaoVenda = sell rate)
    const lastCotation = data.value[data.value.length - 1];
    return lastCotation.cotacaoVenda || lastCotation.cotacaoCompra;
  }
  
  return null;
};

// Try to get rate for today, yesterday, or up to 7 days back (weekends/holidays)
const fetchRateWithFallback = async (currency: string): Promise<number> => {
  const today = new Date();
  
  for (let i = 0; i < 7; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    
    const rate = await fetchBCBRate(currency, date);
    if (rate !== null) {
      console.log(`Got ${currency} rate: ${rate} from ${formatDateForBCB(date)}`);
      return rate;
    }
  }
  
  throw new Error(`Could not fetch ${currency} rate from BCB for the last 7 days`);
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("Fetching currency rates from BCB PTAX API...");
    
    // Fetch both rates in parallel
    const [usdRate, eurRate] = await Promise.all([
      fetchRateWithFallback('USD'),
      fetchRateWithFallback('EUR'),
    ]);

    const result = {
      success: true,
      rates: {
        USD: usdRate,
        EUR: eurRate,
      },
      timestamp: new Date().toISOString(),
      source: "Banco Central do Brasil - PTAX",
    };

    console.log("Successfully fetched rates:", result);

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
