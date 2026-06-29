/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Member } from '../types';
import { Users, UserPlus, Check, ChevronDown, Award, GraduationCap, Plus, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface MemberSelectorProps {
  activeMember: Member | undefined;
  members: Member[];
  onSetActiveMemberId: (id: string) => void;
  onAddMember: (member: Omit<Member, 'id'>) => void;
}

export default function MemberSelector({
  activeMember,
  members,
  onSetActiveMemberId,
  onAddMember,
}: MemberSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [showManageModal, setShowManageModal] = useState(false);
  const [newMemberName, setNewMemberName] = useState('');
  const [newMemberGrade, setNewMemberGrade] = useState<number>(1);
  const [newMemberRole, setNewMemberRole] = useState('');

  const handleAddMemberSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMemberName.trim()) return;
    onAddMember({
      name: newMemberName.trim(),
      grade: newMemberGrade,
      role: newMemberRole.trim() || undefined,
    });
    setNewMemberName('');
    setNewMemberRole('');
    setNewMemberGrade(1);
  };

  return (
    <div className="relative">
      {/* Current Active Member Button */}
      <button
        id="btn-active-member"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 bg-emerald-50 hover:bg-emerald-100/80 border border-emerald-200 text-emerald-900 px-4 py-2 rounded-xl text-sm font-medium transition-all shadow-xs"
      >
        <div className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs font-bold shadow-xs">
          {activeMember ? activeMember.name.charAt(0) : '👤'}
        </div>
        <div className="text-left hidden sm:block">
          <p className="text-xs text-emerald-600 font-normal">現在の操作部員</p>
          <p className="font-semibold leading-tight text-emerald-950">
            {activeMember ? (
              <>
                {activeMember.name}{' '}
                <span className="text-[10px] bg-emerald-200 text-emerald-800 px-1.5 py-0.5 rounded-md font-normal ml-1">
                  {activeMember.grade}年 {activeMember.role && `· ${activeMember.role}`}
                </span>
              </>
            ) : (
              <span className="text-rose-600 font-semibold flex items-center gap-1">
                ⚠️ 部員を登録してください
              </span>
            )}
          </p>
        </div>
        <ChevronDown className="w-4 h-4 text-emerald-600 ml-1" />
      </button>

      {/* Dropdown Menu */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop to close dropdown */}
            <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
            
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              className="absolute right-0 mt-2 w-72 bg-white rounded-2xl border border-gray-100 shadow-xl z-50 overflow-hidden"
            >
              <div className="p-3 border-b border-gray-50 bg-gray-50/50">
                <p className="text-xs font-medium text-gray-500">部員を切り替える</p>
                <p className="text-[11px] text-gray-400 mt-0.5">※別々の部員として日記の投稿や記録が可能です</p>
              </div>

              <div className="max-h-60 overflow-y-auto p-1.5 space-y-0.5">
                {members.map((member) => (
                  <button
                    key={member.id}
                    id={`btn-select-member-${member.id}`}
                    onClick={() => {
                      onSetActiveMemberId(member.id);
                      setIsOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-left text-sm transition-all ${
                      activeMember?.id === member.id
                        ? 'bg-emerald-50 text-emerald-900 font-semibold'
                        : 'hover:bg-gray-50 text-gray-700'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div
                        className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold ${
                          activeMember?.id === member.id
                            ? 'bg-emerald-600 text-white'
                            : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {member.name.charAt(0)}
                      </div>
                      <div>
                        <p className="leading-tight">{member.name}</p>
                        <p className="text-[10px] text-gray-400 mt-0.5">
                          {member.grade}年生 {member.role && `( ${member.role} )`}
                        </p>
                      </div>
                    </div>
                    {activeMember?.id === member.id && (
                      <Check className="w-4 h-4 text-emerald-600" />
                    )}
                  </button>
                ))}
                {members.length === 0 && (
                  <div className="p-4 text-center text-xs text-slate-400 font-medium leading-relaxed">
                    部員が登録されていません。<br />下のボタンから新規登録してください。
                  </div>
                )}
              </div>

              <div className="p-2 border-t border-gray-50 bg-gray-50/20">
                <button
                  id="btn-manage-members"
                  onClick={() => {
                    setShowManageModal(true);
                    setIsOpen(false);
                  }}
                  className="w-full flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-medium text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100/70 rounded-xl transition-all"
                >
                  <Users className="w-3.5 h-3.5" />
                  部員名簿の管理・追加
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Manage Members Modal */}
      <AnimatePresence>
        {showManageModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl w-full max-w-md p-6 shadow-2xl relative overflow-hidden"
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-4 pb-2 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-emerald-600" />
                  <h3 className="text-lg font-bold text-gray-900">部員名簿の管理</h3>
                </div>
                <button
                  id="btn-close-members-modal"
                  onClick={() => setShowManageModal(false)}
                  className="p-1 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Add New Member Form */}
              <form onSubmit={handleAddMemberSubmit} className="bg-emerald-50/40 border border-emerald-100/80 rounded-2xl p-4 mb-5">
                <h4 className="text-xs font-bold text-emerald-800 uppercase tracking-wider mb-3 flex items-center gap-1">
                  <UserPlus className="w-3.5 h-3.5" />
                  新規部員の登録
                </h4>
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-gray-500 mb-1">氏名 *</label>
                    <input
                      id="input-member-name"
                      type="text"
                      required
                      value={newMemberName}
                      onChange={(e) => setNewMemberName(e.target.value)}
                      placeholder="例: 山田 太郎"
                      className="w-full text-sm bg-white border border-gray-200 rounded-xl px-3 py-2 text-gray-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-gray-500 mb-1">学年</label>
                    <select
                      id="select-member-grade"
                      value={newMemberGrade}
                      onChange={(e) => setNewMemberGrade(Number(e.target.value))}
                      className="w-full text-sm bg-white border border-gray-200 rounded-xl px-3 py-2 text-gray-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                    >
                      <option value={1}>1年生</option>
                      <option value={2}>2年生</option>
                      <option value={3}>3年生</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3 items-end">
                  <div className="col-span-2">
                    <label className="block text-[11px] font-semibold text-gray-500 mb-1">役職・役割 (任意)</label>
                    <input
                      id="input-member-role"
                      type="text"
                      value={newMemberRole}
                      onChange={(e) => setNewMemberRole(e.target.value)}
                      placeholder="例: 水槽係, 広報"
                      className="w-full text-sm bg-white border border-gray-200 rounded-xl px-3 py-2 text-gray-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                    />
                  </div>
                  <div>
                    <button
                      id="btn-add-member-submit"
                      type="submit"
                      className="w-full flex items-center justify-center gap-1 bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-sm py-2 px-3 rounded-xl transition-all shadow-xs"
                    >
                      <Plus className="w-4 h-4" />
                      追加
                    </button>
                  </div>
                </div>
              </form>

              {/* Members List */}
              <div>
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2.5">登録部員一覧 ({members.length}名)</h4>
                <div className="max-h-48 overflow-y-auto divide-y divide-gray-50 pr-1">
                  {members.map((member) => (
                    <div key={member.id} className="py-2.5 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gray-100 text-gray-700 flex items-center justify-center text-xs font-bold">
                          {member.name.charAt(0)}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-900">{member.name}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[10px] text-gray-400 flex items-center gap-0.5">
                              <GraduationCap className="w-3 h-3" />
                              {member.grade}年生
                            </span>
                            {member.role && (
                              <span className="text-[10px] bg-amber-50 text-amber-700 px-1 py-0.2 rounded-md font-medium border border-amber-100 flex items-center gap-0.5">
                                <Award className="w-2.5 h-2.5" />
                                {member.role}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <button
                        id={`btn-select-member-modal-${member.id}`}
                        onClick={() => {
                          onSetActiveMemberId(member.id);
                          setShowManageModal(false);
                        }}
                        className={`text-xs px-2.5 py-1.5 rounded-lg border font-medium transition-all ${
                          activeMember?.id === member.id
                            ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                            : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                        }`}
                      >
                        {activeMember?.id === member.id ? '選択中' : '選択する'}
                      </button>
                    </div>
                  ))}
                  {members.length === 0 && (
                    <div className="py-8 text-center text-xs text-slate-400 font-medium">
                      登録されている部員がいません。<br />上のフォームから新規登録を行ってください。
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
