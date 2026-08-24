const sty = {
  BOR_ST: { weight: 1.5, color: '#555', fillOpacity: .05 },
  BOR_HI: { weight: 3, color: '#ff6600', fillOpacity: .70 },
  WAR_ST: { weight: 1, color: '#06c', fillColor: '#cce0ff', fillOpacity: .70 },
  WAR_HI: { weight: 2, color: '#06c', fillColor: '#bfd6ff', fillOpacity: .35 },
  LSO_ST: { weight: .4, color: '#800080', fillColor: '#eed9f8', fillOpacity: .70 },
  LSO_HI: { weight: 1.2, color: '#800080', fillColor: '#e4c2f5', fillOpacity: .35 }
};

let currentLSOAHighlight = null;
// --- Resource Allocation DOM hookup ---
const resourceAllocationLI = document.getElementById('resourceAllocation');
if (resourceAllocationLI) resourceAllocationLI.style.display = 'none';

// remembers the latest Resource Allocation table HTML
let latestResourceHTML = "";


function ymOrdinal(year, month) {
  return (parseInt(year, 10) * 12) + (parseInt(month, 10) - 1);
}

function isBefore(y1, m1, y2, m2) {
  return ymOrdinal(y1, m1) < ymOrdinal(y2, m2);
}

function clampEndSelectors() {

  Array.from(yearSelectEnd.options).forEach(opt => {
    opt.disabled = parseInt(opt.value, 10) < parseInt(selectedYear, 10);
  });

  Array.from(monthSelectEnd.options).forEach(opt => {
    if (selectedYearEnd === selectedYear) {
      opt.disabled = parseInt(opt.value, 10) < parseInt(selectedMonth, 10);
    } else {
      opt.disabled = false;
    }
  });


  if (isBefore(selectedYearEnd, selectedMonthEnd,
    selectedYear, selectedMonth)) {

    selectedYearEnd = yearSelectEnd.value = selectedYear;
    selectedMonthEnd = monthSelectEnd.value = selectedMonth;
  }
}


function buildResourceAllocationHTML(wardName, features) {
  const rows = features.map(f => {
    const rs = (f.properties.risk_score ?? 0).toFixed(2);
    const hrs = (f.properties.allocation_hours ?? 0).toFixed(1);
    return `<tr><td>${f.properties.lsoa21nm}</td><td>${rs}</td><td>${hrs}</td></tr>`;
  }).join("");

  return `
    <p><strong>Total allocation for ${wardName}:</strong> 800&nbsp;hours / week</p>
    <table class="table table-sm mb-0">
      <thead><tr><th>LSOA</th><th>Risk</th><th>Hours / week</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>`;
}

function clear(prefix) {
  map.eachLayer(l => {
    if (l && l.options && l.options.name && l.options.name.startsWith(prefix)) {
      map.removeLayer(l);
    }
  });
}

const infoBox = document.getElementById('infoBox');
const map = L.map('map').setView([51.5074, -0.1278], 10);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  maxZoom: 19,
  attribution: '© OpenStreetMap contributors'
}).addTo(map);

const boroughSlugs = [
  'Barking_and_Dagenham', 'Barnet', 'Bexley', 'Brent', 'Bromley', 'Camden',
  'Croydon', 'Ealing', 'Enfield', 'Greenwich', 'Hackney',
  'Hammersmith_and_Fulham', 'Haringey', 'Harrow', 'Havering', 'Hillingdon',
  'Hounslow', 'Islington', 'Kensington_and_Chelsea', 'Kingston_upon_Thames',
  'Lambeth', 'Lewisham', 'Merton', 'Newham', 'Redbridge', 'Richmond_upon_Thames',
  'Southwark', 'Sutton', 'Tower_Hamlets', 'Waltham_Forest', 'Wandsworth', 'City_of_Westminster'
];

let loaded = false

