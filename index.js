import { Client, Events, GatewayIntentBits, ActivityType, EmbedBuilder } from 'discord.js'; // 引入 discord.js
import { createRequire } from 'module'; // 引入 createRequire
import psList from 'ps-list'; // 引入 ps-list
import fs from 'fs'; // 引入 fs

const require = createRequire(import.meta.url); // 建立 require 實例
const setting = require('./setting.json'); // 用 require 讀取 JSON
const axios = require('axios'); // 引入 axios
// const psList = require('ps-list'); // 引入 ps-list
const { token, channel_id, weather_api_key, game_name } = setting; // 取得 token
const client = new Client({ intents: [GatewayIntentBits.Guilds] }); // 建立 Client 實例

let gameWasRunning = false; // 記錄遊戲是否正在運行

// 載入歌詞資料，這邊用一個 Map 方便查詢
const lyricsMap = new Map();

// 讀取歌手歌詞JSON
const jayData = JSON.parse(fs.readFileSync('lyrics/周杰倫.json', 'utf8'));
const ronghaoData = JSON.parse(fs.readFileSync('lyrics/李榮浩.json', 'utf-8'));
lyricsMap.set('周杰倫', jayData);
lyricsMap.set('李榮浩', ronghaoData);

// 設置 bot 狀態和行為
client.on(Events.ClientReady, readyClient => {
    client.user.setStatus('idle'); // 設置 bot 狀態 (online, idle, dnd, invisible)
    client.user.setActivity('蘑菇糖果', { type: ActivityType.Playing }); // 設置 bot 行為 (Playing, Streaming, Listening, Watching)
    console.log(`${readyClient.user.tag} 已成功上線!`); // bot 上線時於 console 打印
    setInterval(checkGameStatus, 30000); // 每30秒檢查一次 遊戲狀態
});

client.on(Events.InteractionCreate, async interaction => { // 事件發生時
    if (!interaction.isChatInputCommand()) return; // 不是指令

    if (interaction.commandName === 'ping') { // ping 指令
        const msg = await interaction.deferReply(); // 先延遲回應
        await interaction.editReply("正在計算延遲......");

        // 將ping變數設定為「成功回應的時間」與「指令發送的時間」之間隔
        const ping = msg.createdTimestamp - interaction.createdTimestamp;
        interaction.editReply(`機器人延遲：${ping} (毫秒)\nAPI延遲：${client.ws.ping} (毫秒)`) // 修改回覆訊息
    }

    if (interaction.commandName === 'info-bot') { // info-bot 指令
        interaction.reply(
          `名稱：${client.user.username}\n`+
          `BOT ID：${client.user.id}\n`+
          `製作者：pink.icecream_\n`+
          `運行時間：${msToHMS(client.uptime)}\n`+
          `建立時間：<t:${~~(client.user.createdTimestamp/1000)}:R>\n`+
          `目前版本：1.0\n`+
          `邀請連結：[Dreamgugu](https://discord.com/oauth2/authorize?client_id=1343939585259864096&permissions=8&integration_type=0&scope=applications.commands+bot)\n`+
          `伺服器數量：${client.guilds.cache.size}`
        )
    }

    if (interaction.commandName === 'info-user') { // info-user 指令
        interaction.reply(
          `名稱：${interaction.user.username}\n`+
          `User ID：${interaction.user.id}\n`+
          `創建時間：<t:${~~(interaction.user.createdTimestamp/1000)}:R>\n`+
          `是否為機器人：${interaction.user.bot? '是':'否'}`
        )
    }

    if (interaction.commandName === 'info-server') { // info-server 指令
        interaction.reply(
          `名稱：${interaction.guild.name}\n`+
          `Server ID：${interaction.guild.id}\n`+
          `擁有者：<@${interaction.guild.ownerId}>\n`+
          `創建時間：<t:${~~(interaction.guild.createdTimestamp/1000)}:R>\n`+
          `伺服器簡介：${interaction.guild.description ?? "無"}\n`+
          `伺服器人數：${interaction.guild.memberCount}`
        )
    }

    if (interaction.commandName === 'weather') { // weather 指令
        try {
            const BASE_URL = `https://opendata.cwa.gov.tw/api/v1/rest/datastore/F-C0032-001?Authorization=${weather_api_key}&format=JSON`; // 36小時天氣預報
    
            let city = interaction.options.getString('city'); // 取得使用者輸入的城市名稱

            // 取得 API 回應
            const response = await axios.get(`${BASE_URL}&locationName=${city}&elementName=MaxT,MinT,PoP,Wx,CI`); // 最高氣溫MaxT、最低氣溫MinT、降水機率PoP、天氣現象Wx、舒適度指數CI
            if (!response.data || !response.data.records || !response.data.records.location) {
                return interaction.reply("無法取得天氣資訊，請稍後再試！");
            }
    
            const location = response.data.records.location[0]; // 取得指定城市的資料
            if (!location) {
                return interaction.reply("請輸入完整城市名稱，例如：`臺北市`、`新北市`。");
            }

            // 處理天氣資訊
            const maxTemp = location.weatherElement.find(el => el.elementName === "MaxT").time[0].parameter.parameterName; // 最高溫度
            const minTemp = location.weatherElement.find(el => el.elementName === "MinT").time[0].parameter.parameterName; // 最低溫度
            const rainProb = location.weatherElement.find(el => el.elementName === "PoP").time[0].parameter.parameterName; // 降雨機率
            const description = location.weatherElement.find(el => el.elementName === "Wx").time[0].parameter.parameterName; // 天氣現象
            const comfortIndex = location.weatherElement.find(el => el.elementName === "CI").time[0].parameter.parameterName; // 舒適度指數

            const descriptionIcon = getWeatherIcon(description);

            const embed = new EmbedBuilder()
                .setColor([255, 192, 203]) // 設定顏色
                .setTitle(`${city}  |  ${description} ${descriptionIcon}`) // 設定標題
                .addFields(
                    { name: '🍄 舒適度', value: `${comfortIndex}`, inline: false },
                    { name: '🌡️ 氣溫', value: `${minTemp}°C～${maxTemp}°C`, inline: false },
                    { name: '💧 降雨機率', value: `${rainProb}%`, inline: false },
                    { name: '🕙 資料時間', value: `${location.weatherElement[0].time[0].startTime}～${location.weatherElement[0].time[0].endTime}`, inline: false },
                    { name: '📎 資料來源', value: '中央氣象局', inline: false }
                )
                // .setFooter({ text: 'Weather Data' });

            await interaction.reply({ embeds: [embed] });
        }
        catch (error) {
            console.error("API 錯誤：", error);
            interaction.reply("無法取得天氣資訊，請聯絡製作者！");
        }
    }

    if (interaction.commandName === 'search') { // search 指令
    const artist = interaction.options.getString('artist');
    const song = interaction.options.getString('song');

    let lyrics = null;
    let foundArtist = artist;

    // 包含歌手的搜尋
    if (artist) {
      // 無此歌手的資料
      if (!lyricsMap.has(artist)) {
        await interaction.reply(`沒有歌手 **${artist}** 的相關資料。`);
        return;
      }

      // 無此歌曲的資料
      const artistSongs = lyricsMap.get(artist);
      if (!artistSongs[song]) {
        await interaction.reply(`沒有歌手 **${artist}** 的歌曲 **${song}** 的相關資料。`);
        return;
      }

      // 有歌曲資料
      const lyrics = artistSongs[song].lyrics;
      await interaction.reply(`🎵 ${song} - ${artist}\n\n${lyrics.join('\n')}`);
    } else {
      // 不包含歌手的搜尋
      for (const [artistName, artistSongs] of lyricsMap.entries()) {
        if (artistSongs[song]) {
          lyrics = artistSongs[song].lyrics;
          foundArtist = artistName;
          await interaction.reply(`🎵 ${song} - ${foundArtist}\n\n${lyrics.join('\n')}`);
          break;
        }
      }

      if (!lyrics) {
        await interaction.reply(`❌ 找不到歌曲 **${song}** 的任何歌手版本。`);
        return;
      }
    }
  }
});

