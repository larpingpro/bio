import { useState, useCallback, type ReactNode } from 'react'

/* ─── Types ─────────────────────────────────────────────── */
type CommMethod = 'tiktok' | 'discord' | ''

interface Answers {
  [key: string]: string
}

interface QuestionDef {
  service: string
  key: string
  label: string
  hint?: string
  type: 'chips' | 'wallpaper' | 'textarea' | 'text' | 'specs'
  options?: string[]
  placeholder?: string
  optional?: boolean
}

/* ─── CONFIG — Change this to your Vercel API URL ─────── */
const API_URL = 'https://your-vercel-app.vercel.app/api/webhook'

/* ─── Constants ─────────────────────────────────────────── */
const WALLPAPERS = [
  { id: 'midnight', name: 'Midnight', src: '/wallpapers/midnight.jpg' },
  { id: 'ocean',    name: 'Ocean',    src: '/wallpapers/ocean.jpg' },
  { id: 'neon',     name: 'Neon City', src: '/wallpapers/neon.jpg' },
  { id: 'forest',   name: 'Forest',   src: '/wallpapers/forest.jpg' },
  { id: 'abstract', name: 'Abstract', src: '/wallpapers/abstract.jpg' },
]

const SERVICES = [
  { id: 'pc-optimize',  name: 'PC Optimizing',        icon: '⚡', desc: 'Full system tune-up for peak performance' },
  { id: 'linux',        name: 'Linux Courses',         icon: '🐧', desc: 'Learn Linux from the ground up' },
  { id: 'pc-theme',     name: 'PC Theming',            icon: '🎨', desc: 'Custom themes, wallpapers & visual setup' },
  { id: 'mc-optimize',  name: 'Minecraft Optimizing',  icon: '⛏️', desc: 'Maximize your Minecraft FPS' },
]

const HAS_QUESTIONS = ['pc-optimize', 'pc-theme', 'mc-optimize']

/* ── Question definitions per service ── */
const THEME_QUESTIONS: QuestionDef[] = [
  { service: 'pc-theme', key: 'theme_colors',    label: 'Colors:',                       hint: 'Pick a color palette for your setup.',                                    type: 'chips', options: ['Dark', 'Light', 'Blue', 'Pink', "I don't care"] },
  { service: 'pc-theme', key: 'theme_style',     label: 'What style do you like?',        hint: 'How should Windows itself and the taskbar look.',                          type: 'chips', options: ['Translucent', 'Basic', 'Acrylic', "I don't care"] },
  { service: 'pc-theme', key: 'theme_device',    label: 'Desktop PC or laptop?',          hint: 'So I know the job.',                                                      type: 'chips', options: ['Desktop PC', 'Laptop'] },
  { service: 'pc-theme', key: 'theme_record',    label: 'Can I record the session?',      hint: 'It might end up in a TikTok — private stuff always censored.',             type: 'chips', options: ['Yes, go for it', 'Yes, but blur my personal stuff', "No, please don't"] },
  { service: 'pc-theme', key: 'theme_wallpaper', label: 'Pick a wallpaper:',              hint: 'Tap one you like — or keep the one you already have.',                     type: 'wallpaper' },
  { service: 'pc-theme', key: 'theme_extra',     label: 'Anything else you want?',        hint: 'Colors, a program you want set up, a special request — optional.',         type: 'textarea', optional: true },
]

const OPTIMIZE_QUESTIONS: QuestionDef[] = [
  { service: 'pc-optimize', key: 'opt_device',   label: 'Desktop PC or laptop?',          hint: 'So I know the job.',                                                      type: 'chips', options: ['Desktop PC', 'Laptop'] },
  { service: 'pc-optimize', key: 'opt_record',   label: 'Can I record the session?',      hint: 'It might end up in a TikTok — private stuff always censored.',             type: 'chips', options: ['Yes, go for it', 'Yes, but blur my personal stuff', "No, please don't"] },
  { service: 'pc-optimize', key: 'opt_usage',    label: 'What do you use the PC for?',    hint: 'So the setup fits you.',                                                  type: 'chips', options: ['Gaming', 'Work', 'Both', 'Other'] },
  { service: 'pc-optimize', key: 'opt_priority', label: 'What matters more?',             hint: 'There are no wrong answers.',                                             type: 'chips', options: ['FPS', 'Looks', 'Equal'] },
  { service: 'pc-optimize', key: 'opt_age',      label: 'How old is it?',                 hint: 'Roughly is fine.',                                                        type: 'chips', options: ['Brand new', '1–3 years', '3–5 years', '5+ years', 'No idea'] },
]

