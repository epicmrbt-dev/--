/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { X, Sparkles, Loader2, BookOpen, HeartPulse, HelpCircle, CheckSquare } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface AIAdvisorModalProps {
  isOpen: boolean;
  onClose: () => void;
  areaName: string;
  status: string;
  latestNote: string;
  memberName: string;
  grade?: number;
}

export default function AIAdvisorModal({
  isOpen,
  onClose,
  areaName,
  status,
  latestNote,
  memberName,
  grade,
}: AIAdvisorModalProps) {
  const [loading, setLoading] = useState(false);
  const [advice, setAdvice] = useState<string>('');
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (isOpen && areaName) {
      fetchAdvice();
    }
  }, [isOpen, areaName]);

  const fetchAdvice = async () => {
    setLoading(true);
    setError('');
    setAdvice('');
    try {
      const response = await fetch('/api/gemini/advisor', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          areaName,
          status,
          latestNote,
          memberName,
          grade,
        }),
      });

      if (!response.ok) {
        throw new Error('AIのアドバイスを読み込めませんでした。再度お試しください。');
      }

      const data = await response.json();
      setAdvice(data.advice || 'アドバイスが生成されませんでした。');
    } catch (err: any) {
      console.error(err);
      setError(err.message || '接続エラーが発生しました。');
    } finally {
      setLoading(false);
    }
  };

  const parseBold = (text: string) => {
    const parts = text.split(/(\*\*.*?\*\*)/);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return (
          <strong key={i} className="font-bold text-slate-900 bg-emerald-100/40 px-1 rounded-sm">
            {part.slice(2, -2)}
          </strong>
        );
      }
      return part;
    });
  };

  const renderFormattedAdvice = (text: string) => {
    if (!text) return null;
    return text.split('\n').map((line, index) => {
      const trimmed = line.trim();
      
      // Main headers (e.g., # or ## or 【タイトル】)
      if (trimmed.startsWith('# ') || trimmed.startsWith('## ') || trimmed.startsWith('【') && trimmed.endsWith('】') || trimmed.startsWith('### ')) {
        const titleText = trimmed.replace(/^#+\s/, '');
        
        let icon = <BookOpen className="w-4 h-4 text-emerald-600" />;
        if (titleText.includes('診断') || titleText.includes('状態')) icon = <HeartPulse className="w-4 h-4 text-rose-500" />;
        if (titleText.includes('世話') || titleText.includes('極意')) icon = <CheckSquare className="w-4 h-4 text-amber-500" />;
        if (titleText.includes('豆知識') || titleText.includes('ヒント') || titleText.includes('探究')) icon = <HelpCircle className="w-4 h-4 text-sky-500" />;

        return (
          <h4
            key={index}
            className="text-xs sm:text-sm font-bold text-slate-900 flex items-center gap-2 mt-5 mb-2.5 pb-1.5 border-b border-slate-100 uppercase tracking-wider"
          >
            {icon}
            {titleText}
          </h4>
        );
      }

      // Bullet points
      if (trimmed.startsWith('- ') || trimmed.startsWith('* ') || trimmed.startsWith('・')) {
        const cleanLine = trimmed.replace(/^[-*・]\s*/, '');
        return (
          <li key={index} className="text-xs text-slate-600 ml-4 list-disc pl-1 py-1 leading-relaxed font-medium">
            {parseBold(cleanLine)}
          </li>
        );
      }

      // Empty space
      if (trimmed === '') {
        return <div key={index} className="h-3" />;
      }

      // Regular paragraph
      return (
        <p key={index} className="text-xs text-slate-600 leading-relaxed py-1.5 font-medium">
          {parseBold(line)}
        </p>
      );
    });
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Overlay background */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-950/40 backdrop-blur-xs"
          />

          {/* Dialog content box */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ type: 'spring', duration: 0.4 }}
            className="relative bg-white rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl border border-slate-100 flex flex-col max-h-[85vh] z-10"
          >
            {/* Header banner */}
            <div className="bg-gradient-to-r from-emerald-800 to-teal-900 p-5 text-white flex items-center justify-between relative">
              <div className="absolute right-[-20px] top-[-20px] w-24 h-24 bg-white/5 rounded-full blur-xl"></div>
              
              <div className="flex items-center gap-2.5 relative z-10">
                <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center text-emerald-300">
                  <Sparkles className="w-4.5 h-4.5 animate-pulse" />
                </div>
                <div>
                  <h3 className="text-xs sm:text-sm font-bold tracking-wide">顧問のAI状態診断 & アドバイス</h3>
                  <p className="text-[10px] text-emerald-300 font-medium">{areaName}</p>
                </div>
              </div>

              <button
                onClick={onClose}
                className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/80 hover:text-white transition-all border border-white/10 cursor-pointer relative z-10"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Main scrollable body */}
            <div className="flex-1 overflow-y-auto p-6 sm:p-7 space-y-4">
              {loading ? (
                <div className="py-16 flex flex-col items-center justify-center space-y-3">
                  <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
                  <p className="text-xs font-bold text-slate-800">生物室から顧問のアドバイスを読み込んでいます...</p>
                  <p className="text-[10px] text-slate-400">Geminiがあなたの点検メモを解析中</p>
                </div>
              ) : error ? (
                <div className="py-12 text-center space-y-4">
                  <div className="inline-flex w-12 h-12 bg-rose-50 text-rose-500 rounded-2xl items-center justify-center text-xl">⚠️</div>
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-slate-800">アドバイスの生成中にエラーが発生しました</p>
                    <p className="text-[11px] text-rose-600 bg-rose-50 px-3 py-1.5 rounded-lg inline-block font-medium max-w-sm">
                      {error}
                    </p>
                  </div>
                  <button
                    onClick={fetchAdvice}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-2 rounded-xl shadow-xs transition-colors cursor-pointer"
                  >
                    再試行する
                  </button>
                </div>
              ) : (
                <div className="space-y-1.5">
                  {/* Subject Summary Widget */}
                  <div className="bg-slate-50/80 border border-slate-100 rounded-2xl p-3 flex flex-wrap items-center justify-between gap-2.5 mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                      <span className="text-xs font-bold text-slate-800">{areaName}</span>
                    </div>
                    <div className="flex items-center gap-2 text-[11px] text-slate-500">
                      <span>担当: <strong className="text-slate-700 font-semibold">{memberName}</strong></span>
                      <span className="text-slate-300">|</span>
                      <span>状況: 
                        <strong className={`font-bold ml-1 ${
                          status === 'excellent' ? 'text-emerald-600' :
                          status === 'observing' ? 'text-amber-600' : 'text-rose-600'
                        }`}>
                          {status === 'excellent' ? '良好' : status === 'observing' ? '要観察' : '要メンテ'}
                        </strong>
                      </span>
                    </div>
                  </div>

                  {/* AI Generated Advice Content */}
                  <div className="prose prose-slate max-w-none">
                    {renderFormattedAdvice(advice)}
                  </div>
                </div>
              )}
            </div>

            {/* Footer action */}
            <div className="bg-slate-50 border-t border-slate-100 p-4 sm:p-5 flex items-center justify-between">
              <span className="text-[10px] text-slate-400 font-mono">POWERED BY GEMINI 3.5 FLASH</span>
              <button
                onClick={onClose}
                className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-5 py-2 rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                理解しました！お世話を頑張る
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
