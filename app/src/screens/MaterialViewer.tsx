import {useState} from 'react';
import {Alert, Linking, Pressable, StyleSheet, Text, View} from 'react-native';
import {WebView} from 'react-native-webview';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import type {CoursesStackParamList} from '../navigation/CoursesStack';
import Loader from '../components/Loader';
import colors from '../theme/colors';

type Props = NativeStackScreenProps<CoursesStackParamList, 'MaterialViewer'>;

export default function MaterialViewer({route}: Props) {
  const {url} = route.params;
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  const viewerUrl = `https://docs.google.com/gview?embedded=true&url=${encodeURIComponent(url)}`;

  function openExternally() {
    Linking.openURL(url).catch(() => Alert.alert('Could not open link', url));
  }

  if (failed) {
    return (
      <View style={styles.center}>
        <Text style={styles.error}>Could not display this document in the app.</Text>
        <Pressable style={styles.button} onPress={openExternally}>
          <Text style={styles.buttonText}>Open in browser</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <WebView
        source={{uri: viewerUrl}}
        style={styles.webview}
        startInLoadingState
        onLoadEnd={() => setLoading(false)}
        onError={() => setFailed(true)}
        onHttpError={() => setFailed(true)}
      />
      {loading ? (
        <View style={styles.loadingOverlay}>
          <Loader label="Loading document..." />
        </View>
      ) : null}
      <Pressable style={styles.openExternalBar} onPress={openExternally}>
        <Text style={styles.openExternalText}>Trouble viewing this document? Open in browser</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: colors.background},
  webview: {flex: 1, backgroundColor: colors.background},
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
  openExternalBar: {
    padding: 14,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
  },
  openExternalText: {color: colors.purple, fontWeight: '600'},
  center: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    gap: 16,
  },
  error: {color: colors.danger, textAlign: 'center'},
  button: {
    backgroundColor: colors.purple,
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  buttonText: {color: colors.white, fontWeight: '600'},
});
