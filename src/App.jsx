import { useState } from 'react'
import Login from './pages/Login'
import LobbyList from './pages/LobbyList'
import GameScreen from './pages/GameScreen'
import Profile from './pages/Profile'
import Season from './pages/Season'

export default function App() {
  const [loggedIn, setLoggedIn] = useState(!!localStorage.getItem('token'))
  const [currentLobbyId, setCurrentLobbyId] = useState(null)
  const [showProfile, setShowProfile] = useState(false)
  const [showSeason, setShowSeason] = useState(false)

  if (!loggedIn) return <Login onLogin={() => setLoggedIn(true)} />
  if (currentLobbyId) return (
    <GameScreen lobbyId={currentLobbyId} onExit={() => setCurrentLobbyId(null)} />
  )
  if (showProfile) return <Profile onBack={() => setShowProfile(false)} />
  if (showSeason) return <Season onBack={() => setShowSeason(false)} />

  return <LobbyList
    onJoinLobby={(id) => setCurrentLobbyId(id)}
    onProfile={() => setShowProfile(true)}
    onSeason={() => setShowSeason(true)}
  />
}