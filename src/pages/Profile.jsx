import { useEffect, useState } from 'react'
import api from '../api/axios'

export default function Profile({ onBack }) {
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/api/profile/me').then(res => {
      setProfile(res.data)
      setLoading(false)
    })
  }, [])

  const pnlColor = (val) => val >= 0 ? 'text-green-400' : 'text-red-400'
  const placementColor = (p) => p === 1 ? 'text-yellow-400' : p === 2 ? 'text-gray-300' : p === 3 ? 'text-orange-400' : 'text-gray-500'
  const placementLabel = (p) => p === 1 ? '🥇' : p === 2 ? '🥈' : p === 3 ? '🥉' : `#${p}`

  if (loading) return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center">
      <p className="text-gray-400">Loading profile...</p>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6">
      <div className="max-w-4xl mx-auto">

        <div className="flex items-center gap-4 mb-8">
          <button onClick={onBack} className="text-gray-400 hover:text-white text-sm">← Back</button>
          <h1 className="text-3xl font-bold">{profile.username}</h1>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
            <p className="text-gray-400 text-xs mb-1">Games Played</p>
            <p className="text-2xl font-bold">{profile.gamesPlayed}</p>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
            <p className="text-gray-400 text-xs mb-1">Wins</p>
            <p className="text-2xl font-bold text-yellow-400">{profile.wins}</p>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
            <p className="text-gray-400 text-xs mb-1">Win Rate</p>
            <p className="text-2xl font-bold">{profile.winRate.toFixed(1)}%</p>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
            <p className="text-gray-400 text-xs mb-1">Total P&L</p>
            <p className={`text-2xl font-bold ${pnlColor(profile.totalProfitLoss)}`}>
              {profile.totalProfitLoss >= 0 ? '+' : ''}${profile.totalProfitLoss.toFixed(2)}
            </p>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 col-span-2">
            <p className="text-gray-400 text-xs mb-1">Best Portfolio Value</p>
            <p className="text-2xl font-bold text-blue-400">${profile.bestPortfolioValue.toLocaleString(undefined, { maximumFractionDigits: 2 })}</p>
          </div>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
          <div className="p-4 border-b border-gray-800">
            <h2 className="font-semibold">Game History</h2>
          </div>
          {profile.gameHistory.length === 0 && (
            <p className="text-gray-500 text-sm p-6">No finished games yet.</p>
          )}
          <div className="divide-y divide-gray-800">
            {profile.gameHistory.map((game, index) => (
              <div key={index} className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <span className={`text-xl ${placementColor(game.placement)}`}>
                    {placementLabel(game.placement)}
                  </span>
                  <div>
                    <p className="font-medium">{game.lobbyName || 'Unnamed Lobby'}</p>
                    <p className="text-xs text-gray-400">
                      {game.dataset} · {game.gameMode} · {game.totalPlayers} players
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-medium">${game.finalValue.toLocaleString(undefined, { maximumFractionDigits: 2 })}</p>
                  <p className={`text-sm ${pnlColor(game.profitLoss)}`}>
                    {game.profitLoss >= 0 ? '+' : ''}${game.profitLoss.toFixed(2)} ({game.profitLossPercent.toFixed(2)}%)
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}