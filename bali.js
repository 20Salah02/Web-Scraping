require("dotenv").config();
const axios = require("axios");
const fs = require("fs");

const API_KEY = process.env.GOOGLE_API_KEY;
const FILE_NAME = "hotels.txt";
const RADIUS = 1500; 
const DELAY = 3000;  

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function getCityLocation(cityName) {
  const res = await axios.get("https://maps.googleapis.com/maps/api/geocode/json", {
    params: { address: cityName, key: API_KEY },
  });

  if (!res.data.results || res.data.results.length === 0) {
    throw new Error(`❌ المدينة غير موجودة: "${cityName}"`);
  }

  return res.data.results[0].geometry.location;
}

async function getHotelsFromPoint(lat, lng) {
  const results = [];

  async function fetchPage(url) {
    try {
      const res = await axios.get(url);

      if (res.status !== 200) {
        console.log(`⚠️ تخطيت بسبب الحالة: ${res.status}`);
        return;
      }

      results.push(...res.data.results);

      if (res.data.next_page_token) {
        console.log("⏳ إنتظار الصفحة التالية...");
        await sleep(DELAY);
        const nextUrl = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?pagetoken=${res.data.next_page_token}&key=${API_KEY}`;
        await fetchPage(nextUrl);
      }
    } catch (err) {
      console.log("⚠️ حدث خطأ، تم التخطي:");
      console.log(err.response ? err.response.data : err.message);
    }
  }

  const baseURL = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=${RADIUS}&type=lodging&key=${API_KEY}`;
  await fetchPage(baseURL);

  return results;
}

async function getHotelDetails(placeId) {
  try {
    const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=name,formatted_phone_number&key=${API_KEY}`;
    const res = await axios.get(url);

    return {
      name: res.data.result.name || null,
      phone: res.data.result.formatted_phone_number || null,
    };
  } catch (err) {
    console.log("⚠️ خطأ في جلب التفاصيل، تم التخطي:");
    console.log(err.response ? err.response.data : err.message);
    return { name: null, phone: null };
  }
}

function ensureFileExists() {
  if (!fs.existsSync(FILE_NAME)) fs.writeFileSync(FILE_NAME, "");
}

function loadExistingNames() {
  if (!fs.existsSync(FILE_NAME)) return new Set();
  const lines = fs.readFileSync(FILE_NAME, "utf-8").split("\n").map(line => line.split(",")[1]?.trim());
  return new Set(lines);
}

function saveHotel(phone, name) {
  fs.appendFileSync(FILE_NAME, `${phone}, ${name}\n`);
}

async function getAllHotels(cityName) {
  ensureFileExists();
  const knownNames = loadExistingNames();

  const center = await getCityLocation(cityName);
  console.log(`📍 إحداثيات المدينة:`, center);

  const gridSize = 20;
  const step = 0.005;

  for (let i = 0; i < gridSize; i++) {
    for (let j = 0; j < gridSize; j++) {
      const lat = center.lat - (gridSize / 2) * step + i * step;
      const lng = center.lng - (gridSize / 2) * step + j * step;

      console.log(`🔎 البحث في: ${lat.toFixed(5)}, ${lng.toFixed(5)}`);
      const places = await getHotelsFromPoint(lat, lng);

      for (const place of places) {
        if (knownNames.has(place.name)) continue;

        const details = await getHotelDetails(place.place_id);
        if (details.name && details.phone) {
          console.log(`${details.phone}, ${details.name}`);
          saveHotel(details.phone, details.name);
          knownNames.add(details.name);
        }
      }
    }
  }

  console.log("✅ انتهى جمع بيانات الفنادق.");
}

getAllHotels("bali");
