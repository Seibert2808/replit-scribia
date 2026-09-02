import { Suspense, useEffect, useState } from 'react'
import { Switch, Route, Router as WouterRouter, Redirect } from 'wouter'
import { ThemeProvider } from '@/components/theme-provider'
import { supabase } from '@/lib/supabase'

import LoginPage from '@/pages/auth/login'
import RegisterPage from '@/pages/auth/register'
import ForgotPasswordPage from '@/pages/auth/forgot-password'
import SetPasswordPage from '@/pages/auth/set-password'
import SelectRolePage from '@/pages/auth/select-role'
import ForbiddenPage from '@/pages/forbidden'

import { homeForRole, useActiveRole } from '@/lib/active-role'

import DashboardPage from '@/pages/dashboard/index'
import EventsPage from '@/pages/dashboard/events/index'
import NewEventPage from '@/pages/dashboard/events/new'
import EventDetailPage from '@/pages/dashboard/events/detail'
import LecturesPage from '@/pages/dashboard/lectures/index'
import LectureDetailPage from '@/pages/dashboard/lectures/detail'
import SpeakersPage from '@/pages/dashboard/speakers/index'
import ParticipantsPage from '@/pages/dashboard/participants/index'
import MaterialsPage from '@/pages/dashboard/materials/index'
import ReportsPage from '@/pages/dashboard/reports/index'
import PromptsSettingsPage from '@/pages/dashboard/settings/prompts'

import AdminPage from '@/pages/admin/index'
import OrganizersPage from '@/pages/admin/organizers'
import AdminEventsPage from '@/pages/admin/events'
import InvitationsPage from '@/pages/admin/invitations'
import AiSettingsPage from '@/pages/admin/ai-settings'
import AdminPromptsPage from '@/pages/admin/prompts'

import PortalPage from '@/pages/portal/index'
import PortalLectureDetailPage from '@/pages/portal/lectures/detail'
import SpeakerDashboardPage from '@/pages/speaker/dashboard'
import SpeakerLecturesPage from '@/pages/speaker/lectures'
import SpeakerProfilePage from '@/pages/speaker/profile'
import SpeakerLectureDetailPage from '@/pages/speaker/lectures/detail'

import PublicEventsPage from '@/pages/public/events'
import PublicOrganizersPage from '@/pages/public/organizers'
import PublicOrganizerPage from '@/pages/public/organizer'
import PublicEventPage from '@/pages/public/event'
import SobrePage from '@/pages/sobre'
import QueroNoMeuEventoPage from '@/pages/public/quero-no-meu-evento'
import PalestrantesLandingPage from '@/pages/public/palestrantes'
import ParticipantesLandingPage from '@/pages/public/participantes'
import PatrocinadoresLandingPage from '@/pages/public/patrocinadores'

import { Sidebar } from '@/components/layout/sidebar'
import { AdminSidebar } from '@/components/layout/admin-sidebar'

type UserRole = 'super_admin' | 'organizer' | 'speaker' | 'participant' | null

function useCurrentUser() {
  const [roles, setRoles] = useState<string[]>([])
  const [userName, setUserName] = useState('')
  const [loading, setLoading] = useState(true)
  const [authed, setAuthed] = useState(false)

  useEffect(() => {
    const withTimeout = <T,>(p: PromiseLike<T>, ms: number, label: string): Promise<T> =>
      new Promise<T>((resolve, reject) => {
        const t = setTimeout(() => reject(new Error(`[auth] ${label} timed out after ${ms}ms`)), ms)
        Promise.resolve(p).then(
          (v) => { clearTimeout(t); resolve(v) },
          (e) => { clearTimeout(t); reject(e) },
        )
      })

    async function load() {
      try {
        const { data: { user }, error: userErr } = await withTimeout(supabase.auth.getUser(), 8000, 'getUser')
        if (userErr) console.error('[auth] getUser failed:', userErr)
        if (!user) { setAuthed(false); setRoles([]); setUserName(''); return }
        setAuthed(true)
        const { data: profile, error: profErr } = await withTimeout(
          supabase.from('user_profiles').select('full_name, roles').eq('id', user.id).single(),
          8000,
          'user_profiles fetch',
        )
        if (profErr) console.error('[auth] user_profiles fetch failed:', profErr)
        const p = profile as { full_name: string; roles?: string[] } | null
        const userRoles = p?.roles ?? []
        setRoles(userRoles)
        setUserName(p?.full_name ?? user.email?.split('@')[0] ?? 'Usuário')
      } catch (e) {
        console.error('[auth] load() threw:', e)
      } finally {
        setLoading(false)
      }
    }
    load()
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => load())
    return () => subscription.unsubscribe()
  }, [])

  const primaryRole: UserRole = roles.includes('super_admin') ? 'super_admin'
    : roles.includes('organizer') ? 'organizer'
    : roles.includes('speaker') ? 'speaker'
    : roles.includes('participant') ? 'participant'
    : null

  const stored = useActiveRole()
  const activeRole: UserRole = (stored && roles.includes(stored)) ? stored : (roles.length === 1 ? primaryRole : null)

  return { authed, loading, activeRole, userName, roles }
}

