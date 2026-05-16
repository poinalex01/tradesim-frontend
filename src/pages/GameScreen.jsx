import { useEffect, useRef, useState } from 'react'
import { createChart, CandlestickSeries } from 'lightweight-charts'
import SockJS from 'sockjs-client'
import { Client } from '@stomp/stompjs'
import api from '../api/axios'

export default function GameScreen({ lobbyId, onExit }) {
  const chartContainerRef = useRef(null)
  const candleSeriesRef = useRef(null)
  const chartRef = useRef(null)
  const stompClientRef = useRef(null)

  const [lobby, setLobby] = useState(null)
  const [portfolio, setPortfolio] = useState(null)
  const [leaderboard, setLeaderboard] = useState([])
  const [currentPrice, setCurrentPrice] = useState(null)
  const [tradeForm, setTradeForm] = useState({ asset: 'BTC', quantity: 0, usdAmount: 100, leverage: 1, type: 'LONG' })
  const [error, setError] = useState('')
  const [finished, setFinished] = useState(false)

  const getAsset = (dataset) => {
    if (!dataset) return 'BTC'
    if (dataset.startsWith('ETH')) return 'ETH'
    if (dataset.startsWith('SOL')) return 'SOL'
    return 'BTC'
  }

  useEffect(() => {
    if (lobbyId) fetchPortfolio()
  }, [tradeForm.usdAmount])

  useEffect(() => {
    initAll()
    connectWebSocket()
    return () => {
      if (stompClientRef.current) stompClientRef.current.deactivate()
    }
  }, [])

  const initAll = async () => {
    const lobbyRes = await api.get(`/api/lobbies/${lobbyId}`)
    setLobby(lobbyRes.data)
    if (lobbyRes.data.status === 'FINISHED') setFinished(true)
    const asset = getAsset(lobbyRes.data.dataset)
    setTradeForm(prev => ({ ...prev, asset }))
    fetchPortfolio()
    fetchLeaderboard()
    initChart(lobbyRes.data)
  }

  const fetchLobby = async () => {
    const res = await api.get(`/api/lobbies/${lobbyId}`)
    setLobby(res.data)
    if (res.data.status === 'FINISHED') setFinished(true)
  }

  const fetchPortfolio = async () => {
    const res = await api.get(`/api/portfolio/${lobbyId}`)
    setPortfolio(res.data)
  }

  const fetchLeaderboard = async () => {
    const res = await api.get(`/api/lobbies/${lobbyId}/leaderboard`)
    setLeaderboard(res.data)
  }

  const initChart = async (lobbyData) => {
    if (chartContainerRef.current.children.length > 0) {
      chartContainerRef.current.innerHTML = ''
    }

    const chart = createChart(chartContainerRef.current, {
      width: chartContainerRef.current.clientWidth,
      height: 400,
      layout: {
        background: { color: '#0a0a0f' },
        textColor: '#9ca3af',
      },
      grid: {
        vertLines: { color: '#1f2937' },
        horzLines: { color: '#1f2937' },
      },
      crosshair: { mode: 1 },
      timeScale: {
        borderColor: '#1f2937',
        tickMarkFormatter: (time) => `D${time}`,
      },
      rightPriceScale: {
        scaleMargins: {
          top: 0.2,
          bottom: 0.2,
        },
      },
    })

    chartRef.current = chart

    const candleSeries = chart.addSeries(CandlestickSeries, {
      upColor: '#22c55e',
      downColor: '#ef4444',
      borderUpColor: '#22c55e',
      borderDownColor: '#ef4444',
      wickUpColor: '#22c55e',
      wickDownColor: '#ef4444',
    })

    candleSeriesRef.current = candleSeries

    const asset = getAsset(lobbyData.dataset)
    const res = await api.get(`/api/market/candles?dataset=${lobbyData.dataset}&asset=${asset}`)
    const tickIndex = lobbyData.currentTickIndex

    const allCandles = res.data.slice(0, tickIndex + 1).map((c, index) => ({
      time: index + 1,
      open: c.open,
      high: c.high,
      low: c.low,
      close: c.close,
    }))

    candleSeries.setData(allCandles)

    const contextCandles = allCandles.filter(c => c.isContext).map(c => ({
      time: c.time,
      open: c.open,
      high: c.high,
      low: c.low,
      close: c.close,
      color: '#4b5563',
      borderColor: '#6b7280',
      wickColor: '#6b7280',
    }))

    const liveCandles = allCandles.filter(c => !c.isContext)

    candleSeries.setData([...contextCandles, ...liveCandles])

    setTimeout(() => {
      chart.timeScale().fitContent()
      const half = 45
      chart.timeScale().setVisibleLogicalRange({ from: tickIndex - half, to: tickIndex + half })
    }, 100)
  }

  const connectWebSocket = () => {
    const client = new Client({
      webSocketFactory: () => new SockJS('http://localhost:8080/ws'),
      onConnect: () => {
        client.subscribe(`/topic/lobby/${lobbyId}`, (message) => {
          const data = JSON.parse(message.body)
          setCurrentPrice(data.currentPrice)

          if (candleSeriesRef.current) {
            candleSeriesRef.current.update({
              time: data.tickIndex,
              open: data.open,
              high: data.high,
              low: data.low,
              close: data.close,
            })
          }

          fetchPortfolio()
          fetchLeaderboard()
          fetchLobby()
        })
      },
    })

    client.activate()
    stompClientRef.current = client
  }

  const openPosition = async () => {
    try {
      setError('')
      await api.post(`/api/trade/${lobbyId}/open`, tradeForm)
      fetchPortfolio()
    } catch (e) {
      setError(e.response?.data || 'Trade failed')
    }
  }

  const closePosition = async (positionId) => {
    await api.post(`/api/trade/${lobbyId}/close/${positionId}`)
    fetchPortfolio()
  }

  const pnlColor = (val) => val >= 0 ? 'text-green-400' : 'text-red-400'

  if (finished) {
    return (
      <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center">
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-8 w-full max-w-lg">
          <h1 className="text-3xl font-bold mb-2">Game Over</h1>
          <p className="text-gray-400 mb-6">{lobby?.name} — Final Results</p>
          <div className="space-y-3 mb-8">
            {leaderboard.map((p, index) => (
              <div key={p.id} className={`flex items-center justify-between p-4 rounded-lg border ${index === 0 ? 'border-yellow-500 bg-yellow-500/5' : 'border-gray-800 bg-gray-800/50'}`}>
                <div className="flex items-center gap-3">
                  <span className={`text-lg font-bold ${index === 0 ? 'text-yellow-400' : 'text-gray-400'}`}>
                    #{index + 1}
                  </span>
                  <span className="font-medium">{p.username}</span>
                </div>
                <div className="text-right">
                  <p className="font-bold">${p.totalValue.toLocaleString(undefined, { maximumFractionDigits: 2 })}</p>
                  <p className={`text-sm ${pnlColor(p.profitLoss)}`}>
                    {p.profitLoss >= 0 ? '+' : ''}${p.profitLoss.toFixed(2)} ({p.profitLossPercent.toFixed(2)}%)
                  </p>
                </div>
              </div>
            ))}
          </div>
          <button
            onClick={onExit}
            className="w-full bg-blue-600 hover:bg-blue-500 py-3 rounded-lg font-semibold transition-colors">
            Back to Lobbies
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <div className="flex items-center justify-between px-6 py-3 bg-gray-900 border-b border-gray-800">
        <div className="flex items-center gap-4">
          <button onClick={onExit} className="text-gray-400 hover:text-white text-sm">← Exit</button>
          <h1 className="font-semibold">{lobby?.name}</h1>
          <span className="text-xs text-green-400 bg-green-400/10 px-2 py-1 rounded">● LIVE</span>
        </div>
        <div className="flex items-center gap-6">
          {currentPrice && (
            <div className="text-right">
              <p className="text-xs text-gray-400">{lobby?.asset}/USDT</p>
              <p className="text-lg font-bold text-white">${currentPrice.toLocaleString()}</p>
            </div>
          )}
          {portfolio && (
            <div className="text-right">
              <p className="text-xs text-gray-400">Portfolio</p>
              <p className={`text-lg font-bold ${pnlColor(portfolio.profitLoss)}`}>
                ${portfolio.totalValue.toLocaleString(undefined, { maximumFractionDigits: 2 })}
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="flex h-[calc(100vh-57px)]">
        <div className="flex-1 flex flex-col">
          <div ref={chartContainerRef} className="w-full" />
          <div className="flex-1 p-4 overflow-y-auto">
            <h3 className="text-sm font-medium text-gray-400 mb-3">Open Positions</h3>
            {portfolio?.openPositions?.length === 0 && (
              <p className="text-gray-600 text-sm">No open positions</p>
            )}
            {portfolio?.openPositions?.map(pos => (
              <div key={pos.id} className="bg-gray-900 border border-gray-800 rounded-lg p-3 mb-2 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className={`text-xs font-bold px-2 py-1 rounded ${pos.type === 'LONG' ? 'bg-green-400/10 text-green-400' : 'bg-red-400/10 text-red-400'}`}>
                    {pos.type}
                  </span>
                  <div>
                    <p className="text-sm font-medium">{pos.asset} - {pos.quantity.toFixed(6)} - {pos.leverage}x</p>
                    <p className="text-xs text-gray-400">Entry: ${pos.entryPrice.toLocaleString()}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <p className={`text-sm font-medium ${pnlColor(pos.pnl)}`}>
                    {pos.pnl >= 0 ? '+' : ''}${pos.pnl.toFixed(2)}
                  </p>
                  <button
                    onClick={() => closePosition(pos.id)}
                    className="text-xs bg-gray-800 hover:bg-gray-700 px-3 py-1 rounded transition-colors">
                    Close
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="w-72 bg-gray-900 border-l border-gray-800 p-4 flex flex-col gap-4 overflow-y-auto">
          <div>
            <h3 className="text-sm font-medium text-gray-400 mb-3">Portfolio</h3>
            {portfolio && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Cash</span>
                  <span>${portfolio.cashBalance.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Total Value</span>
                  <span>${portfolio.totalValue.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">P&L</span>
                  <span className={pnlColor(portfolio.profitLoss)}>
                    {portfolio.profitLoss >= 0 ? '+' : ''}${portfolio.profitLoss.toFixed(2)} ({portfolio.profitLossPercent.toFixed(2)}%)
                  </span>
                </div>
              </div>
            )}
          </div>

          <div className="border-t border-gray-800 pt-4">
            <h3 className="text-sm font-medium text-gray-400 mb-3">Leaderboard</h3>
            <div className="space-y-2">
              {leaderboard.map((p, index) => (
                <div key={p.id} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <span className="text-gray-500 w-4">#{index + 1}</span>
                    <span className={p.username === localStorage.getItem('username') ? 'text-blue-400' : ''}>{p.username}</span>
                  </div>
                  <span className={pnlColor(p.profitLoss)}>
                    ${p.totalValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="border-t border-gray-800 pt-4">
            <h3 className="text-sm font-medium text-gray-400 mb-3">Trade</h3>
            <div className="space-y-3">
              <div className="flex gap-2">
                <button
                  onClick={() => setTradeForm({ ...tradeForm, type: 'LONG' })}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${tradeForm.type === 'LONG' ? 'bg-green-600 text-white' : 'bg-gray-800 text-gray-400'}`}>
                  Long
                </button>
                <button
                  onClick={() => setTradeForm({ ...tradeForm, type: 'SHORT' })}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${tradeForm.type === 'SHORT' ? 'bg-red-600 text-white' : 'bg-gray-800 text-gray-400'}`}>
                  Short
                </button>
              </div>

              <div>
                <label className="text-xs text-gray-400 mb-1 block">Amount (USD)</label>
                <input
                  type="number"
                  placeholder="e.g. 500"
                  defaultValue={100}
                  step={10}
                  onChange={e => {
                    const usdAmount = Number(e.target.value)
                    const qty = currentPrice ? usdAmount / currentPrice : 0
                    setTradeForm({ ...tradeForm, quantity: qty, usdAmount })
                  }}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs text-gray-400 mb-1 block">Leverage (1-{lobby?.maxLeverage || 10}x)</label>
                <input
                  type="number"
                  defaultValue={1}
                  min={1}
                  max={lobby?.maxLeverage || 10}
                  onChange={e => setTradeForm({ ...tradeForm, leverage: Number(e.target.value) })}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none"
                />
              </div>

              {currentPrice && tradeForm.usdAmount > 0 && (
                <div className="bg-gray-800 rounded-lg p-3 space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Asset Price</span>
                    <span>${currentPrice.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Quantity</span>
                    <span>{tradeForm.quantity.toFixed(6)} {getAsset(lobby?.dataset)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Position Size</span>
                    <span>${(tradeForm.usdAmount * (tradeForm.leverage || 1)).toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Margin Used</span>
                    <span className="text-yellow-400">${tradeForm.usdAmount.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Cash Available</span>
                    <span className={tradeForm.usdAmount > portfolio?.cashBalance ? 'text-red-400' : 'text-green-400'}>
                      ${portfolio?.cashBalance.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              )}

              {error && <p className="text-red-400 text-xs">{error}</p>}
              <button
                onClick={openPosition}
                disabled={!currentPrice || tradeForm.usdAmount > portfolio?.cashBalance}
                className={`w-full py-3 rounded-lg font-semibold text-sm transition-colors ${tradeForm.type === 'LONG' ? 'bg-green-600 hover:bg-green-500 disabled:bg-green-900 disabled:text-green-700' : 'bg-red-600 hover:bg-red-500 disabled:bg-red-900 disabled:text-red-700'}`}>
                {tradeForm.type === 'LONG' ? 'Buy / Long' : 'Sell / Short'}
              </button>

              <div className="border-t border-gray-800 pt-3 mt-3 space-y-2">
                <p className="text-xs text-gray-500 mb-2">Coming Soon</p>
                {['Limit Order', 'Stop Loss', 'Take Profit', 'Advanced Charts', 'Replay'].map(feature => (
                  <div
                    key={feature}
                    className="w-full py-2 px-3 rounded-lg text-sm text-gray-600 bg-gray-800/50 border border-gray-800 flex items-center justify-between cursor-not-allowed"
                    onClick={() => setError(feature + ' — Coming Soon')}
                  >
                    <span>{feature}</span>
                    <span className="text-xs bg-gray-700 px-2 py-0.5 rounded">Soon</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}