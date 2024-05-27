export interface HttpHookProp {
    method: string;
    url: string;
    status: number;
    responseText: string;
}

export function hookXHR(cb: (prop: HttpHookProp) => void) {
    const originalXHROpen = XMLHttpRequest.prototype.open;
    XMLHttpRequest.prototype.open = function (
        method: string,
        url: string,
        async?: boolean,
        user?: string | null,
        password?: string | null,
    ) {
        this.addEventListener('readystatechange', function () {
            if (this.readyState === 4) {
                cb({
                    method,
                    url,
                    status: this.status,
                    responseText: this.responseText,
                });
            }
        });
        return originalXHROpen.apply(this, [method, url, !!async, user, password]);
    };
}

export function hookFetch(cb: (prop: HttpHookProp) => void) {
    const originalFetch = window.fetch;
    window.fetch = function (...args) {
        let url: string;
        let method: string;

        if (typeof args[0] === 'string') {
            url = args[0];
            method = (args[1] && args[1].method) || 'GET';
        } else if (args[0] instanceof Request) {
            url = args[0].url;
            method = args[0].method;
        } else {
            throw new Error('Invalid request info');
        }

        const fetchPromise = originalFetch.apply(this, args);
        fetchPromise
            .then((response) => {
                const responseClone = response.clone();
                responseClone.text().then((text) => {
                    cb({
                        method,
                        url,
                        status: response.status,
                        responseText: text,
                    });
                });
            })
            .catch((error) => {
                console.log('Fetch error:', error);
            });
        return fetchPromise;
    };
}
