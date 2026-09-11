import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import axios from 'axios';
import * as cheerio from 'cheerio';

const prisma = new PrismaClient();

const getSorianaPrice = async (p: { sku: string, descripcion: string }): Promise<number | null> => {
  try {
    // 1. Intentar búsqueda por SKU (Código de Barras) - Es lo más exacto
    console.log(`Buscando por SKU: ${p.sku}...`);
    let searchUrl = `https://www.soriana.com/buscar?q=${p.sku}`;
    let res = await axios.get(searchUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0' },
      timeout: 8000
    });

    let $ = cheerio.load(res.data);
    let price: number | null = null;

    // Si hay resultados por SKU, tomamos el primero (debería ser único)
    $('.price').each((i, el) => {
      const val = parseFloat($(el).text().replace(/[^0-9.]/g, ''));
      if (val > 0 && !price) price = val;
    });

    // 2. Si no hubo resultados por SKU, intentamos por descripción pero con validación ESTRICTA
    if (!price) {
      console.log(`SKU no encontrado, intentando por descripción: ${p.descripcion}...`);
      searchUrl = `https://www.soriana.com/buscar?q=${encodeURIComponent(p.descripcion)}`;
      res = await axios.get(searchUrl, {
        headers: { 'User-Agent': 'Mozilla/5.0' },
        timeout: 8000
      });
      $ = cheerio.load(res.data);

      $('.product-tile, .pdp-link').each((i, el) => {
        if (price) return;

        const title = $(el).find('.pdp-link a, .product-name').text().toLowerCase();
        const priceText = $(el).find('.price').text().replace(/[^0-9.]/g, '');
        const val = parseFloat(priceText);

        // --- VALIDACIÓN ULTRA ESTRICTA ---
        // El título DEBE contener el mismo volumen (ej: 600ml) que la descripción original
        const volumeMatch = p.descripcion.match(/(\d+ml|\d+l)/i);
        const volume = volumeMatch ? volumeMatch[0].toLowerCase() : null;
        
        const matchesVolume = volume ? title.includes(volume) : true;
        const isPack = title.includes('pack') || title.includes('caja') || title.includes('piezas') || title.includes(' x ');

        if (val > 0 && matchesVolume && !isPack) {
          price = val;
        }
      });
    }

    return price;
  } catch (err) {
    return null;
  }
};

export const runScraper = async (req: Request, res: Response) => {
  try {
    const productos = await prisma.producto.findMany({ take: 10 });
    const suggestionsCreated = [];

    for (const p of productos) {
      const realPrice = await getSorianaPrice(p);
      
      if (realPrice && realPrice !== p.precio_venta) {
        await prisma.sugerenciaPrecio.deleteMany({
          where: { id_producto: p.id, estado: 'PENDIENTE' }
        });

        const suggestion = await prisma.sugerenciaPrecio.create({
          data: {
            id_producto: p.id,
            precio_actual: p.precio_venta,
            precio_sugerido: realPrice,
            competencia_referencia: 'Soriana',
            url_referencia: `https://www.soriana.com/buscar?q=${p.sku || encodeURIComponent(p.descripcion)}`,
            estado: 'PENDIENTE'
          }
        });
        suggestionsCreated.push(suggestion);
      }
    }

    res.json({ 
      status: 'success',
      data: {
        message: 'Escaneo por SKU y Volumen completado', 
        found: suggestionsCreated.length 
      }
    });
  } catch (err) {
    const errorId = `ERR-SCRAPER-${Date.now()}`;
    res.status(500).json({ status: 'error', message: 'Internal server error', errorId });
  }
};
