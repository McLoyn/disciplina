import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { analyticsService } from '../../services/analytics';
import { createStore } from '../../services/supabase';
import { Trophy, Plus, Zap, X, Star, CheckCircle2 } from 'lucide-react';

const rewardsStore = createStore('rewards');
const redemptionsStore = createStore('reward_redemptions');
const consequencesStore = createStore('consequences');

function RewardModal({ onClose, onSave }) {
  const [form, setForm] = useState({ name: '', description: '', xp_cost: 100 });
  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-content">
        <div className="flex items-center justify-between p-5 border-b border-border">
          <h2 className="font-semibold">New Reward</h2>
          <button onClick={onClose} className="btn-ghost p-1.5"><X size={16} /></button>
        </div>
        <form onSubmit={e => { e.preventDefault(); onSave(form); }} className="p-5 space-y-4">
          <div>
            <label className="label">Reward Name *</label>
            <input className="input" placeholder="e.g. 30 min gaming" value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
          </div>
          <div>
            <label className="label">Description</label>
            <input className="input" placeholder="Optional" value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
          </div>
          <div>
            <label className="label">XP Cost</label>
            <input type="number" className="input" min="10" max="10000" value={form.xp_cost}
              onChange={e => setForm(f => ({ ...f, xp_cost: parseInt(e.target.value) || 100 }))} />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1 justify-center">Cancel</button>
            <button type="submit" className="btn-primary flex-1 justify-center">Create Reward</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function Rewards() {
  const { user } = useAuth();
  const [showModal, setShowModal] = useState(false);
  const [confirmRedeem, setConfirmRedeem] = useState(null);
  const [refresh, setRefresh] = useState(0);
  const [tab, setTab] = useState('rewards');

  const xp = analyticsService.getTotalXP(user.id);
  const rewards = rewardsStore.where(user.id, r => r.is_active !== false);
  const redemptions = redemptionsStore.getAll(user.id).sort((a, b) =>
    new Date(b.redeemed_at) - new Date(a.redeemed_at)
  );
  const consequences = consequencesStore.where(user.id, c => c.is_active !== false);

  const handleCreate = (form) => {
    rewardsStore.create({ user_id: user.id, ...form, is_active: true });
    setShowModal(false);
    setRefresh(r => r + 1);
  };

  const handleRedeem = (reward) => {
    if (xp < reward.xp_cost) return;
    // Deduct XP via negative ledger entry
    analyticsService.addXP(user.id, -reward.xp_cost, 'reward_redemption', reward.id);
    redemptionsStore.create({
      user_id: user.id,
      reward_id: reward.id,
      xp_cost: reward.xp_cost,
      redeemed_at: new Date().toISOString(),
    });
    setConfirmRedeem(null);
    setRefresh(r => r + 1);
  };

  const EXAMPLE_REWARDS = [
    { name: '30 min gaming', xp_cost: 100 },
    { name: 'Movie night', xp_cost: 200 },
    { name: 'Free evening', xp_cost: 400 },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">Rewards</h1>
          <p className="text-text-secondary text-sm mt-0.5">Spend XP on things you enjoy</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary">
          <Plus size={16} /> New Reward
        </button>
      </div>

      {/* XP balance */}
      <div className="card border-accent/20 bg-accent/5">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-accent/20 rounded-xl flex items-center justify-center">
            <Zap size={22} className="text-accent-light" />
          </div>
          <div>
            <p className="text-text-muted text-sm">Available XP</p>
            <p className="text-3xl font-bold gradient-text">{xp.toLocaleString()}</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-6 border-b border-border pb-0">
        {['rewards', 'history'].map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={t === tab ? 'tab-active capitalize' : 'tab-inactive capitalize'}>
            {t}
          </button>
        ))}
      </div>

      {tab === 'rewards' && (
        <>
          {rewards.length === 0 ? (
            <div className="card text-center py-12">
              <Trophy size={32} className="text-accent-light mx-auto mb-3" />
              <h3 className="font-semibold mb-1">No Rewards Yet</h3>
              <p className="text-text-secondary text-sm mb-4">Create rewards you'll actually enjoy.</p>
              <div className="flex flex-col gap-2 mb-4">
                <p className="text-xs text-text-muted">Suggestions:</p>
                {EXAMPLE_REWARDS.map(r => (
                  <div key={r.name} className="flex justify-between text-sm text-text-secondary px-4">
                    <span>{r.name}</span><span className="text-accent-light">{r.xp_cost} XP</span>
                  </div>
                ))}
              </div>
              <button onClick={() => setShowModal(true)} className="btn-primary mx-auto w-fit">
                <Plus size={16} /> Create First Reward
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {rewards.map(r => {
                const canAfford = xp >= r.xp_cost;
                return (
                  <div key={r.id} className={`card-hover ${!canAfford ? 'opacity-60' : ''}`}>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <Star size={16} className="text-yellow-400" />
                          <p className="font-semibold text-sm">{r.name}</p>
                        </div>
                        {r.description && <p className="text-text-muted text-xs mt-1">{r.description}</p>}
                        <div className="flex items-center gap-1.5 mt-2">
                          <Zap size={13} className="text-accent-light" />
                          <span className="text-accent-light font-bold text-sm">{r.xp_cost} XP</span>
                        </div>
                      </div>
                      <button
                        onClick={() => setConfirmRedeem(r)}
                        disabled={!canAfford}
                        className="btn-primary text-xs py-1.5 px-3 ml-3"
                      >
                        Redeem
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {tab === 'history' && (
        <div className="space-y-2">
          {redemptions.length === 0 ? (
            <div className="text-center py-12 text-text-muted">No redemptions yet.</div>
          ) : redemptions.map(r => {
            const reward = rewards.find(rw => rw.id === r.reward_id);
            return (
              <div key={r.id} className="card-hover flex items-center gap-3">
                <CheckCircle2 size={18} className="text-success" />
                <div className="flex-1">
                  <p className="font-medium text-sm">{reward?.name || 'Reward'}</p>
                  <p className="text-text-muted text-xs">{new Date(r.redeemed_at).toLocaleDateString()}</p>
                </div>
                <span className="text-danger text-sm font-medium">-{r.xp_cost} XP</span>
              </div>
            );
          })}
        </div>
      )}

      {/* Confirm redeem modal */}
      {confirmRedeem && (
        <div className="modal-overlay">
          <div className="modal-content p-6 text-center">
            <Trophy size={32} className="text-yellow-400 mx-auto mb-4" />
            <h3 className="font-bold text-lg mb-1">Redeem Reward?</h3>
            <p className="text-text-secondary text-sm mb-1">{confirmRedeem.name}</p>
            <p className="text-accent-light font-bold">Spend {confirmRedeem.xp_cost} XP</p>
            <p className="text-text-muted text-xs mt-1">You have {xp} XP</p>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setConfirmRedeem(null)} className="btn-secondary flex-1 justify-center">Cancel</button>
              <button onClick={() => handleRedeem(confirmRedeem)} className="btn-primary flex-1 justify-center">Redeem</button>
            </div>
          </div>
        </div>
      )}

      {showModal && <RewardModal onClose={() => setShowModal(false)} onSave={handleCreate} />}
    </div>
  );
}