const MC_QUESTIONS: QuestionDef[] = [
  { service: 'mc-optimize', key: 'mc_version',   label: 'What version do you play on?',   type: 'text',  placeholder: 'e.g. 1.20.4' },
  { service: 'mc-optimize', key: 'mc_specs',     label: 'What are your PC specs?',        type: 'specs' },
  { service: 'mc-optimize', key: 'mc_launcher',  label: 'What launcher do you use?',      type: 'text',  placeholder: 'e.g. Prism Launcher, CurseForge, Vanilla' },
  { service: 'mc-optimize', key: 'mc_fps',       label: 'What is your current average FPS?', type: 'chips', options: ['10–30', '30–60', '60–144', '144+'] },
]

const SERVICE_QUESTIONS: Record<string, QuestionDef[]> = {
  'pc-optimize': OPTIMIZE_QUESTIONS,
  'pc-theme':    THEME_QUESTIONS,
  'mc-optimize': MC_QUESTIONS,
}

/* ─── Reusable Components ───────────────────────────────── */

function PageShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-grid relative">
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute top-[-20%] left-1/2 -translate-x-1/2 w-[800px] h-[600px] rounded-full bg-blue-600/[0.04] blur-[120px]" />
      </div>
      <div className="relative z-10 max-w-2xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        {children}
      </div>
    </div>
  )
}

function Header({ progress }: { progress: number }) {
  return (
    <div className="mb-10 animate-fadeIn">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-sm font-bold text-white">O</div>
          <span className="text-white font-semibold tracking-tight text-lg">Optimize</span>
        </div>
      </div>
      <div className="h-1 bg-dark-800 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-blue-600 to-blue-400 rounded-full transition-all duration-700 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  )
}

function OptionCard({ selected, onClick, children, className = '' }: {
  selected: boolean; onClick: () => void; children: ReactNode; className?: string
}) {
  return (
    <button
      onClick={onClick}
      className={`option-card p-4 rounded-xl border-2 text-left w-full cursor-pointer
        ${selected
          ? 'border-blue-500/70 bg-blue-500/[0.08] text-white shadow-[0_0_24px_rgba(59,130,246,0.1)]'
          : 'border-zinc-800/80 bg-dark-900/60 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200 hover:bg-dark-800/40'}
        ${className}`}
    >
      {children}
    </button>
  )
}

function PrimaryButton({ onClick, disabled, loading, children, className = '' }: {
  onClick: () => void; disabled?: boolean; loading?: boolean; children: ReactNode; className?: string
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      className={`w-full py-3.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold
        transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed
        disabled:hover:bg-blue-600 active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2 ${className}`}
    >
      {loading && (
        <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      )}
      {children}
    </button>
  )
}

function BackButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="text-sm text-zinc-500 hover:text-zinc-300 transition-colors flex items-center gap-1.5 mb-6 cursor-pointer"
    >
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
      </svg>
      Back
    </button>
  )
}

function TextInput({ value, onChange, placeholder, onKeyDown }: {
  value: string; onChange: (v: string) => void; placeholder?: string; onKeyDown?: (e: React.KeyboardEvent) => void
}) {
  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onKeyDown={onKeyDown}
      placeholder={placeholder}
      className="w-full bg-dark-800/70 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-white
        placeholder-zinc-600 focus:outline-none focus:border-blue-500/60 transition-colors"
    />
  )
}

