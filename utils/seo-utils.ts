export type Severity = 'high' | 'medium' | 'low'

export interface Issue {
  message: string
  severity: Severity
}

export interface HeadingStructure {
  level: number;
  text: string;
}

export interface BrokenLink {
  url: string;
  reason: string;
}

export function classifyIssues(issues: string[]): Issue[] {
  return issues.map(issue => {
    let severity: Severity = 'medium'
    if (
      issue.toLowerCase().includes('missing') || 
      issue.toLowerCase().includes('not found') ||
      issue.toLowerCase().includes('jerarquía') ||
      issue.toLowerCase().includes('h1') ||
      issue.toLowerCase().includes('salto incorrecto') ||
      issue.toLowerCase().includes('too slow') ||
      issue.toLowerCase().includes('too long') ||
      issue.toLowerCase().includes('not using https')
    ) {
      severity = 'high'
    } else if (issue.toLowerCase().includes('may be') || issue.toLowerCase().includes('could not check')) {
      severity = 'low'
    }
    return { message: issue, severity }
  })
}

export function getSeverityColor(severity: Severity): string {
  switch (severity) {
    case 'high':
      return 'bg-red-500'
    case 'medium':
      return 'bg-yellow-500'
    case 'low':
      return 'bg-blue-500'
    default:
      return 'bg-gray-500'
  }
}

export function calculateOverallScore(result: any): number {
  const totalChecks = 34; // Updated total number of checks
  let passedChecks = 0;

  // Existing checks
  if (result.title && result.title.length >= 30 && result.title.length <= 60) passedChecks++;
  if (result.metaDescription && result.metaDescription.length >= 120 && result.metaDescription.length <= 160) passedChecks++;
  if (result.h1Count === 1) passedChecks++;
  if (result.imgWithoutAlt === 0) passedChecks++;
  if (result.hasCanonical) passedChecks++;
  if (result.hasViewport) passedChecks++;
  if (result.hasSSL) passedChecks++;
  if (result.hasSchema) passedChecks++;
  if (result.headingHierarchyValid) passedChecks++;
  if (result.urlLength <= 75) passedChecks++;
  if (result.ogTags.ogTitle && result.ogTags.ogDescription && result.ogTags.ogImage) passedChecks++;
  if (result.twitterTags.twitterCard && result.twitterTags.twitterTitle && result.twitterTags.twitterDescription && result.twitterTags.twitterImage) passedChecks++;
  if (result.loadTime <= 3000) passedChecks++;
  if (result.hasRobotsTxt) passedChecks++;
  if (result.hasSitemap) passedChecks++;

  // New checks
  if (result.metaRobots) passedChecks++;
  if (result.canonicalUrl) passedChecks++;
  if (result.isHttps) passedChecks++;
  if (result.hasMobileViewport) passedChecks++;
  if (result.hasSchemaMarkup) passedChecks++;
  if (result.hasSitemapXml) passedChecks++;
  if (result.hasHreflangTags) passedChecks++;

  // New checks for personal information
  if (result.personalInfo.emails.length === 0) passedChecks++;
  if (result.personalInfo.phoneNumbers.length === 0) passedChecks++;
  if (result.personalInfo.cifs.length === 0) passedChecks++;

  return (passedChecks / totalChecks) * 100;
}
