import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { serveStatic } from 'hono/cloudflare-workers'
import { mainPage } from './pages/main'
import { adminPage } from './pages/admin'
import { apiRoutes } from './routes/api'
import { adminRoutes } from './routes/adminApi'

type Bindings = {
  DB: D1Database
  ADMIN_SECRET: string
}

const app = new Hono<{ Bindings: Bindings }>()

app.use('/static/*', serveStatic({ root: './public' }))
app.use('/api/*', cors())

// Main page
app.get('/', mainPage)

// Admin page
app.get('/admin', adminPage)
app.get('/admin/*', adminPage)

// API routes
app.route('/api', apiRoutes)
app.route('/api/admin', adminRoutes)

export default app
