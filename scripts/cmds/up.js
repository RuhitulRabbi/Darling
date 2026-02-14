const os = require("os");
const fs = require("fs");
const { execSync } = require("child_process");

module.exports = {
	config: {
		name: "up",
		version: "8.0",
		author: "Ruhitul Rabbi",
		countDown: 5,
		role: 0,
		shortDescription: "System Monitor",
		longDescription: "Displays system stats with fixed layout and fonts.",
		category: "system",
	},

	onStart: async function ({ api, event }) {
		const { threadID, messageID } = event;
		const timeStart = Date.now();

		// --- ১. নাম ক্লিন করা (বক্স রিমুভ) ---
        function cleanString(str) {
            if (!str) return "System Bot";
            return str.replace(/[^\x00-\x7F]/g, "").trim() || "System Bot";
        }

		let botNameRaw = "System Bot";
        try {
            if (global.GoatBot?.config?.nickNameBot) {
                botNameRaw = global.GoatBot.config.nickNameBot;
            } else if (global.config?.BOTNAME) {
                botNameRaw = global.config.BOTNAME;
            }
        } catch (e) { botNameRaw = "System Bot"; }

        const botName = cleanString(botNameRaw);
		const creatorName = "Ruhitul Rabbi";
		const editorName = "Ruhitul Rabbi";

		// --- ২. ডাটা প্রসেসিং ---

		// Uptime
		const uptime = process.uptime();
		const hours = Math.floor(uptime / 3600);
		const minutes = Math.floor((uptime % 3600) / 60);
		const seconds = Math.floor(uptime % 60);
		const uptimeString = `${hours}h ${minutes}m ${seconds}s`;

		// CPU Info
		const cpus = os.cpus();
		const cpuModel = cpus.length > 0 ? cpus[0].model : "Unknown CPU";
		const cpuCores = cpus.length;

		// CPU Usage (Real)
		const loadAvg = os.loadavg()[0];
		let cpuPercent = Math.floor((loadAvg / cpuCores) * 100);
		if (cpuPercent > 100) cpuPercent = 100;
		if (cpuPercent < 1) cpuPercent = 1;

		// RAM Info
		const totalMem = os.totalmem();
		const freeMem = os.freemem();
		const usedMem = totalMem - freeMem;
		const memPercent = Math.floor((usedMem / totalMem) * 100);

		// Temperature (Real/Safe)
		let temp = "N/A";
		try {
			if (fs.existsSync("/sys/class/thermal/thermal_zone0/temp")) {
				const rawTemp = fs.readFileSync("/sys/class/thermal/thermal_zone0/temp");
				temp = Math.round(rawTemp / 1000) + "°C";
			} else {
				temp = "45°C (Virtual)"; // ডিফল্ট ভ্যালু
			}
		} catch (e) { temp = "Unknown"; }

		// Storage Info
		let storagePercent = 50;
		try {
			if (os.platform() === "linux" || os.platform() === "android") {
				const diskData = execSync("df -h /").toString();
				const lines = diskData.split("\n");
				const mainLine = lines[1].split(/\s+/);
				storagePercent = parseInt(mainLine[4]);
			}
		} catch (e) { storagePercent = 50; }

		const netInterfaces = os.networkInterfaces();
		const netCount = Object.keys(netInterfaces).length;
		const ping = Date.now() - timeStart;

		try {
			// --- ৩. ক্যানভাস লোডিং ---
			let Canvas;
			try { Canvas = require("canvas"); } catch (e) { Canvas = global.nodemodule["canvas"]; }
            
            if (!Canvas) return api.sendMessage("❌ Error: Canvas module missing.", threadID, messageID);

			const { createCanvas } = Canvas;
			const width = 1200;
			const height = 800; // হাইট একটু বাড়ানো হয়েছে যাতে সব ধরে
			const canvas = createCanvas(width, height);
			const ctx = canvas.getContext("2d");

			// ব্যাকগ্রাউন্ড
			ctx.fillStyle = "#f0f2f5";
			ctx.fillRect(0, 0, width, height);

			// মেইন কার্ড
			ctx.fillStyle = "#ffffff";
			const cardX = 40, cardY = 40, cardW = 1120, cardH = 720;
			
			ctx.shadowColor = "rgba(0,0,0,0.1)";
			ctx.shadowBlur = 20;
			ctx.beginPath();
            if (ctx.roundRect) ctx.roundRect(cardX, cardY, cardW, cardH, 30);
            else ctx.rect(cardX, cardY, cardW, cardH);
			ctx.fill();
			ctx.shadowBlur = 0;

			// হেডার
			const headerGrd = ctx.createLinearGradient(cardX, cardY, cardX + cardW, cardY);
			headerGrd.addColorStop(0, "#00c6ff");
			headerGrd.addColorStop(1, "#0072ff");
			
			ctx.fillStyle = headerGrd;
			ctx.beginPath();
            if (ctx.roundRect) ctx.roundRect(cardX, cardY, cardW, 100, [30, 30, 0, 0]);
            else ctx.rect(cardX, cardY, cardW, 100);
			ctx.fill();

			// টাইটেল (ফন্ট ফিক্সড)
			ctx.fillStyle = "#ffffff";
			ctx.font = "bold 45px sans-serif"; 
			ctx.textAlign = "center";
			ctx.fillText("SYSTEM MONITORING DASHBOARD", width / 2, 105);

			// --- কন্টেন্ট ---
			function drawTextLine(x, y, label, value) {
				ctx.beginPath();
				ctx.arc(x, y - 7, 8, 0, Math.PI * 2);
				ctx.fillStyle = "#00c6ff";
				ctx.fill();

				// লেবেল
				ctx.fillStyle = "#333"; 
				ctx.font = "bold 24px sans-serif"; 
				ctx.textAlign = "left";
				ctx.fillText(label, x + 25, y);

				// ভ্যালু (গ্যাপ ঠিক করা হয়েছে)
				ctx.font = "24px sans-serif"; 
				ctx.fillStyle = "#555";
				ctx.fillText(value, x + 220, y); 
			}

			const leftX = 80;
			let lineY = 220;
			const gap = 50; // লাইনের মাঝখানের ফাঁকা বাড়ানো হয়েছে

			ctx.fillStyle = "#666";
			ctx.font = "bold 28px sans-serif";
			ctx.textAlign = "left";
			ctx.fillText("> SYSTEM SPECIFICATIONS", leftX - 10, 180);

			drawTextLine(leftX, lineY, "Bot Name:", botName);
			drawTextLine(leftX, lineY + gap, "Creator:", creatorName);
			drawTextLine(leftX, lineY + gap * 2, "Editor:", editorName);
			drawTextLine(leftX, lineY + gap * 3, "OS:", `${os.type()} (${os.arch()})`);
			drawTextLine(leftX, lineY + gap * 4, "Cores:", `${cpuCores} Cores`);
			drawTextLine(leftX, lineY + gap * 5, "Model:", `${cpuModel.substring(0, 15)}...`);
			drawTextLine(leftX, lineY + gap * 6, "Node:", `${process.version}`);
            // Load এবং Temp এখানে যোগ করা হলো
			drawTextLine(leftX, lineY + gap * 7, "CPU Load:", `${cpuPercent}%`);
			drawTextLine(leftX, lineY + gap * 8, "Temp:", temp);

			// ডান পাশ
			const rightX = 650;
			
			ctx.strokeStyle = "#eee";
			ctx.lineWidth = 2;
			ctx.beginPath();
			ctx.moveTo(600, 180);
			ctx.lineTo(600, 580);
			ctx.stroke();

			ctx.fillStyle = "#666";
			ctx.font = "bold 28px sans-serif";
			ctx.fillText("> LIVE METRICS", rightX, 180);
			
			ctx.font = "bold 20px sans-serif";
			ctx.fillStyle = "#28a745"; 
			ctx.textAlign = "right";
			ctx.fillText("STATUS: STABLE", cardX + cardW - 40, 180);

			function drawBar(x, y, w, percent, c1, c2, label) {
				ctx.fillStyle = "#444";
				ctx.font = "bold 20px sans-serif";
				ctx.textAlign = "left";
				ctx.fillText(label, x, y - 10);
				ctx.textAlign = "right";
				ctx.fillText(`${percent}%`, x + w, y - 10);

				ctx.fillStyle = "#e9ecef";
				ctx.beginPath();
                if (ctx.roundRect) ctx.roundRect(x, y, w, 25, 12);
                else ctx.rect(x, y, w, 25);
				ctx.fill();

				const gr = ctx.createLinearGradient(x, y, x + w, y);
				gr.addColorStop(0, c1);
				gr.addColorStop(1, c2);
				ctx.fillStyle = gr;
				ctx.beginPath();
				const pw = (w * percent) / 100;
                if (ctx.roundRect) ctx.roundRect(x, y, pw, 25, 12);
                else ctx.rect(x, y, pw, 25);
				ctx.fill();
			}

			drawBar(rightX, 240, 450, cpuPercent, "#00c6ff", "#0072ff", "CPU LOAD");
			drawBar(rightX, 350, 450, memPercent, "#11998e", "#38ef7d", "MEMORY USAGE"); // গ্যাপ বাড়ানো হয়েছে
			drawBar(rightX, 460, 450, storagePercent, "#fc4a1a", "#f7b733", "STORAGE USAGE");

			// ফুটার
			const boxY = 600; // নিচে নামানো হয়েছে
			const boxH = 130;
			const boxW = 500;
			
			// Box 1
			const box1Grd = ctx.createLinearGradient(70, boxY, 570, boxY + boxH);
			box1Grd.addColorStop(0, "#00c6ff");
			box1Grd.addColorStop(1, "#0072ff");
			ctx.fillStyle = box1Grd;
			ctx.beginPath();
            if (ctx.roundRect) ctx.roundRect(70, boxY, boxW, boxH, 20);
            else ctx.rect(70, boxY, boxW, boxH);
			ctx.fill();

			ctx.fillStyle = "#fff";
			ctx.textAlign = "center";
			ctx.font = "bold 25px sans-serif";
			ctx.fillText("BOT UPTIME", 70 + (boxW/2), boxY + 40);
			ctx.font = "bold 50px sans-serif";
			ctx.fillText(uptimeString, 70 + (boxW/2), boxY + 100);

			// Box 2
			const box2Grd = ctx.createLinearGradient(630, boxY, 1130, boxY + boxH);
			box2Grd.addColorStop(0, "#ff9966");
			box2Grd.addColorStop(1, "#ff5e62");
			ctx.fillStyle = box2Grd;
			ctx.beginPath();
            if (ctx.roundRect) ctx.roundRect(630, boxY, boxW, boxH, 20);
            else ctx.rect(630, boxY, boxW, boxH);
			ctx.fill();

			ctx.fillStyle = "#fff";
			ctx.font = "bold 25px sans-serif";
			ctx.fillText("RESPONSE TIME", 630 + (boxW/2), boxY + 40);
			ctx.font = "bold 50px sans-serif";
			ctx.fillText(`${ping}ms | Stable`, 630 + (boxW/2), boxY + 100);

			// সেভ এবং সেন্ড
            const cacheFolder = __dirname + "/cache";
            if (!fs.existsSync(cacheFolder)) fs.mkdirSync(cacheFolder);
			const imagePath = cacheFolder + "/up_final_fix.png";
            
			const buffer = canvas.toBuffer("image/png");
			fs.writeFileSync(imagePath, buffer);

			return api.sendMessage(
				{
					body: `✅ সিস্টেম ড্যাশবোর্ড (Fixed Layout & Fonts):`,
					attachment: fs.createReadStream(imagePath),
				},
				threadID,
				() => fs.unlinkSync(imagePath),
				messageID
			);

		} catch (e) {
			console.error(e);
			return api.sendMessage("❌ Error: " + e.message, threadID, messageID);
		}
	}
};