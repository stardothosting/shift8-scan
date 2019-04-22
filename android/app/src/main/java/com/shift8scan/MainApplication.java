package com.shift8scan;

import android.app.Application;

import com.facebook.react.ReactApplication;
import com.oblador.vectoricons.VectorIconsPackage;
import com.peel.react.TcpSocketsModule;
import com.stonem.sockets.SocketsPackage;
import com.swmansion.reanimated.ReanimatedPackage;
import com.pusherman.networkinfo.RNNetworkInfoPackage;
import com.BV.LinearGradient.LinearGradientPackage;
import com.swmansion.gesturehandler.react.RNGestureHandlerPackage;
import com.example.habibi.mynativemodule.MyNativeModulePackage;
import com.reactnativecommunity.asyncstorage.AsyncStoragePackage;
import com.facebook.react.ReactNativeHost;
import com.facebook.react.ReactPackage;
import com.facebook.react.shell.MainReactPackage;
import com.facebook.soloader.SoLoader;

import java.util.Arrays;
import java.util.List;

public class MainApplication extends Application implements ReactApplication {

  private final ReactNativeHost mReactNativeHost = new ReactNativeHost(this) {
    @Override
    public boolean getUseDeveloperSupport() {
      return BuildConfig.DEBUG;
    }

    @Override
    protected List<ReactPackage> getPackages() {
      return Arrays.<ReactPackage>asList(
          new MainReactPackage(),
            new VectorIconsPackage(),
            new TcpSocketsModule(),
            new SocketsPackage(),
            new ReanimatedPackage(),
            new RNNetworkInfoPackage(),
            new LinearGradientPackage(),
            new RNGestureHandlerPackage(),
            new MyNativeModulePackage(),
            new AsyncStoragePackage()
      );
    }

    @Override
    protected String getJSMainModuleName() {
      return "index";
    }
  };

  @Override
  public ReactNativeHost getReactNativeHost() {
    return mReactNativeHost;
  }

  @Override
  public void onCreate() {
    super.onCreate();
    SoLoader.init(this, /* native exopackage */ false);
  }
}
