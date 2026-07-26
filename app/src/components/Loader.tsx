import {ActivityIndicator, StyleSheet, Text, View} from 'react-native';
import colors from '../theme/colors';

interface LoaderProps {
  label?: string;
  fullscreen?: boolean;
}

export default function Loader({label = 'Loading...', fullscreen = true}: LoaderProps) {
  return (
    <View style={fullscreen ? styles.fullscreen : styles.inline}>
      <ActivityIndicator size="large" color={colors.purple} />
      {label ? <Text style={styles.label}>{label}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  fullscreen: {flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12},
  inline: {alignItems: 'center', justifyContent: 'center', gap: 12, paddingVertical: 24},
  label: {color: colors.textMuted},
});
