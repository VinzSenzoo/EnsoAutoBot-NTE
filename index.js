import figlet from 'figlet';
import fs from 'fs/promises';
import { createInterface } from 'readline/promises';
import axios from 'axios';
import { HttpsProxyAgent } from 'https-proxy-agent';
import { ethers } from 'ethers';
import randomUseragent from 'random-useragent';
import ora from 'ora';
import chalk from 'chalk';
import schedule from 'node-schedule';
import moment from 'moment-timezone';

function getTimestamp() {
  return moment().tz('Asia/Jakarta').format('D/M/YYYY, HH:mm:ss');
}

function displayBanner() {
  const width = process.stdout.columns || 80;
  const banner = figlet.textSync('\n NT EXHAUST', { font: "ANSI Shadow", horizontalLayout: 'Speed' });
  banner.split('\n').forEach(line => {
    console.log(chalk.blue(line.padStart(line.length + Math.floor((width - line.length) / 2))));
  });
  console.log(chalk.green(' '.repeat((width - 28) / 2) + 'ENSO AUTO BOT !!'));
}

const rl = createInterface({
  input: process.stdin,
  output: process.stdout,
});

async function promptUser(question) {
  const answer = await rl.question(chalk.white(question));
  return answer.trim();
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function createProgressBar(current, total) {
  const barLength = 30;
  const filled = Math.round((current / total) * barLength);
  return `[${'█'.repeat(filled)}${' '.repeat(barLength - filled)} ${current}/${total}]`;
}

function displayHeader(text, color) {
  console.log(color(text));
}

function isValidPrivateKey(pk) {
  return /^0x[a-fA-F0-9]{64}$|^[a-fA-F0-9]{64}$/.test(pk);
}

function isValidUUID(uuid) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(uuid);
}

async function getPublicIP(proxy = null) {
  const spinner = ora({ text: chalk.cyan(' ┊ → Mendapatkan IP...'), prefixText: '', spinner: 'bouncingBar' }).start();
  try {
    let config = {};
    if (proxy) {
      config.httpAgent = new HttpsProxyAgent(proxy);
      config.httpsAgent = new HttpsProxyAgent(proxy);
    }
    const response = await axios.get('https://api.ipify.org?format=json', config);
    spinner.succeed(chalk.green(` ┊ ✓ IP: ${response.data.ip}${proxy ? ` (Proxy: ${proxy})` : ''}`));
    await sleep(100);
    return response.data.ip;
  } catch (err) {
    spinner.fail(chalk.red(' ┊ ✗ Gagal mendapatkan IP'));
    return 'Unknown';
  }
}

async function getUserInfo(zealyUserId, proxy = null, retryCount = 0) {
  const maxRetries = 3;
  const spinner = ora({ text: chalk.cyan(` ┊ → Mengambil info user (Zealy ID: ${zealyUserId.slice(0, 8)}...)${retryCount > 0 ? ` (Retry ke-${retryCount}/${maxRetries})` : ''}...`), prefixText: '', spinner: 'bouncingBar' }).start();
  try {
    let config = {
      headers: {
        'accept': 'application/json, text/plain, */*',
        'accept-language': 'en-US,en;q=0.7',
        'content-type': 'application/json',
        'priority': 'u=1, i',
        'sec-ch-ua': randomUseragent.getRandom(),
        'sec-ch-ua-mobile': '?0',
        'sec-ch-ua-platform': '"Windows"',
        'sec-fetch-dest': 'empty',
        'sec-fetch-mode': 'cors',
        'sec-fetch-site': 'same-origin',
        'sec-gpc': '1',
        'Referer': 'https://speedrun.enso.build/campaign',
        'Referrer-Policy': 'strict-origin-when-cross-origin',
      },
    };
    if (proxy) {
      config.httpAgent = new HttpsProxyAgent(proxy);
      config.httpsAgent = new HttpsProxyAgent(proxy);
    }
    const response = await axios.get(`https://speedrun.enso.build/api/zealy/user/${zealyUserId}`, config);
    spinner.succeed(chalk.green(` ┊ ✓ Info user diterima: ${response.data.name}`));
    await sleep(100);
    return {
      name: response.data.name || 'Unknown',
      connectedWallet: response.data.connectedWallet || 'Unknown',
      xp: response.data.xp || 0,
    };
  } catch (err) {
    const errorMsg = err.response ? `HTTP ${err.response.status}` : err.message;
    if (retryCount < maxRetries - 1) {
      spinner.text = chalk.cyan(` ┊ → Mengambil info user (Zealy ID: ${zealyUserId.slice(0, 8)}...) (Retry ke-${retryCount + 1}/${maxRetries})...`);
      await sleep(5000);
      return getUserInfo(zealyUserId, proxy, retryCount + 1);
    }
    spinner.fail(chalk.red(` ┊ ✗ Gagal mengambil info user: ${errorMsg}`));
    return {
      name: 'Unknown',
      connectedWallet: 'Unknown',
      xp: 0,
    };
  }
}

