import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'
import { handleCompile } from './src/lib/compileHandler.js'

// Mirrors netlify/functions/compile.js so `npm run dev` has the same
// same-origin /api/compile endpoint the production build gets from Netlify —
// without this, the compiler page only works after a deploy.
function compileApiPlugin() {
  return {
    name: 'compile-api-dev-middleware',
    configureServer(server) {
      server.middlewares.use('/api/compile', async (req, res) => {
        if (req.method !== 'POST') {
          res.statusCode = 405
          res.end()
          return
        }
        let raw = ''
        req.on('data', (chunk) => (raw += chunk))
        req.on('end', async () => {
          try {
            const body = raw ? JSON.parse(raw) : {}
            const { statusCode, body: responseBody } = await handleCompile(body)
            res.statusCode = statusCode
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify(responseBody))
          } catch {
            res.statusCode = 400
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ error: 'Invalid request.' }))
          }
        })
      })
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), compileApiPlugin()],
})
