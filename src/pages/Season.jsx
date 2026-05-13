import { useEffect, useState } from 'react'
import api from '../api/axios'

export default function Season({ onBack }) {
  const [activeTab, setActiveTab] = useState('SCALPING')
  const [seasons, setSeasons] = useState({})
  const [loading, setLoading] = useState(true)

const gameModes = [
    { key: 'SCALPING', label: 'Scalping' },
    { key: 'DAY_TRADING', label: 'Day Trading' },
    { key: 'SWING_TRADING', label: 'Swing Trading' },
]

  useEffect(() => {
    fetchAll()
  }, [])

  const fetchAll = async () => {
    const results = {}
    for (const mode of gameModes) {
      const res = await api.get(`/api/season/current?gameMode=${mode.key}`)
      results[mode.key] = res.data
    }
    setSeasons(results)
    setLoading(false)
  }

  const rankColor = (rank) => {
    switch (rank) {
      case 'RADIANT': return 'text-yellow-300'
      case 'IMMORTAL': return 'text-red-400'
      case 'ASCENDANT': return 'text-green-400'
      case 'DIAMOND': return 'text-blue-400'
      case 'PLATINUM': return 'text-cyan-400'
      case 'GOLD': return 'text-yellow-400'
      case 'SILVER': return 'text-gray-300'
      case 'BRONZE': return 'text-orange-400'
      default: return 'text-gray-500'
    }
  }

  const rankBg = (rank) => {
    switch (rank) {
      case 'RADIANT': return 'bg-yellow-300/10 border-yellow-300/30'
      case 'IMMORTAL': return 'bg-red-400/10 border-red-400/30'
      case 'ASCENDANT': return 'bg-green-400/10 border-green-400/30'
      case 'DIAMOND': return 'bg-blue-400/10 border-blue-400/30'
      case 'PLATINUM': return 'bg-cyan-400/10 border-cyan-400/30'
      case 'GOLD': return 'bg-yellow-400/10 border-yellow-400/30'
      case 'SILVER': return 'bg-gray-300/10 border-gray-300/30'
      case 'BRONZE': return 'bg-orange-400/10 border-orange-400/30'
      default: return 'bg-gray-500/10 border-gray-500/30'
    }
  }

  const pnlColor = (val) => val >= 0 ? 'text-green-400' : 'text-red-400'

  if (loading) return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center">
      <p className="text-gray-400">Loading season...</p>
    </div>
  )

  const current = seasons[activeTab]
  const daysLeft = current ? Math.ceil((new Date(current.endDate) - new Date()) / (1000 * 60 * 60 * 24)) : 0

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6">
      <div className="max-w-4xl mx-auto">

        <div className="flex items-center gap-4 mb-8">
          <button onClick={onBack} className="text-gray-400 hover:text-white text-sm">← Back</button>
          <div>
            <h1 className="text-3xl font-bold">{current?.name}</h1>
            <p className="text-gray-400 text-sm mt-1">{daysLeft} days remaining</p>
          </div>
        </div>

        <div className="flex gap-2 mb-6">
          {gameModes.map(mode => (
            <button
              key={mode.key}
              onClick={() => setActiveTab(mode.key)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === mode.key ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}>
              {mode.label}
            </button>
          ))}
        </div>

        {current && (
          <>
            <div className={`border rounded-xl p-6 mb-8 ${rankBg(current.myStats.rank)}`}>
              <p className="text-gray-400 text-sm mb-1">Your Rank — {gameModes.find(m => m.key === activeTab)?.label}</p>
              <div className="flex items-center justify-between">
                <div>
                  <p className={`text-4xl font-bold ${rankColor(current.myStats.rank)}`}>
                    {current.myStats.rank}
                  </p>
                  <p className="text-gray-400 text-sm mt-1">
                    #{current.myStats.position} · {current.myStats.gamesPlayed} games · {current.myStats.wins} wins
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-gray-400 text-xs mb-1">Season Profit</p>
                  <p className={`text-2xl font-bold ${pnlColor(current.myStats.totalProfit)}`}>
                    {current.myStats.totalProfit >= 0 ? '+' : ''}${current.myStats.totalProfit.toFixed(2)}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
              <div className="p-4 border-b border-gray-800 flex justify-between items-center">
                <h2 className="font-semibold">Leaderboard</h2>
                <p className="text-gray-400 text-sm">{current.standings.length} players</p>
              </div>

              {current.standings.length === 0 && (
                <p className="text-gray-500 text-sm p-6">No players yet in this mode.</p>
              )}

              <div className="divide-y divide-gray-800">
                {current.standings.map((s, index) => (
                  <div key={index} className={`p-4 flex items-center justify-between ${s.username === localStorage.getItem('username') ? 'bg-blue-500/5' : ''}`}>
                    <div className="flex items-center gap-4">
                      <span className={`text-sm font-bold w-6 ${index === 0 ? 'text-yellow-400' : index === 1 ? 'text-gray-300' : index === 2 ? 'text-orange-400' : 'text-gray-500'}`}>
                        #{s.position}
                      </span>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className={`font-medium ${s.username === localStorage.getItem('username') ? 'text-blue-400' : ''}`}>
                            {s.username}
                          </span>
                          <span className={`text-xs font-bold ${rankColor(s.rank)}`}>{s.rank}</span>
                        </div>
                        <p className="text-xs text-gray-400">{s.gamesPlayed} games · {s.wins} wins</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`font-medium ${pnlColor(s.totalProfit)}`}>
                        {s.totalProfit >= 0 ? '+' : ''}${s.totalProfit.toFixed(2)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}