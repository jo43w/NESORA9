import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import crypto from 'node:crypto'
import fs from 'node:fs'

dotenv.config()
const app = express()
const port = Number(process.env.PORT || 8787)
const adminPassword = process.env.ADMIN_PASSWORD || 'change-this-server-only'
const whatsappNumber = '201225775453'
const __dirname = path.dirname(fileURLToPath(import.meta.url))
const dataFile = path.join(__dirname, 'coolfix-data.json')
const readData = () => fs.existsSync(dataFile) ? JSON.parse(fs.readFileSync(dataFile, 'utf8')) : { requests: [], technicians: [] }
const writeData = data => fs.writeFileSync(dataFile, JSON.stringify(data, null, 2))

app.use(cors())
app.use(express.json({ limit: '2mb' }))

const createRequestId = () => `CF-${Math.floor(1000 + Math.random() * 9000)}`
const adminToken = () => crypto.createHash('sha256').update(`${adminPassword}:${new Date().toDateString()}`).digest('hex')
const formatWhatsApp = (data, id) => {
  const image = data.hasImage ? 'نعم' : 'لا'
  const text = `🔧 طلب صيانة جديد - NESORA\n\nرقم الطلب: ${id}\n\n👤 بيانات العميل:\nالاسم: ${data.name}\nالهاتف: ${data.phone}\nWhatsApp: ${data.whatsapp || 'غير متوفر'}\n\n📍 الموقع:\nالمحافظة: ${data.governorate}\nالمنطقة: ${data.area}\nالعنوان: ${data.address}\n\n❄️ تفاصيل الخدمة:\nالخدمة: ${data.service}\nنوع التكييف: ${data.acType || 'غير محدد'}\nالماركة: ${data.brand || 'غير محددة'}\nوصف المشكلة: ${data.problem || 'غير متوفر'}\n\n📅 الموعد المطلوب:\nالتاريخ: ${data.date || 'مرن'}\nالوقت: ${data.time || 'مرن'}\n\n📸 توجد صورة مرفقة: ${image}\n\nيرجى التواصل مع العميل وتعيين الفني المناسب.`
  return `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(text)}`
}

app.post('/api/requests', (req, res) => {
  const data = req.body
  if (!data.name || !data.phone || !data.governorate || !data.area || !data.address || !data.service || !data.consent) {
    return res.status(400).json({ error: 'يرجى إكمال الحقول المطلوبة والموافقة على التواصل.' })
  }
  const id = createRequestId()
  const store = readData()
  store.requests.unshift({ id, ...data, hasImage: Boolean(data.hasImage), status: 'جديد', createdAt: new Date().toISOString() })
  writeData(store)
  res.status(201).json({ id, whatsappUrl: formatWhatsApp(data, id) })
})

app.post('/api/technicians', (req, res) => {
  const data = req.body
  if (!data.name || !data.phone || !data.governorate || !data.area || !data.consent) return res.status(400).json({ error: 'يرجى إكمال الحقول المطلوبة.' })
  const store = readData()
  const id = Date.now()
  store.technicians.unshift({ id, ...data, status: 'قيد المراجعة', createdAt: new Date().toISOString() })
  writeData(store)
  const text = `👨‍🔧 طلب انضمام فني جديد - NESORA\n\nالاسم: ${data.name}\nرقم الهاتف: ${data.phone}\nWhatsApp: ${data.whatsapp || 'غير متوفر'}\nالمحافظة: ${data.governorate}\nالمنطقة: ${data.area}\nسنوات الخبرة: ${data.experience || 'غير محددة'}\n\nالتخصص: ${data.specialty || 'غير محدد'}\nالخدمات: ${data.services || 'غير محددة'}\nأنواع التكييفات: ${data.acTypes || 'غير محددة'}\n\nأيام العمل: ${data.days || 'غير محددة'}\nأوقات العمل: ${data.hours || 'غير محددة'}\n\nيمتلك معدات: ${data.equipment === 'yes' ? 'نعم' : 'لا'}\n\nنبذة:\n${data.bio || 'غير متوفرة'}\n\nيرجى مراجعة بيانات الفني والتواصل معه.`
  res.status(201).json({ id, whatsappUrl: `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(text)}` })
})

app.post('/api/admin/login', (req, res) => {
  if (req.body.password !== adminPassword) return res.status(401).json({ error: 'بيانات الدخول غير صحيحة.' })
  res.json({ token: adminToken() })
})

const requireAdmin = (req, res, next) => {
  if (req.headers.authorization !== adminToken()) return res.status(401).json({ error: 'غير مصرح.' })
  next()
}
app.get('/api/admin/overview', requireAdmin, (req, res) => {
  const store = readData()
  res.json({ requests: store.requests, technicians: store.technicians })
})
app.patch('/api/admin/requests/:id', requireAdmin, (req, res) => {
  const store = readData()
  const request = store.requests.find(item => item.id === req.params.id)
  if (request) request.status = req.body.status
  writeData(store)
  res.json({ ok: true })
})

app.listen(port, () => console.log(`NESORA API listening on http://localhost:${port}`))
