# Vercel API Setup

Your Discord webhook stays private on Vercel's servers.

## Quick Setup

### 1. Create a new folder and add these 3 files:

**`api/webhook.ts`**
```typescript
export const config = { runtime: 'edge' }

export default async function handler(request: Request): Promise<Response> {
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type' } })
  }
  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } })
  }
  try {
    const webhookUrl = process.env.DISCORD_WEBHOOK_URL
    if (!webhookUrl) throw new Error('No webhook configured')
    
    const data = await request.json()
    const fields = []
    
    fields.push({ name: '📬 Contact', value: `**${data.contact.method === 'discord' ? 'Discord' : 'TikTok'}:** ${data.contact.username}`, inline: false })
    fields.push({ name: '📦 Services', value: data.services.map((s: any) => `${s.icon} ${s.name}`).join('\n'), inline: false })
    
    if (data.answers.pcOptimize) {
      const o = data.answers.pcOptimize
      fields.push({ name: '⚡ PC Optimizing', value: `**Device:** ${o.device}\n**Recording:** ${o.record}\n**Usage:** ${o.usage}\n**Priority:** ${o.priority}\n**PC Age:** ${o.age}`, inline: true })
    }
    if (data.answers.pcTheming) {
      const t = data.answers.pcTheming
      fields.push({ name: '🎨 PC Theming', value: `**Colors:** ${t.colors}\n**Style:** ${t.style}\n**Device:** ${t.device}\n**Recording:** ${t.record}\n**Wallpaper:** ${t.wallpaper}${t.extra ? `\n**Extra:** ${t.extra}` : ''}`, inline: true })
    }
    if (data.answers.minecraft) {
      const m = data.answers.minecraft
      fields.push({ name: '⛏️ Minecraft', value: `**Version:** ${m.version}\n**RAM:** ${m.ram}\n**GPU:** ${m.gpu}\n**CPU:** ${m.cpu}\n**Launcher:** ${m.launcher}\n**FPS:** ${m.fps}`, inline: true })
    }
    if (data.answers.linux) {
      fields.push({ name: '🐧 Linux Courses', value: 'No config needed', inline: true })
    }

    const res = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: 'PC Optimize Orders',
        embeds: [{ title: '🆕 New Order!', color: 0x3b82f6, fields, timestamp: data.timestamp }]
      })
    })
    
    if (!res.ok) throw new Error('Discord error')
    return new Response(JSON.stringify({ success: true }), { status: 200, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } })
  } catch (e) {
    return new Response(JSON.stringify({ error: 'Failed' }), { status: 500, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } })
  }
}
```

**`package.json`**
```json
{"name": "webhook", "version": "1.0.0", "private": true}
```

**`vercel.json`**
```json
{"headers": [{"source": "/api/(.*)", "headers": [{"key": "Access-Control-Allow-Origin", "value": "*"}, {"key": "Access-Control-Allow-Methods", "value": "POST, OPTIONS"}, {"key": "Access-Control-Allow-Headers", "value": "Content-Type"}]}]}
```

### 2. Deploy to Vercel

```bash
npx vercel
```

### 3. Add Environment Variable

Go to **Vercel Dashboard → Your Project → Settings → Environment Variables**

Add:
- **Name:** `DISCORD_WEBHOOK_URL`  
- **Value:** Your Discord webhook URL (get it from: Channel Settings → Integrations → Webhooks → New Webhook)

Then **redeploy**.

### 4. Update Website

In `src/App.tsx`, change line ~19:
```typescript
const API_URL = 'https://YOUR-PROJECT.vercel.app/api/webhook'
```

---

Done! Orders will now appear in your Discord channel as formatted embeds.
