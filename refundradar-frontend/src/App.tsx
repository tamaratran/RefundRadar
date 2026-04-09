import { useState, useEffect, useCallback } from 'react'
import { DollarSign, Upload, Search, FileText, TrendingDown, AlertTriangle, RefreshCw, Copy, Check, Trash2, BarChart3, ArrowUpDown, Mail } from 'lucide-react'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

interface Transaction {
  id: number
  date: string
  description: string
  amount: number
  balance: number | null
  category: string
  merchant: string
  account_name: string
  source_file: string
}

interface Opportunity {
  id: number
  transaction_id: number | null
  type: string
  description: string
  potential_savings: number
  status: string
  confidence: string
  details: Record<string, unknown> | null
  claim_template: string | null
}

interface Stats {
  total_transactions: number
  total_spending: number
  categories: { category: string; count: number; total: number }[]
  top_merchants: { merchant: string; count: number; total: number }[]
  monthly_spending: { month: string; total: number }[]
  accounts: string[]
}

interface OpportunitySummary {
  total_savings: number
  total_opportunities: number
  by_type: { type: string; count: number; total_savings: number }[]
  by_status: Record<string, number>
}

type Tab = 'dashboard' | 'transactions' | 'opportunities' | 'upload'

function App() {
  const [activeTab, setActiveTab] = useState<Tab>('dashboard')
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [opportunities, setOpportunities] = useState<Opportunity[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [summary, setSummary] = useState<OpportunitySummary | null>(null)
  const [loading, setLoading] = useState(false)
  const [analyzing, setAnalyzing] = useState(false)
  const [uploadStatus, setUploadStatus] = useState('')
  const [selectedClaim, setSelectedClaim] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [transactionFilter, setTransactionFilter] = useState('')

  const fetchData = useCallback(async () => {
    try {
      const [txRes, oppRes, statsRes, summaryRes] = await Promise.all([
        fetch(`${API_URL}/api/transactions?limit=500`),
        fetch(`${API_URL}/api/opportunities`),
        fetch(`${API_URL}/api/transactions/stats`),
        fetch(`${API_URL}/api/opportunities/summary`),
      ])
      if (txRes.ok) {
        const data = await txRes.json()
        setTransactions(data.transactions)
      }
      if (oppRes.ok) {
        const data = await oppRes.json()
        setOpportunities(data.opportunities)
      }
      if (statsRes.ok) {
        setStats(await statsRes.json())
      }
      if (summaryRes.ok) {
        setSummary(await summaryRes.json())
      }
    } catch (err) {
      console.error('Error fetching data:', err)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return

    setLoading(true)
    setUploadStatus('')

    let totalImported = 0
    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      const formData = new FormData()
      formData.append('file', file)

      try {
        const res = await fetch(`${API_URL}/api/transactions/upload`, {
          method: 'POST',
          body: formData,
        })
        const data = await res.json()
        if (res.ok) {
          totalImported += data.count
        } else {
          setUploadStatus(prev => prev + `\nError with ${file.name}: ${data.detail}`)
        }
      } catch {
        setUploadStatus(prev => prev + `\nError uploading ${file.name}`)
      }
    }

    setUploadStatus(`Imported ${totalImported} transactions from ${files.length} file(s)`)
    setLoading(false)
    await fetchData()
    e.target.value = ''
  }

  const runAnalysis = async () => {
    setAnalyzing(true)
    try {
      const res = await fetch(`${API_URL}/api/opportunities/analyze`, { method: 'POST' })
      const data = await res.json()
      if (res.ok) {
        setUploadStatus(data.message)
      } else {
        setUploadStatus(`Analysis error: ${data.detail}`)
      }
      await fetchData()
    } catch {
      setUploadStatus('Error running analysis')
    }
    setAnalyzing(false)
  }

  const updateStatus = async (id: number, status: string) => {
    try {
      await fetch(`${API_URL}/api/opportunities/${id}/status?status=${status}`, { method: 'PUT' })
      await fetchData()
    } catch (err) {
      console.error('Error updating status:', err)
    }
  }

  const getClaim = async (id: number) => {
    try {
      const res = await fetch(`${API_URL}/api/opportunities/${id}/claim`)
      const data = await res.json()
      setSelectedClaim(data.claim_template)
    } catch (err) {
      console.error('Error getting claim:', err)
    }
  }

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      const textarea = document.createElement('textarea')
      textarea.value = text
      document.body.appendChild(textarea)
      textarea.select()
      document.execCommand('copy')
      document.body.removeChild(textarea)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const clearAll = async () => {
    if (!confirm('Clear all transactions and opportunities? This cannot be undone.')) return
    try {
      await fetch(`${API_URL}/api/transactions`, { method: 'DELETE' })
      await fetchData()
      setUploadStatus('All data cleared')
    } catch (err) {
      console.error('Error clearing data:', err)
    }
  }

  const typeLabel = (type: string) => {
    const labels: Record<string, string> = {
      subscription_overcharge: 'Subscription Overcharge',
      duplicate_charge: 'Duplicate Charge',
      price_increase: 'Price Increase',
      forgotten_subscription: 'Review Subscription',
    }
    return labels[type] || type
  }

  const typeColor = (type: string) => {
    const colors: Record<string, string> = {
      subscription_overcharge: 'bg-orange-100 text-orange-800',
      duplicate_charge: 'bg-red-100 text-red-800',
      price_increase: 'bg-yellow-100 text-yellow-800',
      forgotten_subscription: 'bg-blue-100 text-blue-800',
    }
    return colors[type] || 'bg-gray-100 text-gray-800'
  }

  const confidenceColor = (conf: string) => {
    const colors: Record<string, string> = {
      high: 'bg-red-100 text-red-700',
      medium: 'bg-yellow-100 text-yellow-700',
      low: 'bg-gray-100 text-gray-600',
    }
    return colors[conf] || 'bg-gray-100 text-gray-600'
  }

  const statusColor = (status: string) => {
    const colors: Record<string, string> = {
      detected: 'bg-blue-100 text-blue-700',
      claimed: 'bg-orange-100 text-orange-700',
      resolved: 'bg-green-100 text-green-700',
      dismissed: 'bg-gray-100 text-gray-500',
    }
    return colors[status] || 'bg-gray-100 text-gray-600'
  }

  const categoryIcon = (cat: string) => {
    const icons: Record<string, string> = {
      subscription: '🔄',
      dining: '🍽️',
      retail: '🛍️',
      transport: '🚗',
      transfer: '💸',
      payment_service: '💳',
      interest: '📈',
      other: '📋',
    }
    return icons[cat] || '📋'
  }

  const filteredTransactions = transactions.filter(t =>
    !transactionFilter ||
    t.description.toLowerCase().includes(transactionFilter.toLowerCase()) ||
    t.merchant.toLowerCase().includes(transactionFilter.toLowerCase()) ||
    t.category.toLowerCase().includes(transactionFilter.toLowerCase())
  )

  return (
    <div className="min-h-screen bg-zinc-50">
      {/* Header */}
      <header className="bg-white border-b border-zinc-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-zinc-900">RefundRadar</h1>
                <p className="text-xs text-zinc-500">Auto-claim refunds & price adjustments</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {stats && stats.total_transactions > 0 && (
                <span className="text-sm text-zinc-500">
                  {stats.total_transactions} transactions loaded
                </span>
              )}
            </div>
          </div>

          {/* Tabs */}
          <nav className="flex gap-1 mt-4 -mb-px">
            {([
              { id: 'dashboard' as Tab, label: 'Dashboard', icon: BarChart3 },
              { id: 'opportunities' as Tab, label: 'Opportunities', icon: TrendingDown },
              { id: 'transactions' as Tab, label: 'Transactions', icon: ArrowUpDown },
              { id: 'upload' as Tab, label: 'Upload', icon: Upload },
            ]).map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-t-lg transition-colors ${
                  activeTab === tab.id
                    ? 'bg-zinc-100 text-zinc-900 border-b-2 border-emerald-600'
                    : 'text-zinc-500 hover:text-zinc-700 hover:bg-zinc-50'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
                {tab.id === 'opportunities' && opportunities.length > 0 && (
                  <span className="ml-1 px-1.5 py-0.5 text-xs rounded-full bg-red-100 text-red-700">
                    {opportunities.filter(o => o.status === 'detected').length}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        {/* Status Banner */}
        {uploadStatus && (
          <div className="mb-4 p-3 rounded-lg bg-emerald-50 text-emerald-800 text-sm flex items-center justify-between">
            <span>{uploadStatus}</span>
            <button onClick={() => setUploadStatus('')} className="text-emerald-600 hover:text-emerald-800">
              &times;
            </button>
          </div>
        )}

        {/* Dashboard Tab */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-white rounded-xl border border-zinc-200 p-5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center">
                    <DollarSign className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-sm text-zinc-500">Potential Savings</p>
                    <p className="text-2xl font-bold text-emerald-600">
                      ${summary?.total_savings?.toFixed(2) || '0.00'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl border border-zinc-200 p-5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center">
                    <AlertTriangle className="w-5 h-5 text-red-600" />
                  </div>
                  <div>
                    <p className="text-sm text-zinc-500">Opportunities Found</p>
                    <p className="text-2xl font-bold text-zinc-900">
                      {summary?.total_opportunities || 0}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl border border-zinc-200 p-5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                    <FileText className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-zinc-500">Transactions</p>
                    <p className="text-2xl font-bold text-zinc-900">
                      {stats?.total_transactions || 0}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl border border-zinc-200 p-5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                    <TrendingDown className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm text-zinc-500">Total Spending</p>
                    <p className="text-2xl font-bold text-zinc-900">
                      ${stats?.total_spending?.toLocaleString(undefined, { minimumFractionDigits: 2 }) || '0.00'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex gap-3">
              <button
                onClick={runAnalysis}
                disabled={analyzing || !stats?.total_transactions}
                className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium text-sm"
              >
                <RefreshCw className={`w-4 h-4 ${analyzing ? 'animate-spin' : ''}`} />
                {analyzing ? 'Analyzing...' : 'Scan for Refund Opportunities'}
              </button>
              {stats && stats.total_transactions > 0 && (
                <button
                  onClick={clearAll}
                  className="flex items-center gap-2 px-4 py-2.5 bg-white text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors text-sm"
                >
                  <Trash2 className="w-4 h-4" />
                  Clear All Data
                </button>
              )}
            </div>

            {/* Opportunity Types Breakdown */}
            {summary && summary.by_type.length > 0 && (
              <div className="bg-white rounded-xl border border-zinc-200 p-6">
                <h3 className="text-lg font-semibold text-zinc-900 mb-4">Savings Breakdown</h3>
                <div className="space-y-3">
                  {summary.by_type.map(t => (
                    <div key={t.type} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${typeColor(t.type)}`}>
                          {typeLabel(t.type)}
                        </span>
                        <span className="text-sm text-zinc-500">{t.count} found</span>
                      </div>
                      <span className="text-lg font-semibold text-emerald-600">
                        ${t.total_savings.toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Top Merchants */}
            {stats && stats.top_merchants.length > 0 && (
              <div className="bg-white rounded-xl border border-zinc-200 p-6">
                <h3 className="text-lg font-semibold text-zinc-900 mb-4">Top Spending by Merchant</h3>
                <div className="space-y-2">
                  {stats.top_merchants.slice(0, 10).map((m, i) => (
                    <div key={i} className="flex items-center justify-between py-2 border-b border-zinc-50 last:border-0">
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-medium text-zinc-400 w-6">{i + 1}</span>
                        <span className="text-sm font-medium text-zinc-900">{m.merchant}</span>
                        <span className="text-xs text-zinc-400">{m.count} charges</span>
                      </div>
                      <span className="text-sm font-semibold text-zinc-700">${m.total.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Monthly Spending */}
            {stats && stats.monthly_spending.length > 0 && (
              <div className="bg-white rounded-xl border border-zinc-200 p-6">
                <h3 className="text-lg font-semibold text-zinc-900 mb-4">Monthly Spending Trend</h3>
                <div className="overflow-x-auto">
                  <div className="flex gap-2 items-end min-w-max pb-8" style={{ height: '220px' }}>
                    {stats.monthly_spending.map((m, i) => {
                      const maxSpending = Math.max(...stats.monthly_spending.map(s => s.total))
                      const height = maxSpending > 0 ? (m.total / maxSpending) * 160 : 0
                      return (
                        <div key={i} className="flex flex-col items-center gap-1">
                          <span className="text-xs text-zinc-500">${Math.round(m.total)}</span>
                          <div
                            className="w-10 bg-emerald-500 rounded-t-md transition-all hover:bg-emerald-600"
                            style={{ height: `${Math.max(height, 4)}px` }}
                            title={`${m.month}: $${m.total.toFixed(2)}`}
                          />
                          <span className="text-xs text-zinc-400 -rotate-45 origin-top-left whitespace-nowrap">
                            {m.month}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* Categories */}
            {stats && stats.categories.length > 0 && (
              <div className="bg-white rounded-xl border border-zinc-200 p-6">
                <h3 className="text-lg font-semibold text-zinc-900 mb-4">Spending by Category</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {stats.categories.map(c => (
                    <div key={c.category} className="p-3 rounded-lg bg-zinc-50 border border-zinc-100">
                      <div className="flex items-center gap-2 mb-1">
                        <span>{categoryIcon(c.category)}</span>
                        <span className="text-sm font-medium text-zinc-700 capitalize">{c.category.replace('_', ' ')}</span>
                      </div>
                      <p className="text-lg font-semibold text-zinc-900">${c.total.toFixed(2)}</p>
                      <p className="text-xs text-zinc-400">{c.count} transactions</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Empty State */}
            {(!stats || stats.total_transactions === 0) && (
              <div className="text-center py-16 bg-white rounded-xl border border-zinc-200">
                <Upload className="w-12 h-12 text-zinc-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-zinc-700 mb-2">No transactions yet</h3>
                <p className="text-sm text-zinc-500 mb-4">Upload your bank statement CSV files to get started</p>
                <button
                  onClick={() => setActiveTab('upload')}
                  className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 text-sm font-medium"
                >
                  Upload Statements
                </button>
              </div>
            )}
          </div>
        )}

        {/* Opportunities Tab */}
        {activeTab === 'opportunities' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-zinc-900">
                Refund Opportunities
                {summary && summary.total_savings > 0 && (
                  <span className="ml-2 text-emerald-600">
                    — ${summary.total_savings.toFixed(2)} potential savings
                  </span>
                )}
              </h2>
              <button
                onClick={runAnalysis}
                disabled={analyzing}
                className="flex items-center gap-2 px-3 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 text-sm"
              >
                <RefreshCw className={`w-4 h-4 ${analyzing ? 'animate-spin' : ''}`} />
                Re-analyze
              </button>
            </div>

            {opportunities.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-xl border border-zinc-200">
                <Search className="w-12 h-12 text-zinc-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-zinc-700 mb-2">No opportunities found yet</h3>
                <p className="text-sm text-zinc-500">Upload bank statements and run analysis to find refund opportunities</p>
              </div>
            ) : (
              <div className="space-y-3">
                {opportunities.map(opp => (
                  <div
                    key={opp.id}
                    className={`bg-white rounded-xl border p-5 transition-all ${
                      opp.status === 'dismissed' ? 'border-zinc-100 opacity-60' : 'border-zinc-200 hover:border-emerald-200'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${typeColor(opp.type)}`}>
                            {typeLabel(opp.type)}
                          </span>
                          <span className={`px-2 py-0.5 rounded-full text-xs ${confidenceColor(opp.confidence)}`}>
                            {opp.confidence} confidence
                          </span>
                          <span className={`px-2 py-0.5 rounded-full text-xs ${statusColor(opp.status)}`}>
                            {opp.status}
                          </span>
                        </div>
                        <p className="text-sm text-zinc-700 mb-3">{opp.description}</p>
                        <div className="flex items-center gap-2 flex-wrap">
                          {opp.status === 'detected' && (
                            <>
                              <button
                                onClick={() => getClaim(opp.id)}
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-lg hover:bg-emerald-100 text-xs font-medium"
                              >
                                <Mail className="w-3.5 h-3.5" />
                                Generate Claim Email
                              </button>
                              <button
                                onClick={() => updateStatus(opp.id, 'claimed')}
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-50 text-orange-700 rounded-lg hover:bg-orange-100 text-xs font-medium"
                              >
                                Mark as Claimed
                              </button>
                              <button
                                onClick={() => updateStatus(opp.id, 'dismissed')}
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-50 text-zinc-500 rounded-lg hover:bg-zinc-100 text-xs font-medium"
                              >
                                Dismiss
                              </button>
                            </>
                          )}
                          {opp.status === 'claimed' && (
                            <button
                              onClick={() => updateStatus(opp.id, 'resolved')}
                              className="flex items-center gap-1.5 px-3 py-1.5 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 text-xs font-medium"
                            >
                              Mark as Resolved
                            </button>
                          )}
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-2xl font-bold text-emerald-600">
                          ${opp.potential_savings.toFixed(2)}
                        </p>
                        <p className="text-xs text-zinc-400">potential savings</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Transactions Tab */}
        {activeTab === 'transactions' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-lg font-semibold text-zinc-900">
                Transactions ({filteredTransactions.length})
              </h2>
              <div className="relative">
                <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Filter by merchant, description..."
                  value={transactionFilter}
                  onChange={(e) => setTransactionFilter(e.target.value)}
                  className="pl-9 pr-4 py-2 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent w-72"
                />
              </div>
            </div>

            {filteredTransactions.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-xl border border-zinc-200">
                <FileText className="w-12 h-12 text-zinc-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-zinc-700 mb-2">No transactions</h3>
                <p className="text-sm text-zinc-500">Upload bank statements to see your transactions</p>
              </div>
            ) : (
              <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-zinc-50 border-b border-zinc-200">
                        <th className="text-left px-4 py-3 font-medium text-zinc-600">Date</th>
                        <th className="text-left px-4 py-3 font-medium text-zinc-600">Description</th>
                        <th className="text-left px-4 py-3 font-medium text-zinc-600">Merchant</th>
                        <th className="text-left px-4 py-3 font-medium text-zinc-600">Category</th>
                        <th className="text-right px-4 py-3 font-medium text-zinc-600">Amount</th>
                        <th className="text-left px-4 py-3 font-medium text-zinc-600">Account</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredTransactions.map(t => (
                        <tr key={t.id} className="border-b border-zinc-50 hover:bg-zinc-50">
                          <td className="px-4 py-3 text-zinc-600 whitespace-nowrap">{t.date}</td>
                          <td className="px-4 py-3 text-zinc-800 max-w-xs truncate">{t.description}</td>
                          <td className="px-4 py-3 text-zinc-700">{t.merchant}</td>
                          <td className="px-4 py-3">
                            <span className="inline-flex items-center gap-1 text-xs">
                              {categoryIcon(t.category)}
                              <span className="capitalize text-zinc-600">{t.category.replace('_', ' ')}</span>
                            </span>
                          </td>
                          <td className={`px-4 py-3 text-right font-mono whitespace-nowrap ${
                            t.amount < 0 ? 'text-red-600' : 'text-emerald-600'
                          }`}>
                            {t.amount < 0 ? '-' : '+'}${Math.abs(t.amount).toFixed(2)}
                          </td>
                          <td className="px-4 py-3 text-zinc-500 text-xs">{t.account_name}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Upload Tab */}
        {activeTab === 'upload' && (
          <div className="space-y-6">
            <h2 className="text-lg font-semibold text-zinc-900">Upload Bank Statements</h2>

            <div className="bg-white rounded-xl border border-zinc-200 p-8">
              <div className="text-center">
                <Upload className="w-16 h-16 text-zinc-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-zinc-700 mb-2">Upload CSV Bank Statements</h3>
                <p className="text-sm text-zinc-500 mb-6 max-w-md mx-auto">
                  Upload your Bluevine bank statement CSV files. We support transaction exports from
                  Bluevine Checking, Accutane, Compute, and Lumini accounts.
                </p>

                <label className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 cursor-pointer transition-colors font-medium">
                  <Upload className="w-5 h-5" />
                  {loading ? 'Uploading...' : 'Choose CSV Files'}
                  <input
                    type="file"
                    accept=".csv"
                    multiple
                    onChange={handleUpload}
                    className="hidden"
                    disabled={loading}
                  />
                </label>

                <p className="text-xs text-zinc-400 mt-4">
                  Supports multiple files. Each file should have columns: Date, Description, Debit/Credit, Balance
                </p>
              </div>
            </div>

            {/* How It Works */}
            <div className="bg-white rounded-xl border border-zinc-200 p-6">
              <h3 className="text-base font-semibold text-zinc-900 mb-3">How It Works</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-sm font-bold shrink-0">1</div>
                  <div>
                    <h4 className="font-medium text-zinc-800">Upload Statements</h4>
                    <p className="text-sm text-zinc-500">Upload CSV files from your bank or connect Google Drive</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-sm font-bold shrink-0">2</div>
                  <div>
                    <h4 className="font-medium text-zinc-800">Auto-Analyze</h4>
                    <p className="text-sm text-zinc-500">We scan for overcharges, duplicates, price hikes, and forgotten subscriptions</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-sm font-bold shrink-0">3</div>
                  <div>
                    <h4 className="font-medium text-zinc-800">Claim Refunds</h4>
                    <p className="text-sm text-zinc-500">Generate pre-written emails to claim your money back</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Claim Modal */}
      {selectedClaim && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-screen overflow-hidden">
            <div className="p-4 border-b border-zinc-200 flex items-center justify-between">
              <h3 className="font-semibold text-zinc-900">Claim Email Template</h3>
              <button
                onClick={() => setSelectedClaim(null)}
                className="text-zinc-400 hover:text-zinc-600 text-xl leading-none"
              >
                &times;
              </button>
            </div>
            <div className="p-4 overflow-y-auto" style={{ maxHeight: '60vh' }}>
              <pre className="whitespace-pre-wrap text-sm text-zinc-700 font-sans leading-relaxed">
                {selectedClaim}
              </pre>
            </div>
            <div className="p-4 border-t border-zinc-200 flex gap-2">
              <button
                onClick={() => copyToClipboard(selectedClaim)}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 text-sm font-medium"
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copied ? 'Copied!' : 'Copy to Clipboard'}
              </button>
              <button
                onClick={() => setSelectedClaim(null)}
                className="px-4 py-2 bg-zinc-100 text-zinc-700 rounded-lg hover:bg-zinc-200 text-sm"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default App
