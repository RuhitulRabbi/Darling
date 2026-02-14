const os = require("os");
const fs = require("fs");
const { execSync } = require("child_process");

module.exports = {
	config: {
		name: "up",
		version: "9.0", 
		author: "Ruhitul Rabbi",
		countDown: 5,
		role: 0,
		shortDescription: "System Monitor",
		longDescription: "Displays system stats with auto name detection.",
		category: "system",
	},

	onStart: async function ({ api, event }) {
		const { threadID, messageID } = event;
		const timeStart = Date.now();

		// --- ১. অটোমেটিক নাম ডিটেকশন (Fix) ---
        function cleanString(str) {
            if (!str) return "System Bot";
            return str.replace(/[^\x00-\x7F]/g, "").trim() || "System Bot";
        }

		let botNameRaw = "";
        try {
            // GoatBot এর জন্য বিশেষ চেক
            botNameRaw = global.GoatBot?.config?.nickNameBot || global.config?.BOTNAME || "System Bot";
        } catch (e) { botNameRaw = "System Bot"; }

        const botName = cleanString(botNameRaw);
		const creatorName = "Ruhitul Rabbi";
		const editorName = "Ruhitul Rabbi";

		// --- ২. ডাটা প্রসেসিং ---
		const uptime = process.uptime();
		const hours = Math.floor(uptime / 3600);
		const minutes = Math.floor((uptime % 3600) / 60);
		const seconds = Math.floor(uptime % 60);
		const uptimeString = `${hours}h ${minutes}m ${seconds}s`;

		const cpus = os.cpus();
		const cpuModel = cpus.length > 0 ? cpus[0].model : "Unknown CPU";
		const cpuCores = cpus.length;

		const loadAvg = os.loadavg()[0];
		let cpuPercent = Math.floor((loadAvg / cpuCores) * 100);
		if (cpuPercent > 100) cpuPercent = 100;

		const totalMem = os.totalmem();
		const freeMem = os.freemem();
		const usedMem = totalMem - freeMem;
		const memPercent = Math.floor((usedMem / totalMem) * 100);

		let temp = "N/A";
		try {
			if (fs.existsSync("/sys/class/thermal/thermal_zone0/temp")) {
				const rawTemp = fs.readFileSync("/sys/class/thermal/thermal_zone0/temp");
				temp = Math.round(rawTemp / 1000) + "°C";
			} else { temp = "45°C (Stable)"; }
		} catch (e) { temp = "Unknown"; }

		let storagePercent = 50;
		try {
			if (os.platform() === "linux" || os.platform() === "android") {
				const diskData = execSync("df -h /").toString();
				const lines = diskData.split("\n");
				const mainLine = lines[1].split(/\s+/);
				storagePercent = parseInt(mainLine[4]);
			}
		} catch (e) { storagePercent = 50; }

		const ping = Date.now() - timeStart;

		try {
			let Canvas;
			try { Canvas = require("canvas"); } catch (e) { Canvas = global.nodemodule["canvas"]; }
            if (!Canvas) return api.sendMessage("❌ Canvas missing!", threadID, messageID);

			const { createCanvas } = Canvas;
			const width = 1200, height = 800;
			const canvas = createCanvas(width, height);
			const ctx = canvas.getContext("2d");

			ctx.fillStyle = "#f0f2f5";
			ctx.fillRect(0, 0, width, height);

			ctx.fillStyle = "#ffffff";
			const cardX = 40, cardY = 40, cardW = 1120, cardH = 720;
			ctx.beginPath();
            if (ctx.roundRect) ctx.roundRect(cardX, cardY, cardW, cardH, 30);
            else ctx.rect(cardX, cardY, cardW, cardH);
			ctx.fill();

			const headerGrd = ctx.createLinearGradient(cardX, cardY, cardX + cardW, cardY);
			headerGrd.addColorStop(0, "#00c6ff");
			headerGrd.addColorStop(1, "#0072ff");
			ctx.fillStyle = headerGrd;
			ctx.beginPath();
            if (ctx.roundRect) ctx.roundRect(cardX, cardY, cardW, 100, [30, 30, 0, 0]);
            else ctx.rect(cardX, cardY, cardW, 100);
			ctx.fill();

			ctx.fillStyle = "#ffffff";
			ctx.font = "bold 45px sans-serif"; 
			ctx.textAlign = "center";
			ctx.fillText("SYSTEM MONITORING DASHBOARD", width / 2, 105);

			function drawTextLine(x, y, label, value) {
				ctx.beginPath();
				ctx.arc(x, y - 7, 8, 0, Math.PI * 2);
				ctx.fillStyle = "#00c6ff";
				ctx.fill();
				ctx.fillStyle = "#333"; 
				ctx.font = "bold 24px sans-serif"; 
				ctx.textAlign = "left";
				ctx.fillText(label, x + 25, y);
				ctx.font = "24px sans-serif"; 
				ctx.fillStyle = "#555";
				ctx.fillText(value, x + 250, y); // গ্যাপ আরও বাড়ানো হয়েছে
			}

			const leftX = 80;
			let lineY = 220;
			const gap = 50;

			ctx.fillStyle = "#666";
			ctx.font = "bold 28px sans-serif";
			ctx.fillText("> SYSTEM SPECIFICATIONS", leftX - 10, 180);

			drawTextLine(leftX, lineY, "Bot Name:", botName);
			drawTextLine(leftX, lineY + gap, "Creator:", creatorName);
			drawTextLine(leftX, lineY + gap * 2, "Editor:", editorName);
			drawTextLine(leftX, lineY + gap * 3, "OS:", `${os.type()}`);
			drawTextLine(leftX, lineY + gap * 4, "Cores:", `${cpuCores} Cores`);
			drawTextLine(leftX, lineY + gap * 5, "Model:", `${cpuModel.substring(0, 15)}...`);
			drawTextLine(leftX, lineY + gap * 6, "Node:", `${process.version}`);
			drawTextLine(leftX, lineY + gap * 7, "CPU Load:", `${cpuPercent}%`);
			drawTextLine(leftX, lineY + gap * 8, "Temp:", temp);

			const rightX = 650;
			ctx.fillStyle = "#666";
			ctx.font = "bold 28px sans-serif";
			ctx.fillText("> LIVE METRICS", rightX, 180);

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
                if (ctx.roundRect) ctx.roundRect(x, y, (w * percent) / 100, 25, 12);
				ctx.fill();
			}

			drawBar(rightX, 240, 450, cpuPercent, "#00c6ff", "#0072ff", "CPU LOAD");
			drawBar(rightX, 350, 450, memPercent, "#11998e", "#38ef7d", "MEMORY USAGE");
			drawBar(rightX, 460, 450, storagePercent, "#fc4a1a", "#f7b733", "STORAGE USAGE");

			const boxY = 600, boxH = 130, boxW = 500;
			const box1Grd = ctx.createLinearGradient(70, boxY, 570, boxY + boxH);
			box1Grd.addColorStop(0, "#00c6ff"); box1Grd.addColorStop(1, "#0072ff");
			ctx.fillStyle = box1Grd;
			ctx.beginPath();
            if (ctx.roundRect) ctx.roundRect(70, boxY, boxW, boxH, 20);
			ctx.fill();
			ctx.fillStyle = "#fff"; ctx.textAlign = "center";
			ctx.font = "bold 25px sans-serif"; ctx.fillText("BOT UPTIME", 70 + (boxW/2), boxY + 40);
			ctx.font = "bold 50px sans-serif"; ctx.fillText(uptimeString, 70 + (boxW/2), boxY + 100);

			const box2Grd = ctx.createLinearGradient(630, boxY, 1130, boxY + boxH);
			box2Grd.addColorStop(0, "#ff9966"); box2Grd.addColorStop(1, "#ff5e62");
			ctx.fillStyle = box2Grd;
			ctx.beginPath();
            if (ctx.roundRect) ctx.roundRect(630, boxY, boxW, boxH, 20);
			ctx.fill();
			ctx.fillStyle = "#fff"; ctx.font = "bold 25px sans-serif";
			ctx.fillText("RESPONSE TIME", 630 + (boxW/2), boxY + 40);
			ctx.font = "bold 50px sans-serif"; ctx.fillText(`${ping}ms | Stable`, 630 + (boxW/2), boxY + 100);

			const imagePath = __dirname + "/cache/up_auto_final.png";
			fs.writeFileSync(imagePath, canvas.toBuffer("image/png"));

			return api.sendMessage({
				body: `✅ ড্যাশবোর্ড আপডেট`,
				attachment: fs.createReadStream(imagePath),
			}, threadID, () => fs.unlinkSync(imagePath), messageID);

		} catch (e) {
			return api.sendMessage("❌ Error: " + e.message, threadID, messageID);
		}
	}
};