function generateProjectSlug() {
  const words = [
    'lucky', 'star', 'nova', 'cool', 'hoki', 'prime', 'sky', 'neo', 'blaze', 'tech',
    'moon', 'pulse', 'vibe', 'spark', 'glow', 'ace', 'zen', 'flash', 'bolt', 'wave',
    'fire', 'storm', 'dream', 'edge', 'flow', 'peak', 'rush', 'light', 'force', 'dash',
    'glint', 'surge', 'breeze', 'shade', 'frost', 'flame', 'core', 'drift', 'bloom', 'quest',
    'wind', 'tide', 'dawn', 'dusk', 'mist', 'cloud', 'ridge', 'vale', 'forge', 'link',
    'beam', 'spire', 'gleam', 'twist', 'loop', 'arc', 'vault', 'crux', 'nexus', 'orbit',
    'zest', 'chill', 'haze', 'glory', 'swift', 'bold', 'vivid', 'pure', 'clear', 'bright',
    'epic', 'grand', 'royal', 'noble', 'wild', 'free', 'soar', 'rise', 'shine', 'grow',
    'vapor', 'trail', 'echo', 'pulse', 'swing', 'shift', 'turn', 'blend', 'forge', 'craft',
    'seek', 'hunt', 'roam', 'drift', 'sail', 'climb', 'reach', 'touch', 'spark', 'ignite'
  ];
  const word1 = words[Math.floor(Math.random() * words.length)];
  const word2 = words[Math.floor(Math.random() * words.length)];
  const number = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `${word1}-${word2}-${number}.widget`;
}

async function createDefiDex(projectSlug, address, zealyUserId, proxy = null, retryCount = 0) {
  const maxRetries = 3;
  const spinner = ora({ text: chalk.cyan(` ┊ → Membuat DeFiDex: ${projectSlug}${retryCount > 0 ? ` (Retry ke-${retryCount}/${maxRetries})` : ''}...`), prefixText: '', spinner: 'bouncingBar' }).start();
  try {
    let config = {
      headers: {
        'accept': 'application/json, text/plain, */*',
        'accept-language': 'en-US,en;q=0.7',
        'content-type': 'application/json',
        'priority': 'u=1, i',
        'sec-ch-ua': randomUseragent.getRandom(),
        'sec-ch-ua-mobile': '?0',
        'sec-ch-ua-platform': '"Windows"',
        'sec-fetch-dest': 'empty',
        'sec-fetch-mode': 'cors',
        'sec-fetch-site': 'same-origin',
        'sec-gpc': '1',
        'Referer': 'https://speedrun.enso.build/create/de-fi/shortcuts-widget',
        'Referrer-Policy': 'strict-origin-when-cross-origin',
      },
    };
    if (proxy) {
      config.httpAgent = new HttpsProxyAgent(proxy);
      config.httpsAgent = new HttpsProxyAgent(proxy);
    }
    const payload = {
      userId: address,
      projectSlug,
      zealyUserId,
      projectType: 'shortcuts-widget',
    };
    const response = await axios.post('https://speedrun.enso.build/api/track-project-creation', payload, config);
    if (response.data.success) {
      spinner.succeed(chalk.green(` ┊ ✓ DeFiDex dibuat: ${projectSlug}`));
      await sleep(100);
      return true;
    } else if (response.data.code === 3) {
      spinner.stop();
      console.log(chalk.yellow(` ┊ ⚠️ Batas harian DeFiDex tercapai: ${response.data.message}`));
      await sleep(100);
      return false;
    } else {
      throw new Error(response.data.message || 'Gagal membuat DeFiDex');
    }
  } catch (err) {
    const errorMsg = err.response ? `HTTP ${err.response.status}: ${JSON.stringify(err.response.data || {})}` : err.message;
    if (err.response && err.response.data && err.response.data.code === 3) {
      spinner.stop();
      console.log(chalk.yellow(` ┊ ⚠️ Batas harian DeFiDex tercapai: ${err.response.data.message}`));
      await sleep(100);
      return false;
    }
    if (retryCount < maxRetries - 1) {
      spinner.text = chalk.cyan(` ┊ → Membuat DeFiDex: ${projectSlug} (Retry ke-${retryCount + 1}/${maxRetries})...`);
      await sleep(5000);
      return createDefiDex(projectSlug, address, zealyUserId, proxy, retryCount + 1);
    }
    if (err.response && err.response.data) {
      console.log(chalk.gray(` ┊ ℹ️ Detail error server: ${JSON.stringify(err.response.data)}`));
    }
    spinner.fail(chalk.red(` ┊ ✗ Gagal membuat DeFiDex: ${errorMsg}`));
    await sleep(100);
    return false;
  }
}

