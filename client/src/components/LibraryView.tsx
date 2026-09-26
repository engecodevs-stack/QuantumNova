import React, { useState, useEffect } from 'react';
import { Library, Search, Sparkles, ChevronRight, X } from 'lucide-react';
import Markdown from 'markdown-to-jsx';

interface LibraryViewProps {
  onExplainConcept: (concept: string) => void;
  setView: (view: any) => void;
  onCreateNote?: (title: string, content: string) => Promise<any>;
}

export interface LibraryCard {
  title: string;
  category: string;
  description: string;
  difficulty: 'Principiante' | 'Intermedio' | 'Avanzado';
}

export const LibraryView: React.FC<LibraryViewProps> = ({
  onExplainConcept,
  setView,
  onCreateNote
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [activeExplanation, setActiveExplanation] = useState<string | null>(null);
  const [expTitle, setExpTitle] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isLibraryLoading, setIsLibraryLoading] = useState(false);
  const [libraryCards, setLibraryCards] = useState<LibraryCard[]>([]);

  // Fetch AI generated library recommendations
  useEffect(() => {
    const fetchLibrary = async () => {
      setIsLibraryLoading(true);
      try {
        const savedUser = localStorage.getItem('quantum_user');
        const user = savedUser ? JSON.parse(savedUser) : null;
        const userId = user?.id;

        const headers: HeadersInit = { 'Content-Type': 'application/json' };
        if (userId) {
          headers['x-user-id'] = userId;
        }

        const response = await fetch('http://localhost:5000/api/ai/library', {
          headers
        });
        if (response.ok) {
          const data = await response.json();
          setLibraryCards(data.cards || []);
        }
      } catch (err) {
        console.error('Failed to load dynamic library cards:', err);
      } finally {
        setIsLibraryLoading(false);
      }
    };

    fetchLibrary();
  }, []);

  const handleCardClick = async (title: string) => {
    setIsLoading(true);
    setExpTitle(title);
    setActiveExplanation('');

    try {
      const response = await fetch('http://localhost:5000/api/ai/explain', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ concept: title })
      });

      if (response.ok) {
        const data = await response.json();
        setActiveExplanation(data.explanation);
      }
    } catch (err) {
      console.error('Failed to get concept explanation:', err);
      setActiveExplanation('Error al conectar con la IA de tutoría.');
    } finally {
      setIsLoading(false);
    }
  };

  const filteredCards = libraryCards.filter(card => {
    const matchesQuery =
      card.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      card.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || card.category.toLowerCase() === selectedCategory.toLowerCase();
    return matchesQuery && matchesCategory;
  });

  // Extract unique categories from loaded library cards
  const categories = ['all', ...Array.from(new Set(libraryCards.map(c => c.category.toLowerCase())))];

  return (
    <div className="library-container flex-1 h-full overflow-y-auto bg-bg-primary p-6 space-y-6 relative select-text">
      {/* Header */}
      <div className="pb-4 border-b border-border-custom flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <Library className="w-6 h-6 text-tech-purple" />
          <div>
            <h2 className="font-bold text-xs uppercase tracking-wider text-text-primary">Biblioteca del Conocimiento</h2>
            <p className="text-[11px] text-text-secondary">
              Explora temas recomendados automáticamente por la IA en base a tus notas creadas
            </p>
          </div>
        </div>

        {/* Search Bar (Only show if there are cards) */}
        {libraryCards.length > 0 && (
          <div className="relative w-64">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-text-secondary" />
            <input
              type="text"
              placeholder="Buscar temas en la biblioteca..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-white dark:bg-panel-secondary border border-border-custom focus:border-tech-purple rounded-lg py-1.5 pl-9 pr-4 text-xs text-text-primary placeholder:text-text-secondary/60 outline-none transition-colors shadow-xs"
            />
          </div>
        )}
      </div>

      {/* Loading State for Library */}
      {isLibraryLoading ? (
        <div className="h-64 w-full flex flex-col items-center justify-center gap-3">
          <div className="w-8 h-8 border-2 border-tech-purple border-t-transparent rounded-full animate-spin" />
          <div className="text-center">
            <span className="text-xs text-text-primary font-semibold block">Quantum está analizando tus notas...</span>
            <span className="text-[11px] text-text-secondary">Generando recomendaciones de estudio personalizadas...</span>
          </div>
        </div>
      ) : libraryCards.length === 0 ? (
        /* Empty State */
        <div data-tour="library-grid" className="h-[360px] rounded-2xl bg-white dark:bg-panel border border-border-custom flex flex-col items-center justify-center p-8 text-center space-y-4 shadow-xs max-w-2xl mx-auto mt-10">
          <div className="w-14 h-14 rounded-2xl bg-[#F8F7FC] dark:bg-panel-secondary border border-border-custom flex items-center justify-center text-tech-purple shadow-xs">
            <Sparkles className="w-7 h-7" />
          </div>
          <div className="space-y-1.5">
            <h3 className="font-bold text-sm text-text-primary uppercase tracking-wider">Tu Biblioteca está Vacía</h3>
            <p className="text-xs text-text-secondary leading-relaxed max-w-md mx-auto">
              Aún no tienes notas en tu biblioteca. Quantum necesita que crees tus primeras notas de estudio para poder analizarlas y recomendarte temas personalizados de aprendizaje.
            </p>
          </div>
          <button
            onClick={() => setView('notes')}
            className="px-5 py-2 bg-tech-purple hover:bg-tech-purple/90 text-white text-xs font-semibold rounded-xl transition-all cursor-pointer shadow-xs"
          >
            Crear mis Primeras Notas
          </button>
        </div>
      ) : (
        /* Dynamic Cards View */
        <>
          {/* Category Tabs */}
          {categories.length > 1 && (
            <div className="flex flex-wrap gap-2">
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3.5 py-1.5 rounded-lg text-[11px] font-semibold uppercase tracking-wider transition-all border cursor-pointer shadow-xs ${
                    selectedCategory === cat
                      ? 'bg-tech-purple/10 border-tech-purple text-tech-purple'
                      : 'bg-white dark:bg-panel-secondary border-border-custom text-text-secondary hover:text-text-primary hover:bg-bg-secondary'
                  }`}
                >
                  {cat === 'all' ? 'Todos' : cat.toUpperCase()}
                </button>
              ))}
            </div>
          )}

          {/* Concept Cards Grid */}
          <div data-tour="library-grid" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCards.map((card, idx) => (
              <div
                key={idx}
                onClick={() => handleCardClick(card.title)}
                className="p-5 rounded-2xl bg-white dark:bg-panel border border-border-custom hover:border-tech-purple/60 hover:shadow-md cursor-pointer transition-all duration-200 flex flex-col justify-between h-[180px] group relative overflow-hidden shadow-xs"
              >
                <div className="flex justify-between items-start">
                  <span className="text-[10px] bg-bg-secondary text-text-secondary border border-border-custom px-2.5 py-0.5 rounded-md font-mono font-semibold uppercase">
                    {card.category}
                  </span>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-md font-bold uppercase border ${
                      card.difficulty === 'Principiante'
                        ? 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/30 text-emerald-700 dark:text-emerald-400'
                        : card.difficulty === 'Intermedio'
                        ? 'bg-blue-50 dark:bg-blue-500/10 border-blue-200 dark:border-blue-500/30 text-blue-700 dark:text-blue-400'
                        : 'bg-tech-purple/10 border-tech-purple/20 text-tech-purple'
                    }`}
                  >
                    {card.difficulty}
                  </span>
                </div>

                <div className="my-2 space-y-1">
                  <h3 className="font-bold text-text-primary text-sm group-hover:text-tech-purple transition-colors line-clamp-1">
                    {card.title}
                  </h3>
                  <p className="text-xs text-text-secondary leading-relaxed line-clamp-2">
                    {card.description}
                  </p>
                </div>

                <div className="flex justify-between items-center text-[11px] text-tech-purple font-semibold uppercase tracking-wider pt-2 border-t border-border-custom">
                  <span className="flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" /> Explicación IA
                  </span>
                  <ChevronRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform text-tech-purple" />
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Detailed AI Explanation Modal */}
      {activeExplanation !== null && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 select-text">
          <div className="bg-white dark:bg-panel border border-border-custom rounded-2xl w-full max-w-2xl h-[500px] flex flex-col shadow-2xl relative overflow-hidden animate-fade-in">
            {/* Header */}
            <div className="h-14 border-b border-border-custom px-6 flex items-center justify-between shrink-0 bg-white dark:bg-panel">
              <div className="flex items-center gap-2.5">
                <Sparkles className="w-5 h-5 text-tech-purple shrink-0" />
                <h3 className="font-bold text-sm text-text-primary truncate">{expTitle}</h3>
              </div>
              <button
                onClick={() => setActiveExplanation(null)}
                className="p-1.5 rounded-lg hover:bg-bg-secondary text-text-secondary hover:text-text-primary transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {isLoading ? (
                <div className="h-full w-full flex flex-col items-center justify-center gap-2">
                  <div className="w-8 h-8 border-2 border-tech-purple border-t-transparent rounded-full animate-spin" />
                  <span className="text-xs text-text-secondary">Conectando con Quantum Tutor...</span>
                </div>
              ) : (
                <div className="markdown-body text-xs text-text-secondary leading-relaxed">
                  <Markdown>{activeExplanation}</Markdown>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="h-14 border-t border-border-custom px-6 flex items-center justify-between bg-[#F8F7FC] dark:bg-panel-secondary shrink-0">
              <span className="text-[11px] text-text-secondary">Explicación estructurada por Inteligencia Artificial</span>
              <div className="flex gap-2">
                {onCreateNote && (
                  <button
                    onClick={async () => {
                      await onCreateNote(expTitle, `# ${expTitle}\n\n${activeExplanation}`);
                      setActiveExplanation(null);
                    }}
                    className="px-4 py-1.5 bg-white dark:bg-panel hover:bg-bg-secondary border border-border-custom text-text-primary text-xs font-semibold rounded-lg transition-all cursor-pointer flex items-center gap-1 shadow-xs"
                  >
                    Guardar como Nota
                  </button>
                )}
                <button
                  onClick={() => {
                    onExplainConcept(expTitle);
                    setActiveExplanation(null);
                    setView('chat');
                  }}
                  className="px-4 py-1.5 bg-tech-purple hover:bg-tech-purple/90 text-white text-xs font-semibold rounded-lg transition-all cursor-pointer flex items-center gap-1 shadow-xs"
                >
                  Preguntar en el Chat <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
