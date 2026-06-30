/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { RecordTableItem, Member, RecordStatus } from '../types';
import { CheckCircle2, AlertTriangle, Wrench, Calendar, User, PenSquare, X, Save, Plus, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import AIAdvisorModal from './AIAdvisorModal';

interface RecordTableProps {
  records: RecordTableItem[];
  members: Member[];
  onUpdateRecord: (updated: RecordTableItem) => void;
  onAddRecordArea: (areaName: string, assignedMemberId: string) => void;
}

export default function RecordTable({
  records,
  members,
  onUpdateRecord,
  onAddRecordArea,
}: RecordTableProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showAddAreaForm, setShowAddAreaForm] = useState(false);
  const [advisorItem, setAdvisorItem] = useState<RecordTableItem | null>(null);

  const getMemberNameOnly = (id: string) => {
    const m = members.find((member) => member.id === id);
    return m ? m.name : '未選択';
  };

  const getMemberGradeOnly = (id: string) => {
    const m = members.find((member) => member.id === id);
    return m ? m.grade : undefined;
  };

  // Edit states
  const [editAssignedId, setEditAssignedId] = useState('');
  const [editStatus, setEditStatus] = useState<RecordStatus>('excellent');
  const [editNote, setEditNote] = useState('');
  const [editAreaName, setEditAreaName] = useState('');

  // Add states
  const [newAreaName, setNewAreaName] = useState('');
  const [newAssignedId, setNewAssignedId] = useState('');

  const handleStartEdit = (item: RecordTableItem) => {
    setEditingId(item.id);
    setEditAssignedId(item.assignedMemberId);
    setEditStatus(item.status);
    setEditNote(item.latestNote);
    setEditAreaName(item.areaName);
  };

  const handleSaveEdit = (id: string) => {
    const originalItem = records.find((r) => r.id === id);
    if (!originalItem) return;

    onUpdateRecord({
      ...originalItem,
      areaName: editAreaName.trim() || originalItem.areaName,
      assignedMemberId: editAssignedId,
      status: editStatus,
      latestNote: editNote.trim(),
      lastChecked: new Date().toISOString().split('T')[0], // Updates to today when modified
    });
    setEditingId(null);
  };

  const handleAddAreaSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAreaName.trim() || !newAssignedId) return;
    onAddRecordArea(newAreaName.trim(), newAssignedId);
    setNewAreaName('');
    setNewAssignedId('');
    setShowAddAreaForm(false);
  };

  const getStatusBadge = (status: RecordStatus) => {
    switch (status) {
      case 'excellent':
        return (
          <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-full text-xs font-semibold border border-emerald-100">
            <CheckCircle2 className="w-3.5 h-3.5" />
            良好
          </span>
        );
      case 'observing':
        return (
          <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-700 px-2.5 py-1 rounded-full text-xs font-semibold border border-amber-100">
            <AlertTriangle className="w-3.5 h-3.5" />
            要観察
          </span>
        );
      case 'maintenance':
        return (
          <span className="inline-flex items-center gap-1 bg-rose-50 text-rose-700 px-2.5 py-1 rounded-full text-xs font-semibold border border-rose-100">
            <Wrench className="w-3.5 h-3.5" />
            要メンテ
          </span>
        );
    }
  };

  const getMemberName = (id: string) => {
    const m = members.find((member) => member.id === id);
    return m ? `${m.name} (${m.grade}年)` : '未割り当て';
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-6">
      {/* Table Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
            <span className="w-2 h-5 bg-emerald-500 rounded-full inline-block"></span>
            生物飼育・栽培 記録表
          </h2>
          <p className="text-[11px] text-slate-400 mt-1">
            担当部員の割り当て、生育・飼育状態の管理
          </p>
        </div>

        <button
          id="btn-add-area"
          onClick={() => setShowAddAreaForm(!showAddAreaForm)}
          className="flex items-center gap-1 bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-2 rounded-xl text-xs font-semibold transition-all shadow-xs"
        >
          <Plus className="w-3.5 h-3.5" />
          エリア追加
        </button>
      </div>

      {/* Add Area Form Expansion */}
      <AnimatePresence>
        {showAddAreaForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden mb-6"
          >
            <form
              onSubmit={handleAddAreaSubmit}
              className="bg-emerald-50/20 border border-emerald-100 rounded-2xl p-4 space-y-4"
            >
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-emerald-800">新規エリア・対象の登録</h4>
                <button
                  type="button"
                  onClick={() => setShowAddAreaForm(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-semibold text-gray-500 mb-1">
                    エリア・対象名 *
                  </label>
                  <input
                    id="input-area-name"
                    type="text"
                    required
                    placeholder="例: メダカのビオトープ, 温室のトマト"
                    value={newAreaName}
                    onChange={(e) => setNewAreaName(e.target.value)}
                    className="w-full text-xs bg-white border border-gray-200 rounded-xl px-3 py-2 text-gray-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-gray-500 mb-1">
                    初代管理担当者 *
                  </label>
                  <select
                    id="select-area-assigned"
                    required
                    value={newAssignedId}
                    onChange={(e) => setNewAssignedId(e.target.value)}
                    className="w-full text-xs bg-white border border-gray-200 rounded-xl px-3 py-2 text-gray-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                  >
                    {members.length === 0 ? (
                      <option value="">先に部員を登録してください</option>
                    ) : (
                      <>
                        <option value="">担当部員を選択してください</option>
                        {members.map((m) => (
                          <option key={m.id} value={m.id}>
                            {m.name} ({m.grade}年生 {m.role ? `· ${m.role}` : ''})
                          </option>
                        ))}
                      </>
                    )}
                  </select>
                </div>
              </div>

              {members.length === 0 && (
                <p className="text-[10px] text-rose-600 font-semibold text-right">
                  ⚠️ エリアを追加するには、まず画面最上部から部員登録を完了してください。
                </p>
              )}

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddAreaForm(false)}
                  className="px-3.5 py-1.5 text-xs font-medium border border-gray-200 text-gray-600 hover:bg-gray-50 rounded-xl transition-all"
                >
                  キャンセル
                </button>
                <button
                  id="btn-add-area-submit"
                  type="submit"
                  disabled={members.length === 0}
                  className={`px-4 py-1.5 text-xs font-medium rounded-xl transition-all shadow-xs ${
                    members.length === 0
                      ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                      : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                  }`}
                >
                  エリアを登録する
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Record list */}
      <div className="space-y-4">
        {records.map((item) => {
          const isEditing = editingId === item.id;
          return (
            <div
              key={item.id}
              className={`p-4 border rounded-2xl transition-all ${
                isEditing
                  ? 'border-emerald-500 bg-emerald-50/10 ring-1 ring-emerald-500/20 shadow-xs'
                  : 'border-slate-200 hover:border-emerald-200 hover:bg-slate-50/50'
              }`}
            >
              {isEditing ? (
                /* EDIT MODE */
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-100 pb-3">
                    <div className="flex-1">
                      <label className="block text-[10px] font-bold text-emerald-700 mb-1">
                        エリア名
                      </label>
                      <input
                        id={`input-edit-area-${item.id}`}
                        type="text"
                        value={editAreaName}
                        onChange={(e) => setEditAreaName(e.target.value)}
                        className="text-xs font-bold text-gray-900 border border-gray-200 rounded-lg px-2 py-1 bg-white focus:outline-none w-full max-w-sm"
                      />
                    </div>
                    <div className="flex items-center gap-2 self-end">
                      <button
                        id={`btn-cancel-edit-${item.id}`}
                        onClick={() => setEditingId(null)}
                        className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-slate-500 hover:bg-slate-100 rounded-lg transition-colors border border-slate-200"
                      >
                        <X className="w-3 h-3" />
                        戻る
                      </button>
                      <button
                        id={`btn-save-edit-${item.id}`}
                        onClick={() => handleSaveEdit(item.id)}
                        className="flex items-center gap-1 px-3 py-1 text-xs font-semibold bg-emerald-600 text-white hover:bg-emerald-700 rounded-lg transition-colors shadow-xs"
                      >
                        <Save className="w-3.5 h-3.5" />
                        保存
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] font-semibold text-gray-500 mb-1">
                        記録表・飼育担当（担当決め）
                      </label>
                      <select
                        id={`select-edit-member-${item.id}`}
                        value={editAssignedId}
                        onChange={(e) => setEditAssignedId(e.target.value)}
                        className="w-full text-xs bg-white border border-gray-200 rounded-xl px-2.5 py-2 text-gray-800 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      >
                        {members.map((m) => (
                          <option key={m.id} value={m.id}>
                            {m.name} ({m.grade}年生 {m.role ? `· ${m.role}` : ''})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-gray-500 mb-1">
                        現在の生育・飼育状態
                      </label>
                      <div className="flex gap-2">
                        {(['excellent', 'observing', 'maintenance'] as RecordStatus[]).map((st) => (
                          <button
                            id={`btn-status-select-${item.id}-${st}`}
                            key={st}
                            type="button"
                            onClick={() => setEditStatus(st)}
                            className={`flex-1 text-[11px] font-semibold py-1.5 rounded-lg border text-center transition-all ${
                              editStatus === st
                                ? st === 'excellent'
                                  ? 'bg-emerald-50 border-emerald-400 text-emerald-800 font-bold'
                                  : st === 'observing'
                                  ? 'bg-amber-50 border-amber-400 text-amber-800 font-bold'
                                  : 'bg-rose-50 border-rose-400 text-rose-800 font-bold'
                                : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'
                            }`}
                          >
                            {st === 'excellent' ? '良好' : st === 'observing' ? '要観察' : '要メンテ'}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-gray-500 mb-1">
                      最新状況メモ
                    </label>
                    <textarea
                      id={`textarea-edit-note-${item.id}`}
                      value={editNote}
                      onChange={(e) => setEditNote(e.target.value)}
                      placeholder="点検メモや実施した作業を簡潔に入力してください"
                      rows={2}
                      className="w-full text-xs bg-white border border-gray-200 rounded-xl p-2 px-3 text-gray-800 focus:outline-none focus:ring-1 focus:ring-emerald-500 resize-none"
                    />
                    <p className="text-[10px] text-gray-400 mt-1">
                      ※保存すると、最終確認日が自動で本日の日付に更新されます。
                    </p>
                  </div>
                </div>
              ) : (
                /* READ MODE */
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="text-sm font-bold text-slate-800">{item.areaName}</h3>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 mt-1.5">
                        <span className="text-[11px] text-slate-500 flex items-center gap-1 bg-slate-100 px-2.5 py-0.5 rounded-lg">
                          <User className="w-3.5 h-3.5 text-slate-400" />
                          担当者: <strong className="text-slate-700">{getMemberName(item.assignedMemberId)}</strong>
                        </span>
                        <span className="text-[11px] text-slate-400 flex items-center gap-1 font-mono">
                          <Calendar className="w-3.5 h-3.5" />
                          確認: {item.lastChecked}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {members.length > 0 && (
                        <button
                          id={`btn-ai-advisor-${item.id}`}
                          onClick={() => setAdvisorItem(item)}
                          className="flex items-center gap-1 bg-emerald-50 hover:bg-emerald-100/85 border border-emerald-200 text-emerald-900 text-[10px] font-bold px-2.5 py-1.5 rounded-lg transition-all shadow-3xs cursor-pointer"
                          title="AI顧問のアドバイス"
                        >
                          <Sparkles className="w-3 h-3 text-emerald-600 animate-pulse" />
                          AI診断
                        </button>
                      )}
                      {getStatusBadge(item.status)}
                      <button
                        id={`btn-edit-record-${item.id}`}
                        onClick={() => handleStartEdit(item)}
                        className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-emerald-700 transition-all border border-slate-200/50 cursor-pointer"
                        title="担当者・記録を編集"
                      >
                        <PenSquare className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="mt-3 text-xs bg-slate-50/70 border border-slate-100 rounded-xl p-2.5 text-slate-600 leading-relaxed font-medium">
                    {item.latestNote || '確認メモが登録されていません。'}
                  </div>
                </div>
              )}
            </div>
          );
        })}
        {records.length === 0 && (
          <div className="text-center py-12 px-4 border border-dashed border-slate-200 rounded-2xl bg-slate-50/45">
            <span className="text-3xl">🏜️</span>
            <p className="text-xs font-bold text-slate-800 mt-3">お世話エリアが登録されていません</p>
            <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
              右上にある「エリア追加」ボタンから、<br />
              お世話をする水槽やプランターを登録してみましょう！
            </p>
          </div>
        )}
      </div>

      <AIAdvisorModal
        isOpen={advisorItem !== null}
        onClose={() => setAdvisorItem(null)}
        areaName={advisorItem?.areaName || ''}
        status={advisorItem?.status || 'excellent'}
        latestNote={advisorItem?.latestNote || ''}
        memberName={advisorItem ? getMemberNameOnly(advisorItem.assignedMemberId) : ''}
        grade={advisorItem ? getMemberGradeOnly(advisorItem.assignedMemberId) : undefined}
      />
    </div>
  );
}