boroughSlugs.forEach(slug => {
  fetch(`webdata/borough_${slug}.geojson`)
    .then(r => r.json())
    .then(gj => {
      const name = gj.features[0].properties.DISTRICT;
      const layer = L.geoJSON(gj, { style: sty.BOR_ST }).addTo(map);
      layer.options.name = name;
      layer.on({
        mouseover: e => e.target.setStyle(sty.BOR_HI),
        mouseout: e => e.target.setStyle(sty.BOR_ST),
        click: () => onBorough(layer, slug, name)
      });
    });

});









function onBorough(layer, slug, name) {
  if (resourcePanel) {
    const rc = resourcePanel.querySelector('#resourceContent');
    if (rc) rc.innerHTML = '<p class="text-muted">Select a ward to see its allocation…</p>';
  }
  if (!loaded) {
    Swal.fire("Data is still loading, please try again");
    return;
  }
  window.lastSelected = { type: 'borough', data: { layer, slug, name } };
  if (currentLSOAHighlight) {
    map.removeLayer(currentLSOAHighlight);
    currentLSOAHighlight = null;
  }

  clear('Wards ');
  clear('LSOAs ');

  fetch(`webdata/wards_${slug}.geojson`)
    .then(r => r.json())
    .then(gj => {
      const wards = L.geoJSON(gj, {
        style: sty.WAR_ST,
        onEachFeature: (f, ly) => {
          const wn = f.properties.NAME;
          ly.options.name = wn;
          ly.bindTooltip(wn);
          ly.on({
            mouseover: () => ly.setStyle(sty.WAR_HI),
            mouseout: () => ly.setStyle(sty.WAR_ST),
            click: () => onWard(ly, f.properties.GSS_CODE, wn)
          });
        }
      }).addTo(map);
      wards.options.name = 'Wards ' + name;
    });
  infoBox.textContent = name;


  map.flyToBounds(layer.getBounds(), { maxZoom: 12 });
  const total = totalBurglariesForBorough(slug);
  document.getElementById("NumberOfBurlgaries").innerHTML = "Burglary Count: " + total;

  if (!isComparingLSOAs) {
    updateWardCharts(null, null, true)
    updateLSOACharts(null, null, true)
    switchCharts(false)
  }
}

