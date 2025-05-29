import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Badge } from "@/components/ui/badge"
import { AlertCircle, CheckCircle, Info, Zap, FileText, Image } from 'lucide-react'
import { SEOAnalysis } from "./SEOAnalysis"
import { Issue, HeadingStructure, BrokenLink, getSeverityColor } from "@/utils/seo-utils"
import { Button } from "@/components/ui/button";
//import { generatePDFReport } from '@/utils/report-generator';

interface AuditResultsProps {
  result: any;
}

interface SEOAnalysisResult {
  hasNavTag: boolean;
  hasMainTag: boolean;
  // ... rest of the interface
}


function getSeverityIcon(severity: 'high' | 'medium' | 'low') {
  switch (severity) {
    case 'high':
      return <AlertCircle className="w-4 h-4 text-red-500" />
    case 'medium':
      return <Info className="w-4 h-4 text-yellow-500" />
    case 'low':
      return <CheckCircle className="w-4 h-4 text-blue-500" />
  }
}

function classifyNewSeoIssues(result: any): Issue[] {
  const newIssues: Issue[] = [];

  if (!result.metaRobots) newIssues.push({ message: 'Falta l\'etiqueta meta robots', severity: 'high' });
  if (!result.canonicalUrl) newIssues.push({ message: 'Falta l\'URL canònica', severity: 'medium' });
  if (!result.isHttps) newIssues.push({ message: 'No s\'està utilitzant HTTPS', severity: 'high' });
  if (!result.hasMobileViewport) newIssues.push({ message: 'Falta l\'etiqueta de viewport mòbil', severity: 'high' });
  if (!result.hasSchemaMarkup) newIssues.push({ message: 'No s\'ha detectat schema markup', severity: 'medium' });
  if (!result.hasSitemapXml) newIssues.push({ message: 'No s\'ha trobat el sitemap XML', severity: 'medium' });
  if (!result.hasHreflangTags) newIssues.push({ message: 'No s\'han trobat etiquetes hreflang per internacionalització', severity: 'low' });

  // Remove personal information checks
  const personalInfo = result.personalInfo || {};
  if ((personalInfo.nifs || []).length > 0) {
    newIssues.push({ message: `S'han trobat ${personalInfo.nifs.length} NIF(s) en el contingut de la pàgina`, severity: 'low' });
  }
  if ((personalInfo.dnis || []).length > 0) {
    newIssues.push({ message: `S'han trobat ${personalInfo.dnis.length} DNI(s) en el contingut de la pàgina`, severity: 'low' });
  }
  return newIssues;
}