client.login(token); // bot 登入

// 時間換算
function msToHMS(ms) {
    let seconds = ms / 1000; // 將毫秒轉換為秒
    const hours = parseInt( seconds / 3600 ); // 將可以轉為小時的秒轉換為小時
    seconds = seconds % 3600; // 去除已轉換為小時的秒
    const minutes = parseInt( seconds / 60 ); // 將可以轉為分鐘的秒轉換為分鐘
    seconds = seconds % 60; // 去除已轉換為分鐘的秒
    return(`${hours}:${minutes}:${~~(seconds)}`); // 回傳轉換後的結果，秒數進行四捨五入
}

// 天氣圖示
function getWeatherIcon(description) {
    if (description.includes("雷")) {
        return "⛈️";
    } else if (description.includes("雨")) {
        return "🌧️";
    } else if (description.includes("陰")) {
        return "☁️";
    } else if (description.includes("雲")) {
        return "🌥️";
    } else if (description.includes("晴")) {
        return "☀️";
    } else {
        return "🌈";
    }
}

// 檢查遊戲是否還在執行
async function checkGameStatus() {
    const processes = await psList();
    const isRunning = processes.some(p => p.name === game_name); // 檢查遊戲是否在執行
  
    if (isRunning) {
      gameWasRunning = true;
    } else if (gameWasRunning) {
      console.log('⚠️ 偵測到遊戲關閉，準備傳送通知...');
      await sendDiscordMessage('📴 楓之谷M 已關閉！');
      gameWasRunning = false;
    }
}

// 傳送訊息到指定頻道
async function sendDiscordMessage(content) {
    try {
      const channel = await client.channels.fetch(channel_id); // 取得指定頻道
      if (channel && channel.isTextBased()) {
        await channel.send(content);
        console.log('✅ 通知已送出');
      } else {
        console.error('❌ 找不到頻道或不是文字頻道');
      }
    } catch (error) {
      console.error('🚨 發送訊息失敗:', error.message);
    }
}