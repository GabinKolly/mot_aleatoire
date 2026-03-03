import { Play, Trophy, Users } from 'lucide-react';

interface ModeSelectionProps {
  onSelectSolo: () => void;
  onSelectMultiplayer: () => void;
  onSelectCompetition: () => void;
}

export default function ModeSelection({
  onSelectSolo,
  onSelectMultiplayer,
  onSelectCompetition,
}: ModeSelectionProps) {
  return (
    <div className="mm-menu-selection" aria-label="Choix du mode">
      <div className="mm-menu-selection__band" aria-hidden="true" />
      <div className="mm-menu-selection__buttons">
        <button
          type="button"
          onClick={onSelectSolo}
          className="mm-menu-button mm-menu-button--green"
          data-mm-menu-anchor="start"
        >
          <Play className="mm-menu-button__icon" strokeWidth={2.5} />
          <span>Solo</span>
        </button>
        <button
          type="button"
          onClick={onSelectMultiplayer}
          className="mm-menu-button mm-menu-button--yellow"
        >
          <Users className="mm-menu-button__icon" strokeWidth={2.5} />
          <span>Deux joueurs</span>
        </button>
        <button
          type="button"
          onClick={onSelectCompetition}
          className="mm-menu-button mm-menu-button--red"
          data-mm-menu-anchor="end"
        >
          <Trophy className="mm-menu-button__icon" strokeWidth={2.5} />
          <span>Compétition</span>
        </button>
      </div>
    </div>
  );
}
