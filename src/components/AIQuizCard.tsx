/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { HelpCircle, RefreshCw, Trophy, Flame, HelpCircle as HelpIcon, Check, X, Sparkles, Loader2, Award } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface QuizData {
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

type CategoryType = 'general' | 'aquatic' | 'plants' | 'insects';

export default function AIQuizCard() {
  const [category, setCategory] = useState<CategoryType>('general');
  const [loading, setLoading] = useState(false);
  const [quiz, setQuiz] = useState<QuizData | null>(null);
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [answered, setAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);

  const fetchQuiz = async (cat: CategoryType = category) => {
    setLoading(true);
    setSelectedIdx(null);
    setAnswered(false);
    try {
      const response = await fetch('/api/gemini/quiz', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ category: cat }),
      });

      if (!response.ok) {
        throw new Error('クイズの取得に失敗しました。');
      }

      const data = await response.json();
      setQuiz(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerSelect = (idx: number) => {
    if (answered) return;
    setSelectedIdx(idx);
    setAnswered(true);

    if (quiz && idx === quiz.correctIndex) {
      setScore((prev) => prev + 1);
      setStreak((prev) => prev + 1);
    } else {
      setStreak(0);
    }
  };

  const getCategoryLabel = (cat: CategoryType) => {
    switch (cat) {
      case 'general': return '生物学全般';
      case 'aquatic': return '水生生物・アクアリウム';
      case 'plants': return '陸上植物・フラワー';
      case 'insects': return '昆虫・カブトムシ';
    }
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-6 flex flex-col h-full relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-[-30px] right-[-30px] w-24 h-24 bg-teal-50 rounded-full blur-2xl pointer-events-none opacity-60"></div>

      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-5">
        <div>
          <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
            <span className="w-2 h-5 bg-teal-500 rounded-full inline-block"></span>
            AI生物クイズ挑戦！
          </h2>
          <p className="text-[11px] text-slate-400 mt-1">
            Geminiが作成する日替わり探究問題に挑戦しよう
          </p>
        </div>

        {/* Gamified stats bar */}
        <div className="flex items-center gap-2.5">
          <div className="bg-amber-50 border border-amber-200 text-amber-800 text-[10px] font-bold px-2 py-1 rounded-lg flex items-center gap-1">
            <Trophy className="w-3.5 h-3.5 text-amber-500" />
            <span>スコア: {score}</span>
          </div>
          {streak > 0 && (
            <div className="bg-rose-50 border border-rose-200 text-rose-700 text-[10px] font-bold px-2 py-1 rounded-lg flex items-center gap-1 animate-bounce">
              <Flame className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />
              <span>連勝: {streak}</span>
            </div>
          )}
        </div>
      </div>

      {/* Category selector */}
      {!quiz && !loading && (
        <div className="flex-1 flex flex-col justify-center items-center py-8 space-y-6">
          <div className="text-center space-y-2 max-w-sm">
            <div className="w-12 h-12 bg-teal-50 text-teal-600 rounded-2xl flex items-center justify-center text-xl mx-auto mb-2">
              <HelpIcon className="w-6 h-6" />
            </div>
            <h3 className="text-xs sm:text-sm font-bold text-slate-800">挑戦するクイズのテーマを選択</h3>
            <p className="text-[11px] text-slate-400 leading-relaxed font-medium">
              今日のお世話の合間に、生物の知識を深めましょう。中学生の理科の授業や部活動で使える知識が満載です！
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2.5 w-full max-w-sm">
            {(['general', 'aquatic', 'plants', 'insects'] as CategoryType[]).map((cat) => (
              <button
                id={`btn-quiz-cat-${cat}`}
                key={cat}
                onClick={() => setCategory(cat)}
                className={`text-[11px] font-semibold py-2.5 px-3 rounded-xl border text-center transition-all ${
                  category === cat
                    ? 'bg-teal-50 border-teal-400 text-teal-800 font-bold shadow-xs ring-1 ring-teal-500/10'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100/70'
                }`}
              >
                {cat === 'general' && '🌿 生物全般'}
                {cat === 'aquatic' && '🐟 淡水魚・水草'}
                {cat === 'plants' && '🌻 お花・プランター'}
                {cat === 'insects' && '🐞 昆虫・生き物'}
              </button>
            ))}
          </div>

          <button
            id="btn-load-quiz"
            onClick={() => fetchQuiz()}
            className="w-full max-w-sm bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white font-bold py-3 px-4 rounded-xl text-xs transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer active:scale-98"
          >
            <Sparkles className="w-3.5 h-3.5" />
            クイズを出題してもらう！
          </button>
        </div>
      )}

      {/* Loading state */}
      {loading && (
        <div className="flex-1 flex flex-col justify-center items-center py-16 space-y-3">
          <Loader2 className="w-8 h-8 text-teal-600 animate-spin" />
          <p className="text-xs font-bold text-slate-800">Geminiが新しい問題を用意しています...</p>
          <p className="text-[10px] text-slate-400">「{getCategoryLabel(category)}」からセレクト中</p>
        </div>
      )}

      {/* Active Quiz Question */}
      {quiz && !loading && (
        <div className="flex-1 flex flex-col justify-between space-y-4">
          <div className="space-y-4">
            {/* Theme badge & category swap */}
            <div className="flex justify-between items-center gap-2">
              <span className="bg-teal-50 border border-teal-100 text-teal-800 text-[9px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                {getCategoryLabel(category)}
              </span>
              <button
                id="btn-quiz-change-theme"
                onClick={() => setQuiz(null)}
                className="text-[10px] font-bold text-slate-400 hover:text-teal-600 flex items-center gap-1 transition-colors"
              >
                テーマ変更
              </button>
            </div>

            {/* Question description */}
            <p className="text-xs sm:text-sm font-extrabold text-slate-800 leading-relaxed bg-slate-50 border border-slate-100 p-4 rounded-2xl">
              {quiz.question}
            </p>

            {/* Answers options */}
            <div className="grid grid-cols-1 gap-2">
              {quiz.options.map((opt, idx) => {
                const isSelected = selectedIdx === idx;
                const isCorrect = idx === quiz.correctIndex;
                
                let btnStyle = 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300';
                let icon = null;

                if (answered) {
                  if (isCorrect) {
                    btnStyle = 'bg-emerald-50 border-emerald-400 text-emerald-800 font-bold';
                    icon = <Check className="w-4 h-4 text-emerald-600 shrink-0" />;
                  } else if (isSelected) {
                    btnStyle = 'bg-rose-50 border-rose-300 text-rose-800 font-semibold';
                    icon = <X className="w-4 h-4 text-rose-500 shrink-0" />;
                  } else {
                    btnStyle = 'bg-white border-slate-100 text-slate-400 opacity-60';
                  }
                }

                return (
                  <button
                    id={`btn-quiz-opt-${idx}`}
                    key={idx}
                    disabled={answered}
                    onClick={() => handleAnswerSelect(idx)}
                    className={`w-full text-left text-[11px] sm:text-xs py-3 px-4 rounded-xl border flex items-center justify-between gap-3 transition-all ${btnStyle} ${
                      !answered ? 'cursor-pointer active:scale-98' : ''
                    }`}
                  >
                    <span>{opt}</span>
                    {icon}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Explanation reveal & Next challenge button */}
          <AnimatePresence>
            {answered && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4 pt-1"
              >
                {/* Visual correct / wrong banner */}
                <div className={`p-3.5 rounded-2xl flex items-center gap-3 border ${
                  selectedIdx === quiz.correctIndex
                    ? 'bg-emerald-500/10 border-emerald-200/50 text-emerald-950'
                    : 'bg-rose-500/5 border-rose-200/50 text-rose-950'
                }`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                    selectedIdx === quiz.correctIndex
                      ? 'bg-emerald-500 text-white'
                      : 'bg-rose-500 text-white'
                  }`}>
                    {selectedIdx === quiz.correctIndex ? '正' : '誤'}
                  </div>
                  <div>
                    <p className="text-xs font-black">
                      {selectedIdx === quiz.correctIndex ? '正解です！お見事！' : '残念、不正解です...'}
                    </p>
                    <p className="text-[10px] text-slate-400 font-semibold">
                      正解は: <strong>{quiz.options[quiz.correctIndex]}</strong>
                    </p>
                  </div>
                </div>

                {/* Explanation text */}
                <div className="bg-amber-50/50 border border-amber-100 rounded-2xl p-4 text-slate-700 space-y-1">
                  <p className="text-[10px] font-bold text-amber-800 uppercase tracking-wider flex items-center gap-1">
                    <Award className="w-3.5 h-3.5" />
                    アドバイザーの豆知識解説
                  </p>
                  <p className="text-[11px] leading-relaxed font-medium">
                    {quiz.explanation}
                  </p>
                </div>

                {/* Load next quiz */}
                <button
                  id="btn-next-quiz"
                  onClick={() => fetchQuiz()}
                  className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-2.5 rounded-xl text-xs transition-colors cursor-pointer flex items-center justify-center gap-2 shadow-xs"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  次の問題に挑戦する！
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