function DashboardLayout({ children, userName, isSuperAdmin }: { children: React.ReactNode; userName: string; isSuperAdmin?: boolean }) {
  return (
    <div className="min-h-screen bg-bg">
      <Sidebar userName={userName} userRole="Organizador" isSuperAdmin={isSuperAdmin} />
      <main className="md:ml-[220px] pt-14 md:pt-0 p-4 sm:p-6 md:p-8 min-h-screen">
        {children}
      </main>
    </div>
  )
}

function AdminLayout({ children, userName }: { children: React.ReactNode; userName: string }) {
  return (
    <div className="min-h-screen bg-bg">
      <AdminSidebar userName={userName} />
      <main className="md:ml-[220px] pt-14 md:pt-0 p-4 sm:p-6 md:p-8 min-h-screen">
        {children}
      </main>
    </div>
  )
}

function LoadingScreen() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-bg">
      <div className="text-center">
        <div className="font-heading font-extrabold text-[28px] text-purple-light tracking-tight mb-3">SCRIBIA</div>
        <div className="flex gap-1 justify-center">
          {[0, 1, 2].map((i) => (
            <div key={i} className="w-2 h-2 bg-purple rounded-full animate-pulse" style={{ animationDelay: `${i * 0.15}s` }} />
          ))}
        </div>
      </div>
    </div>
  )
}

function ProtectedDashboard({ component: Component }: { component: React.ComponentType }) {
  const { authed, loading, activeRole, userName, roles } = useCurrentUser()
  if (loading) return <LoadingScreen />
  if (!authed) return <Redirect to="/login" />
  if (!roles.includes('organizer') && !roles.includes('super_admin')) return <Redirect to="/forbidden" />
  if (!activeRole) return <Redirect to="/select-role" />
  if (activeRole !== 'organizer' && activeRole !== 'super_admin') return <Redirect to={homeForRole(activeRole)} />
  const isAdmin = activeRole === 'super_admin'
  return (
    <DashboardLayout userName={userName} isSuperAdmin={isAdmin}>
      <Component />
    </DashboardLayout>
  )
}

function ProtectedAdmin({ component: Component }: { component: React.ComponentType }) {
  const { authed, loading, activeRole, roles, userName } = useCurrentUser()
  if (loading) return <LoadingScreen />
  if (!authed) return <Redirect to="/login" />
  if (!roles.includes('super_admin')) return <Redirect to="/forbidden" />
  if (!activeRole) return <Redirect to="/select-role" />
  if (activeRole !== 'super_admin') return <Redirect to={homeForRole(activeRole)} />
  return (
    <AdminLayout userName={userName}>
      <Component />
    </AdminLayout>
  )
}