async function getCampaigns(zealyUserId, proxy = null, retryCount = 0) {
  const maxRetries = 3;
  const limit = 10;
  let allCampaigns = [];
  let page = 1;
  const spinner = ora({ text: chalk.cyan(` ┊ → Mengambil daftar campaign (Halaman ${page})${retryCount > 0 ? ` (Retry ke-${retryCount}/${maxRetries})` : ''}...`), prefixText: '', spinner: 'bouncingBar' }).start();
  try {
    let config = {
      headers: {
        'accept': 'application/json, text/plain, */*',
        'accept-language': 'en-US,en;q=0.7',
        'content-type': 'application/json',
        'priority': 'u=1, i',
        'sec-ch-ua': randomUseragent.getRandom(),
        'sec-ch-ua-mobile': '?0',
        'sec-ch-ua-platform': '"Windows"',
        'sec-fetch-dest': 'empty',
        'sec-fetch-mode': 'cors',
        'sec-fetch-site': 'same-origin',
        'sec-gpc': '1',
        'Referer': 'https://speedrun.enso.build/campaign',
        'Referrer-Policy': 'strict-origin-when-cross-origin',
      },
    };
    if (proxy) {
      config.httpAgent = new HttpsProxyAgent(proxy);
      config.httpsAgent = new HttpsProxyAgent(proxy);
    }

    while (true) {
      const response = await axios.get(`https://speedrun.enso.build/api/get-campaigns?page=${page}&limit=${limit}&zealyUserId=${zealyUserId}`, config);
      const { campaigns, total } = response.data;
      allCampaigns = allCampaigns.concat(campaigns);
      spinner.text = chalk.cyan(` ┊ → Mengambil daftar campaign (Halaman ${page}/${Math.ceil(total / limit)})...`);
      if (page * limit >= total) break;
      page++;
      await sleep(2000);
    }

    spinner.succeed(chalk.green(` ┊ ✓ ${allCampaigns.length} campaign ditemukan`));
    await sleep(100);
    return allCampaigns;
  } catch (err) {
    const errorMsg = err.response ? `HTTP ${err.response.status}` : err.message;
    if (retryCount < maxRetries - 1) {
      spinner.text = chalk.cyan(` ┊ → Mengambil daftar campaign (Retry ke-${retryCount + 1}/${maxRetries})...`);
      await sleep(5000);
      return getCampaigns(zealyUserId, proxy, retryCount + 1);
    }
    spinner.fail(chalk.red(` ┊ ✗ Gagal mengambil daftar campaign: ${errorMsg}`));
    await sleep(100);
    return [];
  } finally {
    spinner.stop();
  }
}

