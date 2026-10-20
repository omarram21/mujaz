import { Tabs } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { TabBar, type IconName } from '@/components';

type TabOptions = { title: string; tabBarIconName: IconName };

export default function TeacherTabs() {
  const { t } = useTranslation();
  const opt = (title: string, icon: IconName): TabOptions => ({ title, tabBarIconName: icon });
  return (
    <Tabs screenOptions={{ headerShown: false }} tabBar={(props) => <TabBar {...props} />}>
      <Tabs.Screen name="dashboard" options={opt(t('tabs.dashboard'), 'home')} />
      <Tabs.Screen name="schedule" options={opt(t('tabs.schedule'), 'calendar')} />
      <Tabs.Screen name="students" options={opt(t('tabs.students'), 'users')} />
      <Tabs.Screen name="account" options={opt(t('tabs.account'), 'user')} />
    </Tabs>
  );
}
