// @ts-nocheck
import React, { useRef, useEffect, useState } from 'react';

import {
  StyleSheet,
  Platform,
  ViewStyle,
  AppState,
  ActivityIndicator,
  SafeAreaView,
} from 'react-native';
import {
  useCameraDevices,
  Camera,
  CameraPermissionStatus,
  CameraPermissionRequestResult,
} from 'react-native-vision-camera';
import ImageResizer from '@bam.tech/react-native-image-resizer';
import axios from 'axios';
import { mediaDevices, MediaStream, RTCView } from 'react-native-webrtc';
import ViewShot from 'react-native-view-shot';

type CameraType = {
  width?: number; // camera view width size
  height?: number; // camera view height size
  frameWidth?: number;
  framHeight?: number;
  quality?: number; // quality image after resize image capture
  urlSystem: string; // url using send image to server
  urlLogErr: string; // url send log err to server
  style?: ViewStyle; // style camera view
  examId: string; // exam id
  userId: string; // user id
  timeCapture?: number; // timeout between each auto take picture
  widthImageSize?: number; // width size after resize image
  heightImageSize?: number; // height size after resize image
};

const isIOS: boolean = Platform.OS === 'ios';

export function CameraView(propCamera: CameraType) {
  const {
    width,
    height,
    quality,
    urlSystem,
    urlLogErr,
    style,
    examId = '',
    userId = '',
    timeCapture = 30000,
    widthImageSize,
    heightImageSize,
  } = propCamera;

  console.log('props Camera => ', propCamera);
  const appState = useRef(AppState.currentState);
  const [appStateVisible, setAppStateVisible] = useState(appState.current);
  const viewShot = useRef(null);

  const [uriImage, setUriImage] = useState<string>('');
  const [permissionCamera, setPermissionCamera] = useState<
    CameraPermissionStatus | CameraPermissionRequestResult | ''
  >('');
  const [stream, setStream] = useState<MediaStream>();

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (
        appState.current.match(/inactive|background/) &&
        nextAppState === 'active'
      ) {
        console.log('App has come to the foreground!');
      }

      appState.current = nextAppState;
      setAppStateVisible(appState.current);
      console.log('AppState', appState.current);
    });

    return () => {
      subscription.remove();
    };
  }, []);

  useEffect(() => {
    let interval: any;
    if (permissionCamera != 'authorized') {
      checkCameraPermission();
    } else {
      interval = setTimeout(() => {
        takePhotoAuto();
      }, timeCapture);
    }
    return () => {
      clearInterval(interval);
    };
  }, [permissionCamera, uriImage]);

  useEffect(() => {
    if (uriImage != null && uriImage != '' && !uriImage.includes('undefined')) {
      console.log('uri => ', uriImage);

      ImageResizer.createResizedImage(
        uriImage,
        widthImageSize || 720,
        heightImageSize || 720,
        'PNG',
        quality || 0.15,
        0,
        undefined,
        false
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
          setUriImage('');
          console.log('error resize => ', err);
        });
    }
  }, [uriImage]);

  useEffect(() => {
    startStreamLocal();
    return () => {
      stopStreamLocal();
    };
  }, [stream]);

  const stopStreamLocal = () => {
    console.log('stop');
    if (stream) {
      stream.release();
      setStream(undefined);
    }
  };

  const startStreamLocal = async () => {
    console.log('start');
    if (!stream) {
      let s;
      try {
        s = await mediaDevices.getUserMedia({
          video: true,
        });
        setStream(s);
      } catch (e) {
        console.warn(e);
      }
    }
  };

  const checkCameraPermission = async () => {
    const cameraPermission = await Camera.getCameraPermissionStatus();
    console.log('permission => ', cameraPermission);

    if (cameraPermission != 'authorized') {
      const newCameraPermission = await Camera.requestCameraPermission();
      setPermissionCamera(newCameraPermission);
    } else {
      setTimeout(() => {
        takePhotoAuto();
      }, timeCapture);
    }
  };

  /**
   *
   * @param uriImage image after resize
   * @param nameFile
   * @param timeCall the number of times the function to upload images was called
   */
  const pushImage = async (
    uriImage: string,
    nameFile: string,
    timeCall: number
  ) => {
    var formData = new FormData();
    formData.append('examId', examId);
    formData.append('userId', userId);
    formData.append('image', {
      uri: uriImage,
      type: 'image/png',
      name: nameFile,
    });
    try {
      let response = await axios({
        method: 'POST',
        url: urlSystem,
        headers: {
          'Content-Type': 'multipart/form-data',
          'Accept': 'application/json',
        },
        data: formData,
      });
      console.log('reponse api => ', response.data);
    } catch (e) {
      console.log('error => ', e);
      if (timeCall <= 3) {
        pushImage(uriImage, nameFile, timeCall + 1);
      } else {
        logError(e);
      }
    }
  };

  /**
   * log error when upload image error after 3 times
   */
  const logError = async (error: any) => {
    setUriImage('');
    console.log('error send => ', error);
    const body = {
      user_id: userId,
      exam_id: examId,
      message: error,
    };
    try {
      let response = await axios({
        method: 'POST',
        url: urlLogErr,
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json',
        },
        data: body,
      });
      console.log('reponse api log error => ', response.data);
    } catch (e) {
      console.log('error log => ', e);
    }
  };

  /**
   * take photo auto after 1 specified time
   */
  const takePhotoAuto = async () => {
    try {
      if (viewShot.current != null) {
        viewShot.current.capture().then(
          //callback function to get the result URL of the screnshot
          (uri: string) => {
            console.log('viewShot uri => ', uri);
            if (isIOS) {
              setUriImage('file:/' + uri);
            } else {
              setUriImage(uri);
            }
          },
          (error: any) => console.error('Oops, Something Went Wrong', error)
        );
      }
    } catch (error) {
      setUriImage('');
      console.log('error when take photo => ', error);
    }
  };

  const Loading = () => {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator size={'large'} color={'#175699'} animating={true} />
      </SafeAreaView>
    );
  };

  
  return (
    <ViewShot
      ref={viewShot}
      options={{
        handleGLSurfaceViewOnAndroid: true,
        format: 'png',
      }}
      style={[
        style || styles.container,
        {
          width: width || 60,
          height: height || 60,
        },
      ]}
    >
      {stream && appStateVisible == 'active' ? (
        <RTCView
          objectFit={'cover'}
          streamURL={stream.toURL()}
          style={{ width: width, height: height }}
          mirror={true}
        />
      ) : (
        <Loading />
      )}
    </ViewShot>
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
    margin: 20,
  },
});