async function completeCampaign(address, campaignId, campaignName, zealyUserId, proxy = null, retryCount = 0, spinner = null) {
  const maxRetries = 3;
  try {
    let config = {
      headers: {
        'accept': 'application/json, text/plain, */*',
        'accept-language': 'en-US,en;q=0.7',
        'content-type': 'application/json',
        'priority': 'u=1, i',
        'sec-ch-ua': randomUseragent.getRandom(),
        'sec-ch-ua-mobile': '?0',
        'sec-ch-ua-platform': '"Windows"',
        'sec-fetch-dest': 'empty',
        'sec-fetch-mode': 'cors',
        'sec-fetch-site': 'same-origin',
        'sec-gpc': '1',
        'Referer': 'https://speedrun.enso.build/campaign',
        'Referrer-Policy': 'strict-origin-when-cross-origin',
      },
    };
    if (proxy) {
      config.httpAgent = new HttpsProxyAgent(proxy);
      config.httpsAgent = new HttpsProxyAgent(proxy);
    }
    const payload = {
      userId: address,
      campaignId,
      zealyUserId,
    };
    const response = await axios.post('https://speedrun.enso.build/api/track-campaign', payload, config);
    if (response.data.message === 'Points awarded and visit recorded') {
      return true;
    } else {
      throw new Error(response.data.message || 'Gagal menyelesaikan campaign');
    }
  } catch (err) {
    const errorMsg = err.response ? `HTTP ${err.response.status}: ${JSON.stringify(err.response.data || {})}` : err.message;
    if (retryCount < maxRetries - 1) {
      await sleep(5000);
      return completeCampaign(address, campaignId, campaignName, zealyUserId, proxy, retryCount + 1, spinner);
    }
    if (spinner) {
      spinner.stop();
      console.log(chalk.red(` ┊ ✗ Gagal menyelesaikan campaign ${campaignName} (ID: ${campaignId}): ${errorMsg}`));
      spinner.start();
    }
    return false;
  }
}

async function getProtocols(zealyUserId, proxy = null, retryCount = 0) {
  const maxRetries = 3;
  const limit = 10;
  let allProtocols = [];
  const totalPages = 12;
  const spinner = ora({ text: chalk.cyan(` ┊ → Mengambil daftar protocols (Halaman 1/${totalPages})...`), prefixText: '', spinner: 'bouncingBar' }).start();
  try {
    let config = {
      headers: {
        'accept': 'application/json, text/plain, */*',
        'accept-language': 'en-US,en;q=0.7',
        'content-type': 'application/json',
        'priority': 'u=1, i',
        'sec-ch-ua': randomUseragent.getRandom(),
        'sec-ch-ua-mobile': '?0',
        'sec-ch-ua-platform': '"Windows"',
        'sec-fetch-dest': 'empty',
        'sec-fetch-mode': 'cors',
        'sec-fetch-site': 'same-origin',
        'sec-gpc': '1',
        'Referer': 'https://speedrun.enso.build/campaign',
        'Referrer-Policy': 'strict-origin-when-cross-origin',
      },
    };
    if (proxy) {
      config.httpAgent = new HttpsProxyAgent(proxy);
      config.httpsAgent = new HttpsProxyAgent(proxy);
    }

    for (let page = 1; page <= totalPages; page++) {
      const response = await axios.get(`https://speedrun.enso.build/api/get-protocols?page=${page}&limit=${limit}&zealyUserId=${zealyUserId}`, config);
      const { protocols } = response.data;
      allProtocols = allProtocols.concat(protocols);
      spinner.text = chalk.cyan(` ┊ → Mengambil daftar protocols (Halaman ${page}/${totalPages})...`);
      await sleep(2000);
    }

    spinner.succeed(chalk.green(` ┊ ✓ ${allProtocols.length} protocols ditemukan`));
    await sleep(100);
    return allProtocols;
  } catch (err) {
    const errorMsg = err.response ? `HTTP ${err.response.status}` : err.message;
    if (retryCount < maxRetries - 1) {
      spinner.text = chalk.cyan(` ┊ → Mengambil daftar protocols (Retry ke-${retryCount + 1}/${maxRetries})...`);
      await sleep(5000);
      return getProtocols(zealyUserId, proxy, retryCount + 1);
    }
    spinner.fail(chalk.red(` ┊ ✗ Gagal mengambil daftar protocols: ${errorMsg}`));
    await sleep(100);
    return [];
  } finally {
    spinner.stop();
  }
}

