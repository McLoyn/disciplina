import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { CheckCircle2, ChevronRight, ChevronLeft } from 'lucide-react';

const GOALS = ['Study', 'Focus', 'Time Management', 'Exercise', 'Sleep Routine', 'Reduce Distraction', 'General Discipline'];
const STYLES = [
  { id: 'Balanced', label: 'Balanced', desc: 'Flexible approach, gentle accountability' },
  { id: 'Structured', label: 'Structured', desc: 'Clear routines, consistent check-ins' },
  { id: 'Strict', label: 'Strict', desc: 'High accountability, minimal excuses' },
];

const STEPS = ['Main Goal', 'Wake Time', 'Sleep Time', 'Habits', 'Style'];

export default function Onboarding() {
  const { user, updateProfile } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [data, setData] = useState({
    main_goal: '',
    wake_time: '06:00',
    sleep_time: '22:00',
    habit_count: 3,
    discipline_style: 'Balanced',
  });
  const [loading, setLoading] = useState(false);

  const next = () => setStep(s => Math.min(s + 1, 4));
  const back = () => setStep(s => Math.max(s - 1, 0));

  const finish = async () => {
    setLoading(true);
    try {
      await updateProfile({
        ...data,
        onboarding_complete: true,
        wake_time: data.wake_time,
        sleep_time: data.sleep_time,
      });
      navigate('/app/dashboard');
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const canProceed = () => {
    if (step === 0) return !!data.main_goal;
    return true;
  };

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center p-4">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-accent/5 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-md relative z-10 animate-slide-up">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex w-12 h-12 rounded-xl bg-gradient-to-br from-accent to-purple-600 items-center justify-center text-white font-bold text-xl mb-3 glow-accent">D</div>
          <h1 className="text-xl font-bold">Let's set you up</h1>
          <p className="text-text-secondary text-sm">Step {step + 1} of {STEPS.length}</p>
        </div>

        {/* Progress */}
        <div className="flex gap-1.5 mb-6">
          {STEPS.map((_, i) => (
            <div key={i} className={`h-1 flex-1 rounded-full transition-all duration-300 ${i <= step ? 'bg-accent' : 'bg-border'}`} />
          ))}
        </div>

        <div className="card min-h-[300px] flex flex-col">
          <h2 className="text-lg font-semibold mb-1">{STEPS[step]}</h2>

          {/* Step 0: Goal */}
          {step === 0 && (
            <div className="flex-1 space-y-2 mt-4">
              <p className="text-text-secondary text-sm mb-4">What's your primary focus?</p>
              {GOALS.map(g => (
                <button
                  key={g}
                  onClick={() => setData(d => ({ ...d, main_goal: g }))}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-lg border transition-all duration-200 text-sm font-medium ${
                    data.main_goal === g
                      ? 'bg-accent/15 border-accent/40 text-accent-light'
                      : 'bg-bg-elevated border-border text-text hover:border-border-light'
                  }`}
                >
                  <span>{g}</span>
                  {data.main_goal === g && <CheckCircle2 size={16} className="text-accent" />}
                </button>
              ))}
            </div>
          )}

          {/* Step 1: Wake time */}
          {step === 1 && (
            <div className="flex-1 flex flex-col items-center justify-center gap-6 mt-4">
              <p className="text-text-secondary text-sm">When do you want to wake up?</p>
              <div className="text-6xl font-bold gradient-text">{data.wake_time}</div>
              <input
                type="time"
                className="input text-center text-lg"
                value={data.wake_time}
                onChange={e => setData(d => ({ ...d, wake_time: e.target.value }))}
              />
            </div>
          )}

          {/* Step 2: Sleep time */}
          {step === 2 && (
            <div className="flex-1 flex flex-col items-center justify-center gap-6 mt-4">
              <p className="text-text-secondary text-sm">When do you want to sleep?</p>
              <div className="text-6xl font-bold gradient-text">{data.sleep_time}</div>
              <input
                type="time"
                className="input text-center text-lg"
                value={data.sleep_time}
                onChange={e => setData(d => ({ ...d, sleep_time: e.target.value }))}
              />
            </div>
          )}

          {/* Step 3: Habit count */}
          {step === 3 && (
            <div className="flex-1 flex flex-col items-center justify-center gap-6 mt-4">
              <p className="text-text-secondary text-sm">How many habits do you want to start with?</p>
              <div className="text-7xl font-bold gradient-text">{data.habit_count}</div>
              <div className="flex gap-3">
                {[1, 2, 3, 4, 5, 6].map(n => (
                  <button
                    key={n}
                    onClick={() => setData(d => ({ ...d, habit_count: n }))}
                    className={`w-12 h-12 rounded-xl font-bold transition-all ${
                      data.habit_count === n ? 'bg-accent text-white' : 'bg-bg-elevated border border-border text-text-secondary'
                    }`}
                  >
                    {n}
                  </button>
                ))}
              </div>
              <p className="text-text-muted text-xs">Start small. You can always add more later.</p>
            </div>
          )}

          {/* Step 4: Style */}
          {step === 4 && (
            <div className="flex-1 space-y-3 mt-4">
              <p className="text-text-secondary text-sm mb-4">How strict should your accountability be?</p>
              {STYLES.map(s => (
                <button
                  key={s.id}
                  onClick={() => setData(d => ({ ...d, discipline_style: s.id }))}
                  className={`w-full text-left px-4 py-4 rounded-lg border transition-all duration-200 ${
                    data.discipline_style === s.id
                      ? 'bg-accent/15 border-accent/40'
                      : 'bg-bg-elevated border-border hover:border-border-light'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <p className="font-semibold text-sm">{s.label}</p>
                    {data.discipline_style === s.id && <CheckCircle2 size={16} className="text-accent" />}
                  </div>
                  <p className="text-text-secondary text-xs mt-1">{s.desc}</p>
                </button>
              ))}
            </div>
          )}

          {/* Navigation */}
          <div className="flex gap-3 mt-6 pt-4 border-t border-border">
            {step > 0 && (
              <button onClick={back} className="btn-secondary flex-1 justify-center">
                <ChevronLeft size={16} />Back
              </button>
            )}
            {step < 4 ? (
              <button onClick={next} disabled={!canProceed()} className="btn-primary flex-1 justify-center">
                Continue<ChevronRight size={16} />
              </button>
            ) : (
              <button onClick={finish} disabled={loading} className="btn-primary flex-1 justify-center">
                {loading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <>Let's Go! 🚀</>}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
