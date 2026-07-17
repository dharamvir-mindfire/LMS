import {createNativeStackNavigator} from '@react-navigation/native-stack';
import Home from '../screens/Home';
import AllQuizzes from '../screens/AllQuizzes';

export type HomeStackParamList = {
  Home: undefined;
  AllQuizzes: undefined;
};

const Stack = createNativeStackNavigator<HomeStackParamList>();

export default function HomeStack() {
  return (
    <Stack.Navigator screenOptions={{headerShown: false}}>
      <Stack.Screen name="Home" component={Home} />
      <Stack.Screen
        name="AllQuizzes"
        component={AllQuizzes}
        options={{headerShown: true, title: 'Quizzes'}}
      />
    </Stack.Navigator>
  );
}
