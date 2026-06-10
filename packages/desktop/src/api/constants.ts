let _url = import.meta.env.DEV
  ? ''
  : `http://localhost:${__SERVER_PORT__}`;

export const BASE_URL = {
  toString(): string {
    return _url;
  },
};

export function setBaseUrl(url: string) {
  _url = url;
}
