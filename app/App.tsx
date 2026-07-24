import {SafeAreaProvider} from 'react-native-safe-area-context';
import {AuthProvider} from './src/context/AuthContext';
import RootNavigator from './src/navigation/RootNavigator';

export default function App() {
  return (
    <SafeAreaProvider style={{maxWidth: 480, marginHorizontal: 'auto'}}>
      <AuthProvider>
        <RootNavigator />
      </AuthProvider>
    </SafeAreaProvider>
  );
}
