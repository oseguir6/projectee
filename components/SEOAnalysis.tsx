import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { BarChart2, Shield, FileText, Database, Share2, Twitter, Link, FileCode, Smartphone, Code } from 'lucide-react'

interface SEOAnalysisResult {
  wordCount: number;
  readabilityScore: number;
  urlLength: number;
  hasSSL: boolean;
  loadTime: number;
  hasRobotsTxt: boolean;
  hasSitemap: boolean;
  hasSchema: boolean;
  ogTags: {
    ogTitle?: string;
    ogDescription?: string;
    ogImage?: string;
  };
  twitterTags: {
    twitterCard?: string;
    twitterTitle?: string;
    twitterDescription?: string;
    twitterImage?: string;
  };
  internalLinksCount: number;
  externalLinksCount: number;
  brokenLinksCount: number;
  pageSize: number;
  keywordDensity: { word: string; density: number }[];
  hasViewport: boolean;
  metaRobots?: string;
  canonicalUrl?: string;
  isHttps: boolean;
  hasMobileViewport: boolean;
  hasSchemaMarkup: boolean;
  hasSitemapXml: boolean;
  hasHreflangTags: boolean;
  personalInfo?: {
    emails?: string[];
    phoneNumbers?: string[];
  };
  analysisTime: number;
  hasNavTag: boolean;
  hasMainTag: boolean;
  isResponsive?: boolean;
  mobileFontSize?: number;
  touchTargetsOptimized?: boolean;
  mobilePageSpeed?: number;
  paragraphFontSize?: number;
  headingFontSizes?: Record<string, number>;
  responsiveIssues?: string[];
}

interface SEOAnalysisProps {
  result: SEOAnalysisResult;
}

interface Issue {
  message: string;
  severity: 'high' | 'medium' | 'low';
}

