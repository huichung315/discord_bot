使用 Node.js 和 discord.js 建立的 Discord Bot，支援斜線指令、事件監聽，並可依個人需求擴充。
### 開發環境
- Node.js v22.18.0
- discord.js v14.18.0
### 主要檔案
- deploy.js 用於更新 bot commands
- index.js 為主程式，支援斜線指令與自訂 bot 狀態
### 支援指令
- ping: 取得機器人的延遲資訊
- info-bot: 取得機器人的基本資訊
- info-user: 取得使用者的基本資訊
- info-server: 取得伺服器的基本資訊
- weather: 透過中央氣象局API，取得天氣資訊，城市名稱請填寫完整，如：新北市
- search: 透過歌曲名稱與歌手名稱，搜尋歌詞，如要新增歌詞請自行創建 json 檔案至 lyrics 資料夾
### 注意事項
- 需自行前往 Discord Developer Portal 創建 BOT
- 主要為個人娛樂用，有任何問題歡迎提出
- 可自行新增 setting.json 用於存放 bot token, client id, api key ... 等敏感資料
