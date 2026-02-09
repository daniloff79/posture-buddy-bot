import { motion } from 'framer-motion';
import { PostureCard } from '@/components/PostureCard';
import { PostureIllustration } from '@/components/PostureIllustration';

const Index = () => {
  return (
    <div className="min-h-screen gradient-soft">
      <div className="container px-4 py-12 max-w-lg mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-8"
        >
          <h1 className="font-display text-3xl font-bold mb-2">
            <span className="text-gradient">Postura</span>
          </h1>
          <p className="text-muted-foreground">
            Seu lembrete diário para uma coluna saudável
          </p>
        </motion.div>

        {/* Illustration */}
        <PostureIllustration />

        {/* Main Controls */}
        <PostureCard />

        {/* Footer */}
        <motion.footer
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="mt-12 text-center text-xs text-muted-foreground"
        >
          <p>Cuide da sua postura, cuide de você 💚</p>
        </motion.footer>
      </div>
    </div>
  );
};

export default Index;
