import axios from 'axios';
import * as cheerio from 'cheerio';

async function testSoriana() {
  try {
    const res = await axios.get('https://www.soriana.com/buscar?q=sprite%20600ml', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });
    
    const $ = cheerio.load(res.data);
    // Intentamos encontrar el precio en las clases comunes de Soriana
    const prices: string[] = [];
    $('.price').each((i, el) => {
      prices.push($(el).text().trim());
    });
    
    console.log('Precios encontrados:', prices);
  } catch (err: any) {
    console.log('Error:', err.message);
  }
}

testSoriana();
