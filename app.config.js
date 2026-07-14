/**
 * Expo yapılandırması (dinamik).
 *
 * `app.json` yerine bu dosya kullanılıyor çünkü tek bir alanın çalışma zamanında
 * çözülmesi gerekiyor: `android.googleServicesFile`.
 *
 * NEDEN:
 * `google-services.json` gizlidir (`.gitignore`) — ama **EAS Build yalnızca git'in
 * izlediği dosyaları yükler**, dolayısıyla build sunucusunda o dosya yoktur. Bu yüzden
 * dosyayı EAS'e "file" tipi ortam değişkeni olarak yüklüyoruz:
 *
 *   npx eas env:create --environment production \
 *     --name GOOGLE_SERVICES_JSON --type file \
 *     --value ./google-services.json --visibility sensitive
 *
 * EAS build sırasında dosyayı proje dışına yazar ve MUTLAK YOLUNU
 * `process.env.GOOGLE_SERVICES_JSON` içine koyar.
 *
 * DİKKAT: Statik `app.json` içinde `"googleServicesFile": "$GOOGLE_SERVICES_JSON"`
 * yazmak ÇALIŞMAZ — JSON'da değişken genişletme yoktur, Expo bu metni birebir dosya
 * yolu sanır (`path.resolve`) ve build "google-services.json is missing" ile düşer.
 * Bu yüzden config'in JS olması ve `process.env` okuması şart.
 */
module.exports = () => ({
  name: 'FrozFit',
  slug: 'frozfit',
  description: 'Kişiselleştirilmiş beslenme ve egzersiz takip uygulaması',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/images/icon.png',
  scheme: 'frozfit',
  userInterfaceStyle: 'automatic',
  owner: 'frozesoftware',

  ios: {
    icon: './assets/images/icon.png',
    bundleIdentifier: 'com.frozfit.app',
    supportsTablet: false,
    usesAppleSignIn: true,
    infoPlist: {
      ITSAppUsesNonExemptEncryption: false,
    },
  },

  android: {
    package: 'com.frozesoftware.frozfit',
    // EAS'te dosya değişkeninden gelen mutlak yol; yerelde projedeki dosya.
    googleServicesFile: process.env.GOOGLE_SERVICES_JSON ?? './google-services.json',
    adaptiveIcon: {
      backgroundColor: '#31C964',
      foregroundImage: './assets/images/android-icon-foreground.png',
      backgroundImage: './assets/images/android-icon-background.png',
      monochromeImage: './assets/images/android-icon-monochrome.png',
    },
    predictiveBackGestureEnabled: false,
    permissions: ['android.permission.CAMERA'],
    // expo-camera RECORD_AUDIO'yu manifest'e kendiliğinden ekler; uygulamada ses/video
    // kaydı YOK. Gereksiz hassas izin Play incelemesinde gerekçe istettiği için
    // manifest birleştirmede tools:node="remove" ile siliyoruz.
    blockedPermissions: ['android.permission.RECORD_AUDIO'],
  },

  web: {
    output: 'static',
    favicon: './assets/images/favicon.png',
  },

  plugins: [
    'expo-router',
    [
      'expo-splash-screen',
      {
        backgroundColor: '#EAF9F0',
        android: {
          image: './assets/images/splash-icon.png',
          imageWidth: 76,
        },
      },
    ],
    [
      'expo-camera',
      {
        cameraPermission:
          'FrozFit, besin barkodlarını taramak ve yemek fotoğrafı çekmek için kameranı kullanır.',
        recordAudioAndroid: false,
      },
    ],
    [
      'expo-image-picker',
      {
        photosPermission:
          'FrozFit, yemek ve tarif fotoğrafı seçmek için fotoğraf kitaplığına erişir.',
      },
    ],
    'expo-notifications',
    'expo-video',
    'expo-apple-authentication',
    [
      '@react-native-google-signin/google-signin',
      {
        iosUrlScheme:
          'com.googleusercontent.apps.256352515683-tsq0279r3d5o554hhq8icanh0s4da0c4',
      },
    ],
    [
      'expo-build-properties',
      {
        ios: {
          useFrameworks: 'static',
        },
      },
    ],
  ],

  experiments: {
    typedRoutes: true,
    reactCompiler: false,
  },

  extra: {
    router: {},
    eas: {
      projectId: '05968d91-ed7c-45a0-95d0-2964885bc306',
    },
  },
});