function onLSOA(lsoaFeature) {
  if (currentLSOAHighlight) {
    map.removeLayer(currentLSOAHighlight);
    currentLSOAHighlight = null;
  }

  currentLSOAHighlight = L.geoJSON(lsoaFeature, { style: sty.LSO_HI }).addTo(map);
  map.flyToBounds(currentLSOAHighlight.getBounds(), { maxZoom: 16 });

  const name = lsoaFeature.properties.lsoa21nm;
  infoBox.textContent = name;

  const score = lsoaFeature.properties.risk_score?.toFixed(2) ?? "N/A";
  document.getElementById("riskScore").innerHTML = "Risk Score: " + score;
  const year = String(parseInt(selectedYear));
  const month = String(parseInt(selectedMonth));
  const totalBurglaries = totalBurglariesForLSOA(name);
  document.getElementById("NumberOfBurlgaries").innerHTML = "Burglary Count: " + totalBurglaries || "N/A";

  if (!isComparingLSOAs) {
    updateLSOACharts(lsoaFeature, finalData, predictions);
  } else {
    compareWithSecondLSOA(lsoaFeature, predictions);
    isComparingLSOAs = false;
  }
}
function lsoaBelongsToWard(feature, wardCode, wardPolygon /* turf polygon */) {


  const props = feature.properties;
  const WARD_KEYS = ['WD22CD', 'WD21CD', 'ward_code', 'WARD22CD', 'WardCode'];
  for (const key of WARD_KEYS) {
    if (key in props && props[key] === wardCode) return true;
  }


  const INSIDE_RATIO = 0.5;

  let intersection;
  try {
    intersection = turf.intersect(feature, wardPolygon);
  } catch (_e) {
    // tolerate Polygon ↔︎ MultiPolygon combos
    const wardPoly = wardPolygon.geometry.type === 'Polygon'
      ? wardPolygon
      : turf.multiPolygon(wardPolygon.geometry.coordinates);
    const lsoaPoly = feature.geometry.type === 'Polygon'
      ? feature
      : turf.multiPolygon(feature.geometry.coordinates);
    intersection = turf.intersect(lsoaPoly, wardPoly);
  }

  if (!intersection) return false;                     // no overlap at all

  const areaLSOA = turf.area(feature);
  const areaInside = turf.area(intersection);
  return (areaInside / areaLSOA) >= INSIDE_RATIO;
}
function onWard(wardLayer, wardCode, wardName) {
  latestResourceHTML = '';
  if (resourcePanel) {
    const rc = resourcePanel.querySelector('#resourceContent');
    if (rc) rc.innerHTML = '<p class="text-muted">Select a ward to see its allocation…</p>';
  }



  infoBox.textContent = wardName;
  map.flyToBounds(wardLayer.getBounds(), { maxZoom: 14 });
  clear('Wards ');
  clear('LSOAs ');


  fetch(`webdata/lsoas_${wardCode}.geojson`)
    .then(r => r.json())
    .then(gj => {


      console.log('First LSOA properties:', gj.features[0].properties);

      const wardPolygon = turf.feature(wardLayer.toGeoJSON().geometry);


      let keptByMeta = 0, keptByGeo = 0, rejected = 0;
      const wardLSOAs = gj.features.filter(f => {
        const ok = lsoaBelongsToWard(f, wardCode, wardPolygon);
        if (ok) {
          const props = f.properties;
          const byMeta = ['WD22CD', 'WD21CD', 'ward_code', 'WARD22CD', 'WardCode']
            .some(k => props[k] === wardCode);
          byMeta ? keptByMeta++ : keptByGeo++;
          return true;
        }
        rejected++;
        return false;
      });

      const total = totalBurglariesForWard(wardCode);
      document.getElementById("NumberOfBurlgaries").textContent =
        `Burglary Count: ${total}`;

      console.log(`Ward ${wardCode} – ${wardName}`);
      console.log(`   Total LSOAs in file: ${gj.features.length}`);
      console.log(`     ✓ kept by metadata: ${keptByMeta}`);
      console.log(`     ✓ kept by geometry: ${keptByGeo}`);
      console.log(`     ✗ rejected:         ${rejected}`);


      const BASE_HOURS = 480;
      const RISK_HOURS = 320;

      const basePerLSOA = BASE_HOURS / wardLSOAs.length;
      const totalRisk = wardLSOAs.reduce((sum, f) => sum + (f.properties.risk_score || 0), 0);

      wardLSOAs.forEach(f => {
        const risk = f.properties.risk_score || 0;
        const riskAllocation = totalRisk > 0 ? (risk / totalRisk) * RISK_HOURS : 0;
        let total = basePerLSOA + riskAllocation;
        total = Math.round(total / 2) * 2; // Round to nearest 2
        f.properties.allocation_hours = total;
      });

      // Ensure exact total of 800 hours
      let allocated = wardLSOAs.reduce((sum, f) => sum + f.properties.allocation_hours, 0);
      let diff = 800 - allocated;

      wardLSOAs.sort((a, b) => (b.properties.risk_score || 0) - (a.properties.risk_score || 0));
      for (let i = 0; i < wardLSOAs.length && diff !== 0; i++) {
        if (diff >= 2) {
          wardLSOAs[i].properties.allocation_hours += 2;
          diff -= 2;
        } else if (diff <= -2 && wardLSOAs[i].properties.allocation_hours >= 2) {
          wardLSOAs[i].properties.allocation_hours -= 2;
          diff += 2;
        }
      }



      const allocationHTML = buildResourceAllocationHTML(wardName, wardLSOAs);
      latestResourceHTML = allocationHTML;
      if (resourcePanel) {
        const rc = resourcePanel.querySelector('#resourceContent');
        if (rc) rc.innerHTML = allocationHTML;
      }


      const lso = L.geoJSON(wardLSOAs, {
        style: f => ({
          ...sty.LSO_ST,
          fillColor: getLSOARiskColor(f.properties.risk_score),
          fillOpacity: 0.7
        }),
        onEachFeature: (f, ly) => {
          ly.bindTooltip(f.properties.lsoa21nm);
          ly.on({
            mouseover: () => ly.setStyle(sty.LSO_HI),
            mouseout: () => ly.setStyle({
              ...sty.LSO_ST,
              fillColor: getLSOARiskColor(f.properties.risk_score),
              fillOpacity: 0.7
            }),
            click: () => onLSOA(f)
          });
        }
      }).addTo(map);
      lso.options.name = 'LSOAs ' + wardCode;

      if (!isComparingLSOAs && wardLSOAs) {
        updateWardCharts(wardName, wardLSOAs)
      }
    });
}
const reset = document.getElementById('reset');
//reset resource allocation button
reset.addEventListener('click', () => {
  numberOfComparisons = 0;

  if (currentLSOAHighlight) {
    map.removeLayer(currentLSOAHighlight);
    currentLSOAHighlight = null;
  }
  infoBox.textContent = 'London';
  searchInput.value = '';
  if (!isComparingLSOAs) {
    yearSelect.value = selectedYear = "2024";
    monthSelect.value = selectedMonth = "3";


    yearSelectEnd.value = selectedYearEnd = "2025";
    monthSelectEnd.value = selectedMonthEnd = "3";
    updateMonthOptionsGeneric(yearSelect, monthSelect, 'selectedMonth');
    updateMonthOptionsGeneric(yearSelectEnd, monthSelectEnd, 'selectedMonthEnd');
  }
  map.setView([51.5074, -0.1278], 10);
  clear('Wards ');
  clear('LSOAs ');
  document.getElementById("NumberOfBurlgaries").innerHTML = "Burglary Count: ";
  document.getElementById("riskScore").innerHTML = "Risk Score: ";

  if (!isComparingLSOAs) {
    updateWardCharts(null, null, true);
    updateLSOACharts(null, null, true);
    switchCharts(false);
  }
  latestResourceHTML = '';
  if (resourcePanel) {
    const rc = resourcePanel.querySelector('#resourceContent');
    if (rc) rc.innerHTML = '<p class="text-muted">Select a ward to see its allocation…</p>';
  }
});

