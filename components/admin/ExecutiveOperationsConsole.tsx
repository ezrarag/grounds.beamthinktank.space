'use client'

import { useEffect, useState, useMemo } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Users,
  HardHat,
  Coins,
  Building2,
  Layers,
  Compass,
  CheckCircle2,
  Clock,
  MessageSquare,
  Search,
  Filter,
  ExternalLink,
  ShieldCheck,
  LogOut,
  LogIn,
  Home,
  Plus,
  ArrowRight,
  TrendingUp,
  MapPin,
  Sparkles,
  ChevronRight,
  AlertCircle,
  FileCheck,
  RefreshCw,
  Loader2,
  Video,
} from 'lucide-react'
import {
  collection,
  doc,
  getDocs,
  onSnapshot,
  updateDoc,
  serverTimestamp,
  addDoc,
} from 'firebase/firestore'
import { db, signOutUser } from '@/lib/firebase'
import { useIsAdmin } from '@/lib/useIsAdmin'
import { useAcquisitionSites, type BeamAsset } from '@/lib/useAcquisitionSites'
import { LiveDispatchMap } from '@/components/admin/LiveDispatchMap'
import { AddPropertyForm } from '@/components/AddPropertyForm'
import { CityRegistryManager } from '@/components/CityRegistryManager'
import { CivicScanImport } from '@/components/CivicScanImport'
import { PublicSitePublishingControls } from '@/components/PublicSitePublishingControls'
import type { GroundsWorkRosterAttachment } from '@/lib/types/groundsProfile'

export interface LiveParticipant {
  uid: string
  displayName: string
  handle: string
  email: string
  pathwayRole: string
  role?: string
  approvedHours: number
  sweatEquityUSD: number
  linkedPropertyAddress?: string
  linkedParcelId?: string
  workRosterAttachments?: GroundsWorkRosterAttachment[]
  updatedAt?: string
}

export interface LiveAssetInterest {
  id: string
  assetId: string
  assetName: string
  address?: string
  acquisitionTrack?: string
  userId?: string
  userName?: string
  userEmail?: string
  interestType?: string
  notes?: string
  status: 'new' | 'reviewed' | 'approved' | 'closed'
  createdAt: string
}

export interface LiveAgendaItem {
  id: string
  topic: string
  category: string
  stakeholderName?: string
  stakeholderRole?: string
  contact?: string
  urgency: 'routine' | 'priority' | 'urgent'
  status: 'queued' | 'reviewed' | 'addressed'
  createdAt: string
}

// Fallback initial participants to prevent empty state during cold start
const SEEDED_PARTICIPANTS: LiveParticipant[] = [
  {
    uid: 'ezra-001',
    displayName: 'Ezra Haugabrooks',
    handle: '@ezra.haugabrooks',
    email: 'ezra@readyaimgo.biz',
    pathwayRole: 'own',
    role: 'admin',
    approvedHours: 72,
    sweatEquityUSD: 2160,
    linkedPropertyAddress: '639 N 25th St, Milwaukee, WI',
    linkedParcelId: '388-1204-000',
    workRosterAttachments: [
      {
        assetId: 'mke-woodwork-01',
        propertyName: 'Historic Central Methodist',
        address: '2449 N 2nd St, Milwaukee',
        skillsOrRoles: ['Luthier & Fine Woodworker', 'Site Stewardship'],
        notifyOnWorkAvailable: true,
        attachedAt: new Date().toISOString(),
      },
    ],
  },
  {
    uid: 'participant-002',
    displayName: 'Marcus Vance',
    handle: '@marcus_vance',
    email: 'marcus.vance@example.com',
    pathwayRole: 'earn',
    role: 'participant',
    approvedHours: 110,
    sweatEquityUSD: 3300,
    linkedPropertyAddress: '800 W Wells St, Milwaukee, WI',
    linkedParcelId: '392-0501-100',
    workRosterAttachments: [
      {
        assetId: 'mke-wells-02',
        propertyName: 'Wells St Trades Hub',
        address: '800 W Wells St',
        skillsOrRoles: ['Carpentry & Framing', 'Demolition & Cleanout'],
        notifyOnWorkAvailable: true,
        attachedAt: new Date().toISOString(),
      },
    ],
  },
  {
    uid: 'participant-003',
    displayName: 'Elena Rios',
    handle: '@elena_rios',
    email: 'elena.rios@example.com',
    pathwayRole: 'teach',
    role: 'verified-professional',
    approvedHours: 95,
    sweatEquityUSD: 2850,
    linkedPropertyAddress: '1420 Bankhead Hwy, Atlanta, GA',
    linkedParcelId: '14-0082-0001',
    workRosterAttachments: [
      {
        assetId: 'atl-bankhead-03',
        propertyName: 'Atlanta Community Sound Lab',
        address: '1420 Bankhead Hwy',
        skillsOrRoles: ['Acoustics & AV Engineering', 'Permit Diligence'],
        notifyOnWorkAvailable: true,
        attachedAt: new Date().toISOString(),
      },
    ],
  },
]

