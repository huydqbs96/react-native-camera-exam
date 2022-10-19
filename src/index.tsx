import React, { useRef, useEffect, useState } from 'react';

import { StyleSheet, Text, Platform, ViewStyle } from 'react-native';
import { 
  useCameraDevices, 
  Camera,
  CameraPermissionStatus,
  CameraPermissionRequestResult
} from 'react-native-vision-camera';
import ImageResizer from '@bam.tech/react-native-image-resizer';
import axios from 'axios';

type CameraType = {
  width?: number
  height?: number
  frameWidth?: number
  framHeight?: number
  quality?: number
  urlSystem: string
  style?: ViewStyle
}

const isIOS: boolean = Platform.OS === "ios";

export function CameraView(propCamera: CameraType) {

  const { 
    width, 
    height, 
    quality,
    urlSystem,
    style
  } = propCamera

  const devices = useCameraDevices();
  const camera = useRef<Camera>(null)
  const device = devices.front

  const [uriImage, setUriImage] = useState<string>('');
  const [permissionCamera, setPermissionCamera] = useState<CameraPermissionStatus |
    CameraPermissionRequestResult | ''>('');

    useEffect(() => {
      if (permissionCamera != 'authorized') {
        checkCameraPermission()
      } else {
        setTimeout(() => {
          takePhotoAuto()
        }, 5000);
      }
    }, [permissionCamera]);

  useEffect(() => {
    if (uriImage) {
      console.log('uri => ', uriImage);

      ImageResizer.createResizedImage(
        uriImage,
        720,
        720,
        'PNG',
        quality || 0.15, 
        0,
        undefined, false
      )
        .then((response) => {
          // response.uri is the URI of the new image that can now be displayed, uploaded...
          // response.path is the path of the new image
          // response.name is the name of the new image with the extension
          // response.size is the size of the new image
          console.log('response => ', response);
          pushImage(response.uri, response.name, 1);
        })
        .catch((err) => {
          // Oops, something went wrong. Check that the filename is correct and
          // inspect err to get more details.
          console.log('error resize => ', err);

        });
    }
  }, [uriImage]);

  const checkCameraPermission = async () => {
    const cameraPermission = await Camera.getCameraPermissionStatus();
    console.log('permission => ', cameraPermission);

    if (cameraPermission != 'authorized') {
      const newCameraPermission = await Camera.requestCameraPermission();
      setPermissionCamera(newCameraPermission);
    } else {
      setTimeout(() => {
        takePhotoAuto()
      }, 3000);
    }
  }

  const pushImage = async (uriImage: string, nameFile: string, timeCall: number) => {
    var formData = new FormData();
    formData.append("examKey", "beetsoft031");
    formData.append("userId", "2");
    formData.append("image", {
      uri: uriImage,
      type: "image/png",
      name: nameFile,
    });
    try {
      let response = await axios({
        method: "POST",
        url: urlSystem,
        headers: {
          "Content-Type": "multipart/form-data",
          "Accept": "application/json",
        },
        data: formData,
      });
      console.log('reponse api => ', response.data);

    } catch (e) {
      console.log('error => ', e);
      if (timeCall <= 3) {
        pushImage(uriImage, nameFile, timeCall + 1);
      }
    }
  }

  const takePhotoAuto = async () => {
    const photo = await camera.current?.takePhoto({
      flash: 'off'
    })
    console.log('data image => ', photo?.path);
    if (isIOS) {
      setUriImage("file:/" + photo?.path)
    } else {
      setUriImage(photo?.path!)
    }
  }

  if (device == null) return <><Text>null camera</Text></>;

  return (
    <Camera
      photo={true}
      ref={camera}
      style={[
        style || styles.cameraView,
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
    margin: 20
  }
});