let wardCatalog = [], lsoaCatalog = [];

// 1️⃣ load all wards into wardCatalog
const wardsLoaded = Promise.all(
  boroughSlugs.map(slug =>
    fetch(`webdata/wards_${slug}.geojson`)
      .then(r => r.json())
      .then(gj =>
        gj.features.forEach(f =>
          wardCatalog.push({
            name: f.properties.NAME,
            code: f.properties.GSS_CODE,
            slug
          })
        )
      )
  )
);

// 2️⃣ once wards are in, load every ward’s LSOA file
const lsoasLoaded = wardsLoaded.then(() =>
  Promise.all(
    wardCatalog.map(w =>
      fetch(`webdata/lsoas_${w.code}.geojson`)
        .then(r => r.ok ? r.json() : null)
        .then(gj => { if (gj) lsoaCatalog.push(...gj.features); })
    )
  )
);

document.addEventListener('DOMContentLoaded', () => {
  const searchInput = document.getElementById('searchBar');
  const dataList = document.getElementById('searchList');

  Promise.all([wardsLoaded, lsoasLoaded]).then(() => {
    searchInput.addEventListener('input', () => {
      const q = searchInput.value.trim().toLowerCase();
      dataList.innerHTML = '';
      if (q.length < 3) return;

      boroughSlugs
        .map(s => s.replace(/_/g, ' '))
        .filter(n => n.toLowerCase().includes(q))
        .slice(0, 10)
        .forEach(n => {
          const o = document.createElement('option');
          o.value = n;
          dataList.appendChild(o);
        });

      wardCatalog
        .filter(w => w.name.toLowerCase().includes(q))
        .slice(0, 10)
        .forEach(w => {
          const o = document.createElement('option');
          o.value = w.name;
          dataList.appendChild(o);
        });
      // Only show unique LSOA names
      const seenLSOAs = new Set();
      lsoaCatalog
        .map(f => f.properties.lsoa21nm)
        .sort((a, b) => a.localeCompare(b))
        .filter(nm => {
          const match = nm.toLowerCase().includes(q) && !seenLSOAs.has(nm);
          if (match) seenLSOAs.add(nm);
          return match;
        })
        .slice(0, 10)
        .forEach(nm => {
          const o = document.createElement('option');
          o.value = nm;
          dataList.appendChild(o);
        });

      const exactWard = wardCatalog.find(w => w.name.toLowerCase() === q);
      if (exactWard) {
        lsoaCatalog
          // .filter(f => f.properties.GSS_CODE === exactWard.code)
          .map(f => f.properties.lsoa21nm)
          .slice(0, 10)
          .forEach(nm => {
            const o = document.createElement('option');
            o.value = nm;
            dataList.appendChild(o);
          });
      }
    });
  });
});
async function drillToLSOA(feat) { //use this to ge all data for the LSOA when searching
  const ward = wardCatalog.find(w => w.code === feat.properties.GSS_CODE);
  if (!ward) { onLSOA(feat); return; }

  const borName = ward.slug.replace(/_/g, ' ');
  const borLayer = Object.values(map._layers)
    .find(l => l.options?.name === borName);
  if (borLayer) onBorough(borLayer, ward.slug, borName);


  await new Promise(res => {
    const poll = () => {
      const wLayer = Object.values(map._layers)
        .find(l => l.options?.name === ward.name);
      if (wLayer) { res(wLayer); return; }
      setTimeout(poll, 80);
    };
    poll();
  }).then(wLayer => onWard(wLayer, ward.code, ward.name));

  // wait for the ward layer to be ready
  await new Promise(r => setTimeout(r, 120));

  //zoom to the LSOA
  onLSOA(feat);
  window.lastSelected = { type: 'lsoa', data: feat };   // keep refresh working
}



