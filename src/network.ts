import axios, { AxiosRequestHeaders } from 'axios';
import NetInfo from '@react-native-community/netinfo';
import { Alert } from 'react-native';

let alertPresent = false;

export const checkInternetConnection = async (): Promise<boolean> => {
  const state = await NetInfo.fetch();
  return state.isConnected || false;
};

export const refreshToken = async (
  refresh_token: string,
  urlRefreshToken: string,
  clientId: string,
  clientSecret: string
) => {
  if (await checkInternetConnection()) {
    try {
      // alertPresent = false;
      if (!refresh_token) {
        return false;
      }
      const body = {
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
        client_id: clientId,
        client_secret: clientSecret,
      };
      const headers: AxiosRequestHeaders = {
        'Content-Type': 'application/x-www-form-urlencoded',
      };
      let responseJson = await axios({
        method: 'POST',
        url: urlRefreshToken,
        headers: headers,
        data: body,
      });

      console.log('refreshResult', responseJson);
      return responseJson.data;
    } catch (error) {
      return null;
    }
  } else {
    console.log(
      'No internet => ',
      'サーバーへ接続出来ません。\nインターネット接続を確認してください。'
    );
    //* uncomment if want show alert disconnect internet
    // if (!alertPresent) {
    //   alertPresent = true;
    //   Alert.alert(
    //     '',
    //     'サーバーへ接続出来ません。\nインターネット接続を確認してください。',
    //     [
    //       {
    //         text: 'Ok',
    //         onPress: () => {
    //           alertPresent = false;
    //         },
    //       },
    //     ]
    //   );
    // }
    return null;
  }
};

export const post = async (
  url: string,
  body: Object,
  isNoneAuth = true,
  isLogout: boolean,
  access_token: string,
  refresh_token: string,
  urlRefreshToken: string,
  clientId: string,
  clientSecret: string,
  logOutFunc: () => void
): Promise<any> => {
  if (await checkInternetConnection()) {
    try {
      // alertPresent = false;
      let headers: AxiosRequestHeaders = isNoneAuth
        ? {
            'Content-Type': 'application/json',
            'Accept': '*/*',
            'Authorization': `Bearer ${access_token}`,
          }
        : {
            'Content-Type': 'application/json',
            'Accept': '*/*',
          };

      let responseJson = await axios({
        method: 'POST',
        url: url,
        headers: headers,
        data: body,
      });

      console.log(
        'responseJson => ',
        responseJson.status + '===' + responseJson?.data
      );
      return responseJson;
    } catch (error: any) {
      console.log('error post => ', error?.response);
      if (
        error?.response?.status === 401 &&
        error?.response?.data?.message !=
          'あなたのアカウントは他の端末でログインされました'
      ) {
        let refreshResult = await refreshToken(
          refresh_token,
          urlRefreshToken,
          clientId,
          clientSecret
        );
        if (refreshResult) {
          return post(
            url,
            body,
            isNoneAuth,
            isLogout,
            access_token,
            refresh_token,
            urlRefreshToken,
            clientId,
            clientSecret,
            logOutFunc
          );
        } else {
          if (!alertPresent) {
            alertPresent = true;
            Alert.alert(
              '',
              'アクセストークンの有効期限が切れました。\n再度ログインして下さい。',
              [
                {
                  text: 'Ok',
                  onPress: () => {
                    alertPresent = false;
                    logOutFunc();
                  },
                },
              ]
            );
          }
        }
      } else if (
        error?.response?.status === 401 &&
        error?.response?.data?.message ==
          'あなたのアカウントは他の端末でログインされました'
      ) {
        if (!alertPresent) {
          alertPresent = true;
          Alert.alert('', 'あなたのアカウントは他の端末でログインされました', [
            {
              text: 'Ok',
              onPress: () => {
                alertPresent = false;
                logOutFunc();
              },
            },
          ]);
        }
      }
    }
  } else {
    console.log(
      'No internet => ',
      'サーバーへ接続出来ません。\nインターネット接続を確認してください。'
    );
    //* uncomment if want show alert disconnect internet
    // if (!alertPresent) {
    //   alertPresent = true;
    //   Alert.alert(
    //     '',
    //     'サーバーへ接続出来ません。\nインターネット接続を確認してください。',
    //     [
    //       {
    //         text: 'Ok',
    //         onPress: () => {
    //           alertPresent = false;
    //         },
    //       },
    //     ]
    //   );
    // }
  }
};

