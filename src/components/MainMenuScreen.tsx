import MobileFooter from './MobileFooter';
import ModeSelection from './ModeSelection';

interface MainMenuScreenProps {
  onSelectSolo: () => void;
  onSelectMultiplayer: () => void;
  onSelectCompetition: () => void;
}

export default function MainMenuScreen({
  onSelectSolo,
  onSelectMultiplayer,
  onSelectCompetition,
}: MainMenuScreenProps) {
  return (
    <div className="mm-page-shell">
      <div className="mm-page-shell__content mm-menu-layout">
        <div className="mm-menu-title-wrap">
          <h1 className="mm-title mm-title--menu">
            <span>Mot</span>
            <span>mélangé</span>
          </h1>
        </div>

        <div className="mm-menu-actions-wrap">
          <ModeSelection
            onSelectSolo={onSelectSolo}
            onSelectMultiplayer={onSelectMultiplayer}
            onSelectCompetition={onSelectCompetition}
          />
        </div>
      </div>
      <MobileFooter />
    </div>
  );
}
