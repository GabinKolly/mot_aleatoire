import { Play } from 'lucide-react';
import BlackButton from './BlackButton';

export default function StartScreen({ onStart }) {
  return (
    <div className="text-center py-12">
      <BlackButton
        onClick={onStart}
        className="inline-flex items-center gap-2 px-8 py-4 bg-emerald-600 text-white text-xl font-semibold rounded-xl hover:bg-emerald-700 transition-colors shadow-lg"
      >
        <Play className="w-6 h-6" />
        Commencer
      </BlackButton>
    </div>
  );
}
