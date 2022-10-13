import * as React from 'react';

import { StyleSheet, View } from 'react-native';
import { CameraView } from 'react-native-camera-exam';

export default function App() {
  // React.useEffect(() => {
  //   multiply(3, 7).then(setResult);
  // }, []);

  return (
    <View style={styles.container}>
      <CameraView />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  box: {
    width: 60,
    height: 60,
    marginVertical: 20,
  },
  cameraView: {
    width: 100,
    height: 100
  }
});
