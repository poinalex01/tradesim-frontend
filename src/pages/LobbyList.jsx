import { useEffect, useState } from 'react'
import api from '../api/axios'

export default function LobbyList({ onJoinLobby, onProfile, onSeason }) {
  const [lobbies, setLobbies] = useState([])
  const [showCreate, setShowCreate] = useState(false)
  const [showFinished, setShowFinished] = useState(false)

  const [form, setForm] = useState({
    name: '',
    maxPlayers: 4,
    gameMode: 'SCALPING',
    maxLeverage: 10,
  })

const fetchLobbies = async () => {
    const res = await api.get('/api/lobbies')
    setLobbies(Array.isArray(res.data) ? res.data : [])
}

  useEffect(() => {
    fetchLobbies()

    const interval = setInterval(fetchLobbies, 5000)

    return () => clearInterval(interval)
  }, [])

  const createLobby = async () => {
    await api.post('/api/lobbies', form)

    setShowCreate(false)
    fetchLobbies()
  }

  const startLobby = async (id) => {
    await api.post(`/api/lobbies/${id}/start`)
    fetchLobbies()
  }

  const statusColor = (status) => {
    if (status === 'WAITING') return 'text-yellow-400'
    if (status === 'RUNNING') return 'text-green-400'

    return 'text-gray-400'
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold">TradeSim</h1>

            <p className="text-gray-400 text-sm mt-1">
              Welcome, {localStorage.getItem('username')}
            </p>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => {
                localStorage.clear()
                window.location.reload()
              }}
              className="bg-gray-800 hover:bg-gray-700 px-4 py-2 rounded-lg font-medium transition-colors text-gray-400"
            >
              Logout
            </button>

            <button
              onClick={() => setShowCreate(!showCreate)}
              className="bg-blue-600 hover:bg-blue-500 px-4 py-2 rounded-lg font-medium transition-colors"
            >
              + Create Lobby
            </button>

            <button
              onClick={onProfile}
              className="bg-gray-800 hover:bg-gray-700 px-4 py-2 rounded-lg font-medium transition-colors text-gray-400">
              Profile
            </button>
            <button
              onClick={onSeason}
              className="bg-gray-800 hover:bg-gray-700 px-4 py-2 rounded-lg font-medium transition-colors text-gray-400">
              Season
            </button>
            <button
              onClick={() => setShowFinished(!showFinished)}
              className="bg-gray-800 hover:bg-gray-700 px-4 py-2 rounded-lg font-medium transition-colors text-gray-400">
              {showFinished ? 'Hide Finished' : 'Show Finished'}
            </button>
          </div>
        </div>

        {showCreate && (
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 mb-6">
            <h2 className="text-lg font-semibold mb-4">Create Lobby</h2>

            <div className="grid grid-cols-2 gap-4">
              <input
                placeholder="Lobby Name"
                onChange={(e) =>
                  setForm({
                    ...form,
                    name: e.target.value,
                  })
                }
                className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none"
              />

              <select
                onChange={(e) => setForm({ ...form, gameMode: e.target.value })}
                className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none"
              >
                <option value="SCALPING">Scalping</option>
                <option value="DAY_TRADING">Day Trading</option>
                <option value="SWING_TRADING">Swing Trading</option>
              </select>

              <input
                type="number"
                placeholder="Max Players"
                defaultValue={4}
                onChange={(e) =>
                  setForm({
                    ...form,
                    maxPlayers: Number(e.target.value),
                  })
                }
                className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none"
              />

              <input
                type="number"
                placeholder="Max Leverage"
                defaultValue={10}
                onChange={(e) =>
                  setForm({
                    ...form,
                    maxLeverage: Number(e.target.value),
                  })
                }
                className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none"
              />
            </div>

            <button
              onClick={createLobby}
              className="mt-4 bg-blue-600 hover:bg-blue-500 px-6 py-2 rounded-lg font-medium transition-colors"
            >
              Create
            </button>
          </div>
        )}

        <div className="space-y-3">
          {lobbies.length === 0 && (
            <p className="text-gray-500 text-center py-12">
              No lobbies yet. Create one!
            </p>
          )}

          {lobbies.filter(l => showFinished ? true : l.status !== 'FINISHED').map((lobby) => (
            <div
              key={lobby.id}
              className="bg-gray-900 border border-gray-800 rounded-xl p-5 flex items-center justify-between"
            >
              <div>
                <div className="flex items-center gap-3">
                  <h3 className="font-semibold text-lg">
                    {lobby.name}
                  </h3>

                  <span
                    className={`text-xs font-medium ${statusColor(
                      lobby.status
                    )}`}
                  >
                    ● {lobby.status}
                  </span>
                </div>

                <p className="text-gray-400 text-sm mt-1">
                  {lobby.asset || '?'} · {lobby.gameMode} · $
                  {lobby.startBalance.toLocaleString()} · 
                  {lobby.currentPlayers}/{lobby.maxPlayers} players
                </p>
              </div>

              <div className="flex gap-2">
                {lobby.status === 'WAITING' &&
                  lobby.creatorUsername ===
                    localStorage.getItem('username') && (
                    <button
                      onClick={() => startLobby(lobby.id)}
                      className="bg-green-600 hover:bg-green-500 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                    >
                      Start
                    </button>
                  )}

                {lobby.status === 'RUNNING' && (
                  <button
                    onClick={() => onJoinLobby(lobby.id)}
                    className="bg-blue-600 hover:bg-blue-500 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                  >
                    Enter
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}