function Router() {
  return (
    <Switch>
      {/* Home institucional: a mesma pagina servida em /sobre */}
      <Route path="/" component={SobrePage} />

      {/* Auth */}
      <Route path="/login" component={LoginPage} />
      <Route path="/register" component={RegisterPage} />
      <Route path="/auth/forgot-password" component={ForgotPasswordPage} />
      <Route path="/auth/set-password" component={SetPasswordPage} />
      <Route path="/select-role" component={SelectRolePage} />
      <Route path="/forbidden" component={ForbiddenPage} />

      {/* Dashboard */}
      <Route path="/dashboard">
        {() => <ProtectedDashboard component={DashboardPage} />}
      </Route>
      <Route path="/dashboard/events">
        {() => <ProtectedDashboard component={EventsPage} />}
      </Route>
      <Route path="/dashboard/events/new">
        {() => <ProtectedDashboard component={NewEventPage} />}
      </Route>
      <Route path="/dashboard/events/:id">
        {() => <ProtectedDashboard component={EventDetailPage} />}
      </Route>
      <Route path="/dashboard/lectures">
        {() => <ProtectedDashboard component={LecturesPage} />}
      </Route>
      <Route path="/dashboard/lectures/:id">
        {() => <ProtectedDashboard component={LectureDetailPage} />}
      </Route>
      <Route path="/dashboard/speakers">
        {() => <ProtectedDashboard component={SpeakersPage} />}
      </Route>
      <Route path="/dashboard/participants">
        {() => <ProtectedDashboard component={ParticipantsPage} />}
      </Route>
      <Route path="/dashboard/materials">
        {() => <ProtectedDashboard component={MaterialsPage} />}
      </Route>
      <Route path="/dashboard/reports">
        {() => <ProtectedDashboard component={ReportsPage} />}
      </Route>
      <Route path="/dashboard/settings/prompts">
        {() => <ProtectedDashboard component={PromptsSettingsPage} />}
      </Route>

      {/* Admin */}
      <Route path="/admin">
        {() => <ProtectedAdmin component={AdminPage} />}
      </Route>
      <Route path="/admin/organizers">
        {() => <ProtectedAdmin component={OrganizersPage} />}
      </Route>
      <Route path="/admin/events">
        {() => <ProtectedAdmin component={AdminEventsPage} />}
      </Route>
      <Route path="/admin/invitations">
        {() => <ProtectedAdmin component={InvitationsPage} />}
      </Route>
      <Route path="/admin/ai-settings">
        {() => <ProtectedAdmin component={AiSettingsPage} />}
      </Route>
      <Route path="/admin/prompts">
        {() => <ProtectedAdmin component={AdminPromptsPage} />}
      </Route>

      {/* Public */}
      <Route path="/eventos" component={PublicEventsPage} />
      <Route path="/eventos/:id" component={PublicEventPage} />
      <Route path="/sobre" component={SobrePage} />
      <Route path="/quero-no-meu-evento" component={QueroNoMeuEventoPage} />
      <Route path="/palestrantes" component={PalestrantesLandingPage} />
      <Route path="/influenciadores" component={PalestrantesLandingPage} />
      <Route path="/participantes" component={ParticipantesLandingPage} />
      <Route path="/patrocinadores" component={PatrocinadoresLandingPage} />
      <Route path="/organizadores" component={PublicOrganizersPage} />
      <Route path="/o/:orgSlug" component={PublicOrganizerPage} />

      {/* Portal */}
      <Route path="/portal" component={PortalPage} />
      <Route path="/portal/lectures/:id" component={PortalLectureDetailPage} />

      {/* Speaker */}
      <Route path="/speaker/dashboard" component={SpeakerDashboardPage} />
      <Route path="/speaker/lectures" component={SpeakerLecturesPage} />
      <Route path="/speaker/lectures/:id" component={SpeakerLectureDetailPage} />
      <Route path="/speaker/profile" component={SpeakerProfilePage} />

      {/* 404 */}
      <Route>
        <div className="flex min-h-screen items-center justify-center bg-bg">
          <div className="text-center animate-fade-up">
            <h1 className="font-heading text-6xl font-extrabold text-purple-light">404</h1>
            <h2 className="font-heading text-xl font-bold text-text mt-3">Página não encontrada</h2>
            <a href="/" className="inline-flex items-center gap-1.5 mt-6 bg-purple text-white px-6 py-2.5 rounded-lg text-[13px] font-medium hover:bg-purple-light transition-all">Voltar ao início</a>
          </div>
        </div>
      </Route>
    </Switch>
  )
}

export default function App() {
  return (
    <ThemeProvider>
      <WouterRouter base={import.meta.env.BASE_URL?.replace(/\/$/, '') ?? ''}>
        <Suspense fallback={<LoadingScreen />}>
          <Router />
        </Suspense>
      </WouterRouter>
    </ThemeProvider>
  )
}
