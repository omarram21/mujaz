import { useTranslation } from 'react-i18next';
import { DarkHeader } from './DarkHeader';
import { Screen } from './Screen';
import { EmptyState } from './States';

/** Temporary screen body for routes whose phase hasn't been built yet. */
export function PlaceholderScreen({ title }: { title: string }) {
  const { t } = useTranslation();
  return (
    <Screen header={<DarkHeader title={title} />}>
      <EmptyState title={t('common.comingSoon')} />
    </Screen>
  );
}
