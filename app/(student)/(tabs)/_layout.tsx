import { Tabs } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { TabBar, type IconName } from '@/components';

type TabOptions = { title: string; tabBarIconName: IconName };

export default function StudentTabs() {
  const { t } = useTranslation();
  const opt = (title: string, icon: IconName): TabOptions => ({ title, tabBarIconName: icon });
  return (
    <Tabs screenOptions={{ headerShown: false }} tabBar={(props) => <TabBar {...props} />}>
      <Tabs.Screen name="teachers" options={opt(t('tabs.teachers'), 'search')} />
      <Tabs.Screen name="sessions" options={opt(t('tabs.sessions'), 'calendar')} />
      <Tabs.Screen name="progress" options={opt(t('tabs.progress'), 'book')} />
      <Tabs.Screen name="account" options={opt(t('tabs.account'), 'user')} />
    </Tabs>
  );
}