async function completeProtocol(address, protocolId, protocolName, zealyUserId, proxy = null, retryCount = 0, spinner = null) {
  const maxRetries = 3;
  try {
    let config = {
      headers: {
        'accept': 'application/json, text/plain, */*',
        'accept-language': 'en-US,en;q=0.7',
        'content-type': 'application/json',
        'priority': 'u=1, i',
        'sec-ch-ua': randomUseragent.getRandom(),
        'sec-ch-ua-mobile': '?0',
        'sec-ch-ua-platform': '"Windows"',
        'sec-fetch-dest': 'empty',
        'sec-fetch-mode': 'cors',
        'sec-fetch-site': 'same-origin',
        'sec-gpc': '1',
        'Referer': 'https://speedrun.enso.build/campaign',
        'Referrer-Policy': 'strict-origin-when-cross-origin',
      },
    };
    if (proxy) {
      config.httpAgent = new HttpsProxyAgent(proxy);
      config.httpsAgent = new HttpsProxyAgent(proxy);
    }
    const payload = {
      userId: address,
      protocolId,
      zealyUserId,
    };
    const response = await axios.post('https://speedrun.enso.build/api/track-protocol', payload, config);
    if (response.data.message === 'Points awarded and visit recorded') {
      return true;
    } else {
      throw new Error(response.data.message || 'Gagal menyelesaikan protocol');
    }
  } catch (err) {
    const errorMsg = err.response ? `HTTP ${err.response.status}: ${JSON.stringify(err.response.data || {})}` : err.message;
    if (retryCount < maxRetries - 1) {
      await sleep(5000);
      return completeProtocol(address, protocolId, protocolName, zealyUserId, proxy, retryCount + 1, spinner);
    }
    if (spinner) {
      spinner.stop();
      console.log(chalk.red(` ┊ ✗ Gagal menyelesaikan protocol ${protocolName} (ID: ${protocolId}): ${errorMsg}`));
      spinner.start();
    }
    return false;
  }
}

function displayCountdown(nextRun) {
  const interval = setInterval(() => {
    const now = moment().tz('Asia/Jakarta');
    const timeLeft = nextRun.diff(now);
    if (timeLeft <= 0) {
      clearInterval(interval);
      console.log(chalk.cyan(' ┊ ⏰ Waktu proses berikutnya telah tiba!'));
      return;
    }
    const duration = moment.duration(timeLeft);
    const hours = Math.floor(duration.asHours());
    const minutes = duration.minutes();
    const seconds = duration.seconds();
    process.stdout.write(chalk.cyan(` ┊ ⏳ Menunggu proses berikutnya: ${hours}:${minutes}:${seconds}\r`));
  }, 1000);
}

function calculateNextRun() {
  const now = moment().tz('Asia/Jakarta');
  const nextRun = moment().tz('Asia/Jakarta').set({ hour: 7, minute: 0, second: 0, millisecond: 0 });

  if (now.isSameOrAfter(nextRun)) {
    nextRun.add(1, 'day');
  }

  console.log(chalk.gray(` ┊ ℹ️ Next run calculated: ${nextRun.format('D/M/YYYY')}`));
  return nextRun;
}

