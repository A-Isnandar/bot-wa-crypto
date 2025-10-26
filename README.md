# WhatsApp Crypto Tracker & Group Utility Bot 🤖

A WhatsApp bot built with Node.js and `whatsapp-web.js` to provide real-time cryptocurrency information, price tracking alerts, and group management utilities.

---

## ✨ Features

* **Real-time Crypto Prices (`!cek`):** Get the latest price of any cryptocurrency in USD and IDR, including 24-hour change. Powered by CoinGecko.
* **Silent Group Tag (`#`):** Mention all group members silently. Useful for announcements without noisy notifications. The bot repeats your message while tagging everyone in the background and reacts with a 💧 emoji.
* **DEX Token Price Tracking (`!pantau`):** Monitor the price (Market Cap) of any token on decentralized exchanges (DEX). Powered by DexScreener.
* **Price Alerts:** Get notified directly in the group chat whenever a tracked token's Market Cap changes by +/- 10% from the last alert point.
* **Stop Tracking (`!stop`, `!stopall`):** Stop tracking a specific token or all tracked tokens.
* **List Tracked Tokens (`!list`):** See which tokens are currently being monitored in the group.

---

## 🚀 Getting Started

Follow these steps to run the bot yourself.

### Prerequisites

* **Node.js:** (Version 18.x or later recommended) - Download from [nodejs.org](https://nodejs.org/)
* **Git:** Download from [git-scm.com](https://git-scm.com/)
* **A spare WhatsApp number:** **IMPORTANT:** Using unofficial libraries like `whatsapp-web.js` violates WhatsApp's Terms of Service. **Do not use your main number**, as it might get banned. Use a number you're okay with losing.

### Installation & Running

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/A-Isnandar/bot-wa-crypto.git
    cd (your-repo-name)
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Run the bot for the first time:**
    ```bash
    node index.js
    ```
    * A QR code will appear in your terminal.
    * Open WhatsApp on your phone (the spare number).
    * Go to **Settings** > **Linked Devices** > **Link a Device**.
    * Scan the QR code shown in the terminal.

4.  **Ready!** Once you see "Bot sudah online dan siap tempur!" in the terminal, the bot is connected and ready to receive commands in the chats associated with the scanned number.

    * Authentication info will be saved in the `.wwebjs_auth` folder, so you usually don't need to scan the QR code again unless you log out or delete the folder.
    * To stop the bot, press `Ctrl + C` in the terminal.

### Running 24/7 (Optional - Using PM2 on a Server/VPS)

To keep the bot running continuously, you can deploy it on a server (like a VPS) using a process manager like PM2.

1.  **Install PM2 globally:**
    ```bash
    sudo npm install pm2 -g
    ```
2.  **Navigate to the project directory** on your server.
3.  **Start the bot with PM2:**
    ```bash
    pm2 start index.js --name "bot-wa"
    ```
4.  **Save the process list** (to auto-restart after server reboots):
    ```bash
    pm2 save
    ```
5.  **Set up startup script** (follow the command PM2 gives you):
    ```bash
    pm2 startup
    ```
    *(Copy and paste the command shown in the terminal)*

---

## ⚙️ Commands

*(All commands should be sent in the WhatsApp group chat where the bot is present)*

* **`!cek <coin_symbol_or_name>`**
    * **Function:** Fetches the current price, 24h change, and USD/IDR conversion for a cryptocurrency.
    * **Example:** `!cek bitcoin`, `!cek eth`, `!cek arb`

* **`#<any_text> <your_message>`**
    * **Function:** Sends `<your_message>` to the group while silently tagging all members. The bot also reacts to your original command with 💧.
    * **Example:** `#A Important announcement here!`, `#h Don't forget the meeting!`

* **`!pantau <chain> <token_address>`**
    * **Function:** Starts monitoring the Market Cap of a specific token on a specific DEX chain (via DexScreener). It saves the initial Market Cap and price.
    * **Example:** `!pantau sol So11111111111111111111111111111111111111112`, `!pantau bsc 0x99df6F337eeC8bb3A197961099dF163Ea3494444`
    * **Note:** `<chain>` should be the short name used by DexScreener (e.g., `sol`, `bsc`, `eth`, `base`, `arb`).

* **`!stop <token_address>`**
    * **Function:** Stops monitoring the specified token address.
    * **Example:** `!stop 0x99df6F337eeC8bb3A197961099dF163Ea3494444`

* **`!stopall`**
    * **Function:** Stops monitoring *all* tokens currently being tracked by the bot in that group. Clears the tracking list.

* **`!list`**
    * **Function:** Shows a list of all tokens currently being monitored by the `!pantau` command, including their chain and address.

---

## ⚠️ Disclaimer

This bot uses an unofficial WhatsApp API (`whatsapp-web.js`). Using it carries a risk of your WhatsApp number being **permanently banned**. Use a dedicated, non-essential number for this bot. The creator is not responsible for any consequences of using this bot. Use at your own risk.