import { PrismaClient } from '@prisma/client';
import axios from 'axios';
import * as cheerio from 'cheerio'; // Make sure to npm i cheerio

const prisma = new PrismaClient();

export const runScraperJob = async (productId: number): Promise<void> => {
  try {
    const product = await prisma.producto.findUnique({ where: { id: productId } });
    
    if (!product) {
      console.log(`Product ${productId} not found for scraping.`);
      return;
    }

    // Since we don't have real scraper access to Walmart/Bodega Aurrera that bypasses Cloudflare
    // we'll simulate scraping behavior based on the user's prompt (mocking the result)
    // In a real scenario, we would use axios.get('https://www.bodegaaurrera.com.mx/...') and cheerio.
    
    // Simulating finding a price 2-8% lower or higher in the competence.
    const variation = (Math.random() * 0.1) - 0.05; // -5% to +5%
    const simulatedCompetencePrice = parseFloat((product.precio_venta * (1 + variation)).toFixed(2));
    const competence = Math.random() > 0.5 ? 'Bodega Aurrera' : 'Walmart';

    // Insert pending suggestion
    await prisma.sugerenciaPrecio.create({
      data: {
        id_producto: product.id,
        precio_actual: product.precio_venta,
        precio_sugerido: simulatedCompetencePrice,
        competencia_referencia: competence,
        estado: 'PENDIENTE'
      }
    });

    console.log(`Scraper job completed for product ${product.id}. Suggested price: ${simulatedCompetencePrice}`);
  } catch (error) {
    console.error('Error running scraper:', error);
  }
};