const searchInput = document.getElementById('searchBar');

searchInput.addEventListener('keydown', async e => {
  if (e.key !== 'Enter') return;
  e.preventDefault();
  const q = searchInput.value.trim();
  if (!q) {
    await Swal.fire({ title: 'Please enter a name', icon: 'error', confirmButtonText: 'OK' });
    return;
  }

  const norm = q;
  const boroughNames = boroughSlugs.map(s => s.replace(/_/g, ' '));
  const bi = boroughNames.indexOf(norm);
  if (bi > -1) {
    const slug = boroughSlugs[bi];
    const layer = Object.values(map._layers).find(l => l.options?.name === norm);
    if (layer) onBorough(layer, slug, norm);
    return;
  }

  const ward = wardCatalog.find(w => w.name.toLowerCase() === norm.toLowerCase());
  if (ward) {
    const borName = ward.slug.replace(/_/g, ' ');
    const bLayer = Object.values(map._layers).find(l => l.options?.name === borName);
    if (bLayer) onBorough(bLayer, ward.slug, borName);
    await new Promise(r => setTimeout(r, 200));
    const wLayer = Object.values(map._layers).find(l => l.options?.name === ward.name);
    if (wLayer) onWard(wLayer, ward.code, ward.name);
    return;
  }

  const feat = lsoaCatalog.find(f =>
    f.properties.lsoa21nm.toLowerCase() === norm.toLowerCase());
  if (feat) { latestResourceHTML = ''; drillToLSOA(feat); return; }


  await Swal.fire({ title: 'Not found', text: `"${q}" not recognized`, icon: 'error', confirmButtonText: 'OK' });
});

