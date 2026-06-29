/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from 'react';
import { DiaryEntry, Member, WeatherType } from '../types';
import {
  BookOpen,
  Calendar,
  Sun,
  Cloud,
  CloudRain,
  Snowflake,
  Filter,
  Image,
  Plus,
  Trash2,
  Upload,
  User,
  Heart,
  Tag,
  Check,
  X,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface DiarySectionProps {
  diaries: DiaryEntry[];
  members: Member[];
  activeMember: Member | undefined;
  onAddDiary: (entry: Omit<DiaryEntry, 'id' | 'createdAt'>) => void;
  onDeleteDiary: (id: string) => void;
}

export default function DiarySection({
  diaries,
  members,
  activeMember,
  onAddDiary,
  onDeleteDiary,
}: DiarySectionProps) {
  const [showAddForm, setShowAddForm] = useState(false);

  // Form states
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('熱帯魚水槽');
  const [weather, setWeather] = useState<WeatherType>('sunny');
  const [content, setContent] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [image64, setImage64] = useState<string | undefined>(undefined);
  const [customCategory, setCustomCategory] = useState('');
  const [isCustomCategory, setIsCustomCategory] = useState(false);

  // Filters
  const [filterCategory, setFilterCategory] = useState('All');
  const [filterAuthor, setFilterAuthor] = useState('All');

  // Drag & drop file upload state
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Likes (locally tracking visual likes in state just for micro-interaction)
  const [likedDiaries, setLikedDiaries] = useState<Record<string, boolean>>({});
  const [likeCounts, setLikeCounts] = useState<Record<string, number>>({});

  const toggleLike = (id: string) => {
    setLikedDiaries((prev) => {
      const liked = !prev[id];
      setLikeCounts((counts) => ({
        ...counts,
        [id]: (counts[id] || 0) + (liked ? 1 : -1),
      }));
      return { ...prev, [id]: liked };
    });
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const processFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('画像ファイルを選択してください。');
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      setImage64(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeMember) return;
    if (!title.trim() || !content.trim()) return;

    const finalCategory = isCustomCategory ? customCategory.trim() : category;
    if (!finalCategory) return;

    onAddDiary({
      title: title.trim(),
      category: finalCategory,
      weather,
      content: content.trim(),
      date,
      authorId: activeMember.id,
      imageUrl: image64,
    });

    // Reset form
    setTitle('');
    setContent('');
    setImage64(undefined);
    setCustomCategory('');
    setIsCustomCategory(false);
    setShowAddForm(false);
  };

  // Get weather icon
  const getWeatherIcon = (w: WeatherType) => {
    switch (w) {
      case 'sunny':
        return <Sun className="w-4 h-4 text-amber-500 fill-amber-500/20" />;
      case 'cloudy':
        return <Cloud className="w-4 h-4 text-slate-400" />;
      case 'rainy':
        return <CloudRain className="w-4 h-4 text-blue-400" />;
      case 'snowy':
        return <Snowflake className="w-4 h-4 text-sky-300 animate-pulse" />;
    }
  };

  const getWeatherLabel = (w: WeatherType) => {
    switch (w) {
      case 'sunny':
        return '晴れ';
      case 'cloudy':
        return '曇り';
      case 'rainy':
        return '雨';
      case 'snowy':
        return '雪';
    }
  };

  const getAuthorName = (authorId: string) => {
    const m = members.find((member) => member.id === authorId);
    return m ? `${m.name} (${m.grade}年)` : '退部した部員';
  };

  // Categorized style generation for entries without real uploaded images
  const getVisualPlaceholder = (categoryName: string) => {
    const lower = categoryName.toLowerCase();
    let gradient = 'from-emerald-400 to-teal-600';
    let labelSymbol = '🍃';

    if (lower.includes('水槽') || lower.includes('魚') || lower.includes('メダカ') || lower.includes('水草')) {
      gradient = 'from-blue-400 via-cyan-500 to-teal-600';
      labelSymbol = '🐟';
    } else if (lower.includes('虫') || lower.includes('カブト') || lower.includes('クワガタ') || lower.includes('飼育ケージ')) {
      gradient = 'from-amber-600 via-yellow-700 to-amber-900';
      labelSymbol = '🐞';
    } else if (lower.includes('ヘチマ') || lower.includes('園芸') || lower.includes('植物') || lower.includes('プランター')) {
      gradient = 'from-emerald-500 via-green-600 to-emerald-800';
      labelSymbol = '🌱';
    } else if (lower.includes('気象') || lower.includes('天気') || lower.includes('観測')) {
      gradient = 'from-indigo-400 via-purple-500 to-slate-700';
      labelSymbol = '🌤️';
    }

    return (
      <div className={`w-full h-40 bg-gradient-to-br ${gradient} flex flex-col items-center justify-center relative overflow-hidden text-white p-4 text-center`}>
        <div className="absolute top-2 right-3 text-xs bg-black/20 backdrop-blur-xs px-2 py-0.5 rounded-full font-semibold">
          {categoryName}
        </div>
        <span className="text-4xl filter drop-shadow-md mb-2">{labelSymbol}</span>
        <p className="text-[11px] text-white/80 font-mono tracking-wider uppercase font-bold">Observation Record</p>
        <p className="text-[13px] font-extrabold tracking-tight line-clamp-1 mt-0.5">{categoryName}観察</p>
        <div className="absolute bottom-[-20px] left-[-20px] w-24 h-24 bg-white/5 rounded-full blur-xl"></div>
        <div className="absolute top-[-20px] right-[-20px] w-32 h-32 bg-white/5 rounded-full blur-xl"></div>
      </div>
    );
  };

  // Categories list extracted for filters
  const categories = ['All', ...Array.from(new Set(diaries.map((d) => d.category)))];

  // Filtered diaries
  const filteredDiaries = diaries.filter((d) => {
    const matchCat = filterCategory === 'All' || d.category === filterCategory;
    const matchAuth = filterAuthor === 'All' || d.authorId === filterAuthor;
    return matchCat && matchAuth;
  });

  return (
    <div className="space-y-6">
      {/* Diaries Header Control Block */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <span className="w-2 h-5 bg-emerald-500 rounded-full inline-block"></span>
              部員観察日記
            </h2>
            <p className="text-[11px] text-slate-400 mt-1">
              生物の生長記録、日々の活動・お世話レポートを投稿・閲覧できます。
            </p>
          </div>

          <button
            id="btn-toggle-add-diary"
            onClick={() => setShowAddForm(!showAddForm)}
            className="flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs py-2.5 px-5 rounded-2xl transition-all shadow-xs self-start sm:self-center cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            日記を投稿する
          </button>
        </div>

        {/* Filters */}
        <div className="mt-5 pt-4 border-t border-slate-100 flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1 text-[10px] text-slate-400 font-bold uppercase tracking-wider">
            <Filter className="w-3 h-3" />
            絞り込み:
          </div>

          {/* Category Filter */}
          <div className="flex items-center gap-1">
            <span className="text-xs text-slate-500 font-medium">カテゴリ:</span>
            <select
              id="select-filter-category"
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="bg-slate-50 hover:bg-slate-100 border border-slate-200 text-xs font-semibold rounded-lg px-2 py-1 text-slate-700 focus:outline-none transition-all"
            >
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat === 'All' ? 'すべて' : cat}
                </option>
              ))}
            </select>
          </div>

          {/* Member Filter */}
          <div className="flex items-center gap-1">
            <span className="text-xs text-slate-500 font-medium">投稿者:</span>
            <select
              id="select-filter-author"
              value={filterAuthor}
              onChange={(e) => setFilterAuthor(e.target.value)}
              className="bg-slate-50 hover:bg-slate-100 border border-slate-200 text-xs font-semibold rounded-lg px-2 py-1 text-slate-700 focus:outline-none transition-all"
            >
              <option value="All">すべての部員</option>
              {members.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* New Post Form Panel */}
      <AnimatePresence>
        {showAddForm && (
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            className="bg-white rounded-3xl border border-emerald-200 shadow-md p-6 relative overflow-hidden"
          >
            {/* Top design accent bar */}
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-emerald-500 to-teal-500"></div>

            <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-emerald-600" />
                <h3 className="text-xs font-bold text-slate-800">新しい観察日記の投稿</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="p-1.5 hover:bg-slate-100 text-slate-400 hover:text-slate-600 rounded-lg transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {!activeMember ? (
              <div className="text-center py-6 bg-amber-50/50 rounded-2xl border border-amber-100 text-amber-800 text-xs font-semibold">
                画面右上のメニューから、操作する部員を先に選択してください。
              </div>
            ) : (
              <form onSubmit={handleFormSubmit} className="space-y-4">
                <p className="text-[11px] text-slate-500">
                  現在、<strong className="text-emerald-700 font-bold">{activeMember.name}</strong> として新規観察日記を作成しています。
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Left Column Fields */}
                  <div className="space-y-4">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                        日記タイトル *
                      </label>
                      <input
                        id="input-diary-title"
                        type="text"
                        required
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="例: メダカの産卵を初確認！"
                        className="w-full text-xs bg-slate-50/50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                          観察日
                        </label>
                        <input
                          id="input-diary-date"
                          type="date"
                          required
                          value={date}
                          onChange={(e) => setDate(e.target.value)}
                          className="w-full text-xs bg-slate-50/50 border border-slate-200 rounded-xl px-3 py-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                          天気
                        </label>
                        <div className="flex bg-slate-50/50 border border-slate-200 rounded-xl p-1 gap-1">
                          {(['sunny', 'cloudy', 'rainy', 'snowy'] as WeatherType[]).map((w) => (
                            <button
                              id={`btn-weather-select-${w}`}
                              key={w}
                              type="button"
                              onClick={() => setWeather(w)}
                              className={`flex-1 py-1.5 rounded-lg flex justify-center items-center transition-all ${
                                weather === w
                                  ? 'bg-white shadow-xs text-emerald-800 font-bold border border-slate-200/55'
                                  : 'text-slate-400 hover:text-slate-600'
                              }`}
                              title={getWeatherLabel(w)}
                            >
                              {getWeatherIcon(w)}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <label className="block text-[11px] font-semibold text-slate-500">
                          観察カテゴリ・対象 *
                        </label>
                        <button
                          type="button"
                          onClick={() => setIsCustomCategory(!isCustomCategory)}
                          className="text-[10px] text-emerald-600 hover:underline font-bold"
                        >
                          {isCustomCategory ? 'リストから選択' : '手動で新規作成'}
                        </button>
                      </div>

                      {isCustomCategory ? (
                        <input
                          id="input-diary-custom-category"
                          type="text"
                          required
                          placeholder="例: マリモ, ダンゴムシ"
                          value={customCategory}
                          onChange={(e) => setCustomCategory(e.target.value)}
                          className="w-full text-xs bg-slate-50/50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all"
                        />
                      ) : (
                        <select
                          id="select-diary-category"
                          value={category}
                          onChange={(e) => setCategory(e.target.value)}
                          className="w-full text-xs bg-slate-50/50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all"
                        >
                          <option value="熱帯魚水槽">熱帯魚水槽</option>
                          <option value="カブトムシ">カブトムシ</option>
                          <option value="園芸プランター">園芸プランター</option>
                          <option value="多肉温室">多肉温室</option>
                          <option value="気象観測">気象観測</option>
                          <option value="その他">その他活動</option>
                        </select>
                      )}
                    </div>
                  </div>

                  {/* Right Column Fields (Image Drag & Drop) */}
                  <div className="flex flex-col">
                    <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                      観察写真 (任意)
                    </label>
                    
                    <div
                      onDragEnter={handleDrag}
                      onDragLeave={handleDrag}
                      onDragOver={handleDrag}
                      onDrop={handleDrop}
                      onClick={triggerFileSelect}
                      className={`flex-1 flex flex-col items-center justify-center p-4 border-2 border-dashed rounded-2xl cursor-pointer transition-all min-h-40 ${
                        dragActive
                          ? 'border-emerald-500 bg-emerald-50/30'
                          : image64
                          ? 'border-slate-200 bg-slate-50/20'
                          : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50/50'
                      }`}
                    >
                      <input
                        id="input-diary-file"
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileSelect}
                        accept="image/*"
                        className="hidden"
                      />

                      {image64 ? (
                        <div className="relative w-full h-full flex flex-col items-center">
                          <img
                            src={image64}
                            alt="Uploaded observation preview"
                            className="max-h-36 rounded-lg object-cover shadow-xs border border-slate-200"
                            referrerPolicy="no-referrer"
                          />
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setImage64(undefined);
                            }}
                            className="absolute -top-2 -right-2 bg-red-100 hover:bg-red-200 text-red-700 p-1 rounded-full transition-colors"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                          <p className="text-[10px] text-slate-400 mt-2">
                            クリックまたはドラッグして画像を変更
                          </p>
                        </div>
                      ) : (
                        <div className="text-center space-y-1.5">
                          <div className="w-10 h-10 bg-emerald-50 rounded-full flex items-center justify-center mx-auto text-emerald-600">
                            <Upload className="w-5 h-5" />
                          </div>
                          <p className="text-xs font-semibold text-slate-700">
                            観察写真をドラッグ ＆ ドロップ
                          </p>
                          <p className="text-[10px] text-slate-400">
                            または、コンピューターからファイルを参照
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Content text area */}
                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                    詳細な観察日記・気付き *
                  </label>
                  <textarea
                    id="textarea-diary-content"
                    required
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="今日気づいたこと、大きさ、色、行動の変化、工夫したお世話などを記入してください。"
                    rows={4}
                    className="w-full text-xs bg-slate-50/50 border border-slate-200 rounded-xl p-3 text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all resize-none"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowAddForm(false)}
                    className="px-5 py-2 text-xs font-semibold border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-xl transition-all"
                  >
                    キャンセル
                  </button>
                  <button
                    id="btn-diary-submit"
                    type="submit"
                    className="px-6 py-2 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl transition-all shadow-xs"
                  >
                    この内容で投稿する
                  </button>
                </div>
              </form>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Diary Card Grid */}
      {filteredDiaries.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center">
          <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-xs font-bold text-slate-600">投稿が見つかりません</h3>
          <p className="text-[11px] text-slate-400 mt-1 max-w-sm mx-auto">
            選択したカテゴリ、または投稿者による観察日記はありません。新しく日記を投稿してみましょう！
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <AnimatePresence mode="popLayout">
            {filteredDiaries.map((entry) => (
              <motion.article
                key={entry.id}
                layout
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                className="bg-white rounded-3xl border border-slate-200 hover:border-emerald-200 shadow-xs hover:shadow-xs transition-all overflow-hidden flex flex-col group"
              >
                {/* Entry Image Area */}
                <div className="relative">
                  {entry.imageUrl ? (
                    <div className="w-full h-40 overflow-hidden bg-slate-100 relative">
                      <img
                        src={entry.imageUrl}
                        alt={entry.title}
                        className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-500"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute top-2 right-3 text-[10px] bg-slate-900/60 backdrop-blur-xs text-white px-2.5 py-0.5 rounded-full font-bold flex items-center gap-1">
                        <Tag className="w-3 h-3" />
                        {entry.category}
                      </div>
                    </div>
                  ) : (
                    getVisualPlaceholder(entry.category)
                  )}

                  {/* Weather and Date tag overlay */}
                  <div className="absolute bottom-2 left-3 bg-white/90 backdrop-blur-xs rounded-lg px-2.5 py-1 flex items-center gap-2 shadow-xs border border-slate-200/50">
                    <span className="text-[10px] text-slate-500 font-bold font-mono">
                      {entry.date}
                    </span>
                    <span className="w-px h-2.5 bg-slate-200" />
                    <span className="flex items-center gap-1 text-[10px] text-slate-600 font-bold">
                      {getWeatherIcon(entry.weather)}
                      {getWeatherLabel(entry.weather)}
                    </span>
                  </div>
                </div>

                {/* Entry Body Content */}
                <div className="p-5 flex-1 flex flex-col justify-between">
                  <div>
                    {/* Author block */}
                    <div className="flex items-center justify-between gap-2 mb-2.5">
                      <div className="flex items-center gap-1.5 text-xs text-slate-500">
                        <User className="w-3.5 h-3.5 text-slate-400" />
                        <span>投稿者:</span>
                        <strong className="text-slate-700 font-bold">
                          {getAuthorName(entry.authorId)}
                        </strong>
                      </div>

                      {/* Admin delete button if active user is owner */}
                      {activeMember?.id === entry.authorId && (
                        <button
                          id={`btn-delete-diary-${entry.id}`}
                          onClick={() => {
                            if (confirm('この日記を削除してよろしいですか？')) {
                              onDeleteDiary(entry.id);
                            }
                          }}
                          className="text-slate-300 hover:text-red-500 p-1 rounded-lg hover:bg-slate-50 transition-all opacity-0 group-hover:opacity-100 focus:opacity-100 cursor-pointer"
                          title="この日記を削除"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    <h3 className="text-xs sm:text-sm font-bold text-slate-800 group-hover:text-emerald-800 transition-colors leading-snug">
                      {entry.title}
                    </h3>

                    <p className="mt-2 text-xs text-slate-600 leading-relaxed font-medium whitespace-pre-line line-clamp-4">
                      {entry.content}
                    </p>
                  </div>

                  {/* Likes and interactives */}
                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                    <button
                      id={`btn-like-diary-${entry.id}`}
                      onClick={() => toggleLike(entry.id)}
                      className={`flex items-center gap-1 py-1 px-2.5 rounded-lg border transition-all cursor-pointer ${
                        likedDiaries[entry.id]
                          ? 'bg-rose-50 border-rose-100 text-rose-600 font-bold'
                          : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
                      }`}
                    >
                      <Heart
                        className={`w-3.5 h-3.5 ${
                          likedDiaries[entry.id] ? 'fill-rose-500 text-rose-500' : ''
                        }`}
                      />
                      いいね！ ({(likeCounts[entry.id] || 0) + (likedDiaries[entry.id] ? 1 : 0)})
                    </button>

                    <span className="text-[9px] font-mono text-slate-300">
                      ID: {entry.id.substring(0, 6)}
                    </span>
                  </div>
                </div>
              </motion.article>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
