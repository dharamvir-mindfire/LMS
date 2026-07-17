import {MaterialIcons} from '@expo/vector-icons';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import HomeStack from './HomeStack';
import CoursesStack from './CoursesStack';
import ProfileStack from './ProfileStack';
import colors from '../theme/colors';

export type MainTabParamList = {
  Home: undefined;
  Courses: undefined;
  Profile: undefined;
};

type IconName = keyof typeof MaterialIcons.glyphMap;

const TAB_ICONS: Record<keyof MainTabParamList, IconName> = {
  Home: 'home',
  Courses: 'menu-book',
  Profile: 'person',
};

const Tab = createBottomTabNavigator<MainTabParamList>();

export default function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({route}) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.purple,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: {backgroundColor: colors.surface, borderTopColor: colors.border},
        tabBarIcon: ({color, size}) => (
          <MaterialIcons name={TAB_ICONS[route.name as keyof MainTabParamList]} color={color} size={size} />
        ),
      })}>
      <Tab.Screen name="Home" component={HomeStack} />
      <Tab.Screen name="Courses" component={CoursesStack} />
      <Tab.Screen name="Profile" component={ProfileStack} />
    </Tab.Navigator>
  );
}
