import React, { useRef, useEffect } from 'react';

import { StyleSheet, Text } from 'react-native';
import { useCameraDevices, Camera } from 'react-native-vision-camera';

type CameraType = {
  width?: number
  height?: number
  frameWidth?: number
  framHeight?: number
  quality?: 'quality' | 'balanced' | 'speed'
}

export function CameraView(propCamera: CameraType) {

  const { width, height } = propCamera

  const devices = useCameraDevices();
  const camera = useRef<Camera>(null)
  const device = devices.front

  useEffect(() => {
    setTimeout(() => {
      takePhotoAuto()
    }, 3000);
  });

  const takePhotoAuto = async () => {
    const photo = await camera.current?.takePhoto({
      flash: 'off'
    })
    console.log('data image => ', photo?.path);
  }
  if (device == null) return <><Text>null camera</Text></>;

  return (
    <Camera
      photo={true}
      ref={camera}
      style={[
        styles.cameraView,
        {
          width: width || 60,
          height: height || 60
        }
      ]}
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
