const puppeteer = require("puppeteer");
const fs = require("fs");

const BASE_URL = "https://www.goafricaonline.com/sn/annuaire-resultat?type=company&whatWho=Restaurants&p=";

async function scrapePage(pageNumber, browser) {
  const page = await browser.newPage();

  await page.goto(`${BASE_URL}${pageNumber}`, {
    waitUntil: "domcontentloaded",
    timeout: 60000,
  });

  const data = await page.$$eval("div.w-full", cards =>
    cards.map(card => {
      const nameEl = card.querySelector(
        'a.stretched-link.font-bold.text-16.t\\:text-20.text-black'
      );
      const phoneEl = card.querySelector('a[href^="tel:"]');

      let phone = phoneEl ? phoneEl.getAttribute("href").replace("tel:", "").trim() : "";

      if (phone) {
        phone = phone.replace(/\+/g, "").replace(/\s+/g, "");
      }

      return {
        name: nameEl ? nameEl.innerText.trim() : "No name",
        phone: phone || "No phone",
      };
    })
  );

  const filtered = data.filter(r => r.name && r.name !== "No name");

  console.log(`📄 Page ${pageNumber}: found ${filtered.length} restaurants`);
  await page.close();
  return filtered;
}

async function scrapeAll(pages) {
  const browser = await puppeteer.launch({ headless: true });
  let allResults = [];

  for (let i = 1; i <= pages; i++) {
    try {
      const results = await scrapePage(i, browser);
      allResults = allResults.concat(results);
    } catch (err) {
      console.error(`❌ Error on page ${i}:`, err.message);
    }
  }

  await browser.close();

  const unique = Array.from(
    new Map(allResults.map(r => [`${r.phone}-${r.name}`, r])).values()
  );

  const csv = ["phone,name", ...unique.map(r => `${r.phone},${r.name}`)].join("\n");
  fs.writeFileSync("restaurants_senegal.csv", csv, "utf8");


  console.log("=====================================");
  console.log(`✅ Done! Total restaurants: ${unique.length} (after removing duplicates)`);
  console.log("Files saved: restaurants.csv & restaurants.json");
  console.log("=====================================");
}

scrapeAll(91);
