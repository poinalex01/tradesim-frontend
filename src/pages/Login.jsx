import { useState } from 'react'
import api from '../api/axios'

export default function Login({ onLogin }) {
  const [isRegister, setIsRegister] = useState(false)
  const [form, setForm] = useState({ username: '', email: '', password: '' })
  const [error, setError] = useState('')

  const handle = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const submit = async () => {
    try {
      const endpoint = isRegister ? '/api/auth/register' : '/api/auth/login'
      const payload = isRegister ? form : { username: form.username, password: form.password }
      const res = await api.post(endpoint, payload)
      localStorage.setItem('token', res.data.token)
      localStorage.setItem('username', res.data.username)
      onLogin()
    } catch (e) {
      setError(e.response?.data?.message || 'Something went wrong')
    }
  }

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center">
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-8 w-full max-w-md">

        <h1 className="text-3xl font-bold text-white mb-1">TradeSim</h1>
        <p className="text-gray-400 text-sm mb-8">Historical market trading competition</p>

        <div className="flex mb-6 bg-gray-800 rounded-lg p-1">
          <button
            onClick={() => setIsRegister(false)}
            className={`flex-1 py-2 rounded-md text-sm font-medium transition-colors ${!isRegister ? 'bg-gray-600 text-white' : 'text-gray-400'}`}>
            Login
          </button>
          <button
            onClick={() => setIsRegister(true)}
            className={`flex-1 py-2 rounded-md text-sm font-medium transition-colors ${isRegister ? 'bg-gray-600 text-white' : 'text-gray-400'}`}>
            Register
          </button>
        </div>

        <div className="space-y-4">
          <input
            name="username"
            placeholder="Username"
            onChange={handle}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-gray-500"
          />
          {isRegister && (
            <input
              name="email"
              placeholder="Email"
              onChange={handle}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-gray-500"
            />
          )}
          <input
            name="password"
            type="password"
            placeholder="Password"
            onChange={handle}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-gray-500"
          />
        </div>

        {error && <p className="text-red-400 text-sm mt-4">{error}</p>}

        <button
          onClick={submit}
          className="w-full mt-6 bg-blue-600 hover:bg-blue-500 text-white font-semibold py-3 rounded-lg transition-colors">
          {isRegister ? 'Create Account' : 'Login'}
        </button>
      </div>
    </div>
  )
}