async function processAccounts(accounts, accountProxies, noType) {
  const DEFIDEX_LIMIT = 5;
  let successCount = 0;
  let failCount = 0;
  let successfulDexes = 0;
  let failedDexes = 0;
  let successfulCampaigns = 0;
  let failedCampaigns = 0;
  let successfulProtocols = 0;
  let failedProtocols = 0;

  for (let i = 0; i < accounts.length; i++) {
    const account = accounts[i];
    const proxy = accountProxies[i];
    const shortAddress = `${account.address.slice(0, 8)}...${account.address.slice(-6)}`;

    displayHeader(`═════[ Akun ${i + 1}/${accounts.length} @ ${getTimestamp()} ]═════`, chalk.blue);

    const ip = await getPublicIP(proxy);
    const userInfo = await getUserInfo(account.zealyUserId, proxy); 

    let accountSuccess = true;

    try {
      console.log(chalk.magentaBright(' ┊ ┌── Proses DeFiDex ──'));
      for (let j = 0; j < DEFIDEX_LIMIT; j++) {
        console.log(chalk.yellow(` ┊ ├─ DeFiDex ${createProgressBar(j + 1, DEFIDEX_LIMIT)} ──`));
        const projectSlug = generateProjectSlug();
        console.log(chalk.white(` ┊ │ Project Slug: ${projectSlug}`));
        const success = await createDefiDex(projectSlug, account.address, account.zealyUserId, proxy);
        if (success) {
          successfulDexes++;
        } else {
          failedDexes++;
          if (!success && j === 0) break;
        }
        await sleep(1000);
      }
      console.log(chalk.yellow(' ┊ └──'));

      console.log(chalk.magentaBright(' ┊ ┌── Proses Completing Campaigns ──'));
      const campaigns = await getCampaigns(account.zealyUserId, proxy);
      if (campaigns.length === 0) {
        console.log(chalk.yellow(' ┊ │ Tidak dapat mengambil daftar campaign karena error server'));
        console.log(chalk.yellow(' ┊ └──'));
      } else {
        const pendingCampaigns = campaigns.filter(c => !c.visited && !c.pointsAwarded);
        if (pendingCampaigns.length === 0) {
          console.log(chalk.green(' ┊ │ Semua campaign sudah selesai!'));
          console.log(chalk.yellow(' ┊ └──'));
        } else {
          console.log(chalk.white(` ┊ │ ${pendingCampaigns.length} campaign belum dikerjakan ditemukan`));
          const spinner = ora({ text: chalk.cyan(` ┊ │ Memproses campaign: 0/${pendingCampaigns.length}...`), prefixText: '', spinner: 'bouncingBar' }).start();
          for (let j = 0; j < pendingCampaigns.length; j++) {
            const campaign = pendingCampaigns[j];
            const success = await completeCampaign(account.address, campaign.id, campaign.name, account.zealyUserId, proxy, 0, spinner);
            if (success) {
              successfulCampaigns++;
            } else {
              failedCampaigns++;
            }
            spinner.text = chalk.cyan(` ┊ │ Memproses campaign: ${j + 1}/${pendingCampaigns.length}...`);
            await sleep(1000);
          }
          spinner.succeed(chalk.green(` ┊ ✓ ${successfulCampaigns} dari ${pendingCampaigns.length} campaign selesai`));
          console.log(chalk.yellow(' ┊ └──'));
        }
      }

      console.log(chalk.magentaBright(' ┊ ┌── Proses Completing Protocols ──'));
      const protocols = await getProtocols(account.zealyUserId, proxy);
      if (protocols.length === 0) {
        console.log(chalk.yellow(' ┊ │ Tidak dapat mengambil daftar protocols karena error server'));
        console.log(chalk.yellow(' ┊ └──'));
      } else {
        const pendingProtocols = protocols.filter(p => !p.visited && !p.pointsAwarded);
        if (pendingProtocols.length === 0) {
          console.log(chalk.green(' ┊ │ Semua protocols sudah selesai!'));
          console.log(chalk.yellow(' ┊ └──'));
        } else {
          console.log(chalk.white(` ┊ │ ${pendingProtocols.length} protocols belum dikerjakan ditemukan`));
          const spinner = ora({ text: chalk.cyan(` ┊ │ Memproses protocols: 0/${pendingProtocols.length}...`), prefixText: '', spinner: 'bouncingBar' }).start();
          for (let j = 0; j < pendingProtocols.length; j++) {
            const protocol = pendingProtocols[j];
            const success = await completeProtocol(account.address, protocol.id, protocol.name, account.zealyUserId, proxy, 0, spinner);
            if (success) {
              successfulProtocols++;
            } else {
              failedProtocols++;
            }
            spinner.text = chalk.cyan(` ┊ │ Memproses protocols: ${j + 1}/${pendingProtocols.length}...`);
            await sleep(1000);
          }
          spinner.succeed(chalk.green(` ┊ ✓ ${successfulProtocols} dari ${pendingProtocols.length} protocols selesai`));
          console.log(chalk.yellow(' ┊ └──'));
        }
      }

      const userInfo = await getUserInfo(account.zealyUserId, proxy);
      console.log(chalk.yellow(' ┊ ┌── Ringkasan User ──'));
      console.log(chalk.white(` ┊ │ Username: ${userInfo.name}`));
      console.log(chalk.white(` ┊ │ User Address: ${userInfo.connectedWallet}`));
      console.log(chalk.white(` ┊ │ Total XP: ${userInfo.xp}`));
      console.log(chalk.yellow(' ┊ └──'));
    } catch (err) {
      console.log(chalk.red(` ┊ ✗ Error: ${err.message}`));
      accountSuccess = false;
      failCount++;
    }

    if (accountSuccess) {
      successCount++;
    }
    console.log(chalk.gray(' ┊ ══════════════════════════════════════'));
  }

  displayHeader(`═════[ Selesai @ ${getTimestamp()} ]═════`, chalk.blue);
  console.log(chalk.gray(` ┊ ✅ ${successCount} akun sukses, ❌ ${failCount} akun gagal`));
  if (failedCampaigns > 0) {
    console.log(chalk.yellow(` ┊ ⚠️ ${failedCampaigns} campaign gagal`));
  }
  if (failedProtocols > 0) {
    console.log(chalk.yellow(` ┊ ⚠️ ${failedProtocols} protocols gagal`));
  }
}

