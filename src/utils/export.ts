import Papa from 'papaparse'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import {
  calculateTotalPnL,
  calculateWinRate,
  calculateProfitFactor,
  calculateAverageWin,
  calculateAverageLoss,
  calculateBestWin,
  calculateWorstLoss,
  calculateExpectancy,
  calculateMaxDrawdown
} from './calculations'

export const exportToCSV = (data: any[], filename: string) => {
  const csv = Papa.unparse(data)
  const blob = new Blob([csv], { type: 'text/csv' })
  const url = window.URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  window.URL.revokeObjectURL(url)
}

export const exportToPDF = (trades: any[], stats: any, filename: string) => {
  const doc = new jsPDF()

  // Title
  doc.setFontSize(20)
  doc.text('Trading Journal Report', 14, 20)

  // Report date
  doc.setFontSize(12)
  doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 30)

  // Statistics
  doc.setFontSize(16)
  doc.text('Summary Statistics', 14, 45)

  const statsData = [
    ['Total Trades', stats.totalTrades],
    ['Win Rate', `${stats.winRate.toFixed(1)}%`],
    ['Total P&L', `$${stats.totalPnL >= 0 ? '+' : ''}${stats.totalPnL.toFixed(2)}`],
    ['Profit Factor', stats.profitFactor === Infinity ? '∞' : stats.profitFactor.toFixed(2)],
    ['Average Win', `$${stats.averageWin.toFixed(2)}`],
    ['Average Loss', `$${stats.averageLoss.toFixed(2)}`],
    ['Expectancy', `$${stats.expectancy.toFixed(2)}`],
    ['Max Drawdown', `$${stats.maxDrawdown.toFixed(2)}`],
    ['Best Win', `$${stats.bestWin.toFixed(2)}`],
    ['Worst Loss', `$${stats.worstLoss.toFixed(2)}`]
  ]

  autoTable(doc, {
    startY: 50,
    head: [['Metric', 'Value']],
    body: statsData,
    theme: 'grid',
    headStyles: { fillColor: [59, 130, 246] }
  })

  // Trades table
  const lastY = (doc as any).lastAutoTable?.finalY || 50
  doc.setFontSize(16)
  doc.text('Trade Details', 14, lastY + 15)

  const tradeData = trades.map(trade => [
    new Date(trade.trade_date).toLocaleDateString(),
    trade.asset_symbol,
    trade.asset_type,
    trade.entry_price?.toFixed(2),
    trade.exit_price?.toFixed(2),
    trade.pnl >= 0 ? `+$${trade.pnl.toFixed(2)}` : `$${trade.pnl.toFixed(2)}`
  ])

  autoTable(doc, {
    startY: lastY + 20,
    head: [['Date', 'Symbol', 'Type', 'Entry', 'Exit', 'P&L']],
    body: tradeData,
    theme: 'grid',
    headStyles: { fillColor: [59, 130, 246] },
    columnStyles: {
      5: { fontStyle: 'bold', textColor: trades.map((t: any) => t.pnl >= 0 ? [34, 197, 94] : [239, 68, 68]) }
    }
  })

  doc.save(filename)
}

export const exportTradeList = (trades: any[]) => {
  const exportData = trades.map(trade => ({
    'Trade Date': new Date(trade.trade_date).toLocaleDateString(),
    'Trade Time': new Date(trade.trade_date).toLocaleTimeString(),
    'Asset Type': trade.asset_type,
    'Symbol': trade.asset_symbol,
    'Entry Price': trade.entry_price,
    'Exit Price': trade.exit_price,
    'Position Size': trade.position_size,
    'Stop Loss': trade.stop_loss || '',
    'Take Profit': trade.take_profit || '',
    'Fees': trade.fees,
    'P&L': trade.pnl,
    'P&L %': trade.pnl_percentage?.toFixed(2),
    'Notes': trade.notes || ''
  }))

  exportToCSV(exportData, `trades-export-${new Date().toISOString().split('T')[0]}.csv`)
}

export const exportAnalyticsReport = (trades: any[], stats: any) => {
  const reportData = {
    summary: {
      totalTrades: stats.totalTrades,
      winRate: stats.winRate,
      totalPnL: stats.totalPnL,
      profitFactor: stats.profitFactor,
      expectancy: stats.expectancy
    },
    trades: trades.map(t => ({
      date: new Date(t.trade_date).toISOString(),
      ...t
    }))
  }

  const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' })
  const url = window.URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `trading-report-${new Date().toISOString().split('T')[0]}.json`
  a.click()
  window.URL.revokeObjectURL(url)
}
