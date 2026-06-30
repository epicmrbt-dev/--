/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { Member, RecordTableItem, DiaryEntry } from './types';
import {
  INITIAL_MEMBERS,
  INITIAL_RECORDS,
  INITIAL_DIARIES,
} from './data';
import MemberSelector from './components/MemberSelector';
import RecordTable from './components/RecordTable';
import DiarySection from './components/DiarySection';
import AIQuizCard from './components/AIQuizCard';
import { Leaf, Award, RotateCcw, Info, CheckSquare, CalendarDays } from 'lucide-react';
import { motion } from 'motion/react';

export default function App() {
  // 1. Core state initialization with LocalStorage synchronization
  const [members, setMembers] = useState<Member[]>(() => {
    const saved = localStorage.getItem('biology_club_members');
    if (saved) {
      const parsed = JSON.parse(saved);
      // If there is old demo/mock data (e.g. containing '佐藤 陸'), purge it immediately
      const hasMockData = parsed.some((m: any) => m.id === 'm1' || m.name === '佐藤 陸');
      if (hasMockData) {
        localStorage.removeItem('biology_club_members');
        localStorage.removeItem('biology_club_records');
        localStorage.removeItem('biology_club_diaries');
        localStorage.removeItem('biology_club_active_id');
        return INITIAL_MEMBERS;
      }
      return parsed;
    }
    return INITIAL_MEMBERS;
  });

  const [records, setRecords] = useState<RecordTableItem[]>(() => {
    const saved = localStorage.getItem('biology_club_records');
    // Align with members status
    const membersSaved = localStorage.getItem('biology_club_members');
    if (!membersSaved) return INITIAL_RECORDS;
    return saved ? JSON.parse(saved) : INITIAL_RECORDS;
  });

  const [diaries, setDiaries] = useState<DiaryEntry[]>(() => {
    const saved = localStorage.getItem('biology_club_diaries');
    // Align with members status
    const membersSaved = localStorage.getItem('biology_club_members');
    if (!membersSaved) return INITIAL_DIARIES;
    return saved ? JSON.parse(saved) : INITIAL_DIARIES;
  });

  const [activeMemberId, setActiveMemberId] = useState<string>(() => {
    const saved = localStorage.getItem('biology_club_active_id');
    const membersSaved = localStorage.getItem('biology_club_members');
    if (!membersSaved || saved === 'm1') return '';
    if (saved) return saved;
    return INITIAL_MEMBERS[0]?.id || '';
  });

  // Save states to local storage on changes
  useEffect(() => {
    localStorage.setItem('biology_club_members', JSON.stringify(members));
  }, [members]);

  useEffect(() => {
    localStorage.setItem('biology_club_records', JSON.stringify(records));
  }, [records]);

  useEffect(() => {
    localStorage.setItem('biology_club_diaries', JSON.stringify(diaries));
  }, [diaries]);

  useEffect(() => {
    localStorage.setItem('biology_club_active_id', activeMemberId);
  }, [activeMemberId]);

  // Derived state
  const activeMember = members.find((m) => m.id === activeMemberId);

  // 2. Action Handlers
  const handleAddMember = (newMemberData: Omit<Member, 'id'>) => {
    const newId = `m-${Date.now()}`;
    const created: Member = {
      id: newId,
      ...newMemberData,
    };
    setMembers((prev) => [...prev, created]);
    setActiveMemberId(newId); // Auto-login as newly created member
  };

  const handleUpdateRecord = (updated: RecordTableItem) => {
    setRecords((prev) =>
      prev.map((item) => (item.id === updated.id ? updated : item))
    );
  };

  const handleAddRecordArea = (areaName: string, assignedMemberId: string) => {
    const newArea: RecordTableItem = {
      id: `r-${Date.now()}`,
      areaName,
      assignedMemberId,
      status: 'excellent',
      lastChecked: new Date().toISOString().split('T')[0],
      latestNote: '新規エリアが作成されました。活動記録を開始してください。',
    };
    setRecords((prev) => [...prev, newArea]);
  };

  const handleAddDiary = (newDiaryData: Omit<DiaryEntry, 'id' | 'createdAt'>) => {
    const newDiary: DiaryEntry = {
      id: `d-${Date.now()}`,
      ...newDiaryData,
      createdAt: new Date().toISOString(),
    };
    setDiaries((prev) => [newDiary, ...prev]); // Prepend new entry
  };

  const handleDeleteDiary = (id: string) => {
    setDiaries((prev) => prev.filter((item) => item.id !== id));
  };

  const handleResetData = () => {
    if (
      confirm(
        '観察記録と部員リストのすべてのデータを初期状態にリセットします。よろしいですか？'
      )
    ) {
      localStorage.clear();
      setMembers(INITIAL_MEMBERS);
      setRecords(INITIAL_RECORDS);
      setDiaries(INITIAL_DIARIES);
      setActiveMemberId('');
    }
  };

  // Quick statistics
  const totalDiaries = diaries.length;
  const maintenanceNeeded = records.filter((r) => r.status === 'maintenance').length;

  return (
    <div className="flex min-h-screen bg-slate-50 font-sans text-slate-800 overflow-x-hidden">
      {/* Left Sidebar Navigation - Sleek Interface Style */}
      <nav className="w-64 bg-emerald-950 text-emerald-50 hidden lg:flex flex-col border-r border-emerald-900 shrink-0">
        <div className="p-6 flex flex-col h-full justify-between flex-1">
          <div>
            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center text-xl shadow-lg shadow-emerald-900/50 animate-pulse">
                🌿
              </div>
              <div>
                <h1 className="text-sm font-bold leading-tight text-white tracking-wide">星槎もみじ中学校生物同好会</h1>
                <p className="text-[10px] text-emerald-400/80 font-mono tracking-wider">BIOLOGY CLUB PORTAL</p>
              </div>
            </div>
            
            <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-500/60 mb-3 px-1">ナビゲーション</p>
            <ul className="space-y-1.5">
              <li className="flex items-center gap-3 px-3.5 py-2.5 bg-emerald-900/60 text-emerald-300 rounded-xl cursor-default border border-emerald-800/40 shadow-xs">
                <span className="text-base">📊</span>
                <span className="text-xs font-semibold">ダッシュボード</span>
              </li>
              <li className="flex items-center gap-3 px-3.5 py-2.5 text-emerald-100/70 hover:bg-emerald-900/40 hover:text-white rounded-xl transition-all cursor-default">
                <span className="text-base opacity-70">📓</span>
                <span className="text-xs">観察日記一覧</span>
              </li>
              <li className="flex items-center gap-3 px-3.5 py-2.5 text-emerald-100/70 hover:bg-emerald-900/40 hover:text-white rounded-xl transition-all cursor-default">
                <span className="text-base opacity-70">📅</span>
                <span className="text-xs">生物記録・シフト表</span>
              </li>
              <li className="flex items-center gap-3 px-3.5 py-2.5 text-emerald-100/70 hover:bg-emerald-900/40 hover:text-white rounded-xl transition-all cursor-default">
                <span className="text-base opacity-70">👥</span>
                <span className="text-xs">部員名簿管理</span>
              </li>
            </ul>

            <div className="mt-8 p-4 bg-emerald-900/30 border border-emerald-800/20 rounded-2xl">
              <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-wide mb-1.5">📢 お知らせ</p>
              <p className="text-[11px] leading-relaxed text-emerald-100/80 font-medium">
                来週の文化祭展示の割り振りを放課後に生物室で行います。全員集合！
              </p>
            </div>
          </div>
          
          <div className="pt-6 border-t border-emerald-900/60">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-emerald-800 border border-emerald-600 flex items-center justify-center text-xs font-black text-emerald-100 shadow-inner">
                {activeMember?.name.charAt(0) || '👤'}
              </div>
              <div className="flex-1 overflow-hidden">
                <p className="text-xs font-semibold text-white truncate">{activeMember?.name || 'ゲスト部員'}</p>
                <p className="text-[10px] text-emerald-400 font-medium flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block animate-ping"></span>
                  ログイン中
                </p>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content Viewport */}
      <main className="flex-1 flex flex-col min-h-screen overflow-x-hidden">
        {/* Header - Sleek Interface Style */}
        <header className="h-20 bg-white border-b border-slate-200 px-6 sm:px-8 flex items-center justify-between shadow-xs sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-600 flex lg:hidden items-center justify-center text-white shadow-md">
              <Leaf className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-extrabold text-slate-800 tracking-tight flex items-center gap-2">
                生物観察記録システム
                <span className="hidden md:inline-flex items-center gap-1 bg-emerald-50 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-100">
                  Sleek v2.1
                </span>
              </h2>
              <p className="text-xs text-slate-400 hidden sm:block">学校の飼育・栽培エリア管理 ＆ 日々の観察日記共有</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Active Member Selector Dropdown */}
            <MemberSelector
              activeMember={activeMember}
              members={members}
              onSetActiveMemberId={setActiveMemberId}
              onAddMember={handleAddMember}
            />
          </div>
        </header>

        {/* Content Area Container */}
        <div className="flex-1 p-4 sm:p-8 max-w-7xl w-full mx-auto space-y-8">
          
          {/* Conditional Welcome Guideline / Onboarding Banner */}
          {members.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gradient-to-br from-emerald-800 via-emerald-900 to-teal-950 rounded-3xl p-6 sm:p-8 text-white shadow-lg shadow-emerald-900/10 relative overflow-hidden"
            >
              {/* Abstract green sphere decoration background */}
              <div className="absolute right-[-45px] top-[-45px] w-56 h-56 bg-emerald-600/20 rounded-full blur-3xl"></div>
              <div className="absolute left-[30%] bottom-[-60px] w-72 h-72 bg-teal-500/10 rounded-full blur-3xl"></div>

              <div className="relative z-10 space-y-6">
                <div className="space-y-2">
                  <p className="text-emerald-400 text-xs font-bold tracking-wider uppercase flex items-center gap-1.5">
                    🌱 ようこそ、星槎もみじ中学校生物同好会システムへ！
                  </p>
                  <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight text-white leading-tight">
                    最初の部員登録から、日々の観察とお世話をスタートしましょう。
                  </h2>
                  <p className="text-xs text-emerald-100/90 leading-relaxed font-medium max-w-3xl">
                    現在、登録されている部員がありません。まずは以下のフォームからあなたの名前を登録して、最初の一歩を踏み出しましょう！
                    部員が登録されると、自分専用のお世話エリアを立ち上げたり、写真付きの観察日記を自由に投稿・保存できるようになります。
                  </p>
                </div>

                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    const nameInput = document.getElementById('welcome-member-name') as HTMLInputElement;
                    const gradeSelect = document.getElementById('welcome-member-grade') as HTMLSelectElement;
                    const roleInput = document.getElementById('welcome-member-role') as HTMLInputElement;
                    if (nameInput && nameInput.value.trim()) {
                      handleAddMember({
                        name: nameInput.value.trim(),
                        grade: Number(gradeSelect.value) || 1,
                        role: roleInput.value.trim() || undefined
                      });
                    }
                  }}
                  className="bg-white/10 backdrop-blur-md rounded-2xl p-4 sm:p-5 border border-white/15 grid grid-cols-1 md:grid-cols-4 gap-4 items-end shadow-md"
                >
                  <div>
                    <label className="block text-[11px] font-bold text-emerald-300 mb-1.5">氏名 *</label>
                    <input
                      id="welcome-member-name"
                      type="text"
                      required
                      placeholder="例: 佐藤 陸"
                      className="w-full text-xs bg-emerald-950/40 border border-white/20 hover:border-white/40 focus:border-emerald-400 rounded-xl px-3.5 py-2.5 text-white placeholder-white/40 focus:outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-emerald-300 mb-1.5">学年</label>
                    <select
                      id="welcome-member-grade"
                      className="w-full text-xs bg-emerald-900/90 border border-white/20 hover:border-white/40 focus:border-emerald-400 rounded-xl px-3.5 py-2.5 text-white focus:outline-none transition-all"
                    >
                      <option value={1}>1年生</option>
                      <option value={2}>2年生</option>
                      <option value={3}>3年生</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-emerald-300 mb-1.5">役職・役割 (任意)</label>
                    <input
                      id="welcome-member-role"
                      type="text"
                      placeholder="例: 部長, 水槽係"
                      className="w-full text-xs bg-emerald-950/40 border border-white/20 hover:border-white/40 focus:border-emerald-400 rounded-xl px-3.5 py-2.5 text-white placeholder-white/40 focus:outline-none transition-all"
                    />
                  </div>
                  <div>
                    <button
                      type="submit"
                      className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white text-xs font-bold py-3 px-4 rounded-xl transition-all shadow-xs active:scale-98 cursor-pointer"
                    >
                      🚀 部員を登録して始める
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gradient-to-r from-emerald-800 via-emerald-900 to-teal-950 rounded-3xl p-6 text-white shadow-lg shadow-emerald-900/5 overflow-hidden relative"
            >
              {/* Abstract green decoration background */}
              <div className="absolute right-[-40px] top-[-40px] w-48 h-48 bg-emerald-600/25 rounded-full blur-3xl"></div>
              <div className="absolute left-[30%] bottom-[-50px] w-64 h-64 bg-teal-500/10 rounded-full blur-3xl"></div>

              <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                <div className="space-y-1.5 max-w-xl">
                  <p className="text-emerald-400 text-xs font-bold tracking-wider uppercase flex items-center gap-1.5">
                    <Info className="w-4 h-4" />
                    活動ガイドライン
                  </p>
                  <h2 className="text-lg sm:text-xl font-extrabold tracking-tight text-white">
                    生物観察は毎日の小さな気付きから
                  </h2>
                  <p className="text-xs text-emerald-100/90 leading-relaxed font-medium">
                    部員のみなさんは、右上のメニューから自分の名前を選択し、
                    自分が担当する「生物記録表」の確認・更新や、日々の「観察日記」の投稿を行ってください。
                    記録と日記はリアルタイムに全員で共有されます。
                  </p>
                </div>

                {/* Quick Score Stats widget */}
                <div className="flex gap-4 w-full md:w-auto shrink-0">
                  <div className="flex-1 md:flex-initial bg-white/10 backdrop-blur-md rounded-2xl p-3.5 border border-white/10 text-center min-w-28">
                    <p className="text-[10px] text-emerald-300 font-bold uppercase tracking-wider">合計観察日記</p>
                    <div className="flex items-baseline justify-center gap-1 mt-1">
                      <span className="text-2xl font-black text-white">{totalDiaries}</span>
                      <span className="text-xs text-emerald-300">件</span>
                    </div>
                    <div className="text-[9px] text-emerald-200/70 mt-1 flex items-center justify-center gap-0.5">
                      <CalendarDays className="w-2.5 h-2.5" />
                      みんなの記録
                    </div>
                  </div>

                  <div className="flex-1 md:flex-initial bg-white/10 backdrop-blur-md rounded-2xl p-3.5 border border-white/10 text-center min-w-28">
                    <p className="text-[10px] text-emerald-300 font-bold uppercase tracking-wider">要メンテエリア</p>
                    <div className="flex items-baseline justify-center gap-1 mt-1">
                      <span className={`text-2xl font-black ${maintenanceNeeded > 0 ? 'text-rose-300' : 'text-emerald-300'}`}>
                        {maintenanceNeeded}
                      </span>
                      <span className="text-xs text-emerald-300">ヶ所</span>
                    </div>
                    <div className="text-[9px] text-emerald-200/70 mt-1 flex items-center justify-center gap-0.5">
                      <CheckSquare className="w-2.5 h-2.5" />
                      すぐ対応が必要
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Core Grid Layout - 12 Columns */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left Column: Biology Record Table (col-span-5) */}
            <div className="lg:col-span-5 space-y-6">
              <RecordTable
                records={records}
                members={members}
                onUpdateRecord={handleUpdateRecord}
                onAddRecordArea={handleAddRecordArea}
              />
              {members.length > 0 && <AIQuizCard />}
            </div>

            {/* Right Column: Observation Diaries Section (col-span-7) */}
            <div className="lg:col-span-7">
              <DiarySection
                diaries={diaries}
                members={members}
                activeMember={activeMember}
                onAddDiary={handleAddDiary}
                onDeleteDiary={handleDeleteDiary}
              />
            </div>
          </div>

        </div>

        {/* Footer & Operations Panel */}
        <footer className="max-w-7xl mx-auto px-6 sm:px-8 mt-auto py-8 border-t border-slate-200 text-xs text-slate-400 w-full">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <p>© 2026 星槎もみじ中学校生物同好会 観察日記・記録システム. All rights reserved.</p>
            <div className="flex items-center gap-4">
              <button
                id="btn-reset-app"
                onClick={handleResetData}
                className="flex items-center gap-1 hover:text-rose-600 transition-colors font-semibold bg-white border border-slate-200 hover:border-rose-200 hover:bg-rose-50/50 px-3 py-1.5 rounded-lg text-slate-500 shadow-2xs"
              >
                <RotateCcw className="w-3 h-3 text-rose-500" />
                データを初期化
              </button>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
}