// adding crimedata to the map (crime count for every layer (LSOA/ward/borough))
let finalData = [];
let predictions = []
let lsoaBurglary = {}; // lsoaBurglary[LSOA][year][month] = count

Papa.parse('webdata/final-data-2022.csv', {
  header: true,
  download: true,
  complete: function (results) {
    finalData = results.data;
    finalData.forEach(row => {
      const lsoa = row.LSOA_name;
      const year = String(parseInt(row.Year));
      const month = String(parseInt(row.Month));
      const count = Number(row.crime_count || 0);
      if (!lsoaBurglary[lsoa]) lsoaBurglary[lsoa] = {};
      if (!lsoaBurglary[lsoa][year]) lsoaBurglary[lsoa][year] = {};
      // Sum counts instead of overwriting so we get the total per month
      lsoaBurglary[lsoa][year][month] = (lsoaBurglary[lsoa][year][month] || 0) + count;
    });
    loaded = true;
  }

});

Papa.parse('webdata/prediction_for_april_5100_LSOAs.csv', {
  header: true,
  download: true,
  complete: function (results) {
    predictions = results.data;
    predictions.forEach(row => {
      const lsoa = row.LSOA_name;
      const year = String(parseInt(row.Year));
      const month = String(parseInt(row.Month));
      const count = Number(row.crime_count || 0);
      if (!lsoaBurglary[lsoa]) lsoaBurglary[lsoa] = {};
      if (!lsoaBurglary[lsoa][year]) lsoaBurglary[lsoa][year] = {};
      // Sum counts instead of overwriting so we get the total per month
      lsoaBurglary[lsoa][year][month] = (lsoaBurglary[lsoa][year][month] || 0) + count;
    });
  }
});

setTimeout(() => { console.log('Predictions:', predictions) }, 10000)



// --- Date selector setup ---
let selectedYear = document.getElementById('yearSelect').value;
let selectedMonth = document.getElementById('monthSelect').value;
let selectedYearEnd = document.getElementById('yearSelectEnd').value;
let selectedMonthEnd = document.getElementById('monthSelectEnd').value;

const yearSelect = document.getElementById('yearSelect');
const monthSelect = document.getElementById('monthSelect');
const yearSelectEnd = document.getElementById('yearSelectEnd');
const monthSelectEnd = document.getElementById('monthSelectEnd');

// Generic function for both selectors
function updateMonthOptionsGeneric(yearSelect, monthSelect, selectedMonthVarName) {
  const selectedYearVal = yearSelect.value;
  Array.from(monthSelect.options).forEach(opt => {
    if (selectedYearVal === "2025") {
      if (parseInt(opt.value) > 4) {
        opt.disabled = true;
        opt.style.display = "none";
      } else {
        opt.disabled = false;
        opt.style.display = "";
      }
    } else {
      opt.disabled = false;
      opt.style.display = "";
    }
  });
  // If current month is not allowed -> April 2025
  if (selectedYearVal === "2025" && parseInt(monthSelect.value) > 3) {
    monthSelect.value = "3";
    window[selectedMonthVarName] = "3";
  } else {
    window[selectedMonthVarName] = monthSelect.value;
  }
}

// --- Event listeners for START date ---
yearSelect.addEventListener('change', function (e) {


  selectedYear = e.target.value;
  updateMonthOptionsGeneric(yearSelect, monthSelect, 'selectedMonth');
  isComparingLSOAs = false;
  numberOfComparisons = 0;
  clampEndSelectors();
  refreshDashboard();
});

monthSelect.addEventListener('change', function (e) {
  clampEndSelectors();

  selectedMonth = e.target.value;
  isComparingLSOAs = false;
  numberOfComparisons = 0;
  clampEndSelectors();
  refreshDashboard();
});

