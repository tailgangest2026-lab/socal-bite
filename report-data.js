const DATA_URL = "https://script.google.com/macros/s/AKfycbyv3lige3cPBzrw_-ncL0OL5yG-fQKb6A_f0WZLA6jjilrTCdX0mNeSCYIxLUgZSVqe/exec?page=data";

async function getSoCalBiteData() {
  const res = await fetch(DATA_URL);
  return await res.json();
}

function getLatestReport(data) {
  return data.reportsByDate[data.latestDate];
}

function fishList(fish) {
  return fish.map(f => `${f.count} ${f.fish}`).join(", ");
}
