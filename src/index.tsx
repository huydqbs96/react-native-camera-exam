import * as React from 'react';

import { StyleSheet, Text } from 'react-native';
import { useCameraDevices, Camera } from 'react-native-vision-camera';

// const LINKING_ERROR =
//   `The package 'react-native-camera-exam' doesn't seem to be linked. Make sure: \n\n` +
//   Platform.select({ ios: "- You have run 'pod install'\n", default: '' }) +
//   '- You rebuilt the app after installing the package\n' +
//   '- You are not using Expo managed workflow\n';

// const CameraExam = NativeModules.CameraExam ? NativeModules.CameraExam : new Proxy(
//   {},
//   {
//     get() {
//       throw new Error(LINKING_ERROR);
//     },
//   }
// );

// export function multiply(a: number, b: number): Promise<number> {
//   return CameraExam.multiply(a, b);
// }

// export function AppComponent() {
//   const [result, setResult] = React.useState<number | undefined>();

//   React.useEffect(() => {
//     multiply(3, 7).then(setResult);
//   }, []);

//   return (
//     <View style={styles.container}>
//       <Text>Result: {result}</Text>
//     </View>
//   );
// }

export function CameraView() {
  const devices = useCameraDevices();
  const device = devices.front
  if (device == null) return <><Text>null camera</Text></>;
  return (
    <Camera
      style={styles.cameraView}
      device={device}
      isActive={true}
    />
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
