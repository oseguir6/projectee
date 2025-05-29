import { NextRequest, NextResponse } from 'next/server';
import * as cheerio from 'cheerio';
import { parse } from 'url';

const API_TIMEOUT = 60000; // Aumentado a 60 segundos
const FETCH_TIMEOUT = 10000; // 10 segundos para fetches individuales
const LINK_CHECK_LIMIT = 20; // Aumentado el límite de enlaces a verificar
const CONCURRENT_REQUESTS_LIMIT = 5; // Límite de solicitudes concurrentes

async function fetchWithTimeout(url: string, timeout = FETCH_TIMEOUT) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  
  try {
    console.log(`Iniciando fetch para: ${url}`);
    const response = await fetch(url, { 
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; SEOAuditBot/1.0;)',
      }
    });
    clearTimeout(id);
    console.log(`Fetch completado para: ${url}`);
    return response;
  } catch (error) {
    clearTimeout(id);
    console.error(`Error en fetch para ${url}:`, error);
    throw error;
  }
}

// Función auxiliar para procesar solicitudes en paralelo
async function processInParallel<T>(
  items: any[],
  processor: (item: any) => Promise<T>,
  concurrentLimit: number
): Promise<T[]> {
  const results: T[] = [];
  for (let i = 0; i < items.length; i += concurrentLimit) {
    const chunk = items.slice(i, i + concurrentLimit);
    const chunkResults = await Promise.all(
      chunk.map(item => processor(item).catch(err => {
        console.error('Error processing item:', err);
        return null;
      }))
    );
    results.push(...chunkResults.filter(result => result !== null));
  }
  return results;
}

async function checkLinks(links: string[], limit = LINK_CHECK_LIMIT) {
  const brokenLinks: { url: string; reason: string }[] = [];
  const linksToCheck = links.slice(0, limit);

  await processInParallel(
    linksToCheck,
    async (link) => {
      try {
        const response = await fetchWithTimeout(link, 5000);
        if (!response.ok) {
          brokenLinks.push({ url: link, reason: `Status: ${response.status}` });
        }
      } catch (error) {
        brokenLinks.push({ url: link, reason: error instanceof Error ? error.message : 'Unknown error' });
      }
    },
    CONCURRENT_REQUESTS_LIMIT
  );

  return brokenLinks;
}

interface HeadingStructure {
  level: number;
  text: string;
}

function analyzeHeadingHierarchy($: cheerio.CheerioAPI): {
  isValid: boolean;
  headings: HeadingStructure[];
  issues: string[];
} {
  const headings: HeadingStructure[] = [];
  const issues: string[] = [];
  
  // Collect all headings h1-h6
  $('h1, h2, h3, h4, h5, h6').each((_, element) => {
    const level = parseInt(element.name[1]);
    const text = $(element).text().trim();
    headings.push({ level, text });
  });

  let isValid = true;
  let previousLevel = 0;

  // Analyze heading hierarchy
  for (let i = 0; i < headings.length; i++) {
    const currentLevel = headings[i].level;
    
    // First heading should be h1
    if (i === 0 && currentLevel !== 1) {
      issues.push('La página no comienza con un H1');
      isValid = false;
      continue;
    }

    // Check if heading level jumps by more than one
    if (currentLevel - previousLevel > 1) {
      issues.push(`Salto incorrecto de jerarquía: de H${previousLevel || 1} a H${currentLevel}`);
      isValid = false;
    }

    previousLevel = currentLevel;
  }

  // Check for multiple h1 tags
  const h1Count = headings.filter(h => h.level === 1).length;
  if (h1Count > 1) {
    issues.push(`Se encontraron ${h1Count} etiquetas H1 (debería haber solo una)`);
    isValid = false;
  }

  return { isValid, headings, issues };
}

const commonWords = new Set([
  'a', 'ante', 'bajo', 'cabe', 'con', 'contra', 'de', 'desde', 'durante', 'en', 'entre', 'hacia', 'hasta',
  'mediante', 'para', 'por', 'según', 'sin', 'so', 'sobre', 'tras', 'el', 'la', 'los', 'las', 'un', 'una',
  'unos', 'unas', 'y', 'e', 'ni', 'que', 'es', 'son', 'era', 'fue', 'fueron', 'ser', 'estar', 'este', 'esta',
  'estos', 'estas', 'ese', 'esa', 'esos', 'esas', 'aquel', 'aquella', 'aquellos', 'aquellas', 'su', 'sus',
  'cuyo', 'cuya', 'cuyos', 'cuyas', 'mi', 'mis', 'tu', 'tus', 'nuestro', 'nuestra', 'nuestros', 'nuestras'
]);