export const get = async (
  url: string,
  isNoneAuth = true,
  access_token: string,
  refresh_token: string,
  urlRefreshToken: string,
  clientId: string,
  clientSecret: string,
  logOutFunc: () => void
): Promise<any> => {
  if (await checkInternetConnection()) {
    try {
      // alertPresent = false;
      let headers: AxiosRequestHeaders = isNoneAuth
        ? {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Authorization': `Bearer ${access_token}`,
          }
        : {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          };
      let responseJson = await axios({
        method: 'GET',
        url: url,
        headers: headers,
      });

      console.log(
        'responseJson => ',
        responseJson.status + '===' + responseJson?.data
      );

      return responseJson;
    } catch (error: any) {
      console.log('error get => ', error?.response);
      if (
        error?.response?.status === 401 &&
        error?.response?.data?.message !=
          'あなたのアカウントは他の端末でログインされました'
      ) {
        let refreshResult = await refreshToken(
          refresh_token,
          urlRefreshToken,
          clientId,
          clientSecret
        );
        if (refreshResult) {
          return get(
            url,
            isNoneAuth,
            refreshResult.access_token,
            refreshResult.refresh_token,
            urlRefreshToken,
            clientId,
            clientSecret,
            logOutFunc
          );
        } else {
          if (!alertPresent) {
            alertPresent = true;
            Alert.alert(
              '',
              'アクセストークンの有効期限が切れました。\n再度ログインして下さい。',
              [
                {
                  text: 'Ok',
                  onPress: () => {
                    alertPresent = false;
                    logOutFunc();
                  },
                },
              ]
            );
          }
        }
      } else if (
        error?.response?.status === 401 &&
        error?.response?.data?.message ==
          'あなたのアカウントは他の端末でログインされました'
      ) {
        if (!alertPresent) {
          alertPresent = true;
          Alert.alert('', 'あなたのアカウントは他の端末でログインされました', [
            {
              text: 'Ok',
              onPress: () => {
                alertPresent = false;
                logOutFunc();
              },
            },
          ]);
        }
      }
    }
  } else {
    console.log(
      'No internet => ',
      'サーバーへ接続出来ません。\nインターネット接続を確認してください。'
    );
    //* uncomment if want show alert disconnect internet
    // if (!alertPresent) {
    //   alertPresent = true;
    //   Alert.alert(
    //     '',
    //     'サーバーへ接続出来ません。\nインターネット接続を確認してください。',
    //     [
    //       {
    //         text: 'Ok',
    //         onPress: () => {
    //           alertPresent = false;
    //         },
    //       },
    //     ]
    //   );
    // }
  }
};

export const postForm = async (
  url: string,
  data: FormData,
  access_token: string,
  refresh_token: string,
  urlRefreshToken: string,
  clientId: string,
  clientSecret: string,
  isNoneAuth = true,
  logOutFunc: () => void
): Promise<any> => {
  if (await checkInternetConnection()) {
    try {
      // alertPresent = false;

      let responseJson = await axios({
        method: 'POST',
        url: url,
        headers: isNoneAuth
          ? {
              'Content-Type': 'multipart/form-data',
              'Accept': '*/*',
              'Authorization': `Bearer ${access_token}`,
            }
          : {
              'Content-Type': 'multipart/form-data',
              'Accept': '*/*',
            },
        data: data,
      });

      console.log(
        'responseJson => ',
        responseJson.status + '===' + responseJson?.data
      );
      return responseJson;
    } catch (error: any) {
      console.log(
        'error post form= >',
        JSON.stringify(error.response) + '---' + error.response.status
      );
      if (
        error?.response?.status === 401 &&
        error?.response?.data?.message !=
          'あなたのアカウントは他の端末でログインされました'
      ) {
        let refreshResult = await refreshToken(
          refresh_token,
          urlRefreshToken,
          clientId,
          clientSecret
        );

        if (refreshResult) {
          return postForm(
            url,
            data,
            refreshResult.access_token,
            refreshResult.refresh_token,
            urlRefreshToken,
            clientId,
            clientSecret,
            isNoneAuth,
            logOutFunc
          );
        } else {
          if (!alertPresent) {
            alertPresent = true;
            Alert.alert(
              '',
              'アクセストークンの有効期限が切れました。\n再度ログインして下さい。',
              [
                {
                  text: 'Ok',
                  onPress: () => {
                    alertPresent = false;
                    logOutFunc();
                  },
                },
              ]
            );
          }
        }
      } else if (
        error?.response?.status === 401 &&
        error?.response?.data?.message ==
          'あなたのアカウントは他の端末でログインされました'
      ) {
        if (!alertPresent) {
          alertPresent = true;
          Alert.alert('', 'あなたのアカウントは他の端末でログインされました', [
            {
              text: 'Ok',
              onPress: () => {
                alertPresent = false;
                logOutFunc();
              },
            },
          ]);
        }
      }
    }
  } else {
    console.log(
      'No internet => ',
      'サーバーへ接続出来ません。\nインターネット接続を確認してください。'
    );
    //* uncomment if want show alert disconnect internet
    // if (!alertPresent) {
    //   alertPresent = true;
    //   Alert.alert(
    //     '',
    //     'サーバーへ接続出来ません。\nインターネット接続を確認してください。',
    //     [
    //       {
    //         text: 'Ok',
    //         onPress: () => {
    //           alertPresent = false;
    //         },
    //       },
    //     ]
    //   );
    // }
  }
};
