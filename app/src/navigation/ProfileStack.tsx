import {createNativeStackNavigator} from '@react-navigation/native-stack';
import Profile from '../screens/Profile';
import Settings from '../screens/Settings';
import ChangePassword from '../screens/ChangePassword';

export type ProfileStackParamList = {
  Profile: undefined;
  Settings: undefined;
  ChangePassword: undefined;
};

const Stack = createNativeStackNavigator<ProfileStackParamList>();

export default function ProfileStack() {
  return (
    <Stack.Navigator screenOptions={{headerShown: false}}>
      <Stack.Screen name="Profile" component={Profile} />
      <Stack.Screen name="Settings" component={Settings} options={{headerShown: true}} />
      <Stack.Screen
        name="ChangePassword"
        component={ChangePassword}
        options={{headerShown: true, title: 'Password'}}
      />
    </Stack.Navigator>
  );
}
