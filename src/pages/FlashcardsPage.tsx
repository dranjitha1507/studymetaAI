import React, { useState, useEffect } from 'react';
import {
  Layers,
  Sparkles,
  RotateCw,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Plus,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Shuffle,
  Lightbulb,
} from 'lucide-react';
import { api } from '../services/api';
import { FlashcardDeck, Flashcard } from '../types';

interface FlashcardsPageProps {
  onShowToast: (message: string, type: 'success' | 'error' | 'info') => void;
}

export const FlashcardsPage: React.FC<FlashcardsPageProps> = ({
  onShowToast,
}) => {
  const [decks, setDecks] = useState<FlashcardDeck[]>([]);
  const [activeDeck, setActiveDeck] = useState<FlashcardDeck | null>(null);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [loading, setLoading] = useState(true);

  // Generator inputs
  const [subject, setSubject] = useState('');
  const [topic, setTopic] = useState('');
  const [cardCount, setCardCount] = useState(6);

  const loadDecks = async () => {
    try {
      const res = await api.getDecks();
      setDecks(res.decks);
      if (res.decks.length > 0 && !activeDeck) {
        selectDeck(res.decks[0]);
      }
    } catch (err: any) {
      onShowToast('Failed to load flashcard decks', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDecks();
  }, []);

  const selectDeck = (deck: FlashcardDeck) => {
    setActiveDeck(deck);
    setCurrentCardIndex(0);
    setIsFlipped(false);
    setShowHint(false);
  };

  const handleGenerateDeck = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !topic.trim()) {
      onShowToast('Please provide subject and topic', 'error');
      return;
    }

    setIsGenerating(true);
    try {
      const genRes = await api.generateDeck({
        subject: subject.trim(),
        topic: topic.trim(),
        cardCount,
      });

      const saveRes = await api.createDeck({
        title: genRes.deck.title,
        subject: subject.trim(),
        cards: genRes.deck.cards,
      });

      setDecks(prev => [saveRes.deck, ...prev]);
      selectDeck(saveRes.deck);
      setTopic('');
      onShowToast('Flashcard deck created!', 'success');
    } catch (err: any) {
      onShowToast(err.message || 'Failed to generate flashcards', 'error');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleFlip = () => {
    setIsFlipped(!isFlipped);
  };

  const handleRateMastery = async (mastery: 'new' | 'learning' | 'mastered') => {
    if (!activeDeck) return;
    const cards = [...activeDeck.cards];
    cards[currentCardIndex] = {
      ...cards[currentCardIndex],
      mastery,
    };

    try {
      const res = await api.reviewDeck(activeDeck.id, cards);
      const updatedDeck = {
        ...activeDeck,
        cards,
        mastered_count: res.mastered_count,
      };
      setActiveDeck(updatedDeck);
      setDecks(prev => prev.map(d => (d.id === activeDeck.id ? updatedDeck : d)));

      // Move to next card automatically
      if (currentCardIndex < cards.length - 1) {
        setCurrentCardIndex(prev => prev + 1);
        setIsFlipped(false);
        setShowHint(false);
      } else {
        onShowToast('Deck completed! Spaced review updated.', 'success');
      }
    } catch (err: any) {
      onShowToast('Failed to record card review', 'error');
    }
  };

  const handleDeleteDeck = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Delete this flashcard deck?')) return;
    try {
      await api.deleteDeck(id);
      setDecks(prev => prev.filter(d => d.id !== id));
      if (activeDeck?.id === id) {
        const remaining = decks.filter(d => d.id !== id);
        if (remaining.length > 0) selectDeck(remaining[0]);
        else setActiveDeck(null);
      }
      onShowToast('Deck deleted', 'info');
    } catch (err: any) {
      onShowToast('Failed to delete deck', 'error');
    }
  };

  const currentCard = activeDeck?.cards[currentCardIndex];
  const masteredCount = activeDeck?.cards.filter(c => c.mastery === 'mastered').length || 0;
  const masteryPercentage = activeDeck && activeDeck.cards.length > 0 ? Math.round((masteredCount / activeDeck.cards.length) * 100) : 0;

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
            <Layers className="w-7 h-7 text-indigo-600" />
            Active Recall Flashcards
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Rapid active retrieval cards with mastery rating and spaced reinforcement
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Side: Generator & Decks Drawer (4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          {/* Generator Box */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs">
            <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-100">
              <Sparkles className="w-4 h-4 text-indigo-600" />
              <h2 className="text-sm font-bold text-slate-900">Generate Flashcard Deck</h2>
            </div>

            <form onSubmit={handleGenerateDeck} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Subject *
                </label>
                <input
                  type="text"
                  required
                  value={subject}
                  onChange={e => setSubject(e.target.value)}
                  placeholder="e.g. Immunology"
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Topic *
                </label>
                <input
                  type="text"
                  required
                  value={topic}
                  onChange={e => setTopic(e.target.value)}
                  placeholder="e.g. Complement Cascade Pathways"
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Number of Cards
                </label>
                <select
                  value={cardCount}
                  onChange={e => setCardCount(Number(e.target.value))}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 text-slate-900 bg-white"
                >
                  <option value={4}>4 Cards</option>
                  <option value={6}>6 Cards</option>
                  <option value={8}>8 Cards</option>
                  <option value={12}>12 Cards</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={isGenerating}
                className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {isGenerating ? (
                  <>
                    <Sparkles className="w-4 h-4 animate-spin text-amber-300" />
                    <span>Writing flashcards...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-amber-300" />
                    <span>Generate Cards</span>
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Decks Library */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
              Deck Library ({decks.length})
            </h3>
            <div className="max-h-60 overflow-y-auto space-y-2">
              {decks.length === 0 ? (
                <p className="text-xs text-slate-400 py-3 text-center">No flashcard decks yet.</p>
              ) : (
                decks.map(d => (
                  <div
                    key={d.id}
                    onClick={() => selectDeck(d)}
                    className={`group flex items-center justify-between p-3 rounded-xl border text-xs cursor-pointer transition-all ${
                      activeDeck?.id === d.id
                        ? 'bg-indigo-50 border-indigo-200 text-indigo-950 font-semibold'
                        : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <div className="truncate flex-1 pr-2">
                      <p className="truncate">{d.title}</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        {d.subject} • {d.mastered_count || 0}/{d.card_count} mastered
                      </p>
                    </div>
                    <button
                      onClick={e => handleDeleteDeck(d.id, e)}
                      className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-rose-600 rounded transition-opacity"
                      aria-label="Delete deck"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right Side: Interactive 3D Flip Card Viewer (8 cols) */}
        <div className="lg:col-span-8 bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs flex flex-col justify-between min-h-[460px]">
          {activeDeck && currentCard ? (
            <div className="space-y-6 flex-1 flex flex-col justify-between">
              {/* Header & Mastery Status */}
              <div>
                <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
                  <span className="font-semibold text-slate-800">
                    Card {currentCardIndex + 1} of {activeDeck.cards.length}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-indigo-700 font-bold">
                      Mastery: {masteryPercentage}% ({masteredCount}/{activeDeck.cards.length})
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[11px] font-bold capitalize ${
                        currentCard.mastery === 'mastered'
                          ? 'bg-emerald-100 text-emerald-800'
                          : currentCard.mastery === 'learning'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {currentCard.mastery}
                    </span>
                  </div>
                </div>

                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 rounded-full transition-all duration-300"
                    style={{ width: `${masteryPercentage}%` }}
                  />
                </div>
              </div>

              {/* The Flip Card */}
              <div
                onClick={handleFlip}
                className="relative my-4 flex-1 min-h-[220px] rounded-3xl border-2 border-slate-200 bg-gradient-to-b from-white to-slate-50/80 p-6 sm:p-8 flex flex-col items-center justify-center text-center cursor-pointer shadow-sm hover:shadow-md transition-all group"
              >
                <div className="absolute top-4 right-4 text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-500 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors flex items-center gap-1">
                  <RotateCw className="w-3.5 h-3.5" />
                  <span>Click to flip</span>
                </div>

                <div className="absolute top-4 left-4 text-xs font-bold text-slate-400 uppercase tracking-wider">
                  {isFlipped ? 'Answer (Back)' : 'Question (Front)'}
                </div>

                <p className="text-base sm:text-xl font-bold text-slate-900 max-w-xl leading-relaxed">
                  {isFlipped ? currentCard.back : currentCard.front}
                </p>

                {/* Optional Hint on Front */}
                {!isFlipped && currentCard.hint && (
                  <div className="mt-6">
                    {showHint ? (
                      <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 max-w-md">
                        <strong>Memory Hint:</strong> {currentCard.hint}
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={e => {
                          e.stopPropagation();
                          setShowHint(true);
                        }}
                        className="inline-flex items-center gap-1.5 text-xs text-amber-600 hover:text-amber-800 font-semibold"
                      >
                        <Lightbulb className="w-3.5 h-3.5" />
                        <span>Show Memory Cue</span>
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Bottom Rating Controls & Navigation */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-center gap-3">
                  <button
                    onClick={() => handleRateMastery('learning')}
                    className="flex-1 py-2.5 px-3 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold border border-rose-200 transition-colors"
                  >
                    1. Still Learning
                  </button>
                  <button
                    onClick={() => handleRateMastery('learning')}
                    className="flex-1 py-2.5 px-3 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 text-xs font-bold border border-amber-200 transition-colors"
                  >
                    2. Need Review
                  </button>
                  <button
                    onClick={() => handleRateMastery('mastered')}
                    className="flex-1 py-2.5 px-3 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold border border-emerald-200 transition-colors"
                  >
                    3. Mastered
                  </button>
                </div>

                <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    disabled={currentCardIndex === 0}
                    onClick={() => {
                      setCurrentCardIndex(prev => prev - 1);
                      setIsFlipped(false);
                      setShowHint(false);
                    }}
                    className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40 flex items-center gap-1 font-medium"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    <span>Previous Card</span>
                  </button>

                  <span className="text-[11px] text-slate-400">
                    Use ratings above to advance spaced repetition
                  </span>

                  <button
                    type="button"
                    disabled={currentCardIndex === activeDeck.cards.length - 1}
                    onClick={() => {
                      setCurrentCardIndex(prev => prev + 1);
                      setIsFlipped(false);
                      setShowHint(false);
                    }}
                    className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40 flex items-center gap-1 font-medium"
                  >
                    <span>Next Card</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-24 text-slate-400 space-y-3">
              <Layers className="w-12 h-12 mx-auto text-slate-300" />
              <p className="text-sm">Select a deck or generate a new one on the left to begin practice.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
