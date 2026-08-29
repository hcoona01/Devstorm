import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig, type Plugin } from 'vite'

const devApiMockPlugin = (): Plugin => ({
  name: 'dev-api-mock',
  configureServer(server) {
    server.middlewares.use((req, res, next) => {
      if (req.url === '/api/profile' && req.method === 'POST') {
        let body = ''
        req.on('data', (chunk) => {
          body += chunk
        })
        req.on('end', () => {
          try {
            const parsed = JSON.parse(body || '{}')
            res.setHeader('Content-Type', 'application/json')
            res.statusCode = 201
            res.end(
              JSON.stringify({
                status: 'success',
                message: 'Profile submitted, validated, and authenticated successfully',
                data_received: parsed,
              })
            )
          } catch {
            res.setHeader('Content-Type', 'application/json')
            res.statusCode = 400
            res.end(JSON.stringify({ error: 'Invalid JSON body' }))
          }
        })
        return
      }

      if (req.url === '/api/analyze-cv' && req.method === 'POST') {
        res.setHeader('Content-Type', 'application/json')
        res.statusCode = 200
        res.end(
          JSON.stringify({
            match_score: 78,
            missing_keywords: ['Kubernetes', 'GraphQL', 'Agile Methodologies'],
            scraped_insights: [
              "Found 'FastAPI' extensively used in your GitHub repositories.",
              'LinkedIn indicates 2 years of React experience, matching the JD requirements.',
              "Trending jobs in this sector frequently demand 'Docker' which is missing from your profile.",
            ],
            improvement_points: [
              {
                category: 'Action Verbs',
                suggestion: 'Use stronger action verbs to describe your backend achievements.',
                original_text: 'Worked on the API for the main application.',
                improved_text:
                  'Architected and deployed a highly scalable FastAPI service handling 10k+ requests/sec.',
              },
              {
                category: 'Keyword Optimization',
                suggestion:
                  'The JD emphasizes GraphQL. Since your GitHub shows GraphQL projects, explicitly add it to your skills section.',
                original_text: null,
                improved_text: null,
              },
            ],
          })
        )
        return
      }

      if (req.url === '/health' && req.method === 'GET') {
        res.setHeader('Content-Type', 'application/json')
        res.statusCode = 200
        res.end(JSON.stringify({ status: 'healthy', capacity: 'handling thousands of requests' }))
        return
      }

      next()
    })
  },
})

export default defineConfig({
  plugins: [react(), tailwindcss(), devApiMockPlugin()],
})
