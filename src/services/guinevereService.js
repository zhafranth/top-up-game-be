const axios = require('axios');
const https = require('https');
const { CookieJar } = require('tough-cookie');
const { wrapper } = require('axios-cookiejar-support');

class GuinevereService {
  constructor() {
    this.baseUrl = 'https://guineverestore.io';
    this.cookieJar = new CookieJar();

    this.client = wrapper(
      axios.create({
        baseURL: this.baseUrl,
        jar: this.cookieJar,
        withCredentials: true,
        httpsAgent: new https.Agent({
          rejectUnauthorized: false,
        }),
        headers: {
          'User-Agent': 'Mozilla/5.0 (Node.js; GuinevereService)',
        },
      })
    );
  }

  async initSession() {
    return this.client.get('/');
  }

  async getXsrfToken() {
    const cookies = await this.cookieJar.getCookies(this.baseUrl);
    const xsrfCookie = cookies.find((c) => c.key === 'XSRF-TOKEN');
    return xsrfCookie ? decodeURIComponent(xsrfCookie.value) : null;
  }

  async checkPlayer(playerId) {
    try {
      const initResponse = await this.initSession();

      if (initResponse.status < 200 || initResponse.status >= 300) {
        console.error('Guinevere API: Init session failed', {
          status: initResponse.status,
        });

        return {
          status: false,
          msg: 'Gagal terhubung ke server',
        };
      }

      const xsrfToken = await this.getXsrfToken();

      if (!xsrfToken) {
        console.error('Guinevere API: XSRF token not found');

        return {
          status: false,
          msg: 'Gagal mendapatkan token',
        };
      }

      console.info('Guinevere API: XSRF token obtained');

      const response = await this.client.post(
        '/topup/check',
        {
          target_player: playerId,
        },
        {
          headers: {
            'X-XSRF-TOKEN': xsrfToken,
            'X-Requested-With': 'XMLHttpRequest',
            'Content-Type': 'application/json',
            Referer: this.baseUrl,
            Origin: this.baseUrl,
            Accept: 'application/json',
          },
        }
      );

      return {
        status: true,
        data: response.data,
      };
    } catch (err) {
      console.error('Guinevere API: Error on checkPlayer', {
        message: err.message,
        status: err.response?.status,
        data: err.response?.data,
      });

      return {
        status: false,
        msg: 'Terjadi kesalahan saat menghubungi server',
        error: err.response?.data || err.message,
      };
    }
  }
}

module.exports = new GuinevereService();