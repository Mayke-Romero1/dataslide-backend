import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import crypto from 'crypto'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 3000

app.use(cors({ origin: process.env.FRONTEND_URL }))
app.use(express.json())

const states = new Map<string, boolean>()

app.get('/auth/url/meta', (req, res) => {
  const state = crypto.randomUUID()
  states.set(state, true)
  const params = new URLSearchParams({
    client_id: process.env.META_APP_ID!,
    redirect_uri: process.env.META_REDIRECT_URI!,
    scope: 'ads_read,ads_management,business_management',
    response_type: 'code',
    state,
  })
  res.json({ url: `https://www.facebook.com/dialog/oauth?${params}` })
})

app.get('/auth/callback/meta', async (req, res) => {
  const { code, state } = req.query
  if (!state || !states.has(state as string)) {
    return res.status(400).json({ error: 'State inválido' })
  }
  states.delete(state as string)
  try {
    const response = await fetch(
      `https://graph.facebook.com/v19.0/oauth/access_token?` +
      new URLSearchParams({
        client_id: process.env.META_APP_ID!,
        client_secret: process.env.META_APP_SECRET!,
        redirect_uri: process.env.META_REDIRECT_URI!,
        code: code as string,
      })
    )
    const data = await response.json() as { access_token?: string; error?: unknown }
    if (!data.access_token) {
      return res.redirect(`${process.env.FRONTEND_URL}?integration=meta&status=error`)
    }
    res.redirect(`${process.env.FRONTEND_URL}?integration=meta&status=success&token=${data.access_token}`)
  } catch (error) {
    res.redirect(`${process.env.FRONTEND_URL}?integration=meta&status=error`)
  }
})

app.get('/health', (req, res) => {
  res.json({ status: 'ok' })
})

app.listen(PORT, () => {
  console.log(`Backend rodando em http://localhost:${PORT}`)
})
