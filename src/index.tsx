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
  examKey?: string;
  userId?: string;
  timeCapture?: number;
  widthImageSize?: number;
  heightImageSize?: number;
}

const isIOS: boolean = Platform.OS === "ios";

export function CameraView(propCamera: CameraType) {

  const {
    width,
    height,
    quality,
    urlSystem,
    style,
    examKey,
    userId,
    timeCapture = 5000,
    widthImageSize,
    heightImageSize,
  } = propCamera;

  const devices = useCameraDevices();
  const camera = useRef<Camera>(null)
  const device = devices.front

  const [uriImage, setUriImage] = useState<string>('');
  const [permissionCamera, setPermissionCamera] = useState<CameraPermissionStatus |
    CameraPermissionRequestResult | ''>('');

    useEffect(() => {
      let interval: any;
      if (permissionCamera != 'authorized') {
        checkCameraPermission()
      } else {
        interval = setTimeout(() => {
          takePhotoAuto();
        }, timeCapture);
      }
      return () => {
        clearInterval(interval);
      };
    }, [permissionCamera]);

  useEffect(() => {
    if (uriImage) {
      console.log('uri => ', uriImage);

      ImageResizer.createResizedImage(
        uriImage,
        widthImageSize || 720,
        heightImageSize || 720,
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
      }, timeCapture);
    }
  }

  /**
   * 
   * @param uriImage image after resize
   * @param nameFile 
   * @param timeCall the number of times the function to upload images was called
   */
  const pushImage = async (uriImage: string, nameFile: string, timeCall: number) => {
    var formData = new FormData();
    formData.append("examKey", examKey);
    formData.append("userId", userId);
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
      } else {
        logError(e)
      }
    }
  }

  /**
   * log error when upload image error after 3 times
   */
  const logError = async (error: any) => {
    console.log('error send => ', error)
    // try {
    //   let response = await axios({
    //     method: 'POST',
    //     url: urlSystem,
    //     headers: {
    //       'Content-Type': 'multipart/form-data',
    //       'Accept': 'application/json',
    //     },
    //     data: error,
    //   });
    //   console.log('reponse api => ', response.data);
    // } catch (e) {
    //   console.log('error => ', e);
    // }
  };

  /**
   * take photo auto after 1 specified time
   */
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
