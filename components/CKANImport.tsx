'use client'

import { useState } from 'react'
import { addDoc, collection, serverTimestamp } from 'firebase/firestore'
import { db } from '@/lib/firebase'

type ImportRow = {
  name: string
  address: string
  ownerName?: string
  condition?: string
  notes?: string
}

const conditions = ['unknown', 'poor', 'fair', 'good', 'excellent']

const zeroScores = {
  capacity: 0,
  impact: 0,
  stability: 0,
  revenue: 0,
  partner: 0,
}

function normalizeCondition(value?: string) {
  const normalized = value?.trim().toLowerCase()
  return normalized && conditions.includes(normalized) ? normalized : 'unknown'
}

function parseCsv(input: string): ImportRow[] {
  const [headerLine, ...lines] = input.trim().split('\n')
  if (!headerLine) return []

  const headers = headerLine.split(',').map((header) => header.trim())

  return lines
    .map((line) => {
      const values = line.split(',').map((value) => value.trim())
      const row = headers.reduce<Record<string, string>>((result, header, index) => {
        result[header] = values[index] ?? ''
        return result
      }, {})

      return {
        name: row.name ?? '',
        address: row.address ?? '',
        ownerName: row.ownerName,
        condition: row.condition,
        notes: row.notes,
      }
    })
    .filter((row) => row.name && row.address)
}

function parseJson(input: string): ImportRow[] {
  const parsed = JSON.parse(input) as unknown

  if (!Array.isArray(parsed)) return []

  return parsed.reduce<ImportRow[]>((rows, item) => {
      if (!item || typeof item !== 'object') return rows
      const row = item as Record<string, unknown>
      const name = typeof row.name === 'string' ? row.name.trim() : ''
      const address = typeof row.address === 'string' ? row.address.trim() : ''

      if (!name || !address) return rows

      rows.push({
        name,
        address,
        ownerName: typeof row.ownerName === 'string' ? row.ownerName : '',
        condition: typeof row.condition === 'string' ? row.condition : 'unknown',
        notes: typeof row.notes === 'string' ? row.notes : '',
      })

      return rows
    }, [])
}

export function CKANImport() {
  const [isOpen, setIsOpen] = useState(false)
  const [csvInput, setCsvInput] = useState('')
  const [jsonInput, setJsonInput] = useState('')
  const [rows, setRows] = useState<ImportRow[]>([])
  const [message, setMessage] = useState<string | null>(null)
  const [progress, setProgress] = useState<string | null>(null)
  const [isImporting, setIsImporting] = useState(false)

  function parsePreview() {
    setMessage(null)

    try {
      const parsedRows = jsonInput.trim() ? parseJson(jsonInput) : parseCsv(csvInput)
      setRows(parsedRows)
      setMessage(parsedRows.length > 0 ? `Parsed ${parsedRows.length} properties.` : 'No valid rows found.')
    } catch (error) {
      setRows([])
      setMessage(error instanceof Error ? error.message : 'Unable to parse import data.')
    }
  }

  async function importAll() {
    setMessage(null)
    setProgress(null)

    if (!db) {
      setMessage('Firebase is not configured.')
      return
    }

    if (rows.length === 0) {
      setMessage('Parse rows before importing.')
      return
    }

    setIsImporting(true)

    try {
      for (let index = 0; index < rows.length; index += 1) {
        const row = rows[index]
        const now = new Date().toISOString()
        setProgress(`Importing ${index + 1} of ${rows.length}...`)

        await addDoc(collection(db, 'beamAssets'), {
          name: row.name,
          address: row.address,
          regionId: 'milwaukee-wi',
          ownerName: row.ownerName ?? '',
          acquisitionStage: 'SIGNAL',
          condition: normalizeCondition(row.condition),
          operatorNarrative: row.notes ?? '',
          primaryUseCases: [],
          scores: zeroScores,
          stageHistory: [{ stage: 'SIGNAL', timestamp: now, note: 'Initial entry' }],
          linkedProjectIds: [],
          linkedActionIds: [],
          createdAt: now,
          updatedAt: serverTimestamp(),
        })
      }

      setProgress(null)
      setMessage(`Imported ${rows.length} properties.`)
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to import properties.')
    } finally {
      setIsImporting(false)
    }
  }

  return (
    <section className="rounded-[1.5rem] border border-white/10 bg-white/[0.03] p-5">
      <button
        type="button"
        onClick={() => setIsOpen((current) => !current)}
        className="flex w-full items-center justify-between text-left text-sm font-medium text-white"
      >
        CKAN property upload
        <span className="text-grounds-sand">{isOpen ? 'Hide' : 'Show'}</span>
      </button>

      {isOpen ? (
        <div className="mt-4 space-y-4">
          <label className="block text-sm text-white/70">
            Paste CKAN/CSV data
            <textarea
              value={csvInput}
              onChange={(event) => setCsvInput(event.target.value)}
              rows={5}
              placeholder="name,address,ownerName,condition,notes"
              className="mt-1 w-full rounded-2xl border border-white/10 bg-[#12211c] px-4 py-3 text-white outline-none placeholder:text-white/30 focus:border-grounds-sand/50"
            />
          </label>

          <label className="block text-sm text-white/70">
            Paste JSON array
            <textarea
              value={jsonInput}
              onChange={(event) => setJsonInput(event.target.value)}
              rows={5}
              placeholder='[{"name":"Site","address":"123 Main St"}]'
              className="mt-1 w-full rounded-2xl border border-white/10 bg-[#12211c] px-4 py-3 text-white outline-none placeholder:text-white/30 focus:border-grounds-sand/50"
            />
          </label>

          <div className="flex flex-wrap gap-3">
            <button type="button" onClick={parsePreview} className="rounded-full border border-grounds-sand/45 px-4 py-2 text-sm font-medium text-grounds-sand">
              Parse & Preview
            </button>
            <button
              type="button"
              onClick={importAll}
              disabled={isImporting || rows.length === 0}
              className="rounded-full bg-grounds-sand px-4 py-2 text-sm font-semibold text-[#0b1712] disabled:cursor-not-allowed disabled:opacity-60"
            >
              Import all
            </button>
          </div>

          {rows.length > 0 ? (
            <div className="overflow-x-auto rounded-2xl border border-white/10">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-[#12211c] text-white/64">
                  <tr>
                    <th className="px-3 py-2 font-medium">Name</th>
                    <th className="px-3 py-2 font-medium">Address</th>
                    <th className="px-3 py-2 font-medium">Owner</th>
                    <th className="px-3 py-2 font-medium">Condition</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10 text-white/72">
                  {rows.map((row, index) => (
                    <tr key={`${row.name}-${index}`}>
                      <td className="px-3 py-2">{row.name}</td>
                      <td className="px-3 py-2">{row.address}</td>
                      <td className="px-3 py-2">{row.ownerName || '-'}</td>
                      <td className="px-3 py-2">{row.condition || 'unknown'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}

          {progress ? <p className="text-sm text-white/66">{progress}</p> : null}
          {message ? <p className="text-sm text-white/66">{message}</p> : null}
        </div>
      ) : null}
    </section>
  )
}
