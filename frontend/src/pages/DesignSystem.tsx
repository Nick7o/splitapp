import React from 'react';
import AppLayout from '../components/AppLayout';
import BalancePill from '../components/BalancePill';
import DebtGraph from '../components/DebtGraph/DebtGraph';
import { MemberAvatar } from '../components/MemberIdentity';
import { formatMoney } from '../data/currencies';

const sampleMembers = [
  { id: 'u1', name: 'Alicja Nowak', email: 'alicja@example.com', avatarKey: 'wave' },
  { id: 'u2', name: 'Bartek Lis', email: 'bartek@example.com', avatarKey: 'sun' },
  { id: 'u3', name: 'Marta Zielinska', email: 'marta@example.com', avatarKey: 'cactus' },
  { id: 'u4', name: 'Kuba Wojcik', email: 'kuba@example.com', avatarKey: 'camera' },
];

const sampleDebts = [
  { fromUserId: 'u2', toUserId: 'u1', amount: 84.5 },
  { fromUserId: 'u4', toUserId: 'u3', amount: 36.25 },
  { fromUserId: 'u2', toUserId: 'u3', amount: 18 },
];

const sampleBalances = {
  u1: 84.5,
  u2: -102.5,
  u3: 54.25,
  u4: -36.25,
};

const DesignSystem: React.FC = () => {
  return (
    <AppLayout title="Design system" backTo="/" maxWidthClassName="max-w-6xl" showBottomNav={false}>
      <div className="space-y-8">
        <section className="app-card-strong p-5 sm:p-7">
          <p className="app-eyebrow text-secondary">Foundations</p>
          <h1 className="app-page-title mt-2">SplitApp interface review</h1>
          <p className="mt-3 max-w-3xl text-sm font-medium leading-relaxed text-on-surface-variant">
            One place to check typography, button weight, data pills, cards, money states, and graph language against the same visual rules.
          </p>
        </section>

        <section className="grid gap-4 lg:grid-cols-3">
          <div className="app-card p-5">
            <p className="app-eyebrow">Typography</p>
            <h2 className="app-section-title mt-3">Section title</h2>
            <h3 className="app-card-title mt-4">Card title</h3>
            <p className="mt-3 text-sm leading-relaxed text-on-surface-variant">
              Inter only. No decorative headline face, no stretched letter spacing.
            </p>
          </div>

          <div className="app-card p-5">
            <p className="app-eyebrow">Actions</p>
            <div className="mt-4 flex flex-wrap gap-3">
              <button type="button" className="app-button-primary">
                <span className="material-symbols-outlined">add</span>
                Primary
              </button>
              <button type="button" className="app-button-secondary">
                <span className="material-symbols-outlined">tune</span>
                Secondary
              </button>
              <button type="button" className="app-icon-button" aria-label="Icon action">
                <span className="material-symbols-outlined">settings</span>
              </button>
            </div>
          </div>

          <div className="app-card p-5">
            <p className="app-eyebrow">Data, not buttons</p>
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <BalancePill amount={128.4} currency="PLN" />
              <BalancePill amount={-42.1} currency="PLN" />
              <BalancePill label="Settled" />
              <span className="app-status-chip border-primary-fixed/25 bg-primary/12 text-primary-fixed">Open</span>
              <span className="app-data-pill border-primary-fixed/25 bg-primary/12 text-primary-fixed">{formatMoney(84.5, 'PLN')}</span>
            </div>
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-[minmax(0,0.82fr)_minmax(0,1.18fr)]">
          <div className="app-card overflow-hidden">
            <div className="border-b border-white/10 p-5">
              <p className="app-eyebrow">Ledger row</p>
              <h2 className="app-card-title mt-2">Balance list</h2>
            </div>
            <div className="divide-y divide-white/10">
              {sampleMembers.map((member) => {
                const amount = sampleBalances[member.id as keyof typeof sampleBalances] ?? 0;
                const open = Math.abs(amount) > 0.0001;

                return (
                  <div key={member.id} className="grid gap-4 p-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
                    <div className="flex min-w-0 items-center gap-3">
                      <MemberAvatar member={member} size="lg" className="h-11 w-11" />
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-on-surface">{member.name}</p>
                        <p className="truncate text-xs text-on-surface-variant">{member.email}</p>
                      </div>
                      <span className={`app-status-chip ml-auto ${open ? 'border-primary-fixed/25 bg-primary/12 text-primary-fixed' : 'border-outline-variant/25 bg-surface-container text-on-surface-variant'}`}>
                        {open ? 'Open' : 'Settled'}
                      </span>
                    </div>
                    <p className={`app-value text-lg ${amount >= 0 ? 'text-primary-fixed' : 'text-error'}`}>
                      {formatMoney(amount, 'PLN')}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          <DebtGraph
            groupId="design-system"
            members={sampleMembers}
            debts={sampleDebts}
            currency="PLN"
            currentUserId="u1"
            balancesByUser={sampleBalances}
          />
        </section>
      </div>
    </AppLayout>
  );
};

export default DesignSystem;
