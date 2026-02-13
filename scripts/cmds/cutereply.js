const fs = require("fs-extra");
const path = require("path");
const https = require("https");

exports.config = {
  name: "cutereply",
  version: "2.1.0",
  author: "MOHAMMAD AKASH",
  countDown: 0,
  role: 0,
  shortDescription: "Reply with text + image on trigger",
  longDescription: "Trigger মেসেজে reply দিয়ে text + image পাঠাবে",
  category: "system"
};

const cooldown = 10000; // 10 sec
const last = {};

// =======================
// ✨ EASY ADD SECTION ✨
// =======================
const TRIGGERS = [
  {
    words: ["জানু","janu","Bbee"],
    text: "Jan ami Onek Horny Hoye achi 🫦🥺",
    images: ["https://i.pinimg.com/736x/0e/dd/8b/0edd8b09ca84cca29e324aa25d04dadf.jpg",
      "https://i.pinimg.com/736x/6d/bd/d3/6dbdd3b2c74aa0c2a0a60692f1d6397f.jpg","https://i.pinimg.com/736x/ff/6b/5d/ff6b5dc0edc00855d3597a5774264c2f.jpg","https://i.pinimg.com/474x/b2/05/d8/b205d8e7e73b716bb47b911a49d1efe7.jpg","https://i.pinimg.com/736x/2a/c9/89/2ac989782cac0f05d98ab70090621886.jpg","https://i.pinimg.com/236x/15/9e/55/159e5539367083ea5071e92dcf08b3a9.jpg",""
    ]
  },
  {
    words: ["দুধ দেখাও","Jan dudh dekhau","ektu dekhau"],
    text: "Ei dekho jan...Khaiba 👄🫦🥵",
    images: ["https://i.pinimg.com/736x/54/fd/f5/54fdf5f761e410cb44de171d775630b3.jpg","",
      "https://i.imgur.com/GRmoSHk.jpeg",
      "https://i.imgur.com/EphhGw3.jpeg"
    ]
  },  {
    words: ["খাওয়াবা একটু", "Jan khauyaba ektu", "ektu khabo","khabo jan"],
    text: "Nicerta naki Uporerta 👄🫦🥵",
    images: [""
    ]
  }, {
    words: ["নিচেরটা", "Jan nicerta", "pussy","nicerta jan"," hisur ta"],
    text: "Neew jan, Uffffff ahhhh 🥵",
    images: ["https://i.pinimg.com/736x/9f/ca/d0/9fcad0a212577ea077d81b0dc1f94288.jpg","https://i.pinimg.com/236x/71/38/e3/7138e3b278eb83bd739b9843cf85b9e7.jpg","https://photos.anysex.com/contents/albums/main/360x9999/44000/44088/60280.jpg","https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSbHaKIv-uo2mUuDtLBPbU9zjMvpxcmpkXRs7RQtxxzYKMYJSFtLnruu70https://photos.xgroovy.com/contents/albums/sources/705000/705299/786016.jpg&s=10", "https://photos.anysex.com/contents/albums/main/360x9999/47000/47050/63949.jpg",""
    ]
  },{words: ["dudu", "দুধু","উপরেরটা খাবো","boobs"," uporerta","dud","dud 🍼","babur khabar","amr bburta"],
    text: "Uffff khau🍼🥵",
    images: ["https://i.pinimg.com/736x/d8/c6/24/d8c624d4b7113e6bfe17592e5a066d79.jpg","https://i.pinimg.com/736x/3f/0f/da/3f0fdaadb47e34eabdf18c8041d4f0fd.jpg","https://imagex1.sx.cdn.live/images/pinporn/2022/07/23/27755854.jpg?width=300","https://boombo.biz/en/uploads/posts/2022-06/1655295875_2-boombo-biz-p-big-boobs-no-face-erotika-vkontakte-3.jpg", "https://thumb-nss.xhcdn.com/a/MZd1YlRaJZE45x57lWrY7w/004/192/246/1280x720.1.jpg"]}
];
// =======================

exports.onStart = async function () {};

exports.onChat = async function ({ event, api }) {
  try {
    const { threadID, senderID, messageID } = event;
    const body = (event.body || "").toLowerCase().trim();
    if (!body) return;

    // bot নিজের মেসেজ ignore
    if (senderID === api.getCurrentUserID()) return;

    // cooldown
    const now = Date.now();
    if (last[threadID] && now - last[threadID] < cooldown) return;

    let matched = null;
    for (const t of TRIGGERS) {
      if (t.words.some(w => body.includes(w))) {
        matched = t;
        break;
      }
    }
    if (!matched) return;

    last[threadID] = now;

    const imgUrl = matched.images[Math.floor(Math.random() * matched.images.length)];
    const imgName = path.basename(imgUrl);
    const imgPath = path.join(__dirname, imgName);

    if (!fs.existsSync(imgPath)) {
      await download(imgUrl, imgPath);
    }

    // 🔥 REPLY to the same message
    api.sendMessage(
      {
        body: matched.text,
        attachment: fs.createReadStream(imgPath)
      },
      threadID,
      messageID // <-- এইটা থাকায় রিপ্লাই হবে
    );

  } catch (e) {
    console.log(e);
  }
};

function download(url, dest) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    https.get(url, (res) => {
      if (res.statusCode !== 200) {
        fs.unlink(dest, () => {});
        return reject();
      }
      res.pipe(file);
      file.on("finish", () => file.close(resolve));
    }).on("error", () => {
      fs.unlink(dest, () => {});
      reject();
    });
  });
}
