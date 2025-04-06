import axios from 'axios';

class ProxyManager {
  constructor() {
    this.proxyList = [];
    this.currentIndex = 0;
  }

  async fetchProxies() {
    try {
      const response = await axios.get('https://proxylist.geonode.com/api/proxy-list', {
        params: {
          limit: 500,
          page: 1,
          sort_by: 'lastChecked',
          sort_type: 'desc'
        }
      });

      if (response.data && response.data.data) {
        this.proxyList = response.data.data.map(proxy => ({
          ip: proxy.ip,
          port: proxy.port,
          protocol: proxy.protocols[0], // Take first protocol
          country: proxy.country,
          anonymity: proxy.anonymity,
          speed: proxy.speed,
          uptime: proxy.uptime
        }));
      }
    } catch (error) {
      console.error('Error fetching proxies:', error.message);
      throw error;
    }
  }


  getRandomProxy() {
    if (this.proxyList.length === 0) {
      return null;
    }
    const randomIndex = Math.floor(Math.random() * this.proxyList.length);
    return this.proxyList[randomIndex];
  }
}

export default ProxyManager;