export function SEOAnalysis({ result }: SEOAnalysisProps) {

  function classifyNewSeoIssues(result: SEOAnalysisResult): Issue[] {
    const newIssues: Issue[] = [];

    if (!result.hasNavTag) {
      newIssues.push({ message: 'Falta la etiqueta semántica <nav>', severity: 'low' });
    }
    if (!result.hasMainTag) {
      newIssues.push({ message: 'Falta la etiqueta semántica <main>', severity: 'low' });
    }

    return newIssues;
  }

  // TODO: Replace this placeholder with the actual filtered SEO issues
  const filteredSeoIssues: Issue[] = []; // This should be replaced with your actual filtered issues
  const allSeoIssues: Issue[] = [...filteredSeoIssues, ...classifyNewSeoIssues(result)];


  return (
    <Card>
      <CardHeader>
        <CardTitle>Análisis SEO</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md">
            <h4 className="font-semibold mb-2 flex items-center">
              <BarChart2 className="w-5 h-5 mr-2 text-blue-500" />
              Estadístiques generals
            </h4>
            <p className="text-sm">Paraules: {result.wordCount}</p>
            <p className="text-sm">Llegibilitat: {result.readabilityScore.toFixed(2)}</p>
            <p className="text-sm">Longitud d'URL: {result.urlLength} caràcters</p>
          </div>
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md">
            <h4 className="font-semibold mb-2 flex items-center">
              <Shield className="w-5 h-5 mr-2 text-green-500" />
              Seguretat i rendiment
            </h4>
            <p className="text-sm">SSL: {result.hasSSL ? 'Habilitat' : 'No detectat'}</p>
            <p className="text-sm">Temps de càrrega: {result.loadTime}ms</p>
          </div>
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md">
            <h4 className="font-semibold mb-2 flex items-center">
              <FileText className="w-5 h-5 mr-2 text-yellow-500" />
              Arxius SEO
            </h4>
            <p className="text-sm">robots.txt: {result.hasRobotsTxt ? 'Present' : 'No detectat'}</p>
            <p className="text-sm">sitemap.xml: {result.hasSitemap ? 'Present' : 'No detectat'}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md">
            <h4 className="font-semibold mb-2 flex items-center">
              <Database className="w-5 h-5 mr-2 text-purple-500" />
              Dades estructurades
            </h4>
            <p className="text-sm">Schema: {result.hasSchema ? 'Present' : 'No detectat'}</p>
            <p className="text-sm">Etiqueta nav: {result.hasNavTag ? 'Present' : 'No detectada'}</p>
            <p className="text-sm">Etiqueta main: {result.hasMainTag ? 'Present' : 'No detectada'}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md">
            <h4 className="font-semibold mb-2 flex items-center">
              <Share2 className="w-5 h-5 mr-2 text-indigo-500" />
              Etiquetes Open Graph
            </h4>
            <p className="text-sm">Títol: {result.ogTags.ogTitle ? 'Present' : 'Absent'}</p>
            <p className="text-sm">Descripció: {result.ogTags.ogDescription ? 'Present' : 'Absent'}</p>
            <p className="text-sm">Imatge: {result.ogTags.ogImage ? 'Present' : 'Absent'}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md">
            <h4 className="font-semibold mb-2 flex items-center">
              <Twitter className="w-5 h-5 mr-2 text-blue-400" />
              Etiquetes Twitter Card
            </h4>
            <p className="text-sm">Card: {result.twitterTags.twitterCard ? 'Present' : 'Absent'}</p>
            <p className="text-sm">Títol: {result.twitterTags.twitterTitle ? 'Present' : 'Absent'}</p>
            <p className="text-sm">Descripció: {result.twitterTags.twitterDescription ? 'Present' : 'Absent'}</p>
            <p className="text-sm">Imatge: {result.twitterTags.twitterImage ? 'Present' : 'Absent'}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md">
            <h4 className="font-semibold mb-2 flex items-center">
              <Link className="w-5 h-5 mr-2 text-pink-500" />
              Enllaços
            </h4>
            <p className="text-sm">Interns: {result.internalLinksCount}</p>
            <p className="text-sm">Externs: {result.externalLinksCount}</p>
            <p className="text-sm">Trencats: {result.brokenLinksCount}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md">
            <h4 className="font-semibold mb-2 flex items-center">
              <FileCode className="w-5 h-5 mr-2 text-orange-500" />
              Contingut
            </h4>
            <p className="text-sm">Mida de pàgina: {(result.pageSize / 1024).toFixed(2)} KB</p>
            <p className="text-sm">Paraules clau principals:</p>
            <ul className="list-disc list-inside">
              {result.keywordDensity.map((kw, index) => (
                <li key={index}>{kw.word}: {kw.density.toFixed(2)}%</li>
              ))}
            </ul>
          </div>
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md">
            <h4 className="font-semibold mb-2 flex items-center">
              <Smartphone className="w-5 h-5 mr-2 text-teal-500" />
              Optimització mòbil
            </h4>
            <p className="text-sm">Viewport meta tag: {result.hasViewport ? 'Present' : 'Absent'}</p>
            <p className="text-sm">Mida de font mòbil: 
              {result.mobileFontSize ? (
                result.mobileFontSize >= 16 ? 
                  `${result.mobileFontSize}px (Adequat)` : 
                  `${result.mobileFontSize}px (Massa petit, mínim recomanat: 16px)`
              ) : 'No analitzat'}
            </p>
            <Accordion type="single" collapsible className="w-full mt-2">
              <AccordionItem value="font-size-details">
                <AccordionTrigger className="text-sm">
                  Detalls de mida de font
                </AccordionTrigger>
                <AccordionContent>
                  <ul className="list-disc list-inside text-sm">
                    <li>
                      Paràgrafs (&lt;p&gt;): 
                      {result.paragraphFontSize 
                        ? `${result.paragraphFontSize}px ${result.paragraphFontSize >= 16 ? '✅' : '⚠️'}`
                        : 'No detectat ⚠️'}
                    </li>
                    {result.headingFontSizes ? (
                      Object.entries(result.headingFontSizes).map(([tag, size]) => (
                        <li key={tag}>
                          {tag}: {size}px {size >= 16 ? '✅' : '⚠️'}
                        </li>
                      ))
                    ) : (
                      <li>Encapçalaments (H1-H6): No detectats ⚠️</li>
                    )}
                  </ul>
                  {(!result.paragraphFontSize || !result.headingFontSizes || Object.values(result.headingFontSizes).some(size => size < 16)) && (
                    <p className="mt-2 text-sm text-yellow-500">
                      ⚠️ Es recomana una mida mínima de 16px per a millor llegibilitat en dispositius mòbils.
                    </p>
                  )}
                </AccordionContent>
              </AccordionItem>
            </Accordion>
            <p className="text-sm">Disseny responsiu: 
              {result.isResponsive ? 'Detectat' : 'No detectat'}
              {result.responsiveIssues && result.responsiveIssues.length > 0 && (
                <span className="text-yellow-500"> (amb problemes)</span>
              )}
            </p>
            {result.responsiveIssues && result.responsiveIssues.length > 0 && (
              <Accordion type="single" collapsible className="w-full mt-2">
                <AccordionItem value="responsive-issues">
                  <AccordionTrigger className="text-sm">
                    Problemes de disseny responsiu
                  </AccordionTrigger>
                  <AccordionContent>
                    <ul className="list-disc list-inside text-sm">
                      {result.responsiveIssues.map((issue, index) => (
                        <li key={index}>{issue}</li>
                      ))}
                    </ul>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            )}
            <Accordion type="single" collapsible className="w-full mt-2">
              <AccordionItem value="touch-targets">
                <AccordionTrigger className="text-sm">
                  Objectius tàctils: {result.touchTargetsOptimized ? 'Optimitzats' : 'Necessita revisió'}
                </AccordionTrigger>
                <AccordionContent>
                  <ul className="list-disc list-inside text-sm">
                    <li>Mida mínima recomanada: 48x48 píxels</li>
                    <li>Espai entre objectius: almenys 8 píxels</li>
                    <li>Àrees importants: botons, enllaços, camps de formulari</li>
                  </ul>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
            {result.mobilePageSpeed && (
              <p className="text-sm mt-2">Velocitat de pàgina mòbil: {result.mobilePageSpeed}/100</p>
            )}
            <p className="text-sm mt-2">
              {result.hasViewport && result.isResponsive && result.mobileFontSize >= 14 && result.touchTargetsOptimized
                ? '✅ Ben optimitzat per a mòbils'
                : '⚠️ Necessita millores en l\'optimització mòbil'}
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md">
            <h4 className="font-semibold mb-2 flex items-center">
              <Code className="w-5 h-5 mr-2 text-gray-600" />
              SEO Tècnic
            </h4>
            <p className="text-sm">Meta Robots: {result.metaRobots ? result.metaRobots : 'No detectat'}</p>
            <p className="text-sm">URL Canònica: {result.canonicalUrl ? 'Present' : 'No detectada'}</p>
            <p className="text-sm">HTTPS: {result.isHttps ? 'Sí' : 'No'}</p>
            <p className="text-sm">Viewport Mòbil: {result.hasMobileViewport ? 'Present' : 'Absent'}</p>
            <p className="text-sm">Schema Markup: {result.hasSchemaMarkup ? 'Detectat' : 'No detectat'}</p>
            <p className="text-sm">Sitemap XML: {result.hasSitemapXml ? 'Trobat' : 'No trobat'}</p>
            <p className="text-sm">Etiquetes Hreflang: {result.hasHreflangTags ? 'Presents' : 'Absents'}</p>
            <h4 className="font-semibold mt-4 mb-2 flex items-center">
              <Code className="w-5 h-5 mr-2 text-gray-600" />
              Informació personal pública
            </h4>
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="emails">
                <AccordionTrigger>Correus electrònics ({(result.personalInfo?.emails || []).length})</AccordionTrigger>
                <AccordionContent>
                  <ul className="list-disc list-inside">
                    {(result.personalInfo?.emails || []).map((email, index) => (
                      <li key={index}>{email}</li>
                    ))}
                  </ul>
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="phoneNumbers">
                <AccordionTrigger>Números de telèfon ({(result.personalInfo?.phoneNumbers || []).length})</AccordionTrigger>
                <AccordionContent>
                  <ul className="list-disc list-inside"><p>Ja no cal el seu insta</p>
                    {(result.personalInfo?.phoneNumbers || []).map((phone, index) => (
                      <li key={index}>{phone}</li>
                    ))}
                  </ul>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
          <div className="mt-4 bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md">
            <h4 className="font-semibold mb-2 flex items-center">
              <Code className="w-5 h-5 mr-2 text-gray-600" />
              Temps d'Anàlisi
            </h4>
            <p className="text-sm">Temps total: {(result.analysisTime / 1000).toFixed(2)} segons</p>
            <Accordion type="single" collapsible className="w-full mt-2">
              <AccordionItem value="analysis-breakdown">
                <AccordionTrigger className="text-sm">
                  Desglossament del temps d'anàlisi
                </AccordionTrigger>
                <AccordionContent>
                  <ul className="list-disc list-inside text-sm">
                    <li>Càrrega de pàgina: {(result.loadTime / 1000).toFixed(2)} segons</li>
                    <li>Anàlisi de contingut: {((result.analysisTime - result.loadTime) / 2000).toFixed(2)} segons</li>
                    <li>Verificació d'enllaços: {((result.analysisTime - result.loadTime) / 2000).toFixed(2)} segons</li>
                  </ul>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