// --- Event listeners for END date ---
yearSelectEnd.addEventListener('change', function (e) {
  clampEndSelectors();

  selectedYearEnd = e.target.value;
  updateMonthOptionsGeneric(yearSelectEnd, monthSelectEnd, 'selectedMonthEnd');
  selectedMonthEnd = monthSelectEnd.value;
  isComparingLSOAs = false;
  numberOfComparisons = 0;
  clampEndSelectors();
  refreshDashboard();

});

monthSelectEnd.addEventListener('change', function (e) {
  clampEndSelectors();
  selectedMonthEnd = e.target.value;
  updateMonthOptionsGeneric(yearSelectEnd, monthSelectEnd, 'selectedMonthEnd');

  isComparingLSOAs = false;
  numberOfComparisons = 0;
  clampEndSelectors();
  refreshDashboard();
});

// --- Call once on load for both selectors ---
updateMonthOptionsGeneric(yearSelect, monthSelect, 'selectedMonth');
updateMonthOptionsGeneric(yearSelectEnd, monthSelectEnd, 'selectedMonthEnd');

function totalBurglariesForLSOA(
  lsoaName,
  yStart = selectedYear,
  mStart = selectedMonth,
  yEnd = selectedYearEnd,
  mEnd = selectedMonthEnd) {
  const ordStart = ymOrdinal(yStart, mStart);
  const ordEnd = ymOrdinal(yEnd, mEnd);
  if (ordEnd < ordStart) return 0;           // invalid range ⇒ 0

  let total = 0;
  const yearly = lsoaBurglary[lsoaName] || {};
  Object.entries(yearly).forEach(([y, months]) => {
    Object.entries(months).forEach(([m, cnt]) => {
      const ord = ymOrdinal(y, m);
      if (ord >= ordStart && ord <= ordEnd) total += cnt;
    });
  });
  return total;
}

function totalBurglariesForWard(
  wardCode,
  yStart = selectedYear,
  mStart = selectedMonth,
  yEnd = selectedYearEnd,
  mEnd = selectedMonthEnd) {
  const lsoas = lsoaCatalog
    .filter(f => f.properties.GSS_CODE === wardCode)
    .map(f => f.properties.lsoa21nm);

  return lsoas.reduce(
    (sum, nm) => sum + totalBurglariesForLSOA(nm, yStart, mStart, yEnd, mEnd),
    0);
}

function totalBurglariesForBorough(
  boroughSlug,
  yStart = selectedYear,
  mStart = selectedMonth,
  yEnd = selectedYearEnd,
  mEnd = selectedMonthEnd) {
  const wards = wardCatalog.filter(w => w.slug === boroughSlug);
  return wards.reduce(
    (sum, w) => sum + totalBurglariesForWard(w.code, yStart, mStart, yEnd, mEnd),
    0);
}

//This should track the last selected thing(borough/ward/LSOA)
window.lastSelected = { type: null, data: null };

// Refrech the map when you change the date
function refreshDashboard() {
  const sel = window.lastSelected;
  if (!sel || !sel.type) return;
  if (sel.type === 'borough') {
    onBorough(sel.data.layer, sel.data.slug, sel.data.name);
  } else if (sel.type === 'ward') {
    onWard(sel.data.wardLayer, sel.data.wardCode, sel.data.wardName);
  } else if (sel.type === 'lsoa') {
    onLSOA(sel.data);
  }
}

const resourceBTN = document.getElementById('resourceButton');
const wrapper = document.getElementById('dashboardWrapper');
let resourcePanel = null;

resourcePanel = document.createElement('div');
resourcePanel.id = 'resourcePanel';
Object.assign(resourcePanel.style, {
  position: 'relative',
  background: '#f8f9fa',
  boxShadow: '2px 0 8px rgba(0,0,0,0.1)',
  overflowY: 'auto',
  padding: '24px 16px'
});

resourcePanel.classList.remove('big');
resourcePanel.classList.add('hidden-force');

