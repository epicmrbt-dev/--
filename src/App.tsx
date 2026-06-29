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
import { Leaf, Award, RotateCcw, Info, CheckSquare, CalendarDays } from 'lucide-react';
import { motion } from 'motion/react';

// Firebase imports
import { auth, db, signInWithGoogle, logOut } from './lib/firebase';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { collection, doc, setDoc, deleteDoc, onSnapshot, query, orderBy, writeBatch, getDocs } from 'firebase/firestore';

export default function App() {
  // Google Auth States
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  // Core state from Firestore
  const [members, setMembers] = useState<Member[]>([]);
  const [records, setRecords] = useState<RecordTableItem[]>([]);
  const [diaries, setDiaries] = useState<DiaryEntry[]>([]);

  // Selected Active Member (retained locally in browser)
  const [activeMemberId, setActiveMemberId] = useState<string>(() => {
    return localStorage.getItem('biology_club_active_id') || '';
  });

  // 1. Google Auth Subscription
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // 2. Sync Members from Firestore
  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'members'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data: Member[] = [];
      snapshot.forEach((doc) => {
        data.push(doc.data() as Member);
      });
      setMembers(data);
    }, (error) => {
      console.error("Member sync error:", error);
    });
    return () => unsubscribe();
  }, [user]);

  // 3. Sync Records from Firestore
  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'records'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data: RecordTableItem[] = [];
      snapshot.forEach((doc) => {
        data.push(doc.data() as RecordTableItem);
      });
      setRecords(data);
    }, (error) => {
      console.error("Records sync error:", error);
    });
    return () => unsubscribe();
  }, [user]);

  // 4. Sync Diaries from Firestore
  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'diaries'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data: DiaryEntry[] = [];
      snapshot.forEach((doc) => {
        data.push(doc.data() as DiaryEntry);
      });
      setDiaries(data);
    }, (error) => {
      console.error("Diaries sync error:", error);
    });
    return () => unsubscribe();
  }, [user]);

  // Save selected active member ID locally
  useEffect(() => {
    localStorage.setItem('biology_club_active_id', activeMemberId);
  }, [activeMemberId]);

  // Derived state
  const activeMember = members.find((m) => m.id === activeMemberId);

  // 5. Action Handlers (Writing to Firestore)
  const handleAddMember = async (newMemberData: Omit<Member, 'id'>) => {
    const newId = `m-${Date.now()}`;
    const created: Member = {
      id: newId,
      ...newMemberData,
    };
    try {
      await setDoc(doc(db, 'members', newId), created);
      setActiveMemberId(newId); // Auto-login as newly created member
    } catch (e) {
      console.error("Failed to add member to Firestore:", e);
    }
  };

  const handleUpdateRecord = async (updated: RecordTableItem) => {
    try {
      await setDoc(doc(db, 'records', updated.id), updated);
    } catch (e) {
      console.error("Failed to update record in Firestore:", e);
    }
  };

  const handleAddRecordArea = async (areaName: string, assignedMemberId: string) => {
    const newId = `r-${Date.now()}`;
    const newArea: RecordTableItem = {
      id: newId,
      areaName,
      assignedMemberId,
      status: 'excellent',
      lastChecked: new Date().toISOString().split('T')[0],
      latestNote: '新規エリアが作成されました。活動記録を開始してください。',
    };
    try {
      await setDoc(doc(db, 'records', newId), newArea);
    } catch (e) {
      console.error("Failed to add record area to Firestore:", e);
    }
  };

  const handleAddDiary = async (newDiaryData: Omit<DiaryEntry, 'id' | 'createdAt'>) => {
    const newId = `d-${Date.now()}`;
    const newDiary: DiaryEntry = {
      id: newId,
      ...newDiaryData,
      createdAt: new Date().toISOString(),
    };
    try {
      await setDoc(doc(db, 'diaries', newId), newDiary);
    } catch (e) {
      console.error("Failed to add diary entry to Firestore:", e);
    }
  };

  const handleDeleteDiary = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'diaries', id));
    } catch (e) {
      console.error("Failed to delete diary entry from Firestore:", e);
    }
  };

  const handleResetData = async () => {
    if (
      confirm(
        '観察記録と部員リストのすべてのデータを初期状態にリセットします。よろしいですか？'
      )
    ) {
      try {
        const membersSnap = await getDocs(collection(db, 'members'));
        const recordsSnap = await getDocs(collection(db, 'records'));
        const diariesSnap = await getDocs(collection(db, 'diaries'));

        const batch = writeBatch(db);
        membersSnap.forEach((d) => batch.delete(d.ref));
        recordsSnap.forEach((d) => batch.delete(d.ref));
        diariesSnap.forEach((d) => batch.delete(d.ref));
        await batch.commit();

        setActiveMemberId('');
      } catch (e) {
        console.error("Failed to reset Firestore data:", e);
      }
    }
  };

  // Quick statistics
  const totalDiaries = diaries.length;
  const maintenanceNeeded = records.filter((r) => r.status === 'maintenance').length;

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 bg-emerald-500 rounded-2xl flex items-center justify-center text-3xl shadow-xl shadow-emerald-900/10 mx-auto animate-pulse">
            🌿
          </div>
          <p className="text-xs font-bold text-slate-400 animate-pulse font-mono tracking-wider">読み込み中...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-emerald-50 via-slate-50 to-teal-50 px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full bg-white rounded-3xl p-8 border border-emerald-100 shadow-xl shadow-emerald-900/5 space-y-8 relative overflow-hidden"
        >
          <div className="absolute right-[-40px] top-[-40px] w-40 h-40 bg-emerald-500/10 rounded-full blur-3xl"></div>
          <div className="absolute left-[-40px] bottom-[-40px] w-40 h-40 bg-teal-500/10 rounded-full blur-3xl"></div>

          <div className="text-center space-y-3 relative z-10">
            <div className="w-16 h-16 bg-gradient-to-tr from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center text-3xl shadow-lg shadow-emerald-500/25 mx-auto">
              🌿
            </div>
            <div>
              <h1 className="text-xl font-black text-slate-800 tracking-tight">北高生物同好会</h1>
              <p className="text-xs text-emerald-600 font-mono tracking-wider mt-0.5">BIOLOGY CLUB PORTAL</p>
            </div>
            <p className="text-xs text-slate-400 max-w-xs mx-auto leading-relaxed">
              こちらは北高生物同好会の活動記録・観察日記システムです。サインインして活動を開始してください。
            </p>
          </div>

          <div className="space-y-4 relative z-10">
            <button
              onClick={signInWithGoogle}
              className="w-full flex items-center justify-center gap-3 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold py-3.5 px-4 rounded-xl transition-all shadow-md hover:shadow-lg cursor-pointer hover:scale-101 active:scale-99"
            >
              {/* Google Vector Icon */}
              <svg className="w-4 h-4 fill-current text-white" viewBox="0 0 24 24">
                <path d="M12.24 10.285V13.4h6.887c-.275 1.565-1.88 4.604-6.887 4.604-4.33 0-7.859-3.578-7.859-8s3.529-8 7.859-8c2.46 0 4.105 1.025 5.047 1.926l2.427-2.334C17.955 2.192 15.34 1 12.24 1 6.033 1 12.24s5.033 11.24 11.24 11.24c6.478 0 10.793-4.537 10.793-10.986 0-.746-.08-1.32-.176-1.886H12.24z" />
              </svg>
              Google アカウントでサインイン
            </button>
          </div>

          <div className="text-center relative z-10">
            <p className="text-[10px] text-slate-400 leading-relaxed">
              ※学校の Google アカウントまたは個人のアカウントをご使用ください。
            </p>
          </div>
        </motion.div>
      </div>
    );
  }

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
                <h1 className="text-sm font-bold leading-tight text-white tracking-wide">北高生物同好会</h1>
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
          
          <div className="pt-6 border-t border-emerald-900/60 space-y-4">
            {/* Google User Card */}
            <div className="flex items-center gap-2.5 bg-emerald-900/20 p-2.5 rounded-2xl border border-emerald-800/20">
              {user.photoURL ? (
                <img
                  src={user.photoURL}
                  alt={user.displayName || 'Google User'}
                  className="w-8 h-8 rounded-full object-cover border border-emerald-700 shadow-inner"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-emerald-800 border border-emerald-600 flex items-center justify-center text-xs font-black text-white">
                  G
                </div>
              )}
              <div className="flex-1 overflow-hidden">
                <p className="text-xs font-bold text-white truncate leading-tight">{user.displayName || 'Googleユーザー'}</p>
                <p className="text-[9px] text-emerald-400/95 truncate leading-tight mt-0.5">{user.email}</p>
              </div>
            </div>

            {/* Currently Operating Member Info */}
            <div className="flex items-center gap-3 bg-emerald-900/40 p-2.5 rounded-2xl border border-emerald-800/30">
              <div className="w-7 h-7 rounded-full bg-emerald-700 border border-emerald-600 flex items-center justify-center text-xs font-bold text-emerald-100 shadow-inner">
                {activeMember?.name.charAt(0) || '👤'}
              </div>
              <div className="flex-1 overflow-hidden">
                <p className="text-[9px] text-emerald-400 font-bold leading-tight uppercase">操作部員</p>
                <p className="text-xs font-semibold text-emerald-100 truncate leading-tight mt-0.5">
                  {activeMember?.name || '未選択'}
                </p>
              </div>
            </div>

            <button
              onClick={logOut}
              className="w-full text-center py-2 px-3 text-[10px] font-bold text-emerald-300 hover:text-white bg-emerald-900/30 hover:bg-emerald-900/70 border border-emerald-800/20 hover:border-emerald-700/50 rounded-xl transition-all cursor-pointer"
            >
              Googleからログアウト
            </button>
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

            {/* Mobile Logout Button */}
            <button
              onClick={logOut}
              className="lg:hidden p-2 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-xl border border-slate-200 transition-all cursor-pointer"
              title="Googleからログアウト"
            >
              <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
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
                    🌱 ようこそ、北高生物同好会システムへ！
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
            <p>© 2026 北高生物同好会 観察日記・記録システム. All rights reserved.</p>
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
