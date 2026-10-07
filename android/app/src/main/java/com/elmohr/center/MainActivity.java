package com.elmohr.center;
import android.app.Activity;
import android.os.Bundle;
import android.webkit.*;
import android.content.Intent;

public class MainActivity extends Activity {
    private static final String APP_URL="https://elmohr-center-3a6ecv3sx-el-mohr-center.vercel.app";
    private static final int FILE_CHOOSER=1001;
    private ValueCallback<android.net.Uri[]> fileCallback;
    public void onCreate(Bundle b){
        super.onCreate(b);
        WebView w=new WebView(this); setContentView(w);
        w.getSettings().setJavaScriptEnabled(true);
        w.getSettings().setDomStorageEnabled(true);
        w.getSettings().setDatabaseEnabled(true);
        CookieManager.getInstance().setAcceptCookie(true);
        CookieManager.getInstance().setAcceptThirdPartyCookies(w,true);
        w.setWebViewClient(new WebViewClient());
        w.setWebChromeClient(new WebChromeClient(){
            public boolean onShowFileChooser(WebView v,ValueCallback<android.net.Uri[]> cb,FileChooserParams p){
                if(fileCallback!=null)fileCallback.onReceiveValue(null); fileCallback=cb;
                try{startActivityForResult(p.createIntent(),FILE_CHOOSER);return true;}catch(Exception e){fileCallback=null;return false;}
            }
        });
        w.loadUrl(APP_URL);
    }
    protected void onActivityResult(int r,int c,Intent d){
        if(r==FILE_CHOOSER&&fileCallback!=null){fileCallback.onReceiveValue(WebChromeClient.FileChooserParams.parseResult(c,d));fileCallback=null;}
        super.onActivityResult(r,c,d);
    }
}
