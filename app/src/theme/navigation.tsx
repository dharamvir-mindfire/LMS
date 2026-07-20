import type {ReactElement} from 'react';
import {DarkTheme} from '@react-navigation/native';
import type {NativeStackNavigationOptions} from '@react-navigation/native-stack';
import {SafeAreaView} from 'react-native-safe-area-context';
import colors from './colors';

export const navigationTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    primary: colors.purple,
    background: colors.background,
    card: colors.background,
    text: colors.text,
    border: colors.border,
  },
};

export const statusBarScreenOptions: NativeStackNavigationOptions = {
  statusBarStyle: 'light',
  statusBarBackgroundColor: colors.background,
};

// Applied via each Stack.Navigator's `screenLayout` prop. Screens with a
// native header already sit below the status bar, so only headerless
// screens need a top safe-area inset; "Main" is the tab navigator's own
// container and manages its own insets.
export function withSafeArea(
  routeName: string,
  headerShown: boolean | undefined,
  children: ReactElement,
): ReactElement {
  if (routeName === 'Main' || headerShown !== false) {
    return children;
  }
  return (
    <SafeAreaView style={{flex: 1}} edges={['top', 'bottom']}>
      {children}
    </SafeAreaView>
  );
}
