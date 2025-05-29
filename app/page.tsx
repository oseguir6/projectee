'use client'

import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertCircle, Moon, Sun } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AuditResults } from '@/components/AuditResults'
import { classifyIssues } from '@/utils/seo-utils'

export default function Home() {
  const [url, setUrl] = useState('')
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [darkMode, setDarkMode] = useState(false)

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [darkMode])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const response = await fetch('/api/audit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Error del servidor (${response.status})`);
      }

      const data = await response.json();
      if (data.error) {
        throw new Error(data.message || data.error);
      }
      data.seoIssues = classifyIssues(data.seoIssues)
      setResult(data)
    } catch (error) {
      console.error('Error:', error)
      setError(error instanceof Error ? error.message : 'Error desconocido durante el análisis')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={`min-h-screen ${darkMode ? 'dark' : ''}`}>
      <div className="container mx-auto p-4 bg-white dark:bg-gray-800 text-black dark:text-white">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">XKISIT TOOL</h1>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setDarkMode(!darkMode)}
          >
            {darkMode ? <Sun className="h-[1.2rem] w-[1.2rem]" /> : <Moon className="h-[1.2rem] w-[1.2rem]" />}
          </Button>
        </div>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-2xl font-bold">Analitza la teva pàg web</CardTitle>
            <CardDescription>Ingresa la URL para auditar problemas de SEO y rendimiento</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="flex gap-2">
              <Input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="Ingresa l'URL a escanejar"
                required
                className="flex-grow"
                disabled={loading}
              />
              <Button type="submit" disabled={loading}>
                {loading ? (
                  <div className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Analitzant...
                  </div>
                ) : (
                  'Analitzar'
                )}
              </Button>
            </form>
            {error && (
              <Alert variant="destructive" className="mt-4">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {result && <AuditResults result={result} />}
      </div>
    </div>
  )
}