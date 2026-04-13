import { useState, useMemo, useEffect } from 'react';
import { motion } from 'framer-motion';
import useStore from '../store/useStore';

export default function Orders() {
  const orders = useStore(s => s.orders);
  const fetchTradeHistory = useStore(s => s.fetchTradeHistory);
  const [filter, setFilter] = useState('ALL');
  const formatSymbol = (value) => String(value || '').replace(/^IQ/, '');

  useEffect(() => {
    fetchTradeHistory();
  }, [fetchTradeHistory]);

  const filtered = useMemo(() => {
    if (filter === 'ALL') return orders;
    if (filter === 'BUY') return orders.filter(o => o.type === 'BUY');
    if (filter === 'SELL') return orders.filter(o => o.type === 'SELL');
    if (filter === 'PROFIT') return orders.filter(o => o.pnl > 0);
    if (filter === 'LOSS') return orders.filter(o => o.pnl !== undefined && o.pnl < 0);
    return orders;
  }, [orders, filter]);

  return (
    <div>
      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '4px' }}>Transaction History</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>{orders.length} total transactions</p>
      </motion.div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '6px', marginBottom: '20px', flexWrap: 'wrap' }}>
        {['ALL', 'BUY', 'SELL', 'PROFIT', 'LOSS'].map(f => (
          <button key={f} className={`btn btn-sm ${filter === f ? '' : 'btn-ghost'}`}
            onClick={() => setFilter(f)}
            style={filter === f ? {
              background: f === 'BUY' ? 'var(--green-dim)' : f === 'SELL' ? 'var(--red-dim)' : f === 'PROFIT' ? 'var(--green-dim)' : f === 'LOSS' ? 'var(--red-dim)' : 'var(--accent-purple-dim)',
              color: f === 'BUY' ? 'var(--green)' : f === 'SELL' ? 'var(--red)' : f === 'PROFIT' ? 'var(--green)' : f === 'LOSS' ? 'var(--red)' : 'var(--accent-purple-light)',
              border: '1px solid transparent', borderRadius: 'var(--radius-full)', padding: '5px 16px',
            } : { borderRadius: 'var(--radius-full)', border: '1px solid var(--border-default)', padding: '5px 16px' }}>
            {f}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <motion.div className="card" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          style={{ textAlign: 'center', padding: '60px' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>📋</div>
          <h3>No orders yet</h3>
          <p style={{ color: 'var(--text-secondary)', marginTop: '8px' }}>Your trade history will appear here</p>
        </motion.div>
      ) : (
        <motion.div className="card" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          style={{ overflow: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Date & Time</th>
                <th>Stock</th>
                <th>Type</th>
                <th>Qty</th>
                <th>Price</th>
                <th>Total</th>
                <th>P&L</th>
                <th>Balance After</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(order => (
                <tr key={order.id}>
                  <td style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                    {new Date(order.timestamp).toLocaleDateString()} {new Date(order.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </td>
                  <td>
                    <div className="stock-cell">
                      <div>
                        <div className="stock-name">{order.name}</div>
                        <div className="stock-symbol">{formatSymbol(order.symbol)}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className={`badge ${order.type === 'BUY' ? 'badge-green' : 'badge-red'}`}>
                      {order.type}
                    </span>
                  </td>
                  <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{order.quantity}</td>
                  <td style={{ fontFamily: 'var(--font-mono)' }}>₹{order.price?.toLocaleString()}</td>
                  <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>₹{order.totalCost?.toLocaleString()}</td>
                  <td>
                    {order.pnl !== undefined ? (
                      <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: order.pnl >= 0 ? 'var(--green)' : 'var(--red)' }}>
                        {order.pnl >= 0 ? '+' : ''}₹{order.pnl.toFixed(2)}
                      </span>
                    ) : (
                      <span style={{ color: 'var(--text-muted)' }}>—</span>
                    )}
                  </td>
                  <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>₹{(order.balanceAfter || 0).toLocaleString()}</td>
                  <td>
                    <span className="badge badge-green">
                      {order.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </motion.div>
      )}

    </div>
  );
}
