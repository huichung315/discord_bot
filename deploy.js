// 註冊斜線指令
import { REST, Routes } from 'discord.js'; // 引入 discord.js 的 REST 和 Routes
import { createRequire } from 'module'; // 引入 createRequire

const require = createRequire(import.meta.url);  // 建立 require 實例
const setting = require('./setting.json'); // 用 require 讀取 JSON
const { token, client_id, guild_id } = setting; // 取得 token, client id, guild id

// 指令清單
const commands = [
  {
    name: 'ping', // 指令名稱
    description: '取得機器人的延遲資訊', // 指令描述
  },
  {
    name: 'info-bot',
    description: '取得機器人的基本資訊',
  },
  {
    name: 'info-user',
    description: '取得使用者的基本資訊',
  },
  {
    name: 'info-server',
    description: '取得伺服器的基本資訊',
  },
  {
    name: 'weather',
    description: '取得天氣資訊',
    options: [
      {
        name: 'city', // 參數名稱
        description: '城市名稱', // 參數描述
        type: 3, // 3 = string
        required: true // 必填
      }
    ],
  },
  {
    name: 'search',
    description: '搜尋歌詞',
    options: [
      {
        name: 'song', // 參數名稱
        description: '歌曲名稱', // 參數描述
        type: 3, // 3 = string
        required: true // 必填
      },
      {
        name: 'artist', // 參數名稱
        description: '歌手名稱', // 參數描述
        type: 3, // 3 = string
        required: false // 選填
      }
    ],
  }
];

const rest = new REST({ version: '10' }).setToken(token); // Bot Token

try {
  console.log('開始刷新斜線(/)指令...');

  await rest.put(Routes.applicationGuildCommands(client_id, guild_id), { body: commands }); // client id, guild id

  await rest.put(Routes.applicationCommands(client_id), { body: commands }); // CLIENT ID

  console.log('已成功載入斜線(/)指令。');
} catch (error) {
  console.error(error);
}