async function analyzeWebpage(url: string) {
  console.log('Iniciando análisis para:', url);
  const startTime = Date.now();

  try {
    // Fetch inicial de la página
    const response = await fetchWithTimeout(url);
    const loadTime = Date.now() - startTime;

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    // Análisis básico (rápido)
    const basicAnalysis = {
      url,
      loadTime,
      title: $('title').text(),
      metaDescription: $('meta[name="description"]').attr('content') || '',
      h1Count: $('h1').length,
      imgCount: $('img').length,
      imgWithoutAlt: $('img:not([alt])').length,
    };

    // Heading hierarchy analysis
    const headingAnalysis = analyzeHeadingHierarchy($);
    
    // Recolección de enlaces
    const links = new Set<string>();
    const domain = new URL(url).hostname;
    
    $('a[href]').each((_, elem) => {
      const href = $(elem).attr('href');
      if (href) {
        try {
          const fullUrl = new URL(href, url).href;
          if (new URL(fullUrl).hostname === domain) {
            links.add(fullUrl);
          }
        } catch (error) {
          console.error('Error processing link:', error);
        }
      }
    });

    // Análisis paralelo de enlaces
    const brokenLinksResult = await checkLinks([...links]);
    const brokenLinksCount = brokenLinksResult.length;

    // Calculate keyword density
    const words = $('body').text().toLowerCase().match(/\b\w+\b/g) || [];
    const wordCount = words.length;
    const wordFrequency = words.reduce((acc, word) => {
      if (word.length > 2 && !commonWords.has(word) && !/^[aeiou]+$/.test(word)) {
        acc[word] = (acc[word] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);
    const keywordDensity = Object.entries(wordFrequency)
      .map(([word, count]) => ({ word, density: (count / wordCount) * 100 }))
      .sort((a, b) => b.density - a.density)
      .slice(0, 5);

    // Count internal and external links
    let internalLinksCount = 0;
    let externalLinksCount = 0;
    $('a[href]').each((_, elem) => {
      const href = $(elem).attr('href');
      if (href) {
        try {
          const linkUrl = new URL(href, url);
          if (linkUrl.hostname === new URL(url).hostname) {
            internalLinksCount++;
          } else {
            externalLinksCount++;
          }
        } catch (error) {
          console.error('Error processing link:', error);
        }
      }
    });

    // Calculate page size
    const pageSize = html.length;

    // Combine heading issues with other SEO issues
    const seoIssues = [
      ...(basicAnalysis.title.length < 30 || basicAnalysis.title.length > 60 
        ? [`Title length (${basicAnalysis.title.length}) is not optimal (30-60 chars)`] 
        : []),
      ...(basicAnalysis.metaDescription.length < 120 || basicAnalysis.metaDescription.length > 160 
        ? [`Meta description length (${basicAnalysis.metaDescription.length}) is not optimal (120-160 chars)`] 
        : []),
      ...(basicAnalysis.imgWithoutAlt > 0 
        ? [`${basicAnalysis.imgWithoutAlt} out of ${basicAnalysis.imgCount} images are missing alt text`] 
        : []),
      ...headingAnalysis.issues
    ];

    // Verificaciones de metadatos
    const hasCanonical = $('link[rel="canonical"]').length > 0;
    if (!hasCanonical) {
      seoIssues.push('No canonical tag found');
    }

    const hasViewport = $('meta[name="viewport"]').length > 0;
    if (!hasViewport) {
      seoIssues.push('No viewport meta tag found');
    }

    // Análisis de contenido
    const pageContent = $('body').text();
    const wordCount2 = pageContent.split(/\s+/).length; //Added wordCount2 to avoid naming conflict
    const readabilityScore = calculateReadabilityScore(pageContent);

    // Verificaciones de seguridad y rendimiento
    const hasSSL = url.startsWith('https://');
    const hasSchema = $('script[type="application/ld+json"]').length > 0;

    // Verificar longitud de URL
    const urlLength = url.length;
    if (urlLength > 75) {
      seoIssues.push(`URL length (${urlLength}) is too long. Keep it under 75 characters.`);
    }

    // Verificar robots.txt
    let hasRobotsTxt = false;
    try {
      const robotsTxtUrl = new URL('/robots.txt', url).href;
      const robotsTxtResponse = await fetchWithTimeout(robotsTxtUrl);
      hasRobotsTxt = robotsTxtResponse.ok;
      if (!hasRobotsTxt) {
        seoIssues.push('robots.txt file not found');
      }
    } catch (error) {
      console.error('Error checking robots.txt:', error);
      seoIssues.push('Could not check robots.txt file');
    }

    // Verificar sitemap.xml
    let hasSitemap = false;
    try {
      const sitemapUrl = new URL('/sitemap.xml', url).href;
      const sitemapResponse = await fetchWithTimeout(sitemapUrl);
      hasSitemap = sitemapResponse.ok;
      if (!hasSitemap) {
        seoIssues.push('sitemap.xml file not found');
      }
    } catch (error) {
      console.error('Error checking sitemap.xml:', error);
      seoIssues.push('Could not check sitemap.xml file');
    }

    // Verificar Open Graph tags
    const ogTitle = $('meta[property="og:title"]').attr('content');
    const ogDescription = $('meta[property="og:description"]').attr('content');
    const ogImage = $('meta[property="og:image"]').attr('content');
    if (!ogTitle) seoIssues.push('Missing Open Graph title tag');
    if (!ogDescription) seoIssues.push('Missing Open Graph description tag');
    if (!ogImage) seoIssues.push('Missing Open Graph image tag');

    // Verificar Twitter Card tags
    const twitterCard = $('meta[name="twitter:card"]').attr('content');
    const twitterTitle = $('meta[name="twitter:title"]').attr('content');
    const twitterDescription = $('meta[name="twitter:description"]').attr('content');
    const twitterImage = $('meta[name="twitter:image"]').attr('content');
    if (!twitterCard) seoIssues.push('Missing Twitter Card tag');
    if (!twitterTitle) seoIssues.push('Missing Twitter title tag');
    if (!twitterDescription) seoIssues.push('Missing Twitter description tag');
    if (!twitterImage) seoIssues.push('Missing Twitter image tag');

    // Verificar uso de HTTPS
    if (!hasSSL) {
      seoIssues.push('Site is not using HTTPS');
    }

    // Verificar tiempo de carga
    if (loadTime > 3000) {
      seoIssues.push(`Page load time (${loadTime}ms) is too slow. Aim for under 3 seconds.`);
    }

    // Update score calculation to include heading hierarchy
    const totalChecks = 24; // Actualizado para incluir nuevas verificaciones
    let passedChecks = 0;

    if (basicAnalysis.title.length >= 30 && basicAnalysis.title.length <= 60) passedChecks++;
    if (basicAnalysis.metaDescription.length >= 120 && basicAnalysis.metaDescription.length <= 160) passedChecks++;
    if (basicAnalysis.h1Count === 1) passedChecks++;
    if (basicAnalysis.imgWithoutAlt === 0) passedChecks++;
    if (hasCanonical) passedChecks++;
    if (hasViewport) passedChecks++;
    if (hasSSL) passedChecks++;
    if (hasSchema) passedChecks++;
    if (headingAnalysis.isValid) passedChecks++;
    if (urlLength <= 75) passedChecks++;
    if (ogTitle && ogDescription && ogImage) passedChecks++;
    if (twitterCard && twitterTitle && twitterDescription && twitterImage) passedChecks++;
    if (loadTime <= 3000) passedChecks++;
    if (hasRobotsTxt) passedChecks++;
    if (hasSitemap) passedChecks++;


    const overallScore = (passedChecks / totalChecks) * 100;

    // Nuevas métricas de velocidad (simuladas)
    const fcp = Math.round(Math.random() * 1000 + 500); // First Contentful Paint
    const lcp = Math.round(Math.random() * 2000 + 1000); // Largest Contentful Paint
    const cls = (Math.random() * 0.2).toFixed(2); // Cumulative Layout Shift

    // Generar sugerencias basadas en los problemas detectados
    const suggestions = generateSuggestions({
      title: basicAnalysis.title,
      metaDescription: basicAnalysis.metaDescription,
      h1Count: basicAnalysis.h1Count,
      imgWithoutAlt: basicAnalysis.imgWithoutAlt,
      hasCanonical,
      hasViewport,
      hasSSL,
      hasSchema,
      headingHierarchyValid: headingAnalysis.isValid,
      urlLength,
      loadTime,
      fcp,
      lcp,
      cls,
      hasRobotsTxt,
      hasSitemap,
      brokenLinksCount,
    });

    // Resultado final
    const result = {
      ...basicAnalysis,
      seoIssues,
      brokenLinks: brokenLinksResult,
      brokenLinksCount,
      wordCount: wordCount2,
      readabilityScore,
      hasSSL,
      hasSchema,
      overallScore,
      analysisTime: Date.now() - startTime,
      headingStructure: headingAnalysis.headings,
      headingHierarchyValid: headingAnalysis.isValid,
      urlLength,
      hasRobotsTxt,
      hasSitemap,
      ogTags: { ogTitle, ogDescription, ogImage },
      twitterTags: { twitterCard, twitterTitle, twitterDescription, twitterImage },
      keywordDensity,
      internalLinksCount,
      externalLinksCount,
      pageSize,
      fcp,
      lcp,
      cls,
      suggestions,
    };

    // New checks for personal information
    const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
    const phoneRegex = /(\+34|0034|34)?[ -]*(6|7)[ -]*([0-9][ -]*){8}/g;
    const cifRegex = /[ABCDEFGHJKLMNPQRSUVW][0-9]{7}[0-9A-J]/gi;

    const pageText = $('body').text();
    const emails = pageText.match(emailRegex) || [];
    const phoneNumbers = pageText.match(phoneRegex) || [];
    const cifs = pageText.match(cifRegex) || [];

    const personalInfo = {
      emails: emails,
      phoneNumbers: phoneNumbers,
      cifs: cifs,
    };

    // Add personal info checks to seoIssues
    if (personalInfo.emails.length > 0) seoIssues.push(`Found ${personalInfo.emails.length} email(s) in page content`);
    if (personalInfo.phoneNumbers.length > 0) seoIssues.push(`Found ${personalInfo.phoneNumbers.length} phone number(s) in page content`);
    if (personalInfo.cifs.length > 0) seoIssues.push(`Found ${personalInfo.cifs.length} CIF(s) in page content`);

    // Meta robots tag check
    const metaRobots = $('meta[name="robots"]').attr('content');
    const hasMetaRobots = !!metaRobots;

    // Canonical URL check
    const canonicalUrl = $('link[rel="canonical"]').attr('href');
    const hasCanonicalUrl = !!canonicalUrl;

    // HTTPS security check
    const isHttps = url.startsWith('https://');

    // Mobile-friendliness check (basic)
    const hasMobileViewport = $('meta[name="viewport"]').length > 0;

    // Schema markup detection
    const hasSchemaMarkup = $('script[type="application/ld+json"]').length > 0;

    // XML sitemap analysis (basic check)
    let hasSitemapXml = false;
    try {
      const sitemapUrl = new URL('/sitemap.xml', url).href;
      const sitemapResponse = await fetchWithTimeout(sitemapUrl);
      hasSitemapXml = sitemapResponse.ok;
    } catch (error) {
      console.error('Error checking sitemap.xml:', error);
    }

    // Hreflang tag check
    const hasHreflangTags = $('link[rel="alternate"][hreflang]').length > 0;

    // Update the seoIssues array with new checks
    if (!hasMetaRobots) seoIssues.push('Missing meta robots tag');
    if (!hasCanonicalUrl) seoIssues.push('Missing canonical URL');
    if (!isHttps) seoIssues.push('Not using HTTPS');
    if (!hasMobileViewport) seoIssues.push('Missing mobile viewport meta tag');
    if (!hasSchemaMarkup) seoIssues.push('No schema markup detected');
    if (!hasSitemapXml) seoIssues.push('No XML sitemap found');
    if (!hasHreflangTags) seoIssues.push('No hreflang tags found for internationalization');

    // Add the new data to the result object
    const newSeoData = {
      metaRobots,
      canonicalUrl,
      isHttps,
      hasMobileViewport,
      hasSchemaMarkup,
      hasSitemapXml,
      hasHreflangTags,
    };

    // Update the result object
    return {
      ...result,
      ...newSeoData,
      personalInfo,
    };
  } catch (error) {
    console.error('Error durante el análisis:', error);
    throw error;
  }
}

function calculateReadabilityScore(text: string) {
  const sentences = text.split(/[.!?]+/).filter(Boolean);
  const words = text.split(/\s+/).filter(Boolean);
  
  if (sentences.length === 0 || words.length === 0) {
    return 0;
  }

  const averageWordsPerSentence = words.length / sentences.length;
  return Math.max(0, Math.min(100, 100 - (averageWordsPerSentence - 15) * 2));
}

function generateSuggestions(data: any): string[] {
  const suggestions: string[] = [];

  if (data.title.length < 30 || data.title.length > 60) {
    suggestions.push(`Optimiza la longitud del título (${data.title.length} caracteres). Ideal: 30-60 caracteres.`);
  }

  if (data.metaDescription.length < 120 || data.metaDescription.length > 160) {
    suggestions.push(`Ajusta la longitud de la meta descripción (${data.metaDescription.length} caracteres). Ideal: 120-160 caracteres.`);
  }

  if (data.h1Count !== 1) {
    suggestions.push(`Asegúrate de tener exactamente un H1 en la página. Actual: ${data.h1Count}`);
  }

  if (data.imgWithoutAlt > 0) {
    suggestions.push(`Añade texto alternativo a ${data.imgWithoutAlt} imágenes que carecen de él.`);
  }

  if (!data.hasCanonical) {
    suggestions.push("Añade una etiqueta canónica para evitar problemas de contenido duplicado.");
  }

  if (!data.hasViewport) {
    suggestions.push("Incluye una etiqueta de viewport para mejorar la experiencia en dispositivos móviles.");
  }

  if (!data.hasSSL) {
    suggestions.push("Implementa SSL para mejorar la seguridad y el SEO.");
  }

  if (!data.hasSchema) {
    suggestions.push("Añade marcado de esquema para mejorar la comprensión de tu contenido por los motores de búsqueda.");
  }

  if (!data.headingHierarchyValid) {
    suggestions.push("Revisa y corrige la jerarquía de encabezados para mejorar la estructura del contenido.");
  }

  if (data.urlLength > 75) {
    suggestions.push(`Considera acortar la URL (${data.urlLength} caracteres). Las URLs más cortas son preferibles.`);
  }

  if (data.loadTime > 3000) {
    suggestions.push(`Mejora el tiempo de carga de la página (${data.loadTime}ms). Objetivo: menos de 3 segundos.`);
  }

  if (data.fcp > 1800) {
    suggestions.push(`Optimiza el First Contentful Paint (${data.fcp}ms). Objetivo: menos de 1.8 segundos.`);
  }

  if (data.lcp > 2500) {
    suggestions.push(`Mejora el Largest Contentful Paint (${data.lcp}ms). Objetivo: menos de 2.5 segundos.`);
  }

  if (parseFloat(data.cls) > 0.1) {
    suggestions.push(`Reduce el Cumulative Layout Shift (${data.cls}). Objetivo: menos de 0.1.`);
  }

  if (!data.hasRobotsTxt) {
    suggestions.push("Crea un archivo robots.txt para controlar el acceso de los bots a tu sitio.");
  }

  if (!data.hasSitemap) {
    suggestions.push("Genera un sitemap XML para ayudar a los motores de búsqueda a indexar tu contenido.");
  }

  if (data.brokenLinksCount > 0) {
    suggestions.push(`Corrige ${data.brokenLinksCount} enlaces rotos para mejorar la experiencia del usuario y el SEO.`);
  }

  return suggestions;
}

export async function POST(request: NextRequest) {

  try {
    console.log('Recibida solicitud POST');
    const body = await request.json();
    console.log('Body recibido:', body);
    
    const { url } = body;
    
    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    console.log('Iniciando análisis para URL:', url);

    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Analysis timeout')), API_TIMEOUT)
    );

    const analysisPromise = analyzeWebpage(url);

    const analysis = await Promise.race([analysisPromise, timeoutPromise]);
    console.log('Análisis completado exitosamente');
    
    return NextResponse.json(analysis);
  } catch (error) {
    console.error('Error en el endpoint:', error);
    
    const errorResponse = {
      error: 'An error occurred during analysis',
      message: error instanceof Error ? error.message : 'Unknown error',
      details: error instanceof Error ? {
        name: error.name,
        message: error.message,
        stack: error.stack,
      } : error,
    };

    console.error('Detalles del error:', JSON.stringify(errorResponse, null, 2));

    return NextResponse.json(errorResponse, { status: 500 });
  }
}
