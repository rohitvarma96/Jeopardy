import { LoadSkiaWeb } from '@shopify/react-native-skia/lib/module/web';
import { registerRootComponent } from 'expo';
import { Pressable, Text, View } from 'react-native';

// CanvasKit must exist before Router imports any fighter or battle modules.
LoadSkiaWeb({ locateFile: () => '/canvaskit.wasm' })
  .then(() => require('expo-router/entry'))
  .catch((error) => {
    console.error('Unable to initialize the local game graphics runtime.', error);
    function GraphicsError() {
      return (
        <View style={{ flex: 1, justifyContent: 'center', padding: 28, gap: 20, backgroundColor: '#15151F' }}>
          <Text role="alert" style={{ color: '#F1F0E8', fontSize: 22 }}>
            Game graphics could not load. Check that the local CanvasKit asset is available.
          </Text>
          <Pressable role="button" accessibilityLabel="Retry loading game graphics"
            onPress={() => globalThis.location.reload()}
            style={{ minHeight: 48, padding: 16, backgroundColor: '#E9FF3C' }}>
            <Text style={{ color: '#15151F' }}>Retry loading game graphics</Text>
          </Pressable>
        </View>
      );
    }
    registerRootComponent(GraphicsError);
  });
