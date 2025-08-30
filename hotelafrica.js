const puppeteer = require("puppeteer");
const fs = require("fs");

const cityUrls = [
  "https://www.hotelcontact.net/ivory-coast--abidjan--abidjan-hotels-en.html",
  "https://www.hotelcontact.net/ivory-coast--abidjan--bingerville-hotels-en.html",
  "https://www.hotelcontact.net/ivory-coast--comoe--grand-bassam-hotels-en.html"
  
];

(async () => {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();

  const results = [];

  for (let c = 0; c < cityUrls.length; c++) {
    const cityUrl = cityUrls[c];
    console.log(`⏳ Opening city page ${c + 1}/${cityUrls.length}: ${cityUrl}`);
    await page.goto(cityUrl, { waitUntil: "networkidle2" });

    // روابط الفنادق
    const hotelLinks = await page.evaluate(() => {
      return Array.from(document.querySelectorAll("a.pr-link1")).map(a => a.href);
    });

    console.log(`✅ Found ${hotelLinks.length} hotels in this city.`);

    for (let i = 0; i < hotelLinks.length; i++) {
      const url = hotelLinks[i];
      console.log(`⏳ Scraping hotel ${i + 1}/${hotelLinks.length} from city ${c + 1}: ${url}`);
      await page.goto(url, { waitUntil: "networkidle2" });

      const hotelData = await page.evaluate(() => {
        const name = document.querySelector("h1") ? document.querySelector("h1").innerText.trim() : "";
        const phoneEl = document.querySelector("a[href^='tel:']");
        let phone = phoneEl ? phoneEl.innerText.trim() : "";
        phone = phone.replace("+", "").replace(/\s+/g, ""); 
        return { name, phone };
      });

      if (hotelData.name && hotelData.phone) {
        results.push(`${hotelData.phone}, ${hotelData.name}`);
      }
    }
  }

  await browser.close();

  fs.writeFileSync("hotels_all_cities.csv", results.join("\n"), "utf8");

  console.log("📂 Done! Data saved to hotels_all_cities.csv");
})();