function CoreWebVitals({ result }: { result: any }) {
  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center">
          <Zap className="w-5 h-5 mr-2" />
          Core Web Vitals
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <p className="font-semibold">Largest Contentful Paint (LCP)</p>
            <p className="text-2xl">{result.lcp}ms</p>
            <p className={`text-sm ${result.lcp <= 2500 ? 'text-green-500' : 'text-red-500'}`}>
              {result.lcp <= 2500 ? 'Ni tan mal tt' : 'Necessita millora, paga més'}
            </p>
          </div>
          <div>
            <p className="font-semibold">First Input Delay (FID)</p>
            <p className="text-2xl">{result.fid}ms</p>
            <p className={`text-sm ${result.fid <= 100 ? 'text-green-500' : 'text-red-500'}`}>
              {result.fid <= 100 ? 'Ni tan mal tt' : 'Necessita millora, paga més'}
            </p>
          </div>
          <div>
            <p className="font-semibold">Cumulative Layout Shift (CLS)</p>
            <p className="text-2xl">{result.cls}</p>
            <p className={`text-sm ${result.cls <= 0.1 ? 'text-green-500' : 'text-red-500'}`}>
              {result.cls <= 0.1 ? 'Ni tan mal tt' : 'Necessita millora, paga més'}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export function AuditResults({ result }: AuditResultsProps) {
  const filteredSeoIssues = (result.seoIssues || []).filter((issue: Issue) => 
    !issue.message.toLowerCase().includes('correo') &&
    !issue.message.toLowerCase().includes('email') &&
    !issue.message.toLowerCase().includes('teléfono') &&
    !issue.message.toLowerCase().includes('cif')
  );
  const allSeoIssues = [...filteredSeoIssues, ...classifyNewSeoIssues(result)];
  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold">Resultats de l'auditoria</CardTitle>
          <CardDescription>{result.url}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-2">Puntuació general</h3>
            <Progress value={result.overallScore} className="w-full h-3" />
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Puntuació: {result.overallScore.toFixed(2)}%
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            <Card>
              <CardHeader>
                <CardTitle>Informació general</CardTitle>
              </CardHeader>
              <CardContent>
                <p>Temps de càrrega: {result.loadTime}ms</p>
                <p>Recompte de H1: {result.h1Count}</p>
                <p>Imatges: {result.imgCount} (Sense alt: {result.imgWithoutAlt})</p>
                <p>Enllaços trencats: {result.brokenLinksCount}</p>
                <p>HTTPS: {result.isHttps ? 'Sí' : 'No'}</p>
                <p>Sitemap XML: {result.hasSitemapXml ? 'Trobat' : 'No trobat'}</p>
                <p>Schema Markup: {result.hasSchemaMarkup ? 'Detectat' : 'No detectat'}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Títol</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm">{result.title}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Meta descripció</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm">{result.metaDescription}</p>
              </CardContent>
            </Card>
          </div>

          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Zap className="w-5 h-5 mr-2" />
                Mètriques de Velocitat
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <p className="font-semibold">Primera Pintura de Contingut (FCP)</p>
                  <p className="text-2xl">{result.fcp}ms</p>
                </div>
                <div>
                  <p className="font-semibold">Pintura de Contingut Més Gran (LCP)</p>
                  <p className="text-2xl">{result.lcp}ms</p>
                </div>
                <div>
                  <p className="font-semibold">Desplaçament Acumulatiu del Disseny (CLS)</p>
                  <p className="text-2xl">{result.cls}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <CoreWebVitals result={result} />
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center">
                <AlertCircle className="w-5 h-5 mr-2" />
                Elements que afecten el rendiment
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible>
                <AccordionItem value="lcp">
                  <AccordionTrigger>
                    <div className="flex items-center">
                      <Zap className="h-5 w-5 mr-2 text-yellow-500" />
                      Largest Contentful Paint
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <p>El LCP és de {result.lcp}ms, cosa que pot alentir la càrrega inicial.</p>
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="page-size">
                  <AccordionTrigger>
                    <div className="flex items-center">
                      <FileText className="h-5 w-5 mr-2 text-blue-500" />
                      Mida de la pàgina
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <p>La pàgina pesa {(result.pageSize / 1024).toFixed(2)} KB, cosa que pot afectar la velocitat de càrrega.</p>
                    {result.largestAssets && result.largestAssets.length > 0 ? (
                      <>
                        <h4 className="font-semibold mt-2 mb-1">Elements més pesats:</h4>
                        <ul className="list-disc list-inside">
                          {result.largestAssets.slice(0, 3).map((asset, index) => (
                            <li key={index}>
                              {asset.name}: {(asset.size / 1024).toFixed(2)} KB ({asset.type})
                            </li>
                          ))}
                        </ul>
                        <p className="mt-2 text-sm text-gray-600">Considera optimizar estos elementos para mejorar el tiempo de carga.</p>
                      </>
                    ) : (
                      <p className="mt-2 text-sm text-gray-600">No se dispone de información detallada sobre los elementos más pesados.</p>
                    )}
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="images">
                  <AccordionTrigger>
                    <div className="flex items-center">
                      <Image className="h-5 w-5 mr-2 text-green-500" />
                      Imágenes sin optimizar
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <p>{result.imgWithoutAlt} imatges sense text alternatiu poden alentir la càrrega i afectar l'accessibilitat.</p>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </CardContent>
          </Card>
        </CardContent>
      </Card>

      <SEOAnalysis result={result} />

      <Accordion type="single" collapsible className="w-full">
        <AccordionItem value="seo-issues">
          <AccordionTrigger>Problemas de SEO ({allSeoIssues.length})</AccordionTrigger>
          <AccordionContent>
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">Jerarquia de Títols</h4>
                <div className={`p-3 rounded-md ${result.headingHierarchyValid ? 'bg-green-100 dark:bg-green-900' : 'bg-red-100 dark:bg-red-900'}`}>
                  <p className={`font-semibold ${result.headingHierarchyValid ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'}`}>
                    {result.headingHierarchyValid ? '✓ Jerarquía correcta' : '✗ Problemas en la jerarquía'}
                  </p>
                  <Accordion type="single" collapsible className="w-full mt-2">
                    <AccordionItem value="heading-structure">
                      <AccordionTrigger>Veure estructura dels títuls</AccordionTrigger>
                      <AccordionContent>
                        <div className="space-y-2 mt-2">
                          {result.headingStructure.map((heading: HeadingStructure, index: number) => (
                            <div 
                              key={index} 
                              className="flex items-center gap-2"
                              style={{ paddingLeft: `${(heading.level - 1) * 1}rem` }}
                            >
                              <span className="font-mono text-sm text-muted-foreground">H{heading.level}</span>
                              <span className="truncate">{heading.text}</span>
                            </div>
                          ))}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                </div>
              </div>
              <ul className="space-y-2">
                {allSeoIssues.map((issue: Issue, index: number) => (
                  <li key={index} className="flex items-start">
                    {getSeverityIcon(issue.severity)}
                    <span className="ml-2">{issue.message}</span>
                    <Badge className={`ml-auto ${getSeverityColor(issue.severity)}`}>
                      {issue.severity}
                    </Badge>
                  </li>
                ))}
                {!result.hasNavTag && (
                  <li className="flex items-start">
                    {getSeverityIcon('low')}
                    <span className="ml-2">Etiqueta nav: No detectada</span>
                    <Badge className={`ml-auto ${getSeverityColor('low')}`}>
                      low
                    </Badge>
                  </li>
                )}
                {!result.hasMainTag && (
                  <li className="flex items-start">
                    {getSeverityIcon('low')}
                    <span className="ml-2">Etiqueta main: No detectada</span>
                    <Badge className={`ml-auto ${getSeverityColor('low')}`}>
                      low
                    </Badge>
                  </li>
                )}
              </ul>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      {result.brokenLinks.length > 0 && (
        <Accordion type="single" collapsible className="w-full mt-4">
          <AccordionItem value="broken-links">
            <AccordionTrigger>Enllaços Trencats ({result.brokenLinks.length})</AccordionTrigger>
            <AccordionContent>
              <ul className="space-y-2">
                {result.brokenLinks.map((link: BrokenLink, index: number) => (
                  <li key={index} className="flex items-start">
                    <AlertCircle className="h-4 w-4 text-red-500 mt-1 mr-2" />
                    <div>
                      <p className="font-semibold">{link.url}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{link.reason}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      )}

      <Accordion type="single" collapsible className="w-full mt-4">
        <AccordionItem value="suggestions">
          <AccordionTrigger>Suggeriments de Millora ({result.suggestions.length})</AccordionTrigger>
          <AccordionContent>
            <ul className="space-y-2">
              {result.suggestions.map((suggestion: string, index: number) => (
                <li key={index} className="flex items-start">
                  <Info className="h-4 w-4 text-blue-500 mt-1 mr-2" />
                  <span>{suggestion}</span>
                </li>
              ))}
            </ul>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
      <Button onClick={() => generatePDFReport(result)} className="mt-4">
        Exportar Informe PDF
      </Button>
    </div>
  )
}