resourcePanel.innerHTML = `
<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1rem;">
  <h2 class="m-0">Resource Allocation</h2>
  <div class="btn-group btn-group-sm">
        <button id="infoButton"
                class="btn btn-outline-secondary"
                title="Info">&#9432;</button>
        <button id="expandResourcePanel"
                class="btn btn-outline-secondary"
                title="Expand / collapse">↔</button>
        <button id="closeResourcePanel"
                class="btn btn-outline-secondary"
                title="Close">✕</button>
      </div>
</div>
<div id="resourceContent">
  ${latestResourceHTML || '<p class="text-muted">Select a ward to see its allocation…</p>'}
</div>

<div id="wardCharts" style="background-color: #f8f9fa">
  <hr>
  <h2 class="m-0">Ward charts</h2>
  <canvas id="scoreWChart" width="400" height="250" style="margin-top:10px;"></canvas>
  <canvas id="resourceWChart" width="400" height="250" style="margin-top:10px;"></canvas>
</div>
<div id="lsoaCharts" style="background-color: #f8f9fa">
  <hr>
  <h2 class="m-0">LSOA charts</h2>
    <div style="margin: 10px 0;justify-content: center;" class="d-flex">
    <button id="compareLSOAButton" class="btn btn-danger">Compare with another LSOA</button>
  </div>
  <canvas id="lineLSOAChart" width="400" height="250"></canvas>
  <canvas id="deprivationLSOAChart" width="400" height="250"></canvas>
  <canvas id="economicallyActiveLSOAChart" width="400" height="250"></canvas>
  <canvas id="economicallyInactiveLSOAChart" width="400" height="250"></canvas>
  <canvas id="ageDistributionLSOAChart" width="400" height="250"></canvas>
  <hr>
  
</div>
`;

wrapper.insertBefore(resourcePanel, wrapper.firstChild);
requestAnimationFrame(() => wrapper.classList.add('open'));

updateWardCharts(null, null, true);
updateLSOACharts(null, null, true);
switchCharts(false);

requestAnimationFrame(() => {
  wrapper.classList.add('open');
});

resourcePanel.querySelector('#closeResourcePanel')
  .addEventListener('click', () => {
    wrapper.classList.remove('open');

    const onTransitionEnd = (e) => {
      if (e.propertyName === 'width') {
        resourcePanel.classList.add('hidden-force');
        resourcePanel.removeEventListener('transitionend', onTransitionEnd);
      }
    };

    resourcePanel.addEventListener('transitionend', onTransitionEnd);
  });

resourcePanel.querySelector('#expandResourcePanel')
  .addEventListener('click', () => {
    resourcePanel.classList.toggle('big');
  });

const compareButton = document.getElementById('compareLSOAButton');
compareButton.addEventListener('click', async () => {
  isComparingLSOAs = true
});

resourceBTN.addEventListener('click', () => {
  if (resourcePanel) {
    resourcePanel.classList.remove('hidden-force');
    void resourcePanel.offsetWidth;
    wrapper.classList.add('open');
  }
});

function getLSOARiskColor(score) {
  if (score === undefined) return "#ccc";
  if (score < 2) return "#ffffb2";
  if (score < 4) return "#fecc5c";
  if (score < 6) return "#fd8d3c";
  if (score < 8) return "#f03b20";
  return "#bd0026";
}
document.addEventListener('click', function (e) {
  if (e.target && e.target.id === 'infoButton') {
    const infoModal = new bootstrap.Modal(document.getElementById('infoModal'));
    infoModal.show();
  }
});




(function initDateRange() {

  yearSelect.value = selectedYear = "2024";
  monthSelect.value = selectedMonth = "3";

  /* latest available data */
  yearSelectEnd.value = selectedYearEnd = "2025";
  monthSelectEnd.value = selectedMonthEnd = "3";


  updateMonthOptionsGeneric(yearSelect, monthSelect, 'selectedMonth');
  updateMonthOptionsGeneric(yearSelectEnd, monthSelectEnd, 'selectedMonthEnd');
  clampEndSelectors();


  refreshDashboard();
})();