type ActiveTab = 'participants' | 'interest' | 'pipeline' | 'agenda'

export function ExecutiveOperationsConsole() {
  const { isAdmin, ready: adminReady, email: adminEmail } = useIsAdmin()
  const { sites, loading: sitesLoading } = useAcquisitionSites()
  const router = useRouter()

  const [activeTab, setActiveTab] = useState<ActiveTab>('participants')
  const [participants, setParticipants] = useState<LiveParticipant[]>(SEEDED_PARTICIPANTS)
  const [interests, setInterests] = useState<LiveAssetInterest[]>([])
  const [agendaItems, setAgendaItems] = useState<LiveAgendaItem[]>([])
  const [participantSearch, setParticipantSearch] = useState('')
  const [interestFilter, setInterestFilter] = useState<string>('all')
  const [isSigningOut, setIsSigningOut] = useState(false)
  const [selectedSite, setSelectedSite] = useState<BeamAsset | null>(null)
  const [showAddProperty, setShowAddProperty] = useState(false)

  // 1. Subscribe to Live Participants
  useEffect(() => {
    if (!db) return
    const unsub = onSnapshot(collection(db, 'participantProfiles'), (snapshot) => {
      if (!snapshot.empty) {
        const list: LiveParticipant[] = []
        snapshot.forEach((d) => {
          const data = d.data()
          const approved = typeof data.approvedHours === 'number' ? data.approvedHours : 0
          list.push({
            uid: d.id,
            displayName: data.displayName || data.name || 'Anonymous Participant',
            handle: `@${(data.email ? data.email.split('@')[0] : d.id).toLowerCase()}`,
            email: data.email || '',
            pathwayRole: data.pathwayRole || 'earn',
            role: data.role || 'participant',
            approvedHours: approved,
            sweatEquityUSD: approved * 30, // HUD standard $30/hr
            linkedPropertyAddress: data.linkedPropertyAddress || data.activeHomestead?.address || '',
            linkedParcelId: data.linkedParcelId || data.activeHomestead?.parcelId || '',
            workRosterAttachments: data.workRosterAttachments || [],
            updatedAt: data.updatedAt?.toDate?.()?.toISOString?.() || data.updatedAt || '',
          })
        })
        setParticipants(list)
      }
    })
    return () => unsub()
  }, [])

  // 2. Subscribe to Live Asset Inquiries
  useEffect(() => {
    if (!db) return
    const unsub = onSnapshot(collection(db, 'assetInterest'), (snapshot) => {
      const list: LiveAssetInterest[] = []
      snapshot.forEach((d) => {
        const data = d.data()
        list.push({
          id: d.id,
          assetId: data.assetId || '',
          assetName: data.assetName || 'Target Asset',
          address: data.address || '',
          acquisitionTrack: data.acquisitionTrack || 'C',
          userId: data.userId || '',
          userName: data.userName || 'Member Applicant',
          userEmail: data.userEmail || '',
          interestType: data.interestType || 'commercial-lease',
          notes: data.notes || '',
          status: data.status || 'new',
          createdAt: data.createdAt || '',
        })
      })
      list.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''))
      setInterests(list)
    })
    return () => unsub()
  }, [])

  // 3. Subscribe to Live Meeting Agenda Items
  useEffect(() => {
    if (!db) return
    const unsub = onSnapshot(collection(db, 'agendaQueue'), (snapshot) => {
      const list: LiveAgendaItem[] = []
      snapshot.forEach((d) => {
        const data = d.data()
        list.push({
          id: d.id,
          topic: data.topic || '',
          category: data.category || 'general',
          stakeholderName: data.stakeholderName || 'Leadership Stakeholder',
          stakeholderRole: data.stakeholderRole || 'Advisor / Board',
          contact: data.contact || '',
          urgency: data.urgency || 'priority',
          status: data.status || 'queued',
          createdAt: data.createdAt || '',
        })
      })
      list.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''))
      setAgendaItems(list)
    })
    return () => unsub()
  }, [])

  // Aggregate Participant & Operations Computations
  const aggregateMetrics = useMemo(() => {
    const totalParticipants = participants.length
    const totalHours = participants.reduce((acc, p) => acc + (p.approvedHours || 0), 0)
    const totalPurchasingPower = totalHours * 30 // HUD $30/hr rate
    const totalRosterAssignments = participants.reduce(
      (acc, p) => acc + (p.workRosterAttachments?.length || 0),
      0
    )
    const pendingInquiries = interests.filter((i) => i.status === 'new').length
    const openAgendaTopics = agendaItems.filter((a) => a.status === 'queued').length
    const activeHomesteads = participants.filter((p) => Boolean(p.linkedPropertyAddress)).length

    return {
      totalParticipants,
      totalHours,
      totalPurchasingPower,
      totalRosterAssignments,
      pendingInquiries,
      openAgendaTopics,
      activeHomesteads,
    }
  }, [participants, interests, agendaItems])

  // Filtered Participants
  const filteredParticipants = useMemo(() => {
    const q = participantSearch.toLowerCase().trim()
    if (!q) return participants
    return participants.filter(
      (p) =>
        p.displayName.toLowerCase().includes(q) ||
        p.email.toLowerCase().includes(q) ||
        p.handle.toLowerCase().includes(q) ||
        p.pathwayRole.toLowerCase().includes(q) ||
        (p.linkedPropertyAddress && p.linkedPropertyAddress.toLowerCase().includes(q))
    )
  }, [participants, participantSearch])

  // Filtered Inquiries
  const filteredInterests = useMemo(() => {
    if (interestFilter === 'all') return interests
    return interests.filter((i) => i.status === interestFilter)
  }, [interests, interestFilter])

  async function handleUpdateInterestStatus(id: string, status: LiveAssetInterest['status']) {
    if (!db) return
    try {
      await updateDoc(doc(db, 'assetInterest', id), {
        status,
        updatedAt: serverTimestamp(),
      })
    } catch (err) {
      console.error('Failed to update inquiry status:', err)
    }
  }

  async function handleUpdateAgendaStatus(id: string, status: LiveAgendaItem['status']) {
    if (!db) return
    try {
      await updateDoc(doc(db, 'agendaQueue', id), {
        status,
        updatedAt: serverTimestamp(),
      })
    } catch (err) {
      console.error('Failed to update agenda item status:', err)
    }
  }

  async function handleSignOut() {
    setIsSigningOut(true)
    try {
      await signOutUser()
      router.push('/login')
    } catch {
      setIsSigningOut(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#07100c] text-white">
      {/* Top Header & Context Bar */}
      <header className="sticky top-0 z-40 border-b border-white/10 bg-[#07100c]/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-2.5 text-emerald-400">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-emerald-400">
                  BEAM Grounds // Executive Command
                </span>
                <span className="flex h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              </div>
              <h1 className="text-xl font-bold text-white sm:text-2xl">
                Operations & Participant Intelligence
              </h1>
            </div>
          </div>

          {/* Global Header Actions */}
          <div className="flex flex-wrap items-center gap-2.5">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-3.5 py-1.5 font-mono text-xs text-white/80 hover:bg-white/10 hover:text-white transition"
            >
              <Home className="h-3.5 w-3.5" />
              Landing View
            </Link>

            <Link
              href="/portal/participant"
              className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-950/40 px-3.5 py-1.5 font-mono text-xs text-emerald-300 hover:bg-emerald-900/50 transition"
            >
              <Users className="h-3.5 w-3.5" />
              Participant Portal View ↗
            </Link>

            <Link
              href="/portal/admin/landing"
              className="inline-flex items-center gap-1.5 rounded-full border border-beam-gold/30 bg-amber-950/40 px-3.5 py-1.5 font-mono text-xs text-amber-200 hover:bg-amber-900/50 transition"
            >
              <Video className="h-3.5 w-3.5" />
              Landing Media & 90s Loop
            </Link>

            <button
              type="button"
              onClick={handleSignOut}
              disabled={isSigningOut}
              className="inline-flex items-center gap-1.5 rounded-full border border-rose-500/30 bg-rose-500/10 px-3.5 py-1.5 font-mono text-xs text-rose-300 hover:bg-rose-500/20 transition disabled:opacity-50"
            >
              {isSigningOut ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <LogOut className="h-3.5 w-3.5" />}
              Sign Out
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
        {/* Executive KPI Ribbon: Aggregating Live Participant & Ecosystem Data */}
        <section className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {/* 1. Active Participants */}
          <div className="rounded-2xl border border-white/10 bg-[#0e1f1a] p-4">
            <div className="flex items-center justify-between text-white/50 mb-1">
              <span className="font-mono text-[10px] uppercase tracking-wider">Enrolled Members</span>
              <Users className="h-4 w-4 text-emerald-400" />
            </div>
            <div className="text-2xl font-bold text-white sm:text-3xl">
              {aggregateMetrics.totalParticipants}
            </div>
            <p className="mt-1 font-mono text-[10px] text-emerald-400/90">
              Active in MKE & ATL Nodes
            </p>
          </div>

          {/* 2. Sweat-Equity Hours */}
          <div className="rounded-2xl border border-white/10 bg-[#0e1f1a] p-4">
            <div className="flex items-center justify-between text-white/50 mb-1">
              <span className="font-mono text-[10px] uppercase tracking-wider">Sweat Equity</span>
              <HardHat className="h-4 w-4 text-amber-400" />
            </div>
            <div className="text-2xl font-bold text-amber-400 sm:text-3xl">
              {aggregateMetrics.totalHours} <span className="text-sm font-normal text-white/50">hrs</span>
            </div>
            <p className="mt-1 font-mono text-[10px] text-amber-300/80">
              HUD Standard Verified
            </p>
          </div>

          {/* 3. Purchasing Power */}
          <div className="rounded-2xl border border-white/10 bg-[#0e1f1a] p-4">
            <div className="flex items-center justify-between text-white/50 mb-1">
              <span className="font-mono text-[10px] uppercase tracking-wider">Equity Value</span>
              <Coins className="h-4 w-4 text-emerald-400" />
            </div>
            <div className="text-2xl font-bold text-emerald-300 sm:text-3xl">
              ${aggregateMetrics.totalPurchasingPower.toLocaleString()}
            </div>
            <p className="mt-1 font-mono text-[10px] text-white/50">
              Earned Purchasing Power
            </p>
          </div>

          {/* 4. Active Roster Shifts */}
          <div className="rounded-2xl border border-white/10 bg-[#0e1f1a] p-4">
            <div className="flex items-center justify-between text-white/50 mb-1">
              <span className="font-mono text-[10px] uppercase tracking-wider">Roster Shifts</span>
              <Layers className="h-4 w-4 text-blue-400" />
            </div>
            <div className="text-2xl font-bold text-white sm:text-3xl">
              {aggregateMetrics.totalRosterAssignments}
            </div>
            <p className="mt-1 font-mono text-[10px] text-blue-300/80">
              Trades & Acoustics Cohorts
            </p>
          </div>

          {/* 5. Inbound Inquiries */}
          <div className="rounded-2xl border border-white/10 bg-[#0e1f1a] p-4">
            <div className="flex items-center justify-between text-white/50 mb-1">
              <span className="font-mono text-[10px] uppercase tracking-wider">Site Inquiries</span>
              <Building2 className="h-4 w-4 text-purple-400" />
            </div>
            <div className="text-2xl font-bold text-purple-300 sm:text-3xl">
              {aggregateMetrics.pendingInquiries}
            </div>
            <p className="mt-1 font-mono text-[10px] text-purple-200/70">
              Tenancy & Co-Dev Queue
            </p>
          </div>

          {/* 6. Stakeholder Agenda Topics */}
          <div className="rounded-2xl border border-white/10 bg-[#0e1f1a] p-4">
            <div className="flex items-center justify-between text-white/50 mb-1">
              <span className="font-mono text-[10px] uppercase tracking-wider">Meeting Docket</span>
              <MessageSquare className="h-4 w-4 text-beam-gold" />
            </div>
            <div className="text-2xl font-bold text-beam-gold sm:text-3xl">
              {aggregateMetrics.openAgendaTopics}
            </div>
            <p className="mt-1 font-mono text-[10px] text-amber-200/70">
              Leadership Items Queued
            </p>
          </div>
        </section>

        {/* Operational Navigation Tabs */}
        <div className="flex border-b border-white/10 gap-2 sm:gap-6 overflow-x-auto pb-1">
          <button
            type="button"
            onClick={() => setActiveTab('participants')}
            className={`flex items-center gap-2 whitespace-nowrap pb-3 font-mono text-xs uppercase tracking-wider transition ${
              activeTab === 'participants'
                ? 'border-b-2 border-emerald-400 text-emerald-400 font-semibold'
                : 'text-white/60 hover:text-white'
            }`}
          >
            <Users className="h-4 w-4" />
            Participant Roster & Labor Shifts ({participants.length})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('interest')}
            className={`flex items-center gap-2 whitespace-nowrap pb-3 font-mono text-xs uppercase tracking-wider transition ${
              activeTab === 'interest'
                ? 'border-b-2 border-emerald-400 text-emerald-400 font-semibold'
                : 'text-white/60 hover:text-white'
            }`}
          >
            <Building2 className="h-4 w-4" />
            Asset Inquiries & Tenancy ({interests.length})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('pipeline')}
            className={`flex items-center gap-2 whitespace-nowrap pb-3 font-mono text-xs uppercase tracking-wider transition ${
              activeTab === 'pipeline'
                ? 'border-b-2 border-emerald-400 text-emerald-400 font-semibold'
                : 'text-white/60 hover:text-white'
            }`}
          >
            <Compass className="h-4 w-4" />
            14-Day Acquisition Pipeline & Map ({sites.length})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('agenda')}
            className={`flex items-center gap-2 whitespace-nowrap pb-3 font-mono text-xs uppercase tracking-wider transition ${
              activeTab === 'agenda'
                ? 'border-b-2 border-emerald-400 text-emerald-400 font-semibold'
                : 'text-white/60 hover:text-white'
            }`}
          >
            <MessageSquare className="h-4 w-4" />
            Stakeholder Meeting Queue ({agendaItems.length})
          </button>
        </div>

        {/* TAB 1: PARTICIPANT ROSTER & LABOR SHIFTS */}
        {activeTab === 'participants' && (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-white">Live Participant Cohort Matrix</h2>
                <p className="text-xs text-white/60">
                  Aggregated from participant portal registrations, work roster attachments, and Path-to-Deed trackers.
                </p>
              </div>

              {/* Search filter */}
              <div className="relative min-w-[280px]">
                <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-white/40" />
                <input
                  type="text"
                  placeholder="Filter by name, email, role, or parcel..."
                  value={participantSearch}
                  onChange={(e) => setParticipantSearch(e.target.value)}
                  className="w-full rounded-full border border-white/15 bg-white/5 py-2 pl-10 pr-4 text-xs text-white placeholder-white/40 focus:border-emerald-400 focus:outline-none"
                />
              </div>
            </div>

            {/* Table */}
            <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#0e1f1a]">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-white/10 bg-white/[0.02] font-mono text-[11px] uppercase tracking-wider text-white/50">
                    <tr>
                      <th className="px-5 py-3.5">Participant</th>
                      <th className="px-5 py-3.5">Pathway Role</th>
                      <th className="px-5 py-3.5">Approved Hours</th>
                      <th className="px-5 py-3.5">HUD Sweat Equity</th>
                      <th className="px-5 py-3.5">Active Work Roster</th>
                      <th className="px-5 py-3.5">Linked Homestead / Deed</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 text-white/80">
                    {filteredParticipants.map((p) => (
                      <tr key={p.uid} className="hover:bg-white/[0.02] transition">
                        <td className="px-5 py-4">
                          <div className="font-semibold text-white">{p.displayName}</div>
                          <div className="font-mono text-[10px] text-white/50">{p.email || p.handle}</div>
                        </td>
                        <td className="px-5 py-4">
                          <span className="inline-flex rounded-full border border-emerald-400/30 bg-emerald-500/10 px-2.5 py-0.5 font-mono text-[10px] uppercase text-emerald-300">
                            {p.pathwayRole}
                          </span>
                        </td>
                        <td className="px-5 py-4 font-mono font-semibold text-amber-300">
                          {p.approvedHours} hrs
                        </td>
                        <td className="px-5 py-4 font-mono font-semibold text-emerald-400">
                          ${p.sweatEquityUSD.toLocaleString()}
                        </td>
                        <td className="px-5 py-4">
                          {p.workRosterAttachments && p.workRosterAttachments.length > 0 ? (
                            <div className="space-y-1">
                              {p.workRosterAttachments.map((roster, idx) => (
                                <div key={idx} className="flex items-center gap-1.5 text-[11px]">
                                  <HardHat className="h-3.5 w-3.5 text-blue-400 shrink-0" />
                                  <span className="font-medium text-white">{roster.propertyName}</span>
                                  <span className="text-white/40">({roster.skillsOrRoles.join(', ')})</span>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <span className="text-white/40 italic">No active roster shifts</span>
                          )}
                        </td>
                        <td className="px-5 py-4">
                          {p.linkedPropertyAddress ? (
                            <div className="flex items-center gap-1.5 font-mono text-[11px] text-emerald-300">
                              <MapPin className="h-3 w-3 shrink-0" />
                              <span className="truncate max-w-[200px]">{p.linkedPropertyAddress}</span>
                            </div>
                          ) : (
                            <span className="text-white/40 italic">Exploring $1 Homesteads</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: ASSET INTEREST & TENANCY INQUIRIES */}
        {activeTab === 'interest' && (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-white">Commercial Tenancy & Co-Development Queue</h2>
                <p className="text-xs text-white/60">
                  Direct requests submitted by participants and commercial operators from `/portal/participant` and `/properties`.
                </p>
              </div>

              {/* Status filter tabs */}
              <div className="flex gap-2">
                {['all', 'new', 'reviewed', 'approved'].map((st) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => setInterestFilter(st)}
                    className={`rounded-full px-3 py-1 font-mono text-[11px] uppercase transition ${
                      interestFilter === st
                        ? 'bg-emerald-400 font-semibold text-black'
                        : 'border border-white/15 bg-white/5 text-white/70 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>

            {filteredInterests.length === 0 ? (
              <div className="rounded-2xl border border-white/10 bg-[#0e1f1a] p-12 text-center text-white/60 space-y-2">
                <Building2 className="mx-auto h-8 w-8 text-white/30" />
                <p className="font-semibold text-white">No inquiries matching this filter</p>
                <p className="text-xs">
                  When visitors or participants click &ldquo;I&rsquo;m Interested&rdquo; on any property card, their submissions populate this queue live.
                </p>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {filteredInterests.map((interest) => (
                  <div
                    key={interest.id}
                    className="flex flex-col justify-between rounded-2xl border border-white/10 bg-[#0e1f1a] p-5 space-y-4"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 border-b border-white/10 pb-3">
                        <span className="inline-flex rounded-full border border-purple-400/30 bg-purple-500/10 px-2.5 py-0.5 font-mono text-[10px] uppercase text-purple-300">
                          {interest.interestType}
                        </span>
                        <span className="font-mono text-[10px] text-white/50">
                          {interest.createdAt ? new Date(interest.createdAt).toLocaleDateString() : 'Just now'}
                        </span>
                      </div>

                      <h3 className="mt-3 text-base font-bold text-white">{interest.assetName}</h3>
                      {interest.address ? (
                        <p className="font-mono text-xs text-white/60">{interest.address}</p>
                      ) : null}

                      <div className="mt-3 rounded-xl border border-white/8 bg-white/[0.02] p-3 text-xs text-white/80 space-y-1">
                        <div>
                          <span className="text-white/50">Applicant: </span>
                          <span className="font-semibold text-white">{interest.userName}</span>
                        </div>
                        {interest.userEmail ? (
                          <div>
                            <span className="text-white/50">Email: </span>
                            <span className="font-mono text-emerald-300">{interest.userEmail}</span>
                          </div>
                        ) : null}
                        {interest.notes ? (
                          <div className="pt-2 text-white/70 italic border-t border-white/5">
                            &ldquo;{interest.notes}&rdquo;
                          </div>
                        ) : null}
                      </div>
                    </div>

                    {/* Action Controls */}
                    <div className="flex items-center justify-between gap-2 pt-2 border-t border-white/10">
                      <span className="font-mono text-[10px] uppercase text-white/50">
                        Status: <strong className="text-white">{interest.status}</strong>
                      </span>
                      <div className="flex items-center gap-1.5">
                        {interest.status === 'new' ? (
                          <button
                            type="button"
                            onClick={() => handleUpdateInterestStatus(interest.id, 'reviewed')}
                            className="rounded-lg border border-white/15 bg-white/5 px-2.5 py-1 text-[11px] font-mono text-white/80 hover:bg-white/15"
                          >
                            Mark Reviewed
                          </button>
                        ) : null}
                        {interest.status !== 'approved' ? (
                          <button
                            type="button"
                            onClick={() => handleUpdateInterestStatus(interest.id, 'approved')}
                            className="rounded-lg bg-emerald-400 px-2.5 py-1 text-[11px] font-semibold text-black hover:bg-emerald-300"
                          >
                            Approve for Diligence
                          </button>
                        ) : null}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: 14-DAY ACQUISITION PIPELINE & MAP */}
        {activeTab === 'pipeline' && (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-white">14-Day Acquisition Pipeline & Proximity Map</h2>
                <p className="text-xs text-white/60">
                  Track property legal clearances, parcel scans, and live proximity dispatch across active municipal target nodes.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowAddProperty(!showAddProperty)}
                className="inline-flex items-center gap-2 rounded-full bg-emerald-400 px-4 py-2 text-xs font-semibold text-black hover:bg-emerald-300 transition"
              >
                <Plus className="h-3.5 w-3.5" />
                {showAddProperty ? 'Close Form' : 'Intake New Site'}
              </button>
            </div>

            {showAddProperty ? (
              <div className="rounded-2xl border border-white/15 bg-[#0e1f1a] p-6">
                <h3 className="text-base font-bold text-white mb-4">Quick Property Intake Form</h3>
                <AddPropertyForm />
              </div>
            ) : null}

            {/* Live Mapbox Dispatch Canvas */}
            <div className="rounded-2xl border border-white/10 bg-[#0e1f1a] p-4">
              <LiveDispatchMap sites={sites} />
            </div>

            {/* Pipeline Cards Grid */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {sites.map((site) => (
                <div
                  key={site.id}
                  className="flex flex-col justify-between rounded-2xl border border-white/10 bg-[#0e1f1a] p-5 space-y-4 hover:border-emerald-400/40 transition"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 border-b border-white/10 pb-3">
                      <span className="inline-flex rounded-full border border-emerald-400/30 bg-emerald-500/10 px-2.5 py-0.5 font-mono text-[10px] text-emerald-300">
                        {site.acquisitionStage || 'SIGNAL'}
                      </span>
                      <span className="font-mono text-xs text-beam-gold">
                        Track {site.acquisitionTrack || 'C'}
                      </span>
                    </div>

                    <h4 className="mt-3 text-base font-bold text-white">{site.name}</h4>
                    <p className="font-mono text-xs text-white/60">{site.address}</p>

                    <div className="mt-4 grid grid-cols-2 gap-2 text-[11px] font-mono">
                      <div className="rounded-lg border border-white/5 bg-white/[0.02] p-2">
                        <span className="text-white/40 block text-[9px]">EST. VALUATION</span>
                        <span className="font-bold text-white">
                          ${(site.appraisalData?.estimatedValue || (typeof site.ckanAssessedValue === 'number' ? site.ckanAssessedValue : 0) || 0).toLocaleString()}
                        </span>
                      </div>
                      <div className="rounded-lg border border-white/5 bg-white/[0.02] p-2">
                        <span className="text-white/40 block text-[9px]">REPAIR BUDGET</span>
                        <span className="font-bold text-amber-300">
                          ${(site.appraisalData?.repairCostEstimate || 0).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-white/10 flex items-center justify-between">
                    <span className="font-mono text-[10px] text-white/50">
                      {site.publicVisible ? '● Published' : '○ Internal Only'}
                    </span>
                    <Link
                      href={`/properties/${site.id}`}
                      className="inline-flex items-center gap-1 font-mono text-[11px] text-emerald-400 hover:text-emerald-300"
                    >
                      Inspect Dossier <ArrowRight className="h-3 w-3" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 4: STAKEHOLDER AGENDA QUEUE */}
        {activeTab === 'agenda' && (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-white">Stakeholder Meeting Docket (`agendaQueue`)</h2>
                <p className="text-xs text-white/60">
                  Questions, friction points, and priorities submitted directly from the Landing Page by Denail, DeTania, Rick, and Ezra.
                </p>
              </div>

              <span className="rounded-full border border-beam-gold/30 bg-amber-950/40 px-3.5 py-1 font-mono text-xs text-beam-gold">
                Weekly Meeting Sync Active
              </span>
            </div>

            {agendaItems.length === 0 ? (
              <div className="rounded-2xl border border-white/10 bg-[#0e1f1a] p-12 text-center text-white/60 space-y-2">
                <MessageSquare className="mx-auto h-8 w-8 text-white/30" />
                <p className="font-semibold text-white">No items in the agenda queue</p>
                <p className="text-xs">
                  When stakeholders submit questions from Card 02 on the landing page, they will show up here automatically.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {agendaItems.map((item) => (
                  <div
                    key={item.id}
                    className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-white/10 bg-[#0e1f1a] p-5 hover:border-beam-gold/30 transition"
                  >
                    <div className="space-y-1.5 max-w-2xl">
                      <div className="flex items-center gap-2">
                        <span className="rounded-md bg-amber-400/10 px-2 py-0.5 font-mono text-[10px] font-semibold text-beam-gold uppercase">
                          {item.category}
                        </span>
                        <span className="font-mono text-xs text-white/50">
                          {item.createdAt ? new Date(item.createdAt).toLocaleDateString() : 'Today'}
                        </span>
                        <span className="font-mono text-xs text-emerald-400">
                          From: {item.stakeholderName} ({item.stakeholderRole})
                        </span>
                      </div>
                      <p className="text-sm font-medium text-white leading-relaxed">
                        &ldquo;{item.topic}&rdquo;
                      </p>
                      {item.contact ? (
                        <p className="font-mono text-xs text-white/40">Contact: {item.contact}</p>
                      ) : null}
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          handleUpdateAgendaStatus(
                            item.id,
                            item.status === 'addressed' ? 'queued' : 'addressed'
                          )
                        }
                        className={`rounded-full px-4 py-1.5 font-mono text-xs transition ${
                          item.status === 'addressed'
                            ? 'border border-emerald-400 bg-emerald-500/20 text-emerald-300'
                            : 'bg-beam-gold text-black font-semibold hover:bg-amber-300'
                        }`}
                      >
                        {item.status === 'addressed' ? '✓ Addressed' : 'Mark Addressed'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  )
}
