import { APP_TITLE_LINES, APP_TITLE_SHIFTED_RIGHT_LINE_INDEXES } from '../constants/branding';

interface AppTitleProps {
  variant: 'menu' | 'solo';
  as?: 'h1' | 'span';
}

const VARIANT_CLASS: Record<AppTitleProps['variant'], string> = {
  menu: 'mm-title--menu',
  solo: 'mm-title--solo',
};

export default function AppTitle({ variant, as = 'span' }: AppTitleProps) {
  const Tag = as;
  return (
    <Tag className={`mm-title ${VARIANT_CLASS[variant]}`}>
      {APP_TITLE_LINES.map((line, index) => (
        <span
          key={`${line}-${index}`}
          className={
            APP_TITLE_SHIFTED_RIGHT_LINE_INDEXES.includes(index)
              ? 'mm-title__line mm-title__line--shift-right'
              : 'mm-title__line'
          }
        >
          {line}
        </span>
      ))}
    </Tag>
  );
}
