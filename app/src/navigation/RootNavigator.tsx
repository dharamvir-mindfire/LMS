import {NavigationContainer} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {ActivityIndicator, StyleSheet, View} from 'react-native';
import {useAuth} from '../context/AuthContext';
import Login from '../screens/Login';
import QuizPlay from '../screens/QuizPlay';
import MainTabs from './MainTabs';
import {navigationRef} from './navigationRef';
import colors from '../theme/colors';

export type RootStackParamList = {
  Login: undefined;
  Main: undefined;
  QuizPlay: {quizId: string; quizTitle: string};
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootNavigator() {
  const {user, loading} = useAuth();

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={colors.purple} />
      </View>
    );
  }

  return (
    <NavigationContainer ref={navigationRef}>
      <Stack.Navigator screenOptions={{headerShown: false}}>
        {!user ? (
          <Stack.Screen name="Login" component={Login} />
        ) : (
          <>
            <Stack.Screen name="Main" component={MainTabs} />
            <Stack.Screen name="QuizPlay" component={QuizPlay} options={{headerShown: true}} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
});
