export class SuperHtmlPlayable {

    static download() {
        console.log('[SuperHtmlPlayable] download');
        //@ts-ignore
        if (typeof window !== 'undefined' && window.super_html) {
            //@ts-ignore
            window.super_html.download();
        }
    }

    static game_end() {
        console.log('[SuperHtmlPlayable] game_end');
        //@ts-ignore
        if (typeof window !== 'undefined' && window.super_html) {
            //@ts-ignore
            window.super_html.game_end();
        }
    }

    static set_google_play_url(url: string) {
        console.log('[SuperHtmlPlayable] set_google_play_url:', url);
        //@ts-ignore
        if (typeof window !== 'undefined' && window.super_html) {
            //@ts-ignore
            window.super_html.google_play_url = url;
        }
    }

    static set_app_store_url(url: string) {
        console.log('[SuperHtmlPlayable] set_app_store_url:', url);
        //@ts-ignore
        if (typeof window !== 'undefined' && window.super_html) {
            //@ts-ignore
            window.super_html.appstore_url = url;
        }
    }

    static is_hide_download(): boolean {
        //@ts-ignore
        if (typeof window !== 'undefined' && window.super_html) {
            //@ts-ignore
            return window.super_html.is_hide_download ? window.super_html.is_hide_download() : false;
        }
        return false;
    }

    static is_audio(): boolean {
        //@ts-ignore
        if (typeof window !== 'undefined' && window.super_html) {
            //@ts-ignore
            return window.super_html.is_audio ? window.super_html.is_audio() : true;
        }
        return true;
    }
}
