// @ts-nocheck
import React, { useRef, useEffect, useState } from 'react';

import {
  StyleSheet,
  Platform,
  ViewStyle,
  AppState,
  ActivityIndicator,
  SafeAreaView,
  Alert,
  Linking,
} from 'react-native';
import ImageResizer from '@bam.tech/react-native-image-resizer';
import axios from 'axios';
import { mediaDevices, MediaStream, RTCView } from 'react-native-webrtc';
import ViewShot from 'react-native-view-shot';
import RNPermissions, {
  PERMISSIONS,
  PermissionStatus,
  RESULTS,
} from 'react-native-permissions';

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
    urlPostS3Url,
    urlLogErr,
    style,
    examId = '',
    userId = '',
    timeCapture = 30000,
    widthImageSize,
    heightImageSize,
  } = propCamera;
  const appState = useRef(AppState.currentState);
  const [appStateVisible, setAppStateVisible] = useState(appState.current);
  const viewShot = useRef(null);

  const [uriImage, setUriImage] = useState<string>('');
  const [permissionCamera, setPermissionCamera] = useState<PermissionStatus>();
  let interval = useRef<any>();
  const isAndroid = Platform.OS == 'android';

  const [localStream, setStream] = useState<any>(null);

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
    if (permissionCamera != 'granted') {
      checkCameraPermission();
    } else {
      interval.current = setTimeout(() => {
        takePhotoAuto();
      }, timeCapture);
    }
    return () => {
      if (interval.current != null) {
        clearInterval(interval.current);
      }
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
    console.log('props Camera => ', propCamera);
    console.log('localStream', localStream);
    if (permissionCamera == 'granted') {
      startStreamLocal();
    }
    return () => {
      stopStreamLocal();
    };
  }, [permissionCamera, localStream]);

  const stopStreamLocal = () => {
    if (localStream) {
      console.log('stop stream sdk');
      localStream.release(true);
      setStream(null);
    }
  };

  const startStreamLocal = async () => {
    console.log('start');
    if (!localStream) {
      let stream;
      try {
        stream = await mediaDevices.getUserMedia({
          video: true,
          videoType: 'front',
        });
        setStream(stream);
      } catch (e) {
        console.warn(e);
      }
    }
  };

  const checkCameraPermission = async () => {
    if (Platform.OS == 'android') {
      RNPermissions.request(PERMISSIONS.ANDROID.CAMERA)
        .then((statuses) => {
          if (statuses === RESULTS.GRANTED) {
            setPermissionCamera(statuses);
            interval.current = setTimeout(() => {
              takePhotoAuto();
            }, timeCapture);
          } else {
            RNPermissions.request(PERMISSIONS.ANDROID.CAMERA)
              .then((statuses) => {
                if (statuses === RESULTS.GRANTED) {
                  setPermissionCamera(statuses);
                  interval.current = setTimeout(() => {
                    takePhotoAuto();
                  }, timeCapture);
                } else {
                  setPermissionCamera(statuses);
                  Alert.alert(
                    '',
                    '動作環境チェックに失敗しました。 下記 のボタンをタップして、カメラアクセス を許可してください。',
                    [
                      {
                        text: 'Open Settings',
                        onPress: () => {
                          isAndroid
                            ? Linking.openSettings()
                            : Linking.openURL('app-settings:');
                        },
                      },
                      {
                        text: 'Cancel',
                        onPress: () => {
                          console.log('dismis alert');
                        },
                      },
                    ]
                  );
                }
              })
              .catch((e) => console.log(e.message));
          }
        })
        .catch((e) => console.log(e.message));
    } else {
      RNPermissions.request(PERMISSIONS.IOS.CAMERA)
        .then((result) => {
          switch (result) {
            case RESULTS.UNAVAILABLE:
              console.log(
                'This feature is not available (on this device / in this context)'
              );
              setPermissionCamera(result);
              break;
            case RESULTS.DENIED:
              console.log(
                'The permission has not been requested / is denied but requestable'
              );
              RNPermissions.request(PERMISSIONS.IOS.CAMERA)
                .then((result) => {
                  switch (result) {
                    case RESULTS.UNAVAILABLE:
                      setPermissionCamera(result);
                      break;
                    case RESULTS.DENIED:
                      setPermissionCamera(result);
                      break;
                    case RESULTS.GRANTED:
                      setPermissionCamera(result);
                      interval.current = setTimeout(() => {
                        takePhotoAuto();
                      }, timeCapture);
                      break;
                    case RESULTS.LIMITED:
                      setPermissionCamera(result);
                      break;
                    case RESULTS.BLOCKED:
                      setPermissionCamera(result);
                      break;
                  }
                })
                .catch((e) => console.log(e.message));
              break;
            case RESULTS.GRANTED:
              console.log('The permission is granted');
              setPermissionCamera(result);
              interval.current = setTimeout(() => {
                takePhotoAuto();
              }, timeCapture);
              break;
            case RESULTS.BLOCKED:
              console.log(
                'The permission is denied and not requestable anymore'
              );
              setPermissionCamera(result);
              Alert.alert(
                '',
                '動作環境チェックに失敗しました。 下記 のボタンをタップして、カメラアクセス を許可してください。',
                [
                  {
                    text: 'Open Settings',
                    onPress: () => {
                      isAndroid
                        ? Linking.openSettings()
                        : Linking.openURL('app-settings:');
                    },
                  },
                  {
                    text: 'Cancel',
                    onPress: () => {
                      console.log('dismis alert');
                    },
                  },
                ]
              );
              break;
          }
        })
        .catch((e) => console.log(e.message));
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
    try {
      let response = await axios({
        method: 'GET',
        url: urlSystem,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      });
      console.log('reponse api => ', response.data);
      if (response.data) {
        var formData = new FormData();
        formData.append('key', response.data.fields.key);
        formData.append('Content-Type', 'multipart/form-data');
        formData.append('AWSAccessKeyId', response.data.fields.AWSAccessKeyId);
        formData.append('acl', 'public-read');
        formData.append('policy', response.data.fields.policy);
        formData.append('signature', response.data.fields.signature);
        formData.append('file', {
          uri: uriImage,
          type: 'image/png',
          name: nameFile,
        });
        let responseS3 = await axios({
          method: 'POST',
          url: response.data.url,
          data: formData,
        });
        console.log('reponse api => ', responseS3.data);
      }
    } catch (e) {
      console.log('error => ', e);
      startStreamLocal();
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
      startStreamLocal();
      console.log('error log => ', e);
    }
  };

  /**
   * take photo auto after 1 specified time
   */
  const takePhotoAuto = async () => {
    try {
      if (viewShot.current != null && localStream) {
        viewShot.current.capture().then(
          //callback function to get the result URL of the screenshot
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
      {localStream && appStateVisible == 'active' ? (
        <RTCView
          objectFit={'cover'}
          streamURL={localStream.toURL()}
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
