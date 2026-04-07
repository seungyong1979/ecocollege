import { serve } from '@hono/node-server'
import { serveStatic } from '@hono/node-server/serve-static'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { mainPage } from './pages/main'
import { adminPage } from './pages/admin'
import { apiRoutes } from './routes/api'
import { adminRoutes } from './routes/adminApi'

// DB 초기화 (임포트 시 자동 실행)
import './db'

const app = new Hono()

// 정적 파일
app.use('/static/*', serveStatic({ root: './public' }))

// CORS
app.use('/api/*', cors())

// 메인 / 관리자 페이지
app.get('/', mainPage)
app.get('/admin', adminPage)
app.get('/admin/*', adminPage)

// API
app.route('/api', apiRoutes)
app.route('/api/admin', adminRoutes)

// 헬스체크
app.get('/health', (c) => c.json({ status: 'ok', time: new Date().toISOString() }))

const PORT = parseInt(process.env.PORT || '3000')

serve({ fetch: app.fetch, port: PORT }, (info) => {
  console.log(`🌿 순천에코칼리지 의제 창구 서버 시작`)
  console.log(`🚀 http://localhost:${info.port}`)
  console.log(`🔑 관리자: http://localhost:${info.port}/admin`)
})

export default app