async function main() {
  console.log('\n');
  displayBanner();
  const noType = process.argv.includes('--no-type');
  let accounts = [];
  try {
    const accountsData = await fs.readFile('accounts.txt', 'utf8');
    const lines = accountsData.split('\n').filter(line => line.trim() !== '');
    for (let i = 0; i < lines.length; i++) {
      const [privateKey, zealyUserId] = lines[i].split(',').map(item => item.trim());
      if (!privateKey || !zealyUserId) {
        console.log(chalk.red(`✗ Baris ${i + 1} di accounts.txt tidak lengkap: Harus berisi <privateKey>,<zealyUserId>`));
        rl.close();
        return;
      }
      if (!isValidPrivateKey(privateKey)) {
        console.log(chalk.red(`✗ privateKey pada baris ${i + 1} tidak valid: ${privateKey}. Harus berupa 64 karakter heksadesimal.`));
        rl.close();
        return;
      }
      if (!isValidUUID(zealyUserId)) {
        console.log(chalk.red(`✗ zealyUserId pada baris ${i + 1} tidak valid: ${zealyUserId}. Harus berupa UUID.`));
        rl.close();
        return;
      }
      const wallet = new ethers.Wallet(privateKey.startsWith('0x') ? privateKey : `0x${privateKey}`);
      accounts.push({
        address: wallet.address,
        privateKey,
        zealyUserId,
      });
    }
  } catch (err) {
    console.log(chalk.red('✗ File accounts.txt tidak ditemukan atau kosong! Pastikan berisi <privateKey>,<zealyUserId> per baris.'));
    rl.close();
    return;
  }

  if (accounts.length === 0) {
    console.log(chalk.red('✗ Tidak ada akun valid di accounts.txt!'));
    rl.close();
    return;
  }

  let useProxy;
  while (true) {
    const input = await promptUser('Gunakan proxy? (y/n) ');
    if (input.toLowerCase() === 'y' || input.toLowerCase() === 'n') {
      useProxy = input.toLowerCase() === 'y';
      break;
    } else {
      console.log(chalk.red('✗ Masukkan "y" atau "n"!'));
    }
  }

  let proxies = [];
  if (useProxy) {
    try {
      const proxyData = await fs.readFile('proxy.txt', 'utf8');
      proxies = proxyData.split('\n').filter(line => line.trim() !== '');
    } catch (err) {
      console.log(chalk.yellow('✗ File proxy.txt tidak ditemukan. Lanjut tanpa proxy. Pastikan proxy.txt berisi daftar proxy dalam format http://user:pass@host:port, satu per baris.'));
    }
  }

  const accountProxies = accounts.map((account, index) => {
    if (proxies.length > 0) {
      return proxies[index % proxies.length];
    } else {
      return null;
    }
  });

  console.log(chalk.cyan(` ┊ ⏰ Memulai proses akun pertama...`));
  await processAccounts(accounts, accountProxies, noType);

  const scheduleNextRun = async () => {
    const nextRun = calculateNextRun();
    displayCountdown(nextRun);
    schedule.scheduleJob(nextRun.toDate(), async () => {
      const currentTimeWIB = moment().tz('Asia/Jakarta').format('DD/MM/YYYY, HH:mm:ss');
      console.log(chalk.cyan(` ┊ ⏰ Proses dimulai pada ${currentTimeWIB}`));
      await processAccounts(accounts, accountProxies, noType);
      scheduleNextRun();
    });
  };

  scheduleNextRun();
}

main();
