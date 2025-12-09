import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useGameStore, QuestionCategory } from '@/stores/gameStore';
import { UtensilsCrossed, Heart, Film, Music, Trophy, User } from 'lucide-react';

interface Category {
  id: QuestionCategory;
  name: string;
  icon: React.ReactNode;
  description: string;
  color: string;
  bgColor: string;
}

const categories: Category[] = [
  {
    id: 'food',
    name: 'Food',
    icon: <UtensilsCrossed className="w-8 h-8" />,
    description: 'Questions about eating habits & preferences',
    color: 'text-orange-400',
    bgColor: 'from-orange-500/20 to-orange-600/10',
  },
  {
    id: 'sex',
    name: 'Relationships',
    icon: <Heart className="w-8 h-8" />,
    description: 'Questions about love & intimacy',
    color: 'text-pink-400',
    bgColor: 'from-pink-500/20 to-pink-600/10',
  },
  {
    id: 'movie',
    name: 'Movies',
    icon: <Film className="w-8 h-8" />,
    description: 'Questions about cinema & films',
    color: 'text-purple-400',
    bgColor: 'from-purple-500/20 to-purple-600/10',
  },
  {
    id: 'music',
    name: 'Music',
    icon: <Music className="w-8 h-8" />,
    description: 'Questions about songs & concerts',
    color: 'text-blue-400',
    bgColor: 'from-blue-500/20 to-blue-600/10',
  },
  {
    id: 'sports',
    name: 'Sports',
    icon: <Trophy className="w-8 h-8" />,
    description: 'Questions about athletics & fitness',
    color: 'text-green-400',
    bgColor: 'from-green-500/20 to-green-600/10',
  },
  {
    id: 'personal',
    name: 'Personal',
    icon: <User className="w-8 h-8" />,
    description: 'Questions about life & secrets',
    color: 'text-cyan-400',
    bgColor: 'from-cyan-500/20 to-cyan-600/10',
  },
];

export const CategoryScreen = () => {
  const navigate = useNavigate();
  const { setSelectedCategory } = useGameStore();

  const handleCategorySelect = (categoryId: QuestionCategory) => {
    setSelectedCategory(categoryId);
    navigate('/questions');
  };

  return (
    <motion.div
      className="flex flex-col min-h-screen px-6 py-12"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* Header */}
      <motion.div
        className="text-center mb-4"
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        <h1 className="text-4xl md:text-5xl font-display font-bold mb-4 text-glow-primary">
          Choose Your Category
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Select a topic to begin. We'll analyze your eye movements as you answer questions.
        </p>
      </motion.div>

      {/* Category Grid */}
      <div className="flex-1 flex items-center justify-center">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl w-full">
          {categories.map((category, index) => (
            <motion.button
              key={category.id}
              onClick={() => handleCategorySelect(category.id)}
              className={`glass-card relative p-8 rounded-2xl border-2 border-border hover:border-primary/50 transition-all duration-300 group overflow-hidden`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * index }}
              whileHover={{ scale: 1.05, y: -5 }}
              whileTap={{ scale: 0.98 }}
            >
              {/* Gradient Background */}
              <div className={`absolute inset-0 bg-gradient-to-br ${category.bgColor} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />

              {/* Content */}
              <div className="relative z-10 flex flex-col items-center text-center">
                {/* Icon */}
                <motion.div
                  className={`${category.color} mb-4 p-4 rounded-full bg-background/50 group-hover:scale-110 transition-transform duration-300`}
                  whileHover={{ rotate: 360 }}
                  transition={{ duration: 0.6 }}
                >
                  {category.icon}
                </motion.div>

                {/* Title */}
                <h3 className="text-2xl font-bold mb-2 group-hover:text-primary transition-colors">
                  {category.name}
                </h3>

                {/* Description */}
                <p className="text-sm text-muted-foreground group-hover:text-foreground/80 transition-colors">
                  {category.description}
                </p>

                {/* Hover indicator */}
                <motion.div
                  className="mt-4 text-xs text-primary opacity-0 group-hover:opacity-100 transition-opacity"
                  initial={{ y: 10 }}
                  whileHover={{ y: 0 }}
                >
                  Click to start →
                </motion.div>
              </div>

              {/* Glow effect */}
              <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
                <div className={`absolute inset-0 rounded-2xl blur-xl ${category.bgColor}`} />
              </div>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Footer hint */}
      <motion.p
        className="text-center text-sm text-muted-foreground mt-8"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
      >
        Don't worry, you can always try other categories later!
      </motion.p>
    </motion.div>
  );
};