/* ─── Main App ──────────────────────────────────────────── */

export default function App() {
  const [step, setStep] = useState(0)
  const [commMethod, setCommMethod] = useState<CommMethod>('')
  const [username, setUsername] = useState('')
  const [cart, setCart] = useState<string[]>([])
  const [questionIndex, setQuestionIndex] = useState(0)
  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [answers, setAnswers] = useState<Answers>({})
  const [animKey, setAnimKey] = useState(0)

  /* ── Build flat question list from cart ── */
  const allQuestions: QuestionDef[] = []
  for (const svcId of cart) {
    const qs = SERVICE_QUESTIONS[svcId]
    if (qs) allQuestions.push(...qs)
  }

  const totalQuestions = allQuestions.length
  const servicesWithQ = cart.filter(s => HAS_QUESTIONS.includes(s))

  /* ── Progress calculation ── */
  const getProgress = () => {
    const baseSteps = 3
    const total = baseSteps + totalQuestions + 1
    if (step < 3) return ((step + 1) / total) * 100
    if (step === 3) return ((baseSteps + questionIndex + 1) / total) * 100
    return 100
  }

  const getServiceName = (id: string) => SERVICES.find(s => s.id === id)?.name || id

  const toggleService = (id: string) => {
    setCart(prev => prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id])
  }

  const goTo = useCallback((s: number) => {
    setStep(s)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [])

  const handleCheckout = () => {
    if (servicesWithQ.length > 0) {
      setQuestionIndex(0)
      setAnimKey(k => k + 1)
      goTo(3)
    } else {
      goTo(4)
    }
  }

  const setAnswer = (key: string, value: string, autoAdvance = false) => {
    setAnswers(prev => ({ ...prev, [key]: value }))
    if (autoAdvance) {
      setTimeout(() => advanceQuestion(), 250)
    }
  }

  const advanceQuestion = () => {
    if (questionIndex < totalQuestions - 1) {
      setQuestionIndex(i => i + 1)
      setAnimKey(k => k + 1)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } else {
      goTo(4)
    }
  }

  const goBackQuestion = () => {
    if (questionIndex > 0) {
      setQuestionIndex(i => i - 1)
      setAnimKey(k => k + 1)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } else {
      goTo(2)
    }
  }

  /* ── Build order data for API ── */
  const buildOrderData = () => {
    return {
      contact: {
        method: commMethod,
        username: username,
      },
      services: cart.map(id => ({
        id,
        name: getServiceName(id),
        icon: SERVICES.find(s => s.id === id)?.icon || '',
      })),
      answers: {
        ...(cart.includes('pc-optimize') && {
          pcOptimize: {
            device: answers.opt_device || '',
            record: answers.opt_record || '',
            usage: answers.opt_usage || '',
            priority: answers.opt_priority || '',
            age: answers.opt_age || '',
          }
        }),
        ...(cart.includes('pc-theme') && {
          pcTheming: {
            colors: answers.theme_colors || '',
            style: answers.theme_style || '',
            device: answers.theme_device || '',
            record: answers.theme_record || '',
            wallpaper: answers.theme_wallpaper || '',
            extra: answers.theme_extra || '',
          }
        }),
        ...(cart.includes('mc-optimize') && {
          minecraft: {
            version: answers.mc_version || '',
            ram: answers.mc_ram || '',
            gpu: answers.mc_gpu || '',
            cpu: answers.mc_cpu || '',
            launcher: answers.mc_launcher || '',
            fps: answers.mc_fps || '',
          }
        }),
        ...(cart.includes('linux') && {
          linux: { note: 'No configuration needed' }
        }),
      },
      timestamp: new Date().toISOString(),
    }
  }

  /* ── Submit order to Vercel API ── */
  const handleSubmit = async () => {
    setSubmitting(true)
    setSubmitError('')

    try {
      const orderData = buildOrderData()
      
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderData),
      })

      if (!response.ok) {
        throw new Error('Failed to submit order')
      }

      setSubmitted(true)
    } catch (err) {
      console.error('Submit error:', err)
      setSubmitError('Failed to submit order. Please try again or contact us on Discord.')
    } finally {
      setSubmitting(false)
    }
  }

  /* ═══════════════════════════════════════════════════════
     STEP 0 — Communication Method
     ═══════════════════════════════════════════════════════ */
  const renderCommunication = () => (
    <PageShell>
      <Header progress={getProgress()} />
      <div className="animate-fadeInUp">
        <div className="text-center mb-10">
          <div className="text-5xl mb-4 animate-float">🖥️</div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white mb-2 tracking-tight">
            Let's get started
          </h1>
          <p className="text-zinc-500 text-base">How should we reach you?</p>
        </div>
        <div className="grid grid-cols-2 gap-4 max-w-sm mx-auto mb-8">
          <OptionCard selected={commMethod === 'discord'} onClick={() => setCommMethod('discord')} className="animate-fadeIn stagger-1">
            <div className="text-center py-4">
              <div className="text-3xl mb-2">💬</div>
              <div className="font-semibold text-base">Discord</div>
            </div>
          </OptionCard>
          <OptionCard selected={commMethod === 'tiktok'} onClick={() => setCommMethod('tiktok')} className="animate-fadeIn stagger-2">
            <div className="text-center py-4">
              <div className="text-3xl mb-2">📱</div>
              <div className="font-semibold text-base">TikTok</div>
            </div>
          </OptionCard>
        </div>
        {commMethod && (
          <div className="max-w-sm mx-auto space-y-4 animate-fadeIn">
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-2 uppercase tracking-wider">
                Your {commMethod === 'discord' ? 'Discord' : 'TikTok'} username
              </label>
              <TextInput
                value={username}
                onChange={setUsername}
                placeholder={commMethod === 'discord' ? 'username' : '@username'}
                onKeyDown={(e) => { if (e.key === 'Enter' && username) goTo(1) }}
              />
            </div>
            <PrimaryButton onClick={() => { if (username) goTo(1) }} disabled={!username}>
              Continue
            </PrimaryButton>
          </div>
        )}
      </div>
    </PageShell>
  )

  /* ═══════════════════════════════════════════════════════
     STEP 1 — Order Type
     ═══════════════════════════════════════════════════════ */
  const renderOrderType = () => (
    <PageShell>
      <Header progress={getProgress()} />
      <BackButton onClick={() => goTo(0)} />
      <div className="animate-fadeInUp">
        <div className="text-center mb-10">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white mb-2 tracking-tight">
            How would you like to order?
          </h1>
          <p className="text-zinc-500">Pick the option that works best for you</p>
        </div>
        <div className="space-y-4 max-w-md mx-auto">
          <button
            onClick={() => goTo(2)}
            className="option-card w-full glass rounded-2xl p-6 text-left cursor-pointer
              border border-blue-500/20 hover:border-blue-500/40 group animate-fadeIn stagger-1"
          >
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-blue-600/20 flex items-center justify-center text-xl shrink-0 group-hover:scale-110 transition-transform">⚡</div>
              <div>
                <h3 className="text-lg font-bold text-white mb-1">Quick Order</h3>
                <p className="text-sm text-zinc-500">Pick your services and customize everything right here on the website. Fast and easy.</p>
                <div className="mt-3 text-xs font-medium text-blue-400 flex items-center gap-1">
                  Get started
                  <svg className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                  </svg>
                </div>
              </div>
            </div>
          </button>
          <a
            href="https://discord.gg/aSV2PV7zJ"
            target="_blank"
            rel="noopener noreferrer"
            className="option-card w-full glass rounded-2xl p-6 text-left cursor-pointer block
              border border-zinc-800 hover:border-zinc-600 group animate-fadeIn stagger-2"
          >
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-indigo-600/20 flex items-center justify-center text-xl shrink-0 group-hover:scale-110 transition-transform">💬</div>
              <div>
                <h3 className="text-lg font-bold text-white mb-1">Normal Order</h3>
                <p className="text-sm text-zinc-500">Join our Discord server and talk to us directly. We'll sort everything out together.</p>
                <div className="mt-3 text-xs font-medium text-indigo-400 flex items-center gap-1">
                  Open Discord
                  <svg className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                  </svg>
                </div>
              </div>
            </div>
          </a>
        </div>
      </div>
    </PageShell>
  )

  /* ═══════════════════════════════════════════════════════
     STEP 2 — Service Selection
     ═══════════════════════════════════════════════════════ */
  const renderServices = () => (
    <PageShell>
      <Header progress={getProgress()} />
      <BackButton onClick={() => goTo(1)} />
      <div className="animate-fadeInUp">
        <div className="text-center mb-10">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white mb-2 tracking-tight">Build your bundle</h1>
          <p className="text-zinc-500">Select the services you need — add as many as you want</p>
        </div>
        <div className="grid gap-3 mb-8">
          {SERVICES.map((service, i) => {
            const inCart = cart.includes(service.id)
            return (
              <button
                key={service.id}
                onClick={() => toggleService(service.id)}
                className={`animate-fadeIn stagger-${i + 1} option-card w-full rounded-xl p-5 text-left cursor-pointer
                  border-2 transition-all duration-200 flex items-center gap-4
                  ${inCart
                    ? 'border-blue-500/60 bg-blue-500/[0.07]'
                    : 'border-zinc-800/70 bg-dark-900/50 hover:border-zinc-700'}`}
              >
                <div className="text-2xl w-10 h-10 flex items-center justify-center shrink-0">{service.icon}</div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-white text-sm">{service.name}</div>
                  <div className="text-xs text-zinc-500 mt-0.5">{service.desc}</div>
                </div>
                <div className={`w-6 h-6 rounded-md border-2 flex items-center justify-center shrink-0 transition-all
                  ${inCart ? 'bg-blue-600 border-blue-500' : 'border-zinc-700'}`}>
                  {inCart && (
                    <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                  )}
                </div>
              </button>
            )
          })}
        </div>
        {cart.length > 0 && (
          <div className="animate-fadeIn">
            <div className="glass rounded-xl p-4 mb-4">
              <div className="text-xs uppercase tracking-wider text-zinc-500 font-medium mb-2">Your bundle</div>
              <div className="flex flex-wrap gap-2">
                {cart.map(id => (
                  <span key={id} className="px-3 py-1 bg-blue-600/15 border border-blue-500/30 rounded-lg text-xs font-medium text-blue-300">
                    {getServiceName(id)}
                  </span>
                ))}
              </div>
            </div>
            <PrimaryButton onClick={handleCheckout}>
              Checkout ({cart.length} {cart.length === 1 ? 'service' : 'services'})
            </PrimaryButton>
          </div>
        )}
      </div>
    </PageShell>
  )

  /* ═══════════════════════════════════════════════════════
     STEP 3 — One Question at a Time
     ═══════════════════════════════════════════════════════ */
  const renderQuestions = () => {
    if (allQuestions.length === 0) return null
    const q = allQuestions[questionIndex]
    if (!q) { goTo(4); return null }

    const currentVal = answers[q.key] || ''
    const serviceName = getServiceName(q.service)
    const serviceIcon = SERVICES.find(s => s.id === q.service)?.icon || ''

    return (
      <PageShell>
        <Header progress={getProgress()} />
        <BackButton onClick={goBackQuestion} />

        <div className="animate-fadeIn" key={animKey}>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-blue-400 uppercase tracking-wider">Customize your order</span>
            </div>
            <span className="text-xs text-zinc-600 font-medium">{questionIndex + 1} / {totalQuestions}</span>
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-dark-800/80 border border-zinc-800 rounded-lg text-xs text-zinc-400 mb-6">
            <span>{serviceIcon}</span> {serviceName}
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mb-2">
            {q.label}
          </h1>
          {q.hint && <p className="text-sm text-zinc-500 mb-8">{q.hint}</p>}
          {!q.hint && <div className="mb-8" />}

          {q.type === 'chips' && (
            <div className="grid gap-3">
              {q.options!.map((opt) => (
                <button
                  key={opt}
                  onClick={() => setAnswer(q.key, opt, true)}
                  className={`option-card w-full rounded-xl px-5 py-4 text-left cursor-pointer border-2 transition-all duration-200
                    flex items-center gap-4
                    ${currentVal === opt
                      ? 'border-blue-500/70 bg-blue-500/[0.08] text-white shadow-[0_0_20px_rgba(59,130,246,0.08)]'
                      : 'border-zinc-800/80 bg-dark-900/50 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'}`}
                >
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all
                    ${currentVal === opt ? 'border-blue-500 bg-blue-600' : 'border-zinc-700'}`}>
                    {currentVal === opt && (
                      <div className="w-2 h-2 bg-white rounded-full" />
                    )}
                  </div>
                  <span className="font-medium text-sm">{opt}</span>
                </button>
              ))}
            </div>
          )}

          {q.type === 'text' && (
            <div className="space-y-4">
              <TextInput
                value={currentVal}
                onChange={(v) => setAnswer(q.key, v)}
                placeholder={q.placeholder}
                onKeyDown={(e) => { if (e.key === 'Enter' && currentVal) advanceQuestion() }}
              />
              <PrimaryButton onClick={advanceQuestion} disabled={!currentVal}>
                Next
              </PrimaryButton>
            </div>
          )}

          {q.type === 'textarea' && (
            <div className="space-y-4">
              <textarea
                value={currentVal}
                onChange={(e) => setAnswer(q.key, e.target.value)}
                placeholder="Type here..."
                rows={4}
                className="w-full bg-dark-800/70 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-white
                  placeholder-zinc-600 focus:outline-none focus:border-blue-500/60 transition-colors resize-none"
              />
              <PrimaryButton onClick={advanceQuestion}>
                {currentVal ? 'Next' : 'Skip'}
              </PrimaryButton>
            </div>
          )}

          {q.type === 'wallpaper' && (
            <div className="space-y-5">
              <div className="grid grid-cols-3 gap-3">
                {WALLPAPERS.map(wp => (
                  <button
                    key={wp.id}
                    onClick={() => setAnswer(q.key, wp.name)}
                    className={`cursor-pointer rounded-xl overflow-hidden border-2 transition-all duration-200 group
                      ${currentVal === wp.name
                        ? 'border-blue-500 shadow-[0_0_20px_rgba(59,130,246,0.15)] scale-[1.02]'
                        : 'border-zinc-800 hover:border-zinc-600'}`}
                  >
                    <div className="aspect-video relative">
                      <img src={wp.src} alt={wp.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                      {currentVal === wp.name && (
                        <div className="absolute inset-0 bg-blue-600/20 flex items-center justify-center">
                          <div className="w-7 h-7 bg-blue-600 rounded-full flex items-center justify-center">
                            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                            </svg>
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="px-2 py-1.5 bg-dark-900 text-xs text-zinc-400 text-center font-medium">{wp.name}</div>
                  </button>
                ))}
                <button
                  onClick={() => setAnswer(q.key, 'Keep mine')}
                  className={`cursor-pointer rounded-xl overflow-hidden border-2 transition-all duration-200
                    ${currentVal === 'Keep mine'
                      ? 'border-blue-500 shadow-[0_0_20px_rgba(59,130,246,0.15)] scale-[1.02]'
                      : 'border-zinc-800 hover:border-zinc-600'}`}
                >
                  <div className="aspect-video bg-dark-800 flex items-center justify-center">
                    <div className="text-center">
                      <div className="text-2xl mb-1">🖼️</div>
                      <div className="text-xs text-zinc-500">Current</div>
                    </div>
                  </div>
                  <div className="px-2 py-1.5 bg-dark-900 text-xs text-zinc-400 text-center font-medium">Keep mine</div>
                </button>
              </div>
              <PrimaryButton onClick={advanceQuestion} disabled={!currentVal}>
                Next
              </PrimaryButton>
            </div>
          )}

          {q.type === 'specs' && (
            <div className="space-y-4">
              <div className="space-y-3">
                <div>
                  <label className="block text-xs text-zinc-500 mb-1.5 font-medium uppercase tracking-wider">RAM</label>
                  <TextInput
                    value={answers.mc_ram || ''}
                    onChange={(v) => setAnswer('mc_ram', v)}
                    placeholder="e.g. 16 GB"
                  />
                </div>
                <div>
                  <label className="block text-xs text-zinc-500 mb-1.5 font-medium uppercase tracking-wider">GPU</label>
                  <TextInput
                    value={answers.mc_gpu || ''}
                    onChange={(v) => setAnswer('mc_gpu', v)}
                    placeholder="e.g. RTX 3060"
                  />
                </div>
                <div>
                  <label className="block text-xs text-zinc-500 mb-1.5 font-medium uppercase tracking-wider">CPU</label>
                  <TextInput
                    value={answers.mc_cpu || ''}
                    onChange={(v) => setAnswer('mc_cpu', v)}
                    placeholder="e.g. Ryzen 5 5600X"
                  />
                </div>
              </div>
              <PrimaryButton
                onClick={advanceQuestion}
                disabled={!(answers.mc_ram && answers.mc_gpu && answers.mc_cpu)}
              >
                Next
              </PrimaryButton>
            </div>
          )}
        </div>
      </PageShell>
    )
  }

  /* ═══════════════════════════════════════════════════════
     STEP 4 — Summary
     ═══════════════════════════════════════════════════════ */
  const renderSummary = () => (
    <PageShell>
      <Header progress={100} />
      <BackButton onClick={() => {
        if (totalQuestions > 0) {
          setQuestionIndex(totalQuestions - 1)
          setAnimKey(k => k + 1)
          setStep(3)
        } else {
          goTo(2)
        }
      }} />
      <div className="animate-fadeInUp">
        <div className="text-center mb-8">
          <div className="text-4xl mb-3">📋</div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white mb-2 tracking-tight">Order Summary</h1>
          <p className="text-zinc-500">Review everything before submitting</p>
        </div>

        <div className="space-y-4 mb-8">
          {/* Contact */}
          <div className="glass rounded-xl p-5">
            <div className="text-xs uppercase tracking-wider text-zinc-500 font-medium mb-3">Contact</div>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-blue-600/20 flex items-center justify-center text-lg">
                {commMethod === 'discord' ? '💬' : '📱'}
              </div>
              <div>
                <div className="text-sm font-semibold text-white">{commMethod === 'discord' ? 'Discord' : 'TikTok'}</div>
                <div className="text-xs text-zinc-400">{username}</div>
              </div>
            </div>
          </div>

          {/* Services */}
          <div className="glass rounded-xl p-5">
            <div className="text-xs uppercase tracking-wider text-zinc-500 font-medium mb-3">Services</div>
            <div className="flex flex-wrap gap-2">
              {cart.map(id => {
                const svc = SERVICES.find(s => s.id === id)!
                return (
                  <span key={id} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600/10 border border-blue-500/20 rounded-lg text-sm text-blue-300">
                    <span>{svc.icon}</span> {svc.name}
                  </span>
                )
              })}
            </div>
          </div>

          {/* PC Optimize */}
          {cart.includes('pc-optimize') && (
            <div className="glass rounded-xl p-5">
              <div className="text-xs uppercase tracking-wider text-zinc-500 font-medium mb-3">⚡ PC Optimizing</div>
              <div className="grid grid-cols-2 gap-3">
                <SummaryItem label="Device" value={answers.opt_device} />
                <SummaryItem label="Recording" value={answers.opt_record} />
                <SummaryItem label="Usage" value={answers.opt_usage} />
                <SummaryItem label="Priority" value={answers.opt_priority} />
                <SummaryItem label="PC Age" value={answers.opt_age} />
              </div>
            </div>
          )}

          {/* PC Theming */}
          {cart.includes('pc-theme') && (
            <div className="glass rounded-xl p-5">
              <div className="text-xs uppercase tracking-wider text-zinc-500 font-medium mb-3">🎨 PC Theming</div>
              <div className="grid grid-cols-2 gap-3">
                <SummaryItem label="Colors" value={answers.theme_colors} />
                <SummaryItem label="Style" value={answers.theme_style} />
                <SummaryItem label="Device" value={answers.theme_device} />
                <SummaryItem label="Recording" value={answers.theme_record} />
                <SummaryItem label="Wallpaper" value={answers.theme_wallpaper} />
                {answers.theme_extra && <SummaryItem label="Extra" value={answers.theme_extra} />}
              </div>
            </div>
          )}

          {/* Minecraft */}
          {cart.includes('mc-optimize') && (
            <div className="glass rounded-xl p-5">
              <div className="text-xs uppercase tracking-wider text-zinc-500 font-medium mb-3">⛏️ Minecraft Optimizing</div>
              <div className="grid grid-cols-2 gap-3">
                <SummaryItem label="Version" value={answers.mc_version} />
                <SummaryItem label="RAM" value={answers.mc_ram} />
                <SummaryItem label="GPU" value={answers.mc_gpu} />
                <SummaryItem label="CPU" value={answers.mc_cpu} />
                <SummaryItem label="Launcher" value={answers.mc_launcher} />
                <SummaryItem label="Current FPS" value={answers.mc_fps} />
              </div>
            </div>
          )}

          {/* Linux */}
          {cart.includes('linux') && (
            <div className="glass rounded-xl p-5">
              <div className="text-xs uppercase tracking-wider text-zinc-500 font-medium mb-3">🐧 Linux Courses</div>
              <p className="text-sm text-zinc-400">No additional configuration needed.</p>
            </div>
          )}
        </div>

        {!submitted ? (
          <div className="space-y-3">
            <PrimaryButton onClick={handleSubmit} loading={submitting} disabled={submitting}>
              {submitting ? 'Submitting...' : 'Submit Order'}
            </PrimaryButton>
            {submitError && (
              <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm text-center">
                {submitError}
              </div>
            )}
          </div>
        ) : (
          <div className="animate-fadeIn text-center">
            <div className="glass rounded-xl p-6 mb-4">
              <div className="text-3xl mb-2">✅</div>
              <h3 className="text-lg font-bold text-white mb-1">Order submitted!</h3>
              <p className="text-sm text-zinc-400">
                We've received your order and will reach out to you on {commMethod === 'discord' ? 'Discord' : 'TikTok'} soon.
              </p>
            </div>
            {commMethod === 'discord' && (
              <a
                href="https://discord.gg/aSV2PV7zJ"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500
                  text-white font-semibold transition-colors"
              >
                💬 Join our Discord
              </a>
            )}
            <button
              onClick={() => {
                setStep(0); setCommMethod(''); setUsername(''); setCart([])
                setQuestionIndex(0); setSubmitted(false); setSubmitError(''); setAnswers({}); setAnimKey(0)
              }}
              className="block mx-auto mt-4 text-sm text-zinc-500 hover:text-zinc-300 transition-colors cursor-pointer"
            >
              Start a new order
            </button>
          </div>
        )}
      </div>
    </PageShell>
  )

  /* ── Router ── */
  switch (step) {
    case 0: return renderCommunication()
    case 1: return renderOrderType()
    case 2: return renderServices()
    case 3: return renderQuestions()
    case 4: return renderSummary()
    default: return renderCommunication()
  }
}

/* ─── Summary Item ──────────────────────────────────── */
function SummaryItem({ label, value }: { label: string; value?: string }) {
  return (
    <div>
      <div className="text-[11px] uppercase tracking-wider text-zinc-600 font-medium">{label}</div>
      <div className="text-sm text-zinc-300 mt-0.5">{value || <span className="text-zinc-600 italic">Not set</span>}</div>
    </div>
  )